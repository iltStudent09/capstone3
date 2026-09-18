import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required'),
    body('email')
      .isEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('role')
      .optional()
      .isIn(['adjuster', 'admin'])
      .withMessage('Role must be adjuster or admin'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already in use' });
      }

      // Create new user
      const user = new User({ name, email, password, role });
      await user.save();

      // Generate JWT
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Compare passwords
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        message: 'Login successful',
        token,
        user: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    res.status(200).json({
      message: 'User profile retrieved',
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
