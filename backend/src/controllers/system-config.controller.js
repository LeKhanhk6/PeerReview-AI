import * as systemConfigService from '../services/system-config.service.js';

export const getSystemConfigs = async (req, res, next) => {
  try {
    const data = await systemConfigService.getSystemConfigs();
    res.json({
      success: true,
      data: data.configs,
      items: data.items,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSystemConfigs = async (req, res, next) => {
  try {
    const data = await systemConfigService.updateSystemConfigs(req.user, req.body);
    res.json({
      success: true,
      data: data.configs,
      items: data.items,
    });
  } catch (error) {
    next(error);
  }
};
