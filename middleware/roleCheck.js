/**
 * Role-based access control middleware
 * Reads role from 'auth-token' header or Authorization Bearer token
 */

/**
 * Extract user role from request headers
 * @param {Object} req - Express request object
 * @returns {string|null} User role or null
 */
const getUserRole = (req) => {
    // Try auth-token header first
    if (req.headers['auth-token']) {
        return req.headers['auth-role'] || req.user?.Role || null;
    }
    
    // Try Authorization Bearer token
    if (req.headers.authorization) {
        return req.headers['auth-role'] || req.user?.Role || null;
    }
    
    return req.user?.Role || null;
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
    const role = getUserRole(req);
    if (role === 'admin') {
        return next();
    }
    return res.status(403).json({ message: "Access denied. Admin role required." });
};

/**
 * Check if user is receptionist
 */
const isReceptionist = (req, res, next) => {
    const role = getUserRole(req);
    if (role === 'receptionist') {
        return next();
    }
    return res.status(403).json({ message: "Access denied. Receptionist role required." });
};

/**
 * Check if user is admin or receptionist
 */
const adminOrReceptionist = (req, res, next) => {
    const role = getUserRole(req);
    if (role === 'admin' || role === 'receptionist') {
        return next();
    }
    return res.status(403).json({ 
        message: "Access denied. Admin or receptionist role required." 
    });
};

/**
 * Check if user is admin or trainer
 */
const adminOrTrainer = (req, res, next) => {
    const role = getUserRole(req);
    if (role === 'admin' || role === 'trainer') {
        return next();
    }
    return res.status(403).json({ 
        message: "Access denied. Admin or trainer role required." 
    });
};

/**
 * Generic role checker
 * @param {Array} allowedRoles - Array of allowed roles
 * @returns {Function} Middleware function
 */
const ensureRole = (allowedRoles) => {
    return (req, res, next) => {
        const role = getUserRole(req);
        if (allowedRoles.includes(role)) {
            return next();
        }
        return res.status(403).json({ 
            message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
        });
    };
};

/**
 * Check if user can manage reservations (own reservations or admin/receptionist)
 */
const canManageReservation = (req, res, next) => {
    const role = getUserRole(req);
    const userId = req.user?.UserID || req.user?.id;
    
    // Admin and receptionist can manage all reservations
    if (role === 'admin' || role === 'receptionist') {
        return next();
    }
    
    // Users can manage their own reservations (will be checked in controller)
    if (userId) {
        return next();
    }
    
    return res.status(403).json({ 
        message: "Access denied. Cannot manage reservations." 
    });
};

module.exports = {
    isAdmin,
    isReceptionist,
    adminOrReceptionist,
    adminOrTrainer,
    ensureRole,
    canManageReservation,
    getUserRole
};
