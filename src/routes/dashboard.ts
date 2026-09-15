import { Router, Request, Response, NextFunction } from 'express';
import Claim from '../models/Claim';
import Policy from '../models/Policy';
import User from '../models/User';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/dashboard - Get dashboard statistics
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Total claims
    const totalClaims = await Claim.countDocuments();

    // Claims by status
    const claimsByStatus = await Claim.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Total policies
    const totalPolicies = await Policy.countDocuments();

    // Policies by type
    const policiesByType = await Policy.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    // Total users
    const totalUsers = await User.countDocuments();

    // Recent claims (last 5)
    const recentClaims = await Claim.find()
      .populate('policy', 'policyNumber holderName')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Total claim amount
    const totalAmount = await Claim.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    res.status(200).json({
      message: 'Dashboard data retrieved',
      data: {
        totalClaims,
        claimsByStatus,
        totalPolicies,
        policiesByType,
        totalUsers,
        recentClaims,
        totalClaimAmount: totalAmount[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
