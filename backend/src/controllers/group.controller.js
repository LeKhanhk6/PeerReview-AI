import * as groupService from '../services/group.service.js';
import { AppError } from '../utils/AppError.js';

export const getAll = async (req, res, next) => {
    try {
        const user = req.user;
        const { classId } = req.query;

        const groups = await groupService.getAllGroups(user, classId);
        return res.ok(groups);
    } catch (error) {
        next(error);
    }
};

export const getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const group = await groupService.getGroupById(id, user);
        return res.ok(group);
    } catch (error) {
        next(error);
    }
};

export const create = async (req, res, next) => {
    try {
        const user = req.user;
        const { class_id, name } = req.body;

        // 2. Class Existence & Ownership Check
        const classInfo = await groupService.getClassOwnershipInfo(class_id);
        if (!classInfo) {
            throw new AppError('Class not found', 404);
        }

        if (user.role === 'TEACHER' && classInfo.teacher_id !== user.userId) {
            throw new AppError('Forbidden: You do not manage this class', 403);
        }

        // 3. Create
        const newGroup = await groupService.createGroup(class_id, name, user);
        return res.ok(newGroup);
    } catch (error) {
        next(error);
    }
};

export const addMember = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;
        const currentUser = req.user;

        const newMember = await groupService.addMember(id, user_id, currentUser);
        return res.ok(newMember);
    } catch (error) {
        next(error);
    }
};

export const removeMember = async (req, res, next) => {
    try {
        const { id, userId } = req.params;
        const currentUser = req.user;

        await groupService.removeMember(id, userId, currentUser);
        return res.ok({ success: true });
    } catch (error) {
        next(error);
    }
};

export const joinGroup = async (req, res, next) => {
    try {
        const { id } = req.params;
        const studentId = req.user.userId;

        const newMember = await groupService.studentJoinGroup(id, studentId);
        return res.ok(newMember);
    } catch (error) {
        next(error);
    }
};

export const leaveGroup = async (req, res, next) => {
    try {
        const { id } = req.params;
        const studentId = req.user.userId;

        await groupService.studentLeaveGroup(id, studentId);
        return res.ok({ success: true });
    } catch (error) {
        next(error);
    }
};

export const assignLeader = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;
        const currentUser = req.user;

        const result = await groupService.assignLeader(id, user_id, currentUser);
        return res.ok(result);
    } catch (error) {
        next(error);
    }
};
