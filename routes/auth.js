const express = require('express');
const bcrypt = require('bcryptjs');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { generateToken } = require('../middleware/auth');
const { ValidationError, UnauthorizedError } = require('../middleware/errorHandler');

const router = express.Router();

// User registration
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, role = 'editor' } = req.body;

    // Validate input
    if (!email || !password || !first_name || !last_name) {
      throw new ValidationError('All fields are required');
    }

    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
          role
        }
      }
    });

    if (authError) {
      throw new Error(authError.message);
    }

    // Create user in our users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        password_hash: passwordHash,
        first_name,
        last_name,
        role
      })
      .select('id, email, role, first_name, last_name')
      .single();

    if (userError) {
      throw new Error(userError.message);
    }

    // Generate JWT token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

// User login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Get user details from our users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, is_active, last_login')
      .eq('id', authData.user.id)
      .single();

    if (userError || !user || !user.is_active) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

// Password reset request
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email is required');
    }

    // Send password reset email via Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CORS_ORIGIN}/reset-password`
    });

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Reset password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      throw new ValidationError('Token and new password are required');
    }

    if (new_password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }

    // Update password via Supabase
    const { error } = await supabase.auth.updateUser({
      password: new_password
    });

    if (error) {
      throw new Error(error.message);
    }

    // Hash and update password in our users table
    const passwordHash = await bcrypt.hash(new_password, 12);
    
    // Get user from token
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (user) {
      await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', user.id);
    }

    res.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/profile', async (req, res, next) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new UnauthorizedError('User not authenticated');
    }

    // Get user details from our users table
    const { data: userDetails, error: userError } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, avatar_url, is_active, last_login, created_at')
      .eq('id', user.id)
      .single();

    if (userError || !userDetails) {
      throw new Error('User details not found');
    }

    res.json({
      user: userDetails
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', async (req, res, next) => {
  try {
    const { first_name, last_name, avatar_url } = req.body;
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new UnauthorizedError('User not authenticated');
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        first_name,
        last_name,
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('id, email, role, first_name, last_name, avatar_url')
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/change-password', async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new UnauthorizedError('User not authenticated');
    }

    if (!current_password || !new_password) {
      throw new ValidationError('Current and new passwords are required');
    }

    if (new_password.length < 6) {
      throw new ValidationError('New password must be at least 6 characters long');
    }

    // Verify current password
    const { data: userDetails } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', user.id)
      .single();

    const isPasswordValid = await bcrypt.compare(current_password, userDetails.password_hash);
    if (!isPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    // Update password in Supabase Auth
    const { error: authError } = await supabase.auth.updateUser({
      password: new_password
    });

    if (authError) {
      throw new Error(authError.message);
    }

    // Hash and update password in our users table
    const passwordHash = await bcrypt.hash(new_password, 12);
    
    await supabase
      .from('users')
      .update({ 
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
    }

    res.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.json({
      message: 'Logged out successfully'
    });
  }
});

module.exports = router;