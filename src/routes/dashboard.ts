import { Router, Request, Response, NextFunction } from 'express';
import Claim from '../models/Claim';
import Policy from '../models/Policy';
import User from '../models/User';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/dashboard - Get dashboard statistics
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Admin sees all stats, adjusters see only their assigned claims
    const isAdmin = req.user?.role === 'admin';
    const userId = req.user?._id;

    // Total claims (all for admin, only assigned for adjusters)
    const claimFilter = isAdmin ? {} : { assignedTo: userId };
    const totalClaims = await Claim.countDocuments(claimFilter);

    // Claims by status
    const claimsByStatus = await Claim.aggregate([
      { $match: claimFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Total policies (all for admin, only owned for adjusters)
    const policyFilter = isAdmin ? {} : { owner: userId };
    const totalPolicies = await Policy.countDocuments(policyFilter);

    // Policies by type
    const policiesByType = await Policy.aggregate([
      { $match: policyFilter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    // Total users (only 1 if not admin)
    const totalUsers = isAdmin ? await User.countDocuments() : 1;

    // Recent claims (only own if adjuster)
    const recentClaims = await Claim.find(claimFilter)
      .populate('policy', 'policyNumber holderName')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Total claim amount
    const totalAmount = await Claim.aggregate([
      { $match: claimFilter },
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
