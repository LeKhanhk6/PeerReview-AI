export const authorizeRoles = (...allowedRoles) => {
    if (allowedRoles.length === 0) {
        throw new Error('authorizeRoles requires at least one allowed role');
    }

    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                message: 'Unauthorized: missing authentication context'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Forbidden: insufficient permissions'
            });
        }

        return next();
    };
};
