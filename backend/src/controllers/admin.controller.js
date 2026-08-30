import * as adminService from '../services/admin.service.js';

export const getUsers = async (req, res, next) => {
  try {
    const data = await adminService.getUsers(req.query);
    res.json({
      success: true,
      data: data.users,
      pagination: {
        total: data.total,
        page: data.page,
        limit: data.limit,
        hasNext: data.hasNext,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const data = await adminService.updateUserRole(req.user, req.params.userId, req.body.role);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const data = await adminService.updateUserStatus(req.user, req.params.userId, req.body.status);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const data = await adminService.getAuditLogs(req.query);
    res.json({
      success: true,
      data: data.logs,
      pagination: {
        total: data.total,
        page: data.page,
        limit: data.limit,
        hasNext: data.hasNext,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardOverview = async (req, res, next) => {
  try {
    const data = await adminService.getDashboardOverview();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
