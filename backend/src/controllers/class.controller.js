import * as classService from '../services/class.service.js';

export const getAll = async (req, res, next) => {
    try {
        const result = await classService.getAllClasses(req.user, req.pagination);
        return res.ok(result);
    } catch (error) {
        next(error);
    }
};

export const getById = async (req, res, next) => {
    try {
        const classData = await classService.getClassById(req.params.id, req.user);
        return res.ok(classData);
    } catch (error) {
        next(error);
    }
};

export const create = async (req, res, next) => {
    try {
        const newClass = await classService.createClass(req.body, req.user);
        return res.ok(newClass);
    } catch (error) {
        next(error);
    }
};

export const update = async (req, res, next) => {
    try {
        const updatedClass = await classService.updateClass(req.params.id, req.body, req.user);
        return res.ok(updatedClass);
    } catch (error) {
        next(error);
    }
};

export const remove = async (req, res, next) => {
    try {
        await classService.deleteClass(req.params.id, req.user);
        return res.ok({ success: true, message: 'Class deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const getMembers = async (req, res, next) => {
    try {
        const members = await classService.getClassMembers(req.params.id, req.user);
        return res.ok(members);
    } catch (error) {
        next(error);
    }
};

export const join = async (req, res, next) => {
    try {
        const result = await classService.joinClassByInviteCode(req.body.invite_code, req.user);
        return res.ok(result);
    } catch (error) {
        next(error);
    }
};
