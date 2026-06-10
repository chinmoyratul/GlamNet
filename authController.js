const User = require('../models/User');
const Customer = require('../models/Customer');
const Barber = require('../models/Barber');
const SalonStaff = require('../models/SalonStaff');
const Salon = require('../models/Salon');
const Service = require('../models/Service');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phoneNumber, password, role } = req.body;
    const userRole = role || 'customer';

    // Validate role-specific required fields BEFORE creating the user to avoid orphan users
    if (userRole === 'barber') {
      const { salonId, specialty, experienceYears } = req.body;
      if (!salonId || !specialty || !experienceYears) {
        return res.status(400).json({
          success: false,
          message: 'Please provide salonId, specialty, and experienceYears for barber registration'
        });
      }
    }

    if (userRole === 'salon_staff') {
      const { salonId, shift } = req.body;
      if (!salonId || !shift) {
        return res.status(400).json({
          success: false,
          message: 'Please provide salonId and shift for salon staff registration'
        });
      }
    }

    if (userRole === 'salon') {
      const { salonName, salonAddress, city, openingTime, closingTime, description } = req.body;
      if (!salonName || !salonAddress || !city || !openingTime || !closingTime || !description) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all salon details: name, address, city, opening/closing times, and description'
        });
      }
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      role: userRole
    });

    // Create customer profile if role is customer
    if (user.role === 'customer') {
      await Customer.create({ userId: user._id });
    }

    // Create barber profile if role is barber
    if (user.role === 'barber') {
      const { salonId, specialty, experienceYears } = req.body;
      await Barber.create({
        userId: user._id,
        salonId,
        specialty,
        experienceYears
      });
    }

    // Create salon staff profile if role is salon_staff
    if (user.role === 'salon_staff') {
      const { salonId, shift } = req.body;
      await SalonStaff.create({
        userId: user._id,
        salonId,
        shift
      });
    }

    // Create salon profile if role is salon
    if (user.role === 'salon') {
      const { salonName, salonAddress, city, salonPhoneNumber, openingTime, closingTime, description } = req.body;
      const salon = await Salon.create({
        name: salonName,
        address: salonAddress,
        city,
        email: user.email,
        phone: salonPhoneNumber || user.phoneNumber,
        openingTime,
        closingTime,
        description,
        ownerId: user._id
      });

      // Seed default services for the new salon
      const defaultServices = [
        { name: 'Classic Haircut', category: 'Haircut', price: 25, duration: 30, description: 'Standard haircut and styling' },
        { name: 'Deluxe Haircut', category: 'Haircut', price: 40, duration: 45, description: 'Premium haircut with wash and head massage' },
        { name: 'Beard Trim', category: 'Beard Trim', price: 15, duration: 20, description: 'Neat trim and shaping for your beard' },
        { name: 'Full Hair Color', category: 'Hair Color', price: 80, duration: 120, description: 'Complete hair coloring service' },
        { name: 'Refresh Facial', category: 'Facial', price: 35, duration: 40, description: 'Cleansing and moisturizing facial treatment' }
      ];

      await Promise.all(defaultServices.map(service =>
        Service.create({ ...service, salonId: salon._id })
      ));
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    // Handle duplicate email nicely
    if (error.code === 11000 && error.keyValue && error.keyValue.email) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please log in instead.'
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password, captchaToken } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Verify CAPTCHA if provided
    if (captchaToken && process.env.RECAPTCHA_SECRET_KEY) {
      try {
        const axios = require('axios');
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;
        const response = await axios.post(verifyUrl);
        
        if (!response.data.success) {
          return res.status(400).json({
            success: false,
            message: 'CAPTCHA verification failed'
          });
        }
      } catch (error) {
        console.error('CAPTCHA verification error:', error);
        // Continue with login if CAPTCHA verification fails (for development)
      }
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is OAuth user (should use OAuth login)
    if (user.provider !== 'local') {
      return res.status(401).json({
        success: false,
        message: `Please sign in with ${user.provider === 'google' ? 'Google' : 'Apple'}`
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Get additional profile based on role
    let profile = null;
    if (user.role === 'customer') {
      profile = await Customer.findOne({ userId: user._id });
    } else if (user.role === 'barber') {
      profile = await Barber.findOne({ userId: user._id }).populate('salonId');
    } else if (user.role === 'salon_staff') {
      profile = await SalonStaff.findOne({ userId: user._id }).populate('salonId');
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        profile
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updateprofile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verifyemail/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    // Implementation for email verification
    res.status(200).json({
      success: true,
      message: 'Email verification feature to be implemented'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'There is no user with that email'
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // Create email message
    const message = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Please click on the following link to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
      <p>This link will expire in 10 minutes.</p>
    `;

    try {
      // Create transporter
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Send email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Reset Request',
        html: message
      });

      res.status(200).json({
        success: true,
        message: 'Email sent'
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Google OAuth login
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res, next) => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const { email, given_name, family_name, sub: googleId } = ticket.getPayload();

    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { googleId }] });

    if (user) {
      // Update user with Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = 'google';
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        firstName: given_name || 'User',
        lastName: family_name || '',
        email,
        phoneNumber: '0000000000', // Default, user can update later
        googleId,
        provider: 'google',
        password: crypto.randomBytes(20).toString('hex') // Random password for OAuth users
      });

      // Create customer profile
      if (user.role === 'customer') {
        await Customer.create({ userId: user._id });
      }
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Google authentication failed'
    });
  }
};

// @desc    Apple OAuth login
// @route   POST /api/auth/apple
// @access  Public
exports.appleLogin = async (req, res, next) => {
  try {
    const { identityToken, user: appleUser } = req.body;

    if (!identityToken) {
      return res.status(400).json({
        success: false,
        message: 'Apple identity token is required'
      });
    }

    // Decode Apple identity token (JWT)
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(identityToken);

    if (!decoded) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Apple token'
      });
    }

    const { email, sub: appleId } = decoded;
    const firstName = appleUser?.name?.firstName || decoded.name?.firstName || 'User';
    const lastName = appleUser?.name?.lastName || decoded.name?.lastName || '';

    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { appleId }] });

    if (user) {
      // Update user with Apple ID if not set
      if (!user.appleId) {
        user.appleId = appleId;
        user.provider = 'apple';
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        firstName,
        lastName,
        email: email || `${appleId}@privaterelay.appleid.com`,
        phoneNumber: '0000000000', // Default, user can update later
        appleId,
        provider: 'apple',
        password: crypto.randomBytes(20).toString('hex') // Random password for OAuth users
      });

      // Create customer profile
      if (user.role === 'customer') {
        await Customer.create({ userId: user._id });
      }
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Apple authentication failed'
    });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
};


