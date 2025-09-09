/**
 * Role-based authorization middleware
 * 
 * Roles hierarchy:
 * - admin: can do everything
 * - receptionist: can manage users (except admins), change regular<->trainer
 * - trainer: can create classes, view own data
 * - regular: basic user, view own data
 */

const { Op } = require('sequelize');

/**
 * Check if user has required role
 * @param {Array} allowedRoles - Array of roles that can access the endpoint
 */
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.headers["auth-role"];
        
        if (!userRole) {
            return res.status(401).json({ 
                error: 'Role not specified',
                message: 'auth-role header required'
            });
        }
        
        if (allowedRoles.includes(userRole)) {
            return next();
        }
        
        return res.status(403).json({ 
            error: 'Insufficient permissions',
            required: allowedRoles,
            current: userRole 
        });
    };
};

/**
 * Check if user is owner of resource OR has required role
 * @param {Array} allowedRoles - Roles that can access any resource
 */
const checkOwnershipOrRole = (allowedRoles = []) => {
    return (req, res, next) => {
        const userRole = req.headers["auth-role"];
        const userId = req.user.id;
        const targetUserId = parseInt(req.params.id);
        
        // Owner can always access their own data
        if (userId === targetUserId) {
            return next();
        }
        
        // Check if user has privileged role
        if (allowedRoles.includes(userRole)) {
            return next();
        }
        
        return res.status(403).json({ 
            error: 'Access denied',
            message: 'You can only access your own data or need higher privileges'
        });
    };
};

/**
 * Check role change permissions
 * @param {string} currentRole - Current user role making the request
 * @param {string} targetCurrentRole - Current role of target user
 * @param {string} newRole - New role to assign
 */
const canChangeRole = (currentRole, targetCurrentRole, newRole) => {
    // Admin can change any role to any role
    if (currentRole === 'admin') {
        return { allowed: true };
    }
    
    // Receptionist can only change regular <-> trainer
    if (currentRole === 'receptionist') {
        const allowedRoles = ['regular', 'trainer'];
        
        if (allowedRoles.includes(targetCurrentRole) && allowedRoles.includes(newRole)) {
            return { allowed: true };
        }
        
        return { 
            allowed: false, 
            message: 'Receptionist can only change between regular and trainer roles'
        };
    }
    
    // Regular and trainer cannot change roles
    return { 
        allowed: false, 
        message: 'Insufficient permissions to change roles'
    };
};

/**
 * Check delete permissions
 * @param {string} userRole - Role of user making request
 * @param {number} userId - ID of user making request
 * @param {number} targetUserId - ID of user to delete
 * @param {string} targetUserRole - Role of user to delete
 */
const canDeleteUser = (userRole, userId, targetUserId, targetUserRole) => {
    // Users can delete their own account
    if (userId === targetUserId) {
        return { allowed: true };
    }
    
    // Admin can delete anyone except other admins (safety)
    if (userRole === 'admin') {
        if (targetUserRole === 'admin' && userId !== targetUserId) {
            return { 
                allowed: false, 
                message: 'Admins cannot delete other admin accounts'
            };
        }
        return { allowed: true };
    }
    
    // Receptionist can delete regular/trainer accounts
    if (userRole === 'receptionist') {
        const allowedToDelete = ['regular', 'trainer'];
        if (allowedToDelete.includes(targetUserRole)) {
            return { allowed: true };
        }
        return { 
            allowed: false, 
            message: 'Receptionist cannot delete admin or receptionist accounts'
        };
    }
    
    return { 
        allowed: false, 
        message: 'Insufficient permissions'
    };
};

module.exports = {
    checkRole,
    checkOwnershipOrRole,
    canChangeRole,
    canDeleteUser
};
