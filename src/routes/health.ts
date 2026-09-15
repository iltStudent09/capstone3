import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/health - Health check
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

export default router;
