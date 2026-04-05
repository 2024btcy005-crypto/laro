const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// Temporary in-memory OTP store (In production, use Redis or a DB table with expiry)
const otpStore = new Map();

// @desc    Send OTP to phone number
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) return res.status(400).json({ message: "Phone number is required." });

        // Generate a real 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP with timestamp
        otpStore.set(phoneNumber, { otp, expires: Date.now() + 5 * 60 * 1000 }); // 5 min expiry

        console.log(`[AUTH] OTP for ${phoneNumber} is ${otp}`);

        // In a real implementation:
        // await smsService.send(phoneNumber, `Your Laro verification code is: ${otp}`);

        res.status(200).json({ message: "Verification code sent to " + phoneNumber });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP and Login/Register
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
    try {
        const { phoneNumber, otp, role = 'customer' } = req.body;

        const stored = otpStore.get(phoneNumber);

        if (!stored) {
            return res.status(400).json({ message: "OTP not found or expired. Request a new one." });
        }

        if (stored.otp !== otp) {
            return res.status(400).json({ message: "Invalid verification code." });
        }

        if (Date.now() > stored.expires) {
            otpStore.delete(phoneNumber);
            return res.status(400).json({ message: "OTP expired." });
        }

        // OTP verified, clear it
        otpStore.delete(phoneNumber);

        let user = await User.findOne({ where: { phoneNumber } });

        if (!user) {
            // New User Registration Simulation
            return res.status(200).json({
                isNewUser: true,
                phoneNumber,
                message: "Please complete registration"
            });
        }

        res.status(200).json({
            id: user.id,
            name: user.name,
            phoneNumber: user.phoneNumber,
            role: user.role,
            token: generateToken(user.id, user.role),
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { email, password, name, phoneNumber, role } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Email, password and name are required' });
        }

        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            // Allow existing CUSTOMERS to join as DELIVERY partners
            if (role === 'delivery' && userExists.role === 'customer') {
                console.log(`[AUTH] Upgrading existing customer ${email} to delivery role`);
                userExists.role = 'delivery';
                if (phoneNumber && !userExists.phoneNumber) userExists.phoneNumber = phoneNumber;
                await userExists.save();

                return res.status(200).json({
                    id: userExists.id,
                    name: userExists.name,
                    email: userExists.email,
                    phoneNumber: userExists.phoneNumber,
                    role: userExists.role,
                    token: generateToken(userExists.id, userExists.role),
                    message: "Account upgraded to Partner"
                });
            }
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        if (phoneNumber) {
            const phoneExists = await User.findOne({ where: { phoneNumber } });
            if (phoneExists) {
                if (role === 'delivery' && phoneExists.role === 'customer') {
                    // Similar logic for phone-based registration if applicable
                    phoneExists.role = 'delivery';
                    await phoneExists.save();
                    return res.status(200).json({
                        id: phoneExists.id,
                        name: phoneExists.name,
                        email: phoneExists.email,
                        phoneNumber: phoneExists.phoneNumber,
                        role: phoneExists.role,
                        token: generateToken(phoneExists.id, phoneExists.role),
                        message: "Account upgraded to Partner"
                    });
                }
                return res.status(400).json({ message: 'Phone number already in use' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await User.create({
            email,
            passwordHash,
            name,
            phoneNumber,
            role: role || 'customer'
        });

        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            token: generateToken(user.id, user.role),
        });

    } catch (error) {
        console.error('[AUTH] Registration error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin Email/Password Login
// @route   POST /api/auth/login/admin
// @access  Public
const loginAdmin = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body; // In UI, this can be email or phone

        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { phoneNumber: phoneNumber },
                    { email: phoneNumber }
                ]
            },
            include: [{ model: require('../models').University, as: 'university' }]
        });

        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            const adminRoles = ['super_admin', 'campus_admin', 'admin'];
            if (!adminRoles.includes(user.role)) {
                return res.status(403).json({ message: 'Access denied. Admins only.' });
            }

            res.json({
                token: generateToken(user.id, user.role),
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    role: user.role,
                    universityId: user.universityId
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Login User
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        console.log(`[AUTH] Login attempt for: ${email}`);

        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log(`[AUTH] User not found for: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (isMatch) {
            console.log(`[AUTH] Login successful for: ${email} (${user.role})`);
            res.status(200).json({
                id: user.id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                token: generateToken(user.id, user.role),
            });
        } else {
            console.log(`[AUTH] Password mismatch for: ${email}`);
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('[AUTH] Login error:', error);
        res.status(500).json({ message: error.message });
    }
};

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Real Social Login (No Phone)
// @route   POST /api/auth/social-login
// @access  Public
const socialLogin = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ message: "ID Token is required." });
        }

        // Verify the token
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        const { sub: socialProviderId, email, name, picture } = payload;

        let user = await User.findOne({ where: { socialProviderId } });

        if (!user) {
            user = await User.create({
                email,
                name,
                socialProviderId,
                role: 'customer'
            });
        }

        res.status(200).json({
            id: user.id,
            name: user.name,
            phoneNumber: user.phoneNumber,
            role: user.role,
            token: generateToken(user.id, user.role),
            needsWallet: !user.phoneNumber
        });
    } catch (error) {
        console.error('[SOCIAL LOGIN ERR]', error.message);
        res.status(401).json({ message: "Invalid social token" });
    }
};

// @desc    Link phone number to an account (Laro Wallet creation)
// @route   POST /api/auth/link-phone
// @access  Private
const linkPhoneNumber = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const userId = req.user.id;

        if (!phoneNumber) return res.status(400).json({ message: "Phone number is required." });

        // Basic validation for phone number
        if (!/^\d{10}$/.test(phoneNumber)) {
            return res.status(400).json({ message: "Enter a valid 10-digit phone number." });
        }

        const userExists = await User.findOne({ where: { phoneNumber } });
        if (userExists) {
            return res.status(400).json({ message: "This phone number is already linked to another wallet." });
        }

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.phoneNumber) {
            return res.status(400).json({ message: "You already have a wallet linked to this account." });
        }

        user.phoneNumber = phoneNumber;
        await user.save();

        res.status(200).json({
            message: "Phone number linked successfully (Wallet Created)",
            user: {
                id: user.id,
                name: user.name,
                phoneNumber: user.phoneNumber,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile (Name, Vehicle, etc.)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, vehicleType, vehicleNumber, address, universityId } = req.body;

        console.log(`[AUTH] Profile update request for user ${userId}:`, { name, vehicleType, vehicleNumber, universityId });

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (name) user.name = name;
        if (vehicleType) user.vehicleType = vehicleType;
        if (vehicleNumber) user.vehicleNumber = vehicleNumber;
        if (address) user.address = address;
        if (universityId) {
            console.log(`[AUTH] Setting universityId to ${universityId} for user ${userId}`);
            user.universityId = universityId;
        }

        await user.save();
        console.log(`[AUTH] Profile updated successfully for user ${userId}`);

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                vehicleType: user.vehicleType,
                vehicleNumber: user.vehicleNumber,
                address: user.address,
                universityId: user.universityId
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete User Account
// @route   DELETE /api/auth/delete-account
// @access  Private
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.destroy();

        res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    sendOtp,
    verifyOtp,
    registerUser,
    loginAdmin,
    login,
    linkPhoneNumber,
    socialLogin,
    updateProfile,
    deleteAccount
};
