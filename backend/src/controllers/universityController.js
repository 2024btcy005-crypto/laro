const { University, User } = require('../models');
const bcrypt = require('bcryptjs');

// @desc    Get all universities
// @route   GET /api/universities
// @access  Public
exports.getAllUniversities = async (req, res) => {
    try {
        const universities = await University.findAll({
            where: { isActive: true },
            include: [{
                model: User,
                as: 'users',
                attributes: ['id', 'name', 'email', 'role'],
                where: { role: 'campus_admin' },
                required: false
            }],
            order: [['name', 'ASC']]
        });
        res.json(universities);
    } catch (error) {
        console.error('Error fetching universities:', error);
        res.status(500).json({ message: 'Server error fetching universities' });
    }
};

// @desc    Get university by ID
// @route   GET /api/universities/:id
// @access  Public
exports.getUniversityById = async (req, res) => {
    try {
        const university = await University.findByPk(req.params.id);
        if (!university) {
            return res.status(404).json({ message: 'University not found' });
        }
        res.json(university);
    } catch (error) {
        console.error('Error fetching university:', error);
        res.status(500).json({ message: 'Server error fetching university details' });
    }
};

// @desc    Create a university and optional admin
// @route   POST /api/universities
// @access  Private/Admin
exports.createUniversity = async (req, res) => {
    try {
        const { name, address, radius, adminName, adminEmail, adminPassword } = req.body;

        // Create University
        const university = await University.create({
            name, address, radius
        });

        // Create Admin User if details provided
        if (adminEmail && adminPassword && adminName) {
            const existingUser = await User.findOne({ where: { email: adminEmail } });

            if (existingUser) {
                // If user exists, upgrade them and update password if provided
                existingUser.role = 'campus_admin';
                existingUser.universityId = university.id;

                if (adminPassword) {
                    const salt = await bcrypt.genSalt(10);
                    existingUser.passwordHash = await bcrypt.hash(adminPassword, salt);
                }

                await existingUser.save();
            } else {
                // Create new user
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(adminPassword, salt);

                await User.create({
                    name: adminName,
                    email: adminEmail,
                    passwordHash,
                    role: 'campus_admin',
                    universityId: university.id
                });
            }
        }

        res.status(201).json(university);
    } catch (error) {
        console.error('Error creating university:', error);
        res.status(500).json({ message: 'Server error creating university' });
    }
};

// @desc    Update a university
// @route   PUT /api/universities/:id
// @access  Private/Admin
exports.updateUniversity = async (req, res) => {
    try {
        const university = await University.findByPk(req.params.id);
        if (!university) {
            return res.status(404).json({ message: 'University not found' });
        }

        await university.update(req.body);
        res.json(university);
    } catch (error) {
        console.error('Error updating university:', error);
        res.status(500).json({ message: 'Server error updating university' });
    }
};

// @desc    Delete a university
// @route   DELETE /api/universities/:id
// @access  Private/Admin
exports.deleteUniversity = async (req, res) => {
    try {
        const university = await University.findByPk(req.params.id);
        if (!university) {
            return res.status(404).json({ message: 'University not found' });
        }

        await university.destroy();
        res.json({ message: 'University deleted successfully' });
    } catch (error) {
        console.error('Error deleting university:', error);
        res.status(500).json({ message: 'Server error deleting university' });
    }
};
