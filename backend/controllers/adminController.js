const User = require('../models/User');

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ hiddenAdmin: { $ne: true } }).select('firstName lastName email phoneNumber altPhoneNumber address role hiddenAdmin isVerified createdAt'); // Return only admin-safe customer fields
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/admin/user/:id
exports.updateUserRole = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            // Admin promotion is intentionally not available through this endpoint.
            // Provision trusted administrators directly in the database after verification.
            if (req.body.role && req.body.role !== 'customer') {
                return res.status(403).json({ message: 'Administrator access can only be provisioned by an authorized database operator' });
            }
            if (user._id.equals(req.user._id)) {
                return res.status(400).json({ message: 'You cannot change your own administrator role' });
            }
            user.role = 'customer';
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                firstName: updatedUser.firstName,
                role: updatedUser.role
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Set hidden admin status for a user (Admin only)
// @route   PUT /api/admin/user/:id/hidden-admin
exports.setHiddenAdmin = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.hiddenAdmin = req.body.hiddenAdmin === true;
        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            firstName: updatedUser.firstName,
            role: updatedUser.role,
            hiddenAdmin: updatedUser.hiddenAdmin
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'admin' || user._id.equals(req.user._id)) {
            return res.status(403).json({ message: 'Administrator accounts and your own account cannot be deleted here' });
        }
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};