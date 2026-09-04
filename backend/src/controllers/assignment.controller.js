import * as assignmentService from '../services/assignment.service.js';
import * as storageService from '../services/storage.service.js';
import { AppError } from '../utils/AppError.js';

export const uploadAttachment = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new AppError('No file uploaded', 400);
        }

        const file_url = await storageService.uploadAssignmentAttachment(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        return res.ok({
            file_name: req.file.originalname,
            file_url,
            file_type: req.file.mimetype,
            file_size: req.file.size
        });
    } catch (error) {
        next(error);
    }
};

export const getAll = async (req, res, next) => {
    try {
        const user = req.user;
        const { classId } = req.query;

        const assignments = await assignmentService.getAllAssignments(user, classId);
        return res.ok(assignments);
    } catch (error) {
        next(error);
    }
};

export const getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const assignment = await assignmentService.getAssignmentById(id, user);
        return res.ok(assignment);
    } catch (error) {
        next(error);
    }
};

export const getAssignmentDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const assignmentDetail = await assignmentService.getAssignmentDetailById(id, user);
        return res.ok(assignmentDetail);
    } catch (error) {
        next(error);
    }
};

export const create = async (req, res, next) => {
    try {
        const user = req.user;
        const { class_id, title, description, requirements, deadline, attachments } = req.body;

        // 2. Class Existence & Ownership Check
        const classInfo = await assignmentService.getClassOwnershipInfo(class_id);
        if (!classInfo) {
            throw new AppError('Class not found', 404);
        }

        if (user.role === 'TEACHER' && classInfo.teacher_id !== user.userId) {
            throw new AppError('Forbidden: You do not manage this class', 403);
        }

        // 3. Create
        const newAssignment = await assignmentService.createAssignment({
            class_id,
            title,
            description,
            requirements,
            deadline,
            attachments
        }, user);
        return res.ok(newAssignment);
    } catch (error) {
        next(error);
    }
};

export const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const { title, description, requirements, deadline, attachments } = req.body;

        // 2. Existence & Ownership Check
        const assignmentInfo = await assignmentService.getAssignmentOwnershipInfo(id);
        if (!assignmentInfo) {
            throw new AppError('Assignment not found', 404);
        }

        if (user.role === 'TEACHER' && assignmentInfo.teacher_id !== user.userId) {
            throw new AppError('Forbidden: You do not have permission to edit this assignment', 403);
        }

        // 3. Update
        const updatedAssignment = await assignmentService.updateAssignment(id, {
            title,
            description,
            requirements,
            deadline,
            attachments
        }, user);
        return res.ok(updatedAssignment);
    } catch (error) {
        next(error);
    }
};

export const remove = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // 1. Existence & Ownership Check
        const assignmentInfo = await assignmentService.getAssignmentOwnershipInfo(id);
        if (!assignmentInfo) {
            throw new AppError('Assignment not found', 404);
        }

        if (user.role === 'TEACHER' && assignmentInfo.teacher_id !== user.userId) {
            throw new AppError('Forbidden: You do not have permission to delete this assignment', 403);
        }

        // 2. Delete
        await assignmentService.deleteAssignment(id, user);
        return res.ok({ success: true });
    } catch (error) {
        next(error);
    }
};
