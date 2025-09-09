const { Op } = require("sequelize");
const Users = require("../models/Users");
const { canChangeRole, canDeleteUser } = require("../middleware/roleCheck");

/**
 * Get users based on role permissions
 * - admin: sees all users
 * - receptionist: sees all except admins  
 * - regular/trainer: sees only themselves
 */
const getUsers = async (req, res) => {
    try {
        const userRole = req.headers["auth-role"];
        const userId = req.user.id;

        let users;

        if (userRole === 'admin') {
            // Admin sees everyone
            users = await Users.findAll({
                attributes: { exclude: ['Password'] }
            });
        } else if (userRole === 'receptionist') {
            // Receptionist sees everyone except admins
            users = await Users.findAll({
                where: { Role: { [Op.ne]: 'admin' } },
                attributes: { exclude: ['Password'] }
            });
        } else {
            // Regular/trainer sees only themselves
            users = await Users.findAll({
                where: { UserID: userId },
                attributes: { exclude: ['Password'] }
            });
        }

        return res.json({
            users,
            total: users.length,
            viewLevel: userRole === 'admin' ? 'all' : userRole === 'receptionist' ? 'limited' : 'self'
        });

    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({
            error: "Server error",
            message: err.message
        });
    }
};


/**
 * Get user by ID with ownership/role checks
 * Already handled by middleware checkOwnershipOrRole
 */
const getUserById = async (req, res) => {
    try {
        const user = await Users.findByPk(req.params.id, {
            attributes: { exclude: ['Password'] }
        });
        
        if (!user) {
            return res.status(404).json({ 
                error: "User not found" 
            });
        }

        return res.json(user);
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({
            error: "Server error",
            message: err.message
        });
    }
};

/**
 * Create new user - only admin can create users
 */
const createUser = async (req, res) => {
    try {
        const userRole = req.headers["auth-role"];
        
        if (userRole !== 'admin') {
            return res.status(403).json({
                error: "Only administrators can create users"
            });
        }

        const { Username, Password, Email, Role = 'regular' } = req.body;
        
        // Validate role
        const validRoles = ['regular', 'trainer', 'admin', 'receptionist'];
        if (!validRoles.includes(Role)) {
            return res.status(400).json({
                error: "Invalid role",
                validRoles
            });
        }

        const newUser = await Users.create({ 
            Username, 
            Password, 
            Email, 
            Role 
        });

        // Return without password
        const { Password: _, ...userWithoutPassword } = newUser.toJSON();
        
        return res.status(201).json({
            message: "User created successfully",
            user: userWithoutPassword
        });
    } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).json({
            error: "Server error",
            message: err.message
        });
    }
};

/**
 * Update user - with role-based restrictions
 */
const updateUser = async (req, res) => {
    try {
        const userRole = req.headers["auth-role"];
        const userId = req.user.id;
        const targetUserId = parseInt(req.params.id);
        const { Username, Password, Email, Role } = req.body;

        const user = await Users.findByPk(targetUserId);
        if (!user) {
            return res.status(404).json({ 
                error: "User not found" 
            });
        }

        // Prepare update data (exclude Role for now)
        const updateData = {};
        if (Username !== undefined) updateData.Username = Username;
        if (Password !== undefined) updateData.Password = Password;
        if (Email !== undefined) updateData.Email = Email;

        // Handle role changes separately
        if (Role !== undefined && Role !== user.Role) {
            const roleCheck = canChangeRole(userRole, user.Role, Role);
            if (!roleCheck.allowed) {
                return res.status(403).json({
                    error: roleCheck.message
                });
            }
            updateData.Role = Role;
        }

        await user.update(updateData);

        // Return without password
        const { Password: _, ...userWithoutPassword } = user.toJSON();

        return res.json({ 
            message: "User updated successfully",
            user: userWithoutPassword
        });

    } catch (err) {
        console.error("Error updating user:", err);
        res.status(500).json({
            error: "Server error",
            message: err.message
        });
    }
};

/**
 * Separate endpoint for role changes with specific validation
 */
const updateUserRole = async (req, res) => {
    try {
        const userRole = req.headers["auth-role"];
        const userId = req.user.id;
        const targetUserId = parseInt(req.params.id);
        const { Role: newRole } = req.body;

        if (!newRole) {
            return res.status(400).json({
                error: "Role is required"
            });
        }

        const targetUser = await Users.findByPk(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ 
                error: "User not found" 
            });
        }

        const roleCheck = canChangeRole(userRole, targetUser.Role, newRole);
        if (!roleCheck.allowed) {
            return res.status(403).json({
                error: roleCheck.message
            });
        }

        await targetUser.update({ Role: newRole });

        return res.json({ 
            message: "Role updated successfully",
            user: {
                UserID: targetUser.UserID,
                Username: targetUser.Username,
                Email: targetUser.Email,
                Role: newRole
            }
        });

    } catch (err) {
        console.error("Error updating role:", err);
        res.status(500).json({
            error: "Server error",
            message: err.message
        });
    }
};

/**
 * Delete user with role-based permissions
 */
const deleteUser = async (req, res) => {
    try {
        const userRole = req.headers["auth-role"];
        const userId = req.user.id;
        const targetUserId = parseInt(req.params.id);

        const targetUser = await Users.findByPk(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ 
                error: "User not found" 
            });
        }

        const deleteCheck = canDeleteUser(userRole, userId, targetUserId, targetUser.Role);
        if (!deleteCheck.allowed) {
            return res.status(403).json({
                error: deleteCheck.message
            });
        }

        await Users.destroy({
            where: { UserID: targetUserId }
        });

        return res.json({ 
            message: "User deleted successfully",
            deletedUser: {
                UserID: targetUser.UserID,
                Username: targetUser.Username,
                Email: targetUser.Email
            }
        });

    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({
            error: "Server error",
            message: err.message
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    updateUserRole,
    deleteUser
};
