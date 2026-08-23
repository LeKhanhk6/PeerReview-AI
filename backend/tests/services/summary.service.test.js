import { jest } from '@jest/globals';
import AppError from '../../src/utils/AppError.js';

// Setup module mock for DB pool
jest.unstable_mockModule('../../src/config/db.js', () => ({
    default: {
        query: jest.fn(),
        connect: jest.fn()
    }
}));

const { default: poolMock } = await import('../../src/config/db.js');
const summaryService = await import('../../src/services/summary.service.js');

describe('Summary Service (Teacher Collaboration & DB Locking)', () => {
    let clientMock;

    beforeEach(() => {
        jest.clearAllMocks();
        
        clientMock = {
            query: jest.fn(),
            release: jest.fn(),
        };
        poolMock.connect.mockResolvedValue(clientMock);
    });

    describe('updateSummaryItem - Optimistic Locking', () => {
        const mockCurrentUser = { userId: 1, role: 'TEACHER' };
        
        it('Should reject update if item not found or unauthorized (Anti-enumeration)', async () => {
            poolMock.query.mockResolvedValueOnce({ rowCount: 0 }); // Item not found

            await expect(summaryService.updateSummaryItem(mockCurrentUser, 1, {}))
                .rejects.toMatchObject({ status: 404, message: 'Summary item not found' });
        });

        it('Should throw 409 Conflict if Optimistic Lock fails (updated_at mismatch)', async () => {
            poolMock.query.mockResolvedValueOnce({
                rowCount: 1,
                rows: [{ id: 1, teacher_id: 1, status: 'DRAFT', summary_id: 10 }]
            });

            clientMock.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce({ rowCount: 0 }) // UPDATE returns 0 rows (conflict)
                .mockResolvedValueOnce(); // ROLLBACK

            await expect(summaryService.updateSummaryItem(mockCurrentUser, 1, { content: 'test', updatedAt: '2023-01-01T00:00:00.000Z' }))
                .rejects.toMatchObject({ status: 409, message: expect.stringContaining('Conflict') });

            expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');
        });

        it('Should successfully update if Optimistic Lock passes (updated_at <= payload)', async () => {
            poolMock.query.mockResolvedValueOnce({
                rowCount: 1,
                rows: [{ id: 1, teacher_id: 1, status: 'DRAFT', summary_id: 10, submission_id: 100 }]
            });

            clientMock.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce({ rowCount: 1, rows: [{ updated_at: '2023-01-02T00:00:00.000Z' }] }) // UPDATE success
                .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE STATUS to REVIEWING
                .mockResolvedValueOnce({}) // INSERT Activity
                .mockResolvedValueOnce(); // COMMIT

            const result = await summaryService.updateSummaryItem(mockCurrentUser, 1, { content: 'test', updatedAt: '2023-01-01T00:00:00.000Z' });
            
            expect(result.updatedAt).toBeDefined();
            expect(clientMock.query).toHaveBeenCalledWith('COMMIT');
        });
    });

    describe('approveReviewSummary - NOWAIT Locking', () => {
        const mockCurrentUser = { userId: 1, role: 'TEACHER' };

        it('Should map 55P03 (Lock Not Available) to 409 immediately (NOWAIT rule)', async () => {
            poolMock.query.mockResolvedValueOnce({
                rowCount: 1,
                rows: [{ submission_id: 100, teacher_id: 1 }] // getSubmissionOrFail
            });

            const lockError = new Error('could not obtain lock on row in relation');
            lockError.code = '55P03';

            clientMock.query
                .mockResolvedValueOnce() // BEGIN
                .mockRejectedValueOnce(lockError); // SELECT FOR UPDATE NOWAIT fails

            await expect(summaryService.approveReviewSummary(mockCurrentUser, 100))
                .rejects.toMatchObject({ status: 409, message: expect.stringContaining('currently being updated by another teacher') });
            
            expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');
        });

        it('Should prevent approving an empty summary', async () => {
            poolMock.query.mockResolvedValueOnce({
                rowCount: 1,
                rows: [{ submission_id: 100, teacher_id: 1 }]
            });

            clientMock.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 10, status: 'REVIEWING' }] }) // FOR UPDATE
                .mockResolvedValueOnce({ rowCount: 1, rows: [{ count: '0' }] }); // No items!

            await expect(summaryService.approveReviewSummary(mockCurrentUser, 100))
                .rejects.toMatchObject({ status: 400, message: expect.stringContaining('empty summary') });

            expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');
        });
    });
});
