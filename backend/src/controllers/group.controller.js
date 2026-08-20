import * as groupService from '../services/group.service.js';
import { isValidUUID, isValidString } from '../utils/validation.util.js';

export const getAll = async (req, res) => {
    try {
        const user = req.user;
        const { classId } = req.query;

        if (classId && !isValidUUID(classId)) {
            return res.status(400).json({ message: 'Invalid classId format' });
        }

        const groups = await groupService.getAllGroups(user, classId);
        return res.status(200).json(groups);
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
            return res.status(400).json({ message: 'Invalid group ID format' });
        }

        const group = await groupService.getGroupById(id, user);
        return res.status(200).json(group);
    } catch (error) {
        const status = error.status || 500;
        return res.status(status).json({ message: error.message });
    }
};

export const create = async (req, res) => {
    try {
        const user = req.user;
        const { class_id, name } = req.body;

        // 1. Validation
        if (!class_id || !isValidUUID(class_id)) {
            return res.status(400).json({ message: 'Valid class_id UUID is required' });
        }
        if (!isValidString(name, 100)) {
            return res.status(400).json({ message: 'Name is required, must not be empty, and max 100 characters' });
        }

        // 2. Class Existence & Ownership Check
        const classInfo = await groupService.getClassOwnershipInfo(class_id);
        if (!classInfo) {
            return res.status(404).json({ message: 'Class not found' });
        }

        if (user.role === 'TEACHER' && classInfo.teacher_id !== user.userId) {
            return res.status(403).json({ message: 'Forbidden: You do not manage this class' });
        }

        // 3. Create
        const newGroup = await groupService.createGroup(class_id, name.trim());
        return res.status(201).json(newGroup);
    } catch (error) {
        const status = error.status || 500;
        return res.status(status).json({ message: error.message });
    }
};

export const addMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;
        const currentUser = req.user;

        // Validation
        if (!isValidUUID(id)) {
            return res.status(400).json({ message: 'Invalid group ID format' });
        }
        if (!user_id || !isValidUUID(user_id)) {
            return res.status(400).json({ message: 'Valid user_id UUID is required' });
        }

        const newMember = await groupService.addMember(id, user_id, currentUser);
        return res.status(201).json(newMember);
    } catch (error) {
        const status = error.status || 500;
        return res.status(status).json({ message: error.message });
    }
};

export const removeMember = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const currentUser = req.user;

        if (!isValidUUID(id)) {
            return res.status(400).json({ message: 'Invalid group ID format' });
        }
        if (!isValidUUID(userId)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        await groupService.removeMember(id, userId, currentUser);
        return res.status(204).send();
    } catch (error) {
        const status = error.status || 500;
        return res.status(status).json({ message: error.message });
    }
};
