const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Register new user or claim an invited account
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name?.trim() || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail }).select('+password');

    // If user was pre-created via invite and has no real password yet, activate account
    if (existingUser && existingUser.isInvited) {
      existingUser.name = name.trim();
      existingUser.password = password;
      if (role) existingUser.role = role;
      existingUser.isInvited = false;
      await existingUser.save();

      return res.status(201).json({
        _id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        token: generateToken(existingUser._id)
      });
    }

    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role || 'Developer'
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

// Authenticate user and return token
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user || user.isInvited) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Login failed' });
  }
};

// List workspace users for assignment and member selection
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('_id name email role isInvited createdAt');
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load workspace users' });
  }
};

// Update logged-in user's name
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !/^[a-zA-Z\s]{2,50}$/.test(name.trim())) {
      return res.status(400).json({ message: 'Please provide a valid name' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name.trim();
    await user.save();

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Update logged-in user's password after verifying current password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Valid current and new passwords (min 6 chars) are required' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update password' });
  }
};

// Invite a team member to the workspace
exports.inviteMember = async (req, res) => {
  try {
    if (!['Admin', 'Project Manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to invite members' });
    }

    const { email, role } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'User with this email is already in the workspace' });
    }

    const tempPassword = crypto.randomBytes(12).toString('hex');
    const invitedUser = await User.create({
      name: normalizedEmail.split('@')[0],
      email: normalizedEmail,
      password: tempPassword,
      role: role || 'Developer',
      isInvited: true
    });

    return res.status(201).json({
      message: `Invitation recorded for ${invitedUser.email}. They can sign up with this email to activate their account.`,
      user: {
        _id: invitedUser._id,
        email: invitedUser.email,
        role: invitedUser.role,
        isInvited: invitedUser.isInvited
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to invite member' });
  }
};