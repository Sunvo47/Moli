import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
export interface AuthRequest extends Request {
user?: {
userId: number;
email: string;
role: string;
};
}
export const authenticateToken = (
req: AuthRequest,
res: Response,
next: NextFunction
) => {
try {
const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return res.status(401).json({
    message: 'Authentication required',
  });
}

const token = authHeader.split(' ')[1];

const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET as string
) as {
  userId: number;
  email: string;
  role: string;
};

req.user = decoded;

next();
} catch (error) {
return res.status(401).json({
message: 'Invalid or expired token',
});
}
};
export const requireAdmin = (
req: AuthRequest,
res: Response,
next: NextFunction
) => {
if (!req.user) {
return res.status(401).json({
message: 'Authentication required',
});
}
if (req.user.role !== 'ADMIN') {
return res.status(403).json({
message: 'Admin access required',
});
}
next();
};
