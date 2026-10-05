import { Router } from 'express';
import {
  authenticateToken,
  AuthRequest,
} from '../middleware/auth.middleware';

const router = Router();

router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  res.json({
    message: 'Token is valid',
    user: req.user,
  });
});

export default router;
