const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    console.log('Register attempt with body:', req.body);
    const { matricNumber, password, name, email, role } = req.body;

    // Validate required fields
    if (!matricNumber || !password || !name || !email) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        message: 'Please provide all required fields: matricNumber, password, name, email' 
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ 
      $or: [{ matricNumber }, { email }] 
    });
    
    if (userExists) {
      console.log('User already exists:', matricNumber);
      return res.status(400).json({ 
        message: userExists.email === email 
          ? 'Email already registered' 
          : 'Matric number already registered' 
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Create user
    const user = await User.create({
      matricNumber,
      password,
      name,
      email,
      role: role || 'student'
    });

    if (user) {
      console.log('User registered successfully:', matricNumber);
      const token = generateToken(user._id);
      
      res.status(201).json({
        _id: user._id,
        matricNumber: user.matricNumber,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { matricNumber, password } = req.body;
    
    console.log('Login attempt for:', matricNumber);

    if (!matricNumber || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ message: 'Please provide both matric number and password' });
    }

    const user = await User.findOne({ matricNumber });
    
    if (!user) {
      console.log('User not found:', matricNumber);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    
    if (isMatch) {
      const token = generateToken(user._id);
      console.log('Login successful for:', matricNumber);
      
      res.json({
        _id: user._id,
        matricNumber: user.matricNumber,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      });
    } else {
      console.log('Invalid password for:', matricNumber);
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      _id: user._id,
      matricNumber: user.matricNumber,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    res.status(404).json({ message: 'User not found' });
  }
};

module.exports = { register, login, getProfile };

