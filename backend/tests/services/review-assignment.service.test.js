import { jest } from '@jest/globals';
import { AppError } from '../../src/utils/AppError.js';

// Setup module mock for DB pool
jest.unstable_mockModule('../../src/config/db.js', () => ({
    default: {
        query: jest.fn(),
        connect: jest.fn()
    }
}));

const { default: poolMock } = await import('../../src/config/db.js');
const { generateReviewAssignments } = await import('../../src/services/review-assignment.service.js');

describe('Review Assignment Service (MVP)', () => {
    let clientMock;

    beforeEach(() => {
        jest.clearAllMocks();
        
        clientMock = {
            query: jest.fn(),
            release: jest.fn(),
        };
        poolMock.connect.mockResolvedValue(clientMock);
    });

    describe('generateReviewAssignments', () => {
        it('should validate inputs', async () => {
            await expect(generateReviewAssignments('abc', 1)).rejects.toMatchObject({ status: 400 });
        });

        it('should prevent generating if assignments already exist (Immutable assignments)', async () => {
            poolMock.query
                .mockResolvedValueOnce({ rows: [{ 1: 1 }] }) // Auth check OK
                .mockResolvedValueOnce({ rows: [{ count: '5' }] }); // Existing assignments check > 0
                
            await expect(generateReviewAssignments(1, 1)).rejects.toMatchObject({ status: 400, message: 'Assignments already generated' });
        });

        it('should guarantee No Self-Review invariant and correct distribution', async () => {
            // Mock auth check
            poolMock.query
                .mockResolvedValueOnce({ rows: [{ 1: 1 }] }) // Auth OK
                .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // No existing assignments
                .mockResolvedValueOnce({ // Submissions
                    rows: [
                        { group_id: 10, submission_id: 100 },
                        { group_id: 11, submission_id: 101 },
                        { group_id: 12, submission_id: 102 },
                        { group_id: 13, submission_id: 103 },
                        { group_id: 14, submission_id: 104 }
                    ]
                });

            clientMock.query.mockResolvedValue({});

            // Request 2 reviews per group
            const result = await generateReviewAssignments(1, 1, 2);
            
            expect(result.groups).toBe(5);
            expect(result.totalAssignments).toBe(10); // 5 groups * 2
            
            // Check the bulk insert query
            const insertCall = clientMock.query.mock.calls.find(c => c[0].includes('INSERT INTO review_assignments'));
            expect(insertCall).toBeDefined();
            
            const insertValues = insertCall[1];
            // Format of insertValues: [target_submission_1, reviewer_group_1, target_submission_2, reviewer_group_2, ...]
            
            const assignments = [];
            for (let i = 0; i < insertValues.length; i += 2) {
                assignments.push({
                    submissionId: insertValues[i],
                    reviewerGroup: insertValues[i + 1]
                });
            }

            // Map submissions back to groups to verify self-review
            const submissionToGroup = {
                100: 10, 101: 11, 102: 12, 103: 13, 104: 14
            };

            const reviewCounts = {};

            assignments.forEach(a => {
                const targetGroup = submissionToGroup[a.submissionId];
                
                // NO SELF REVIEW ASSERTION
                expect(a.reviewerGroup).not.toBe(targetGroup);

                // Track distribution
                reviewCounts[a.reviewerGroup] = (reviewCounts[a.reviewerGroup] || 0) + 1;
            });

            // DISTRIBUTION FAIRNESS ASSERTION
            // Every group must have exactly 2 reviews assigned to them
            Object.values(reviewCounts).forEach(count => {
                expect(count).toBe(2);
            });
        });

        it('should trigger deep rollback on bulk insert failure', async () => {
            global.allowConsoleError();
            poolMock.query
                .mockResolvedValueOnce({ rows: [{ 1: 1 }] }) // Auth OK
                .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // No existing assignments
                .mockResolvedValueOnce({ // Submissions
                    rows: [
                        { group_id: 10, submission_id: 100 },
                        { group_id: 11, submission_id: 101 },
                        { group_id: 12, submission_id: 102 }
                    ]
                });

            const dbError = new Error('Insert crash');
            clientMock.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce() // DELETE
                .mockRejectedValueOnce(dbError); // Bulk INSERT fails

            await expect(generateReviewAssignments(1, 1, 1)).rejects.toThrow('Insert crash');
            
            expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');
            expect(clientMock.query).not.toHaveBeenCalledWith('COMMIT');
        });

        it('should throw constraint error if submissions < 2', async () => {
            poolMock.query
                .mockResolvedValueOnce({ rows: [{ 1: 1 }] }) // Auth OK
                .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // No existing assignments
                .mockResolvedValueOnce({ // Submissions
                    rows: [
                        { group_id: 10, submission_id: 100 }
                    ]
                });

            await expect(generateReviewAssignments(1, 1, 2)).rejects.toMatchObject({ status: 400 });
        });
    });
});
