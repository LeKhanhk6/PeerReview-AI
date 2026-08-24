import { jest } from '@jest/globals';
import { AppError } from '../../src/utils/AppError.js';

// Setup module mock for DB pool
jest.unstable_mockModule('../../src/config/db.js', () => ({
    default: {
        query: jest.fn(),
        connect: jest.fn()
    }
}));

// Mock Activity Service to isolate side effects
jest.unstable_mockModule('../../src/services/activity.service.js', () => ({
    logActivity: jest.fn()
}));

// Mock Rubric Service
jest.unstable_mockModule('../../src/services/rubric.service.js', () => ({
    getRubricAndCriteria: jest.fn()
}));

const { default: poolMock } = await import('../../src/config/db.js');
const { logActivity } = await import('../../src/services/activity.service.js');
const { getRubricAndCriteria } = await import('../../src/services/rubric.service.js');
const {
    submitReview,
    getMyReviewAssignments,
    getReviewAssignmentDetail,
    getAssignmentReviewsForSynthesis
} = await import('../../src/services/review.service.js');

describe('Review Service (MVP)', () => {
    let clientMock;

    beforeEach(() => {
        jest.clearAllMocks();
        
        clientMock = {
            query: jest.fn(),
            release: jest.fn(),
        };
        poolMock.connect.mockResolvedValue(clientMock);
    });

    describe('submitReview (Core Operations)', () => {
        const defaultCheckRes = {
            rows: [{
                id: 1, 
                status: 'PENDING', 
                reviewer_group_id: 1,
                assignment_id: 1, 
                deadline: new Date(Date.now() + 10000).toISOString(),
                is_past_deadline: false
            }]
        };

        const defaultRubricRes = {
            rows: [
                { id: 10, weight: "40.00" },
                { id: 11, weight: "60.00" }
            ]
        };

        const validPayload = {
            overallComment: "Good work",
            criteriaScores: [
                { criteriaId: 10, score: 35 },
                { criteriaId: 11, score: 55 }
            ]
        };

        it('should successfully submit review', async () => {
            clientMock.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce(defaultCheckRes) // SELECT FOR UPDATE
                .mockResolvedValueOnce(defaultRubricRes) // SELECT Rubric
                .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE status
                .mockResolvedValueOnce({ rows: [{ id: 100, total_score: "47.00", submitted_at: new Date() }] }) // INSERT review
                .mockResolvedValueOnce({}) // Bulk INSERT criteria
                .mockResolvedValueOnce(); // COMMIT

            const result = await submitReview(1, 'user1', validPayload);
            expect(result.status).toBe('COMPLETED');
            expect(result.totalScore).toBe(47); // 35*0.4 + 55*0.6 = 14 + 33 = 47
            expect(clientMock.query).toHaveBeenCalledWith('COMMIT');
            expect(logActivity).toHaveBeenCalled();
        });

        it('should reject score < 0', async () => {
            clientMock.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce(defaultCheckRes) // SELECT FOR UPDATE
                .mockResolvedValueOnce(defaultRubricRes); // SELECT Rubric

            const invalidPayload = { ...validPayload, criteriaScores: [{ criteriaId: 10, score: -5 }, { criteriaId: 11, score: 55 }] };
            await expect(submitReview(1, 'user1', invalidPayload)).rejects.toMatchObject({ status: 400, message: expect.stringContaining('Invalid score') });
            expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');
        });

        it('should reject score > max weight (Score integrity)', async () => {
            clientMock.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce(defaultCheckRes) // SELECT FOR UPDATE
                .mockResolvedValueOnce(defaultRubricRes); // SELECT Rubric

            const invalidPayload = { ...validPayload, criteriaScores: [{ criteriaId: 10, score: 45 }, { criteriaId: 11, score: 55 }] };
            await expect(submitReview(1, 'user1', invalidPayload)).rejects.toMatchObject({ status: 400, message: expect.stringContaining('max weight') });
            expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');
        });

        it('should reject NaN score', async () => {
            clientMock.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce(defaultCheckRes) // SELECT FOR UPDATE
                .mockResolvedValueOnce(defaultRubricRes); // SELECT Rubric

            const invalidPayload = { ...validPayload, criteriaScores: [{ criteriaId: 10, score: 'not-a-number' }, { criteriaId: 11, score: 55 }] };
            await expect(submitReview(1, 'user1', invalidPayload)).rejects.toMatchObject({ status: 400, message: expect.stringContaining('Invalid score') });
            expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');
        });

        it('should trigger Deep Rollback (No Partial Writes) if bulk insert fails', async () => {
            const dbError = new Error('DB Crash on bulk insert');
            clientMock.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce(defaultCheckRes) // SELECT FOR UPDATE
                .mockResolvedValueOnce(defaultRubricRes) // SELECT Rubric
                .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE status
                .mockResolvedValueOnce({ rows: [{ id: 100, total_score: "47.00", submitted_at: new Date() }] }) // INSERT review
                .mockRejectedValueOnce(dbError); // Bulk INSERT fails

            await expect(submitReview(1, 'user1', validPayload)).rejects.toThrow(dbError);
            
            expect(clientMock.query).not.toHaveBeenCalledWith('COMMIT');
            expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');
        });

        it('should ensure Idempotency (Sequential Double-Submit fail securely)', async () => {
            // First call succeeds
            clientMock.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce(defaultCheckRes) // SELECT FOR UPDATE
                .mockResolvedValueOnce(defaultRubricRes) // SELECT Rubric
                .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE status
                .mockResolvedValueOnce({ rows: [{ id: 100 }] }) // INSERT review
                .mockResolvedValueOnce({}) // Bulk INSERT
                .mockResolvedValueOnce(); // COMMIT

            await submitReview(1, 'user1', validPayload);

            // Second sequential call simulates the DB constraint catching it or status already COMPLETED
            clientMock.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce({ rows: [{ ...defaultCheckRes.rows[0], status: 'COMPLETED' }] }); // It is now COMPLETED

            await expect(submitReview(1, 'user1', validPayload)).rejects.toMatchObject({ status: 400, message: expect.stringContaining('Review already submitted') });
        });

        it('should validate Transaction Isolation (Concurrency Race Condition blocked deterministically)', async () => {
            // Simulate 2 parallel connections
            const clientMock1 = { query: jest.fn(), release: jest.fn() };
            const clientMock2 = { query: jest.fn(), release: jest.fn() };
            
            poolMock.connect
                .mockResolvedValueOnce(clientMock1)
                .mockResolvedValueOnce(clientMock2);

            // Client 1 succeeds
            clientMock1.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce(defaultCheckRes) // SELECT FOR UPDATE
                .mockResolvedValueOnce(defaultRubricRes) // SELECT Rubric
                .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE status (Success, changes 1 row)
                .mockResolvedValueOnce({ rows: [{ id: 100 }] }) // INSERT review
                .mockResolvedValueOnce({}) // Bulk INSERT
                .mockResolvedValueOnce(); // COMMIT

            // Client 2 passes SELECT FOR UPDATE (reads PENDING before Client 1 commits in this mocked race)
            // But fails on UPDATE status WHERE status = 'PENDING'
            clientMock2.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce(defaultCheckRes) // SELECT FOR UPDATE sees PENDING
                .mockResolvedValueOnce(defaultRubricRes) // SELECT Rubric
                .mockResolvedValueOnce({ rowCount: 0 }); // UPDATE status WHERE status='PENDING' returns 0 rows!

            const results = await Promise.allSettled([
                submitReview(1, 'user1', validPayload),
                submitReview(1, 'user2', validPayload) // Pretend user2 is trying to submit for same assignment
            ]);

            expect(results[0].status).toBe('fulfilled');
            expect(results[1].status).toBe('rejected');
            expect(results[1].reason).toMatchObject({ status: 400, message: expect.stringContaining('Review already submitted') });
            expect(clientMock2.query).toHaveBeenCalledWith('ROLLBACK');
        });
    });

    describe('Masking Non-Reversible Tests', () => {
        it('getMyReviewAssignments should strictly mask output', async () => {
            poolMock.query.mockResolvedValueOnce({
                rows: [{
                    review_assignment_id: 10,
                    review_status: 'PENDING',
                    assigned_at: '2023-01-01',
                    submission_id: 999, // Should be masked!
                    version_number: 2,
                    created_at: '2023-01-01',
                    file_url: 'http://raw-file.pdf',
                    full_count: "1"
                }]
            });

            const result = await getMyReviewAssignments(1, 'user1', 10, 0);
            
            expect(result.rows[0].submission.id).toBeUndefined();
            // Non-reversible check: The generated hash must not be the raw ID
            expect(result.rows[0].submission.publicId).toBeDefined();
            expect(result.rows[0].submission.publicId).not.toBe('999');
            expect(result.rows[0].submission.fileUrl).toContain('/download'); // Proxy URL
        });

        it('getReviewAssignmentDetail should mask submission securely', async () => {
            poolMock.query
                .mockResolvedValueOnce({ // Assignment Detail Query
                    rows: [{
                        review_assignment_id: 10,
                        review_status: 'PENDING',
                        assigned_at: '2023-01-01',
                        submission_id: 888, // Raw ID
                        assignment_id: 1,
                        submission_created_at: '2023-01-01',
                        assignment_title: 'Title',
                        assignment_description: 'Desc',
                        assignment_deadline: new Date(Date.now() + 10000).toISOString()
                    }]
                })
                .mockResolvedValueOnce({ rows: [] }); // Attachments Query

            getRubricAndCriteria.mockResolvedValueOnce({ id: 1, description: '', criteria: [] });

            const result = await getReviewAssignmentDetail(10, 'user1');
            
            expect(result.submission.id).toBeUndefined();
            expect(typeof result.submission.publicId).toBe('string');
            expect(result.submission.publicId).not.toBe('888');
        });
    });

    describe('Hybrid Sampling (Stable under all sizes)', () => {
        it('should handle < 100 reviews correctly', async () => {
            const mockRows = Array.from({ length: 10 }).map((_, i) => ({
                overall_comment: `Comment ${i}`,
                submitted_at: Date.now() - i * 1000,
                criteria_comments: `Criteria ${i}`
            }));
            poolMock.query.mockResolvedValueOnce({ rows: mockRows });

            const result = await getAssignmentReviewsForSynthesis(1);
            expect(result.totalReviews).toBe(10);
            expect(result.reviewsUsed).toBe(10);
        });

        it('should handle exactly 100 reviews correctly', async () => {
            const mockRows = Array.from({ length: 100 }).map((_, i) => ({
                overall_comment: `Comment ${i}`,
                submitted_at: Date.now() - i * 1000,
                criteria_comments: `Criteria ${i}`
            }));
            poolMock.query.mockResolvedValueOnce({ rows: mockRows });

            const result = await getAssignmentReviewsForSynthesis(1);
            expect(result.totalReviews).toBe(100);
            expect(result.reviewsUsed).toBe(100);
        });

        it('should handle > 100 reviews (Hybrid Sampling execution without crash)', async () => {
            const mockRows = Array.from({ length: 1000 }).map((_, i) => ({
                overall_comment: `Comment ${i}`,
                submitted_at: Date.now() - i * 1000,
                criteria_comments: `Criteria ${i}`
            }));
            poolMock.query.mockResolvedValueOnce({ rows: mockRows });

            const result = await getAssignmentReviewsForSynthesis(1);
            expect(result.totalReviews).toBe(1000);
            expect(result.reviewsUsed).toBeLessThanOrEqual(100); 
            // 40 newest + 40 longest + 20 random (could be slightly less if overlaps exist, but definitely clamped)
            expect(result.reviewsUsed).toBeGreaterThan(80);
        });
    });
});
