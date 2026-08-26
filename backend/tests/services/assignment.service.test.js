import { jest } from '@jest/globals';
import poolMock from '../__mocks__/db.mock.js';

let getAssignmentById, getAllAssignments, createAssignment, updateAssignment, deleteAssignment, getAssignmentDetailById, AppError;

beforeAll(async () => {
    jest.unstable_mockModule('../../src/config/db.js', () => ({ default: poolMock }));
    
    const assignmentService = await import('../../src/services/assignment.service.js');
    getAssignmentById = assignmentService.getAssignmentById;
    getAllAssignments = assignmentService.getAllAssignments;
    createAssignment = assignmentService.createAssignment;
    updateAssignment = assignmentService.updateAssignment;
    deleteAssignment = assignmentService.deleteAssignment;
    getAssignmentDetailById = assignmentService.getAssignmentDetailById;
    
    const appErrorModule = await import('../../src/utils/AppError.js');
    AppError = appErrorModule.AppError;
});

afterEach(() => {
    // Relying on global jest.setup.js to clear/restore mocks and check console.error
});

describe('assignment.service (MVP)', () => {
    const adminUser = { role: 'ADMIN', userId: 'admin1' };
    const teacherOwner = { role: 'TEACHER', userId: 'teacher1' };
    const teacherOther = { role: 'TEACHER', userId: 'teacher2' };
    const studentUser = { role: 'STUDENT', userId: 'student1' };
    const dbAssignmentRow = { id: 1, class_id: 1, title: 'Test Assignment', deadline: '2026-12-31' };

    describe('createAssignment (MVP)', () => {
        const payload = { class_id: 1, title: 'Test', description: 'Desc', requirements: 'Req', deadline: '2026-12-31' };

        it('should create assignment successfully for teacher owner (happy path)', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'teacher1' }] }); // class check
            poolMock.query.mockResolvedValueOnce({ rows: [dbAssignmentRow] }); // insert
            
            const result = await createAssignment(payload, teacherOwner);
            expect(result.id).toBe(1);
            expect(poolMock.query).toHaveBeenCalledTimes(2);
        });

        it('should throw 403 if user is not a teacher', async () => {
            const error = await createAssignment(payload, studentUser).catch(e => e);
            expect(error).toBeInstanceOf(AppError);
            expect(error.status).toBe(403);
        });

        it('should throw 403 when teacher does not own class', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'otherTeacher' }] });
            const error = await createAssignment(payload, teacherOwner).catch(e => e);
            expect(error.status).toBe(403);
        });

        it('should throw 400 for invalid title', async () => {
            const error = await createAssignment({ ...payload, title: '   ' }, teacherOwner).catch(e => e);
            expect(error.status).toBe(400);
        });

        it('should propagate DB crash', async () => {
            poolMock.query.mockRejectedValueOnce(new Error('DB Crash'));
            await expect(createAssignment(payload, teacherOwner)).rejects.toThrow('DB Crash');
        });
    });

    describe('getAssignmentById (MVP)', () => {
        it('should return assignment for admin/teacher/student (happy path)', async () => {
            poolMock.query.mockResolvedValue({ rows: [dbAssignmentRow] }); // works for any query here
            
            const adminRes = await getAssignmentById(1, adminUser);
            expect(adminRes.id).toBe(1);

            const teacherRes = await getAssignmentById(1, teacherOwner);
            expect(teacherRes.id).toBe(1);

            const studentRes = await getAssignmentById(1, studentUser);
            expect(studentRes.id).toBe(1);
        });

        it('should throw 404 if assignment not found (or unauthorized by query)', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [] });
            
            const error = await getAssignmentById(1, studentUser).catch(e => e);
            expect(error.status).toBe(404);
        });

        it('should throw 404 when teacher accesses assignment outside their class', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [] }); // Simulating teacher not having access
            const error = await getAssignmentById(1, teacherOther).catch(e => e);
            expect(error.status).toBe(404);
        });

        it('should throw 400 and NOT call DB when id is invalid', async () => {
            const error = await getAssignmentById('invalid', studentUser).catch(e => e);
            expect(error.status).toBe(400);
            expect(poolMock.query).not.toHaveBeenCalled();
        });

        it('should throw 500 when DB returns unexpected shape (driver crash)', async () => {
            poolMock.query.mockResolvedValueOnce(null);
            await expect(getAssignmentById(1, studentUser)).rejects.toThrow();
        });
    });

    describe('getAllAssignments (MVP)', () => {
        it('should return assignments list scoped to student groups', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [dbAssignmentRow] });
            const res = await getAllAssignments(studentUser);
            expect(res).toHaveLength(1);
        });

        it('should return assignments list scoped to teacher class', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [dbAssignmentRow] });
            const res = await getAllAssignments(teacherOwner);
            expect(res).toHaveLength(1);
        });

        it('should throw 400 for missing user context', async () => {
            const error = await getAllAssignments(null).catch(e => e);
            expect(error.status).toBe(400);
        });
    });

    describe('updateAssignment (MVP)', () => {
        const updatePayload = { title: 'Updated', description: 'Desc', requirements: 'Req', deadline: '2026-12-31' };

        it('should update assignment successfully for teacher owner', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'teacher1' }] }); // ownership check
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // lock query
            poolMock.query.mockResolvedValueOnce({ rows: [{ ...dbAssignmentRow, title: 'Updated' }], rowCount: 1 }); // update
            
            const result = await updateAssignment(1, updatePayload, teacherOwner);
            expect(result.title).toBe('Updated');
        });

        it('should throw 404 when teacher is not owner (to prevent existence leak)', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'otherTeacher' }] });
            const error = await updateAssignment(1, updatePayload, teacherOwner).catch(e => e);
            expect(error.status).toBe(404);
        });

        it('should propagate DB crash safely', async () => {
            poolMock.query.mockRejectedValueOnce(new Error('DB Crash'));
            await expect(updateAssignment(1, updatePayload, teacherOwner)).rejects.toThrow('DB Crash');
        });
    });

    describe('deleteAssignment (MVP)', () => {
        it('should delete assignment successfully for teacher owner', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'teacher1' }] }); // ownership check
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }); // delete
            
            const result = await deleteAssignment(1, teacherOwner);
            expect(result).toBe(true);
        });

        it('should throw 404 when teacher is not owner (to prevent existence leak)', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'otherTeacher' }] });
            const error = await deleteAssignment(1, teacherOwner).catch(e => e);
            expect(error.status).toBe(404);
        });

        it('should propagate DB crash safely', async () => {
            poolMock.query.mockRejectedValueOnce(new Error('DB Crash'));
            await expect(deleteAssignment(1, teacherOwner)).rejects.toThrow('DB Crash');
        });
    });

    describe('getAssignmentDetailById (Deadline logic)', () => {
        let fixedTime = new Date('2026-06-15T00:00:00Z').getTime();
        beforeAll(() => {
            jest.spyOn(Date, 'now').mockImplementation(() => fixedTime);
        });
        afterAll(() => {
            jest.restoreAllMocks();
        });

        it('should handle past deadline correctly', async () => {
            // Deadline is 2026-01-01, but current time is 2026-06-15 -> OVERDUE
            poolMock.query.mockResolvedValueOnce({ rows: [{ ...dbAssignmentRow, deadline: '2026-01-01T00:00:00Z' }] }); // basic query
            poolMock.query.mockResolvedValueOnce({ rows: [] }); // rubric
            poolMock.query.mockResolvedValueOnce({ rows: [] }); // attachments
            
            const result = await getAssignmentDetailById(1, adminUser);
            expect(result.deadline_status).toBe('OVERDUE');
            expect(result.assignment_status).toBe('CLOSED');
            expect(result.can_submit).toBe(false);
        });
    });
});
