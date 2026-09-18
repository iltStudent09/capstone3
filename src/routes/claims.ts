import { Router, Request, Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import Claim from '../models/Claim';
import Policy from '../models/Policy';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/claims - List claims with filters and pagination
router.get(
  '/',
  [
    query('status').optional().isIn(['submitted', 'under-review', 'approved', 'denied', 'closed']),
    query('policy').optional().isMongoId(),
    query('assignedTo').optional().isMongoId(),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, policy, assignedTo, search, page = 1, limit = 10 } = req.query;

      const filter: any = {};

      // Restrict to own claims if not admin
      if (req.user?.role !== 'admin') {
        filter.assignedTo = req.user._id;
      }

      if (status) filter.status = status;
      if (policy) filter.policy = policy;
      if (assignedTo) filter.assignedTo = assignedTo;

      if (search) {
        filter.$or = [
          { claimNumber: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = ((page as number) - 1) * (limit as number);

      const claims = await Claim.find(filter)
        .populate('policy', 'policyNumber holderName')
        .populate('assignedTo', 'name email')
        .populate('notes.author', 'name email')
        .skip(skip)
        .limit(limit as number)
        .sort({ createdAt: -1 });

      const total = await Claim.countDocuments(filter);

      res.status(200).json({
        message: 'Claims retrieved',
        data: claims,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / (limit as number)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/claims/stats - Get claim statistics
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalClaims = await Claim.countDocuments();

    const claimsByStatus = await Claim.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalAmount = await Claim.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    res.status(200).json({
      message: 'Claim statistics retrieved',
      data: {
        totalClaims,
        claimsByStatus,
        totalAmount: totalAmount[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/claims/:id - Get single claim
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('policy', 'policyNumber holderName type')
      .populate('assignedTo', 'name email role')
      .populate('notes.author', 'name email');

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    // Restrict access if not admin and not assigned to this claim
    if (req.user?.role !== 'admin' && claim.assignedTo?._id?.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.status(200).json({
      message: 'Claim retrieved',
      data: claim,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/claims - Create claim
router.post(
  '/',
  [
    body('policy')
      .isMongoId()
      .withMessage('Valid policy ID is required'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required'),
    body('incidentDate')
      .isISO8601()
      .withMessage('Incident date must be a valid date'),
    body('amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { policy, description, incidentDate, amount } = req.body;

      // Verify policy exists
      const policyDoc = await Policy.findById(policy);
      if (!policyDoc) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      const claim = new Claim({
        policy,
        description,
        incidentDate,
        amount,
        assignedTo: req.user._id,
      });

      await claim.save();

      res.status(201).json({
        message: 'Claim created successfully',
        data: claim,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/claims/:id - Update claim
router.put(
  '/:id',
  [
    body('status')
      .optional()
      .isIn(['submitted', 'under-review', 'approved', 'denied', 'closed']),
    body('amount')
      .optional()
      .isFloat({ min: 0 }),
    body('description')
      .optional()
      .trim(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claim = await Claim.findById(req.params.id);
// Restrict access if not admin and not assigned to this claim
      if (req.user?.role !== 'admin' && claim.assignedTo?.toString() !== req.user?._id?.toString()) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      
      if (!claim) {
        return res.status(404).json({ error: 'Claim not found' });
      }

      const updates = req.body;
      Object.assign(claim, updates);
      await claim.save();

      res.status(200).json({
        message: 'Claim updated successfully',
        data: claim,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/claims/:id/notes - Add note to claim
router.post(
  '/:id/notes',
  [
    body('text')
      .trim()
      .notEmpty()
      .withMessage('Note text is required'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { text } = req.body;

      const claim = await Claim.findById(req.params.id);

      if (!claim) {
        return res.status(404).json({ error: 'Claim not found' });
      }

      claim.notes.push({
        author: req.user._id,
        text,
        createdAt: new Date(),
      });

      await claim.save();

      res.status(201).json({
        message: 'Note added successfully',
        data: claim,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/claims/:id - Delete claim
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try

    // Restrict access if not admin and not assigned to this claim
    if (req.user?.role !== 'admin' && claim.assignedTo?.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Claim.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Claim deleted successfully' });
  } catch (error) {
    next(error);
  }
}); {
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    await Claim.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Claim deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
