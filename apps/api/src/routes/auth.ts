import express from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { auth } from '../middleware/auth';
import { LoginCredentials, AuthResponse } from '@nomadpi/shared';

export const authRouter = express.Router();

// Register
authRouter.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body as LoginCredentials;
    
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = new UserModel({ email, password });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || '',
      { expiresIn: '24h' }
    );

    const response: AuthResponse = {
      user: {
        id: user._id.toString(),
        email: user.email,
        createdAt: user.createdAt
      },
      token
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as LoginCredentials;
    
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || '',
      { expiresIn: '24h' }
    );

    const response: AuthResponse = {
      user: {
        id: user._id.toString(),
        email: user.email,
        createdAt: user.createdAt
      },
      token
    };

    res.json(response);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});
