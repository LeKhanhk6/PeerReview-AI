import * as assignmentService from '../services/assignment.service.js';
import {
    isValidUUID,
    isValidFutureDate,
    isValidString,
    isValidOptionalString
} from '../utils/validation.util.js';

export const getAll = async (req, res) => {
    try {
        const user = req.user;
        const { classId } = req.query;

        if (classId && !isValidUUID(classId)) {
            return res.status(400).json({ message: 'Invalid classId format' });
        }

        const assignments = await assignmentService.getAllAssignments(user, classId);
        return res.status(200).json(assignments);
    } catch (error) {
        const status = error.status || 500;
        return res.status(status).json({ message: error.message });
    }
};

export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!isValidUUID(id)) {
            return res.status(400).json({ message: 'Invalid assignment ID format' });
        }

        const assignment = await assignmentService.getAssignmentById(id, user);
        return res.status(200).json(assignment);
    } catch (error) {
        const status = error.status || 500;
        return res.status(status).json({ message: error.message });
    }
};

export const create = async (req, res) => {
    try {
        const user = req.user;
        const { class_id, title, description, requirements, deadline } = req.body;

        // 1. Validation
        if (!class_id || !isValidUUID(class_id)) return res.status(400).json({ message: 'Valid class_id UUID is required' });
        if (!isValidString(title, 255)) return res.status(400).json({ message: 'Title is required, must not be empty, and max 255 characters' });
        if (!isValidOptionalString(description)) return res.status(400).json({ message: 'Description must be a string' });
        if (!isValidOptionalString(requirements)) return res.status(400).json({ message: 'Requirements must be a string' });
        if (!deadline || !isValidFutureDate(deadline)) return res.status(400).json({ message: 'Valid future ISO 8601 deadline is required' });

        // 2. Class Existence & Ownership Check
        const classInfo = await assignmentService.getClassOwnershipInfo(class_id);
        if (!classInfo) {
            return res.status(404).json({ message: 'Class not found' });
        }

        if (user.role === 'TEACHER' && classInfo.teacher_id !== user.userId) {
            return res.status(403).json({ message: 'Forbidden: You do not manage this class' });
        }

        // 3. Create
        const newAssignment = await assignmentService.createAssignment({
            class_id,
            title: title.trim(),
            description: description ? description.trim() : null,
            requirements: requirements ? requirements.trim() : null,
            deadline
        });
        return res.status(201).json(newAssignment);
    } catch (error) {
        const status = error.status || 500;
        return res.status(status).json({ message: error.message });
    }
};

export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const { title, description, requirements, deadline } = req.body;

        // 1. Validation
        if (!isValidUUID(id)) return res.status(400).json({ message: 'Invalid assignment ID format' });
        if (!isValidString(title, 255)) return res.status(400).json({ message: 'Title is required, must not be empty, and max 255 characters' });
        if (!isValidOptionalString(description)) return res.status(400).json({ message: 'Description must be a string' });
        if (!isValidOptionalString(requirements)) return res.status(400).json({ message: 'Requirements must be a string' });
        if (!deadline || !isValidFutureDate(deadline)) return res.status(400).json({ message: 'Valid future ISO 8601 deadline is required' });

        // 2. Existence & Ownership Check
        const assignmentInfo = await assignmentService.getAssignmentOwnershipInfo(id);
        if (!assignmentInfo) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        if (user.role === 'TEACHER' && assignmentInfo.teacher_id !== user.userId) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to edit this assignment' });
        }

        // 3. Update
        const updatedAssignment = await assignmentService.updateAssignment(id, {
            title: title.trim(),
            description: description ? description.trim() : null,
            requirements: requirements ? requirements.trim() : null,
            deadline
        });
        return res.status(200).json(updatedAssignment);
    } catch (error) {
        const status = error.status || 500;
        return res.status(status).json({ message: error.message });
    }
};

export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!isValidUUID(id)) return res.status(400).json({ message: 'Invalid assignment ID format' });

        // 1. Existence & Ownership Check
        const assignmentInfo = await assignmentService.getAssignmentOwnershipInfo(id);
        if (!assignmentInfo) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        if (user.role === 'TEACHER' && assignmentInfo.teacher_id !== user.userId) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this assignment' });
        }

        // 2. Delete
        await assignmentService.deleteAssignment(id);
        return res.status(204).send();
    } catch (error) {
        const status = error.status || 500;
        return res.status(status).json({ message: error.message });
    }
};