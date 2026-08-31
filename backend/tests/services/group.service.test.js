import { jest } from '@jest/globals';
import poolMock from '../__mocks__/db.mock.js';
import { createGroupScenario, createMockDbGroupRow } from '../factories/group.factory.js';

let getGroupById, getAllGroups, createGroup, addMember, removeMember, assignLeader, studentJoinGroup, studentLeaveGroup, AppError;

beforeAll(async () => {
    // Only reset modules once per file if using cache, or use beforeAll to speed up tests
    jest.unstable_mockModule('../../src/config/db.js', () => ({ default: poolMock }));
    
    const groupService = await import('../../src/services/group.service.js');
    getGroupById = groupService.getGroupById;
    getAllGroups = groupService.getAllGroups;
    createGroup = groupService.createGroup;
    addMember = groupService.addMember;
    removeMember = groupService.removeMember;
    assignLeader = groupService.assignLeader;
    studentJoinGroup = groupService.studentJoinGroup;
    studentLeaveGroup = groupService.studentLeaveGroup;
    
    const appErrorModule = await import('../../src/utils/AppError.js');
    AppError = appErrorModule.AppError;
});

beforeEach(() => {
    poolMock.query.mockReset();
});

describe('group.service', () => {
    let scenario;
    let dbGroupRow;
    let dbMembersRows;

    beforeEach(() => {
        scenario = createGroupScenario({
            groupId: 1,
            ownerId: 'teacher-owner',
            members: [
                { userId: 'student-1', isLeader: true },
                { userId: 'student-2', isLeader: false }
            ]
        });
        dbGroupRow = createMockDbGroupRow(scenario);
        dbGroupRow.teacher_id = scenario.teacher_id;
        
        dbMembersRows = scenario.members.map(m => ({
            id: m.user_id,
            full_name: m.full_name,
            email: m.email,
            is_leader: m.is_leader,
            joined_at: m.joined_at,
            group_id: scenario.id
        }));
    });

    describe('getGroupById', () => {
        const NOT_FOUND_MSG = 'Group not found or you do not have permission to view it';
        
        it('should return group successfully for the teacher owner (happy path) and normalize output', async () => {
            const userContext = { role: 'TEACHER', userId: 'teacher-owner' };
            poolMock.query.mockResolvedValueOnce({ rows: [dbGroupRow] });
            poolMock.query.mockResolvedValueOnce({ rows: dbMembersRows });

            const result = await getGroupById(scenario.id, userContext);
            
            expect(result.id).toBe(scenario.id);
            expect(result.members).toHaveLength(2);
            expect(result).toHaveProperty('teacherId', scenario.teacher_id); // Output normalization
            expect(poolMock.query).toHaveBeenCalledTimes(2); // Behavior-first
        });

        it('should return group successfully for a student member (happy path)', async () => {
            const userContext = { role: 'STUDENT', userId: 'student-1' };
            poolMock.query.mockResolvedValueOnce({ rows: [dbGroupRow] });
            poolMock.query.mockResolvedValueOnce({ rows: dbMembersRows });

            const result = await getGroupById(scenario.id, userContext);
            
            expect(result.id).toBe(scenario.id);
            expect(poolMock.query).toHaveBeenCalledTimes(2);
        });

        it('should throw 404 when group not found (empty DB response)', async () => {
            const userContext = { role: 'TEACHER', userId: 'teacher-owner' };
            poolMock.query.mockResolvedValueOnce({ rows: [] }); // Group not found
            
            await expect(getGroupById(scenario.id, userContext))
                .rejects
                .toMatchObject({ 
                    status: 404,
                    message: NOT_FOUND_MSG
                });
            expect(poolMock.query).toHaveBeenCalledTimes(1);
        });

        it('should throw 404 and NOT leak group existence when student is NOT in the group', async () => {
            const userContext = { role: 'STUDENT', userId: 'outsider-student' };
            poolMock.query.mockResolvedValueOnce({ rows: [dbGroupRow] }); 
            poolMock.query.mockResolvedValueOnce({ rows: dbMembersRows }); 

            await expect(getGroupById(scenario.id, userContext))
                .rejects
                .toMatchObject({ 
                    status: 404,
                    message: NOT_FOUND_MSG
                });
        });

        it('should throw 404 when teacher is NOT the owner and short-circuit', async () => {
            const userContext = { role: 'TEACHER', userId: 'teacher-not-owner' };
            poolMock.query.mockResolvedValueOnce({ rows: [dbGroupRow] }); 
            
            const error = await getGroupById(scenario.id, userContext).catch(e => e);
            expect(error).toBeInstanceOf(AppError);
            expect(error.status).toBe(404);
            expect(error.message).toBe(NOT_FOUND_MSG);
            expect(poolMock.query).toHaveBeenCalledTimes(1); // Short circuit
        });

        it('should reject Role Escalation Attack (e.g., student faking teacher role)', async () => {
            const userContext = { role: 'TEACHER', userId: 'student-1' };
            poolMock.query.mockResolvedValueOnce({ rows: [dbGroupRow] }); 

            await expect(getGroupById(scenario.id, userContext))
                .rejects
                .toMatchObject({ status: 404, message: NOT_FOUND_MSG });
        });

        it('should detect corrupted membership data (duplicate roles conflict) and throw 500', async () => {
            const userContext = { role: 'TEACHER', userId: 'teacher-owner' };
            poolMock.query.mockResolvedValueOnce({ rows: [dbGroupRow] }); 
            
            const normalStudent = { ...dbMembersRows[1], is_leader: false };
            const sameStudentAsLeader = { ...dbMembersRows[1], is_leader: true };
            
            poolMock.query.mockResolvedValueOnce({ rows: [normalStudent, sameStudentAsLeader] }); 

            await expect(getGroupById(scenario.id, userContext))
                .rejects
                .toMatchObject({ status: 500 });
        });

        it('should throw 500 when dealing with corrupted membership data (missing user ID or role)', async () => {
            const userContext = { role: 'TEACHER', userId: 'teacher-owner' };
            poolMock.query.mockResolvedValueOnce({ rows: [dbGroupRow] }); 
            
            const corruptedMember = { full_name: 'Ghost' }; // Missing `id` and `is_leader`
            poolMock.query.mockResolvedValueOnce({ rows: [corruptedMember] }); 

            await expect(getGroupById(scenario.id, userContext)).rejects.toMatchObject({ status: 500 });
        });

        it('should throw 500 when DB returns invalid group shape', async () => {
            const userContext = { role: 'TEACHER', userId: 'teacher-owner' };
            poolMock.query.mockResolvedValueOnce({ rows: [{}] }); // Empty group object
            
            await expect(getGroupById(scenario.id, userContext)).rejects.toMatchObject({ status: 500 });
        });
        
        it('should throw 500 when DB returns unexpected shape (null rows driver crash)', async () => {
            const userContext = { role: 'TEACHER', userId: 'teacher-owner' };
            poolMock.query.mockResolvedValueOnce({ rows: null }); // Driver crash
            
            await expect(getGroupById(scenario.id, userContext)).rejects.toThrow(TypeError);
        });

        const invalidIds = [null, undefined, 1.5, -1, {}, [], "abc", "   ", NaN];
        it.each(invalidIds)('should reject invalid id: %p with 400', async (invalidId) => {
            const userContext = { role: 'TEACHER', userId: 'teacher-owner' };
            
            await expect(getGroupById(invalidId, userContext)).rejects.toMatchObject({ status: 400 });
            expect(poolMock.query).not.toHaveBeenCalled();
        });
        
        it('should handle concurrency cleanly without race conditions', async () => {
            const userContext = { role: 'TEACHER', userId: 'teacher-owner' };
            poolMock.query.mockImplementation((queryStr) => {
                if (queryStr.includes('FROM groups g')) {
                    return Promise.resolve({ rows: [dbGroupRow] });
                }
                if (queryStr.includes('FROM group_members gm')) {
                    return Promise.resolve({ rows: dbMembersRows });
                }
                return Promise.resolve({ rows: [] });
            });
            
            const results = await Promise.all([
                getGroupById(scenario.id, userContext),
                getGroupById(scenario.id, userContext)
            ]);
            
            expect(results).toHaveLength(2);
            expect(results[0].id).toBe(scenario.id);
            expect(results[1].id).toBe(scenario.id);
        });
    });

    describe('createGroup', () => {
        const userContext = { role: 'TEACHER', userId: 'teacher-owner' };
        
        it('should create group successfully (happy path)', async () => {
            const mockInput = { classId: 1, name: 'Team Alpha' };
            const mockDbRow = {
                id: 2,
                class_id: mockInput.classId,
                name: mockInput.name,
                created_at: '2025-01-01T12:00:00Z'
            };
            
            poolMock.query.mockResolvedValueOnce({ rows: [{ teacher_id: userContext.userId }] }); // Class check
            poolMock.query.mockResolvedValueOnce({ rows: [] }); // Uniqueness check
            poolMock.query.mockResolvedValueOnce({ rows: [mockDbRow] }); // Insert
            
            const result = await createGroup(mockInput.classId, mockInput.name, userContext);
            
            expect(result).toEqual(mockDbRow);
            expect(poolMock.query).toHaveBeenCalledTimes(3);
        });

        it('should throw 403 and short-circuit if user is not a teacher', async () => {
            const studentContext = { role: 'STUDENT', userId: 'student-1' };
            await expect(createGroup(1, 'name', studentContext))
                .rejects
                .toMatchObject({ status: 403 });
            
            expect(poolMock.query).not.toHaveBeenCalled(); // Short-circuit
        });

        it('should throw 403 if teacher does not manage the class', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ teacher_id: 'other-teacher' }] });
            
            await expect(createGroup(1, 'name', userContext))
                .rejects
                .toMatchObject({ status: 403 });
        });

        it('should throw 404 if class not found', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [] });
            
            const error = await createGroup(1, 'name', userContext).catch(e => e);
            expect(error).toBeInstanceOf(AppError);
            expect(error.status).toBe(404);
        });
        
        it('should throw 409 if a group with the same name already exists in the class', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ teacher_id: userContext.userId }] });
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 99 }] }); // Existing group
            
            const error = await createGroup(1, 'Existing Team', userContext).catch(e => e);
            expect(error).toBeInstanceOf(AppError);
            expect(error.status).toBe(409);
        });

        const invalidInputs = [
            { classId: null, name: 'Team Alpha' },
            { classId: 1, name: null },
            { classId: 1, name: '' },
            { classId: 1, name: '   ' }
        ];
        it.each(invalidInputs)('should reject invalid input %p with 400', async (input) => {
            const error = await createGroup(input.classId, input.name, userContext).catch(e => e);
            expect(error).toBeInstanceOf(AppError);
            expect(error.status).toBe(400);
            expect(poolMock.query).not.toHaveBeenCalled();
        });
        
        it('should throw and not swallow error when DB crashes on createGroup', async () => {
            poolMock.query.mockRejectedValueOnce(new Error('DB Crash'));
            
            await expect(createGroup(1, 'name', userContext)).rejects.toThrow('DB Crash');
        });
    });

    describe('getAllGroups (MVP)', () => {
        const mockRows = [{ id: 1, name: 'Group 1', class_id: 1, class_name: 'Math', created_at: '2025', member_count: 3 }];
        
        it('should return groups for ADMIN (happy path)', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: mockRows });
            const result = await getAllGroups({ role: 'ADMIN', userId: 'admin1' });
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Group 1');
            expect(poolMock.query).toHaveBeenCalledTimes(1);
        });

        it('should return groups for TEACHER with classId filter (happy path)', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: mockRows });
            const result = await getAllGroups({ role: 'TEACHER', userId: 'teacher1' }, 1);
            expect(result).toHaveLength(1);
        });

        it('should return groups for STUDENT (happy path)', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: mockRows });
            const result = await getAllGroups({ role: 'STUDENT', userId: 'student1' });
            expect(result).toHaveLength(1);
        });

        it('should throw 400 for invalid user context', async () => {
            const error = await getAllGroups(null).catch(e => e);
            expect(error).toBeInstanceOf(AppError);
            expect(error.status).toBe(400);
        });

        it('should throw 403 for unsupported role', async () => {
            const error = await getAllGroups({ role: 'GUEST', userId: 'guest1' }).catch(e => e);
            expect(error).toBeInstanceOf(AppError);
            expect(error.status).toBe(403);
        });

        it('should propagate DB crash', async () => {
            poolMock.query.mockRejectedValueOnce(new Error('DB read failed'));
            await expect(getAllGroups({ role: 'ADMIN', userId: 'admin1' })).rejects.toThrow('DB read failed');
        });
    });

    describe('addMember (MVP)', () => {
        const currentUser = { role: 'TEACHER', userId: 'teacher1' };
        
        it('should add member successfully (happy path)', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, class_id: 1, teacher_id: 'teacher1' }] }); // group check
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 'student1', role: 'STUDENT' }] }); // user check
            poolMock.query.mockResolvedValueOnce({ rows: [{}] }); // class membership check
            poolMock.query.mockResolvedValueOnce({ rows: [] }); // duplicate check
            poolMock.query.mockResolvedValueOnce({ rows: [] }); // class limit check
            poolMock.query.mockResolvedValueOnce({ rows: [{ count: 1 }] }); // member count check
            poolMock.query.mockResolvedValueOnce({ rows: [{ group_id: 1, user_id: 'student1', is_leader: false }] }); // insert

            const result = await addMember(1, 'student1', currentUser);
            expect(result.group_id).toBe(1);
            expect(poolMock.query).toHaveBeenCalledTimes(7);
        });

        it('should throw 404 if group not found', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [] });
            
            const error = await addMember(1, 'student1', currentUser).catch(e => e);
            expect(error.status || error.statusCode).toBe(404);
        });

        it('should throw 403 if teacher does not manage class', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, class_id: 1, teacher_id: 'otherTeacher' }] });
            
            const error = await addMember(1, 'student1', currentUser).catch(e => e);
            expect(error.status || error.statusCode).toBe(403);
        });

        it('should throw 400 if user to add is not a STUDENT', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, class_id: 1, teacher_id: 'teacher1' }] });
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 'teacher2', role: 'TEACHER' }] });
            
            const error = await addMember(1, 'teacher2', currentUser).catch(e => e);
            expect(error.status || error.statusCode).toBe(400);
        });

        it('should throw 409 if duplicate member (edge case)', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, class_id: 1, teacher_id: 'teacher1' }] });
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 'student1', role: 'STUDENT' }] });
            poolMock.query.mockResolvedValueOnce({ rows: [{}] }); // class membership check
            poolMock.query.mockResolvedValueOnce({ rows: [{}] }); // duplicate found
            
            const error = await addMember(1, 'student1', currentUser).catch(e => e);
            expect(error.status || error.statusCode).toBe(409);
        });

        it('should propagate DB crash', async () => {
            poolMock.query.mockRejectedValueOnce(new Error('DB insert failed'));
            
            await expect(addMember(1, 'student1', currentUser)).rejects.toThrow('DB insert failed');
        });
    });

    describe('removeMember (MVP)', () => {
        const currentUser = { role: 'TEACHER', userId: 'teacher1' };
        
        it('should remove member successfully (happy path)', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, class_id: 1, teacher_id: 'teacher1' }] }); // group check
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 'student1' }] }); // user check
            poolMock.query.mockResolvedValueOnce({ rows: [{}] }); // member check
            poolMock.query.mockResolvedValueOnce({ rows: [] }); // delete

            const result = await removeMember(1, 'student1', currentUser);
            expect(result).toBe(true);
            expect(poolMock.query).toHaveBeenCalledTimes(4);
        });

        it('should throw 403 if teacher does not manage class', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, teacher_id: 'otherTeacher' }] });
            const error = await removeMember(1, 'student1', currentUser).catch(e => e);
            expect(error.status || error.statusCode).toBe(403);
        });
    });

    describe('assignLeader (MVP)', () => {
        const currentUser = { role: 'TEACHER', userId: 'teacher1' };
        
        it('should assign leader successfully (happy path)', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, class_id: 1, teacher_id: 'teacher1' }] }); // group check
            
            // Mock transaction queries
            const clientMock = {
                query: jest.fn(),
                release: jest.fn()
            };
            poolMock.connect.mockResolvedValueOnce(clientMock);
            
            clientMock.query.mockResolvedValueOnce({}); // BEGIN
            clientMock.query.mockResolvedValueOnce({ rows: [{}] }); // member check
            clientMock.query.mockResolvedValueOnce({}); // update false
            clientMock.query.mockResolvedValueOnce({}); // update true
            clientMock.query.mockResolvedValueOnce({}); // COMMIT

            const result = await assignLeader(1, 'student1', currentUser);
            expect(result.is_leader).toBe(true);
            expect(clientMock.query).toHaveBeenCalledTimes(5);
            expect(clientMock.release).toHaveBeenCalled();
        });

        it('should rollback transaction on error', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, class_id: 1, teacher_id: 'teacher1' }] }); // group check
            
            const clientMock = {
                query: jest.fn(),
                release: jest.fn()
            };
            poolMock.connect.mockResolvedValueOnce(clientMock);
            clientMock.query.mockResolvedValueOnce({}); // BEGIN
            clientMock.query.mockRejectedValueOnce(new Error('Crash')); // member check crash
            
            await expect(assignLeader(1, 'student1', currentUser)).rejects.toThrow('Crash');
            expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');
            expect(clientMock.release).toHaveBeenCalled();
        });
    });

    describe('studentJoinGroup & studentLeaveGroup (MVP)', () => {
        it('studentJoinGroup should succeed (happy path)', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1, class_id: 1 }] }); // group check
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 'student1', role: 'STUDENT' }] }); // user check
            poolMock.query.mockResolvedValueOnce({ rows: [{}] }); // class membership check
            poolMock.query.mockResolvedValueOnce({ rows: [] }); // duplicate check
            poolMock.query.mockResolvedValueOnce({ rows: [] }); // class limit check
            poolMock.query.mockResolvedValueOnce({ rows: [{ count: 1 }] }); // member count check
            poolMock.query.mockResolvedValueOnce({ rows: [{ group_id: 1, user_id: 'student1', is_leader: false }] }); // insert
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 101 }] }); // logActivity insert

            const result = await studentJoinGroup(1, 'student1');
            expect(result.group_id).toBe(1);
        });

        it('studentLeaveGroup should succeed (happy path)', async () => {
            poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // group check
            poolMock.query.mockResolvedValueOnce({ rows: [{}] }); // member check
            poolMock.query.mockResolvedValueOnce({ rows: [] }); // delete

            const result = await studentLeaveGroup(1, 'student1');
            expect(result).toBe(true);
        });
    });
});
