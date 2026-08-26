import { jest } from '@jest/globals';
import poolMock from '../__mocks__/db.mock.js';
import { AppError } from '../../src/utils/AppError.js';

const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
};

let getRubricAndCriteria, saveRubric, deleteRubric;

beforeAll(async () => {
    // Custom db mock setup for transactions
    const dbMock = {
        ...poolMock,
        connect: jest.fn(() => mockClient),
    };
    jest.unstable_mockModule('../../src/config/db.js', () => ({ default: dbMock }));
    
    const rubricService = await import('../../src/services/rubric.service.js');
    getRubricAndCriteria = rubricService.getRubricAndCriteria;
    saveRubric = rubricService.saveRubric;
    deleteRubric = rubricService.deleteRubric;
});

describe('rubric.service (MVP)', () => {
    const teacherOwner = { userId: 'teacher1', role: 'TEACHER' };
    const teacherOther = { userId: 'teacher2', role: 'TEACHER' };
    const studentUser = { userId: 'student1', role: 'STUDENT' };
    
    const validCriteria = [
        { name: 'C1', description: 'Desc 1', weight: 40 },
        { name: 'C2', description: 'Desc 2', weight: 60 }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('saveRubric', () => {
        it('should create rubric successfully (happy path)', async () => {
            // verifyTeacherOwnership
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'teacher1' }] });
            
            // Transaction: BEGIN, SELECT FOR UPDATE, INSERT, INSERT criteria 1, INSERT criteria 2, SELECT criteria, COMMIT
            mockClient.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // SELECT FOR UPDATE (not found)
                .mockResolvedValueOnce({ rows: [{ id: 100 }] }) // INSERT rubric
                .mockResolvedValueOnce() // INSERT C1
                .mockResolvedValueOnce() // INSERT C2
                .mockResolvedValueOnce({ rows: validCriteria }) // SELECT criteria
                .mockResolvedValueOnce(); // COMMIT
            
            const res = await saveRubric(1, 'New Rubric', validCriteria, teacherOwner);
            expect(res).toMatchObject({
                id: expect.any(Number),
                criteria: expect.any(Array)
            });
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        });

        it('should update rubric successfully if it already exists', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'teacher1' }] });
            
            // Transaction: BEGIN, SELECT FOR UPDATE, UPDATE, DELETE criteria, INSERT C1, INSERT C2, SELECT criteria, COMMIT
            mockClient.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 100 }] }) // SELECT FOR UPDATE (found)
                .mockResolvedValueOnce() // UPDATE rubric
                .mockResolvedValueOnce() // DELETE old criteria
                .mockResolvedValueOnce() // INSERT C1
                .mockResolvedValueOnce() // INSERT C2
                .mockResolvedValueOnce({ rows: validCriteria }) // SELECT criteria
                .mockResolvedValueOnce(); // COMMIT
            
            const res = await saveRubric(1, 'Updated Rubric', validCriteria, teacherOwner);
            expect(res).toMatchObject({
                id: expect.any(Number),
                criteria: expect.any(Array)
            });
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        });

        it('should throw 400 and NOT call DB for invalid inputs (short-circuit)', async () => {
            // empty criteria
            let err = await saveRubric(1, 'Desc', [], teacherOwner).catch(e => e);
            expect(err).toBeInstanceOf(AppError);
            expect(err.status).toBe(400);
            
            // null criteria
            err = await saveRubric(1, 'Desc', null, teacherOwner).catch(e => e);
            expect(err).toBeInstanceOf(AppError);
            expect(err.status).toBe(400);

            // empty name
            err = await saveRubric(1, 'Desc', [{ name: '', weight: 100 }], teacherOwner).catch(e => e);
            expect(err).toBeInstanceOf(AppError);
            expect(err.status).toBe(400);
            
            // invalid assignmentId
            err = await saveRubric('invalid', 'Desc', validCriteria, teacherOwner).catch(e => e);
            expect(err).toBeInstanceOf(AppError);
            expect(err.status).toBe(400);

            // Verify short-circuit
            expect(poolMock.query).not.toHaveBeenCalled();
        });

        it('should throw 400 if total weight is not 100', async () => {
            const invalidCriteria = [
                { name: 'C1', description: 'Desc 1', weight: 40 },
                { name: 'C2', description: 'Desc 2', weight: 50 } // Total 90
            ];
            
            const error = await saveRubric(1, 'New Rubric', invalidCriteria, teacherOwner).catch(e => e);
            expect(error).toBeInstanceOf(AppError);
            expect(error.status).toBe(400);
        });

        it('should throw 400 for duplicate criteria names', async () => {
            const invalidCriteria = [
                { name: 'C1', description: 'Desc 1', weight: 50 },
                { name: 'C1', description: 'Desc 2', weight: 50 } 
            ];
            
            const error = await saveRubric(1, 'New Rubric', invalidCriteria, teacherOwner).catch(e => e);
            expect(error).toBeInstanceOf(AppError);
            expect(error.status).toBe(400);
        });

        it('should throw 404 when teacher does not own the class', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'teacher1' }] }); // 'teacher1' owns, but 'teacherOther' is calling
            
            const error = await saveRubric(1, 'New Rubric', validCriteria, teacherOther).catch(e => e);
            expect(error.status).toBe(404);
            expect(error.message).toContain('not found');
        });

        it('should throw 403 if student tries to save rubric', async () => {
            const error = await saveRubric(1, 'New Rubric', validCriteria, studentUser).catch(e => e);
            expect(error.status).toBe(403);
            expect(error.message).toContain('Forbidden');
        });

        it('should rollback and NOT commit if criteria insert fails mid-transaction', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'teacher1' }] }); // auth check
            
            mockClient.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // SELECT FOR UPDATE
                .mockResolvedValueOnce({ rows: [{ id: 100 }] }) // INSERT rubric
                .mockRejectedValueOnce(new Error('Criteria Error')); // INSERT C1 fails
            
            await expect(saveRubric(1, 'New Rubric', validCriteria, teacherOwner)).rejects.toThrow(Error);
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        });

        it('should throw 500 on DB crash during transaction and rollback', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'teacher1' }] });
            
            mockClient.query
                .mockResolvedValueOnce() // BEGIN
                .mockRejectedValueOnce(new Error('Crash!')); // next query crashes
            
            await expect(saveRubric(1, 'New Rubric', validCriteria, teacherOwner)).rejects.toThrow(Error);
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });

    describe('getRubricAndCriteria', () => {
        it('should return rubric with criteria for owner teacher', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'teacher1' }] }); // auth verify
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 100, description: 'R1' }] }); // rubric query
            poolMock.query.mockResolvedValueOnce({ rows: validCriteria }); // criteria query
            
            const res = await getRubricAndCriteria(1, teacherOwner);
            expect(res.id).toBe(100);
            expect(res.criteria).toHaveLength(2);
        });

        it('should return rubric with criteria for authorized student', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ user_id: 'student1' }] }); // auth check: realistic shape
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 100, description: 'R1' }] }); // rubric query
            poolMock.query.mockResolvedValueOnce({ rows: [] }); // criteria query empty
            
            const res = await getRubricAndCriteria(1, studentUser);
            expect(res.id).toBe(100);
            expect(res.criteria).toHaveLength(0); // empty criteria OK
        });

        it('should throw 404 if not found (student unauthorized)', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [] }); // student not in group
            
            const error = await getRubricAndCriteria(1, studentUser).catch(e => e);
            expect(error.status).toBe(404);
        });

        it('should throw 404 if rubric does not exist', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'teacher1' }] }); // auth OK
            poolMock.query.mockResolvedValueOnce({ rows: [] }); // rubric query empty
            
            const error = await getRubricAndCriteria(1, teacherOwner).catch(e => e);
            expect(error.status).toBe(404);
        });

        it('should throw 500 when DB crashes', async () => {
            poolMock.query.mockRejectedValueOnce(new Error('DB Crash!'));
            await expect(getRubricAndCriteria(1, teacherOwner)).rejects.toThrow('DB Crash!');
        });

        it('should throw 500 when DB returns invalid shape (driver bug)', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'teacher1' }] }); // auth OK
            poolMock.query.mockResolvedValueOnce(null); // driver bug for rubricQuery
            
            await expect(getRubricAndCriteria(1, teacherOwner)).rejects.toThrow('Invalid DB response');
        });
    });

    describe('deleteRubric', () => {
        it('should delete successfully', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'teacher1' }] }); // auth verify
            mockClient.query.mockResolvedValueOnce({}); // BEGIN
            mockClient.query.mockResolvedValueOnce({ rows: [{ id: 100 }] }); // rubric exists
            mockClient.query.mockResolvedValueOnce({ rows: [] }); // in use check (none)
            mockClient.query.mockResolvedValueOnce({}); // DELETE
            mockClient.query.mockResolvedValueOnce({}); // COMMIT
            
            const res = await deleteRubric(1, teacherOwner);
            expect(res).toBe(true);
        });

        it('should block delete if in use by submissions', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'teacher1' }] }); // auth verify
            mockClient.query.mockResolvedValueOnce({}); // BEGIN
            mockClient.query.mockResolvedValueOnce({ rows: [{ id: 100 }] }); // rubric exists
            mockClient.query.mockResolvedValueOnce({ rows: [{ id: 500 }] }); // in use check -> submission exists!
            mockClient.query.mockResolvedValueOnce({}); // ROLLBACK
            
            const error = await deleteRubric(1, teacherOwner).catch(e => e);
            expect(error.status).toBe(400);
            expect(error.message).toContain('submissions already exist');
        });

        it('should throw 404 if teacher not owner', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'teacher1' }] }); // auth verify fails for other
            
            const error = await deleteRubric(1, teacherOther).catch(e => e);
            expect(error.status).toBe(404);
        });

        it('should throw 403 if student tries to delete rubric', async () => {
            const error = await deleteRubric(1, studentUser).catch(e => e);
            expect(error).toBeInstanceOf(AppError);
            expect(error.status).toBe(403);
            expect(poolMock.query).not.toHaveBeenCalled();
        });

        it('should throw 404 if rubric does not exist', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'teacher1' }] }); // auth verify
            mockClient.query.mockResolvedValueOnce({}); // BEGIN
            mockClient.query.mockResolvedValueOnce({ rows: [] }); // rubric doesn't exist
            mockClient.query.mockResolvedValueOnce({}); // ROLLBACK
            
            const error = await deleteRubric(1, teacherOwner).catch(e => e);
            expect(error.status).toBe(404);
        });

        it('should throw 500 when DB crashes on delete', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'teacher1' }] }); // auth verify
            mockClient.query.mockResolvedValueOnce({}); // BEGIN
            mockClient.query.mockResolvedValueOnce({ rows: [{ id: 100 }] }); // rubric exists
            mockClient.query.mockResolvedValueOnce({ rows: [] }); // in use check (none)
            mockClient.query.mockRejectedValueOnce(new Error('Delete Crash!')); // DELETE crashes
            mockClient.query.mockResolvedValueOnce({}); // ROLLBACK
            
            await expect(deleteRubric(1, teacherOwner)).rejects.toThrow('Delete Crash!');
        });
    });
});
