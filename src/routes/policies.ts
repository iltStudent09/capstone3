import { Router, Request, Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import Policy from '../models/Policy';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

const isAdmin = (req: Request) => req.user?.role === 'admin';

const isOwnerOrAdmin = (req: Request, policy: any) => {
  if (isAdmin(req)) {
    return true;
  }

  const ownerId = policy.owner?._id?.toString?.() ?? policy.owner?.toString?.();
  return ownerId === req.user?._id?.toString();
};

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/policies - List policies with filters and pagination
router.get(
  '/',
  [
    query('type').optional().isIn(['auto', 'home', 'life']),
    query('status').optional().isIn(['active', 'expired', 'cancelled']),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, status, search, page = 1, limit = 10 } = req.query;

      const filter: any = isAdmin(req) ? {} : { owner: req.user._id };

      if (type) filter.type = type;
      if (status) filter.status = status;

      if (search) {
        filter.$or = [
          { holderName: { $regex: search, $options: 'i' } },
          { policyNumber: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = ((page as number) - 1) * (limit as number);

      const policies = await Policy.find(filter)
        .populate('owner', 'name email')
        .skip(skip)
        .limit(limit as number)
        .sort({ createdAt: -1 });

      const total = await Policy.countDocuments(filter);

      res.status(200).json({
        message: 'Policies retrieved',
        data: policies,
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

// GET /api/policies/:id - Get single policy
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = await Policy.findById(req.params.id).populate(
      'owner',
      'name email'
    );

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    if (!isOwnerOrAdmin(req, policy)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.status(200).json({
      message: 'Policy retrieved',
      data: policy,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/policies - Create policy
router.post(
  '/',
  [
    body('policyNumber')
      .trim()
      .notEmpty()
      .withMessage('Policy number is required'),
    body('holderName')
      .trim()
      .notEmpty()
      .withMessage('Holder name is required'),
    body('type')
      .isIn(['auto', 'home', 'life'])
      .withMessage('Type must be auto, home, or life'),
    body('status')
      .isIn(['active', 'expired', 'cancelled'])
      .withMessage('Status must be active, expired, or cancelled'),
    body('premium')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Premium must be a positive number'),
    body('effectiveDate')
      .optional()
      .isISO8601()
      .withMessage('Effective date must be a valid date'),
    body('expirationDate')
      .optional()
      .isISO8601()
      .withMessage('Expiration date must be a valid date'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { policyNumber, holderName, type, status, premium, effectiveDate, expirationDate } = req.body;

      // Check for duplicate policy number
      const existing = await Policy.findOne({ policyNumber: policyNumber.toUpperCase() });
      if (existing) {
        return res.status(409).json({ error: 'Policy number already exists' });
      }

      const policy = new Policy({
        policyNumber,
        holderName,
        type,
        status,
        premium,
        effectiveDate,
        expirationDate,
        owner: req.user._id,
      });

      await policy.save();

      res.status(201).json({
        message: 'Policy created successfully',
        data: policy,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/policies/:id - Update policy
router.put(
  '/:id',
  [
    body('policyNumber')
      .optional()
      .trim(),
    body('holderName')
      .optional()
      .trim(),
    body('type')
      .optional()
      .isIn(['auto', 'home', 'life']),
    body('status')
      .optional()
      .isIn(['active', 'expired', 'cancelled']),
    body('premium')
      .optional()
      .isFloat({ min: 0 }),
    body('effectiveDate')
      .optional()
      .isISO8601(),
    body('expirationDate')
      .optional()
      .isISO8601(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const policy = await Policy.findById(req.params.id);

      if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      if (!isOwnerOrAdmin(req, policy)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const updates = req.body;
      Object.assign(policy, updates);
      await policy.save();

      res.status(200).json({
        message: 'Policy updated successfully',
        data: policy,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/policies/:id - Delete policy
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    if (!isOwnerOrAdmin(req, policy)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Policy.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Policy deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
