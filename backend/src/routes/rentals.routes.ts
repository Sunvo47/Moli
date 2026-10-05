import { Router } from 'express';
import { prisma } from '../lib/prisma';
import {
authenticateToken,
AuthRequest,
} from '../middleware/auth.middleware';

const router = Router();

// POST /api/rentals
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
try {
const userId = req.user!.userId;
const { movieId } = req.body;

if (!movieId) {
  return res.status(400).json({
    message: 'Movie ID is required',
  });
}

const movie = await prisma.movie.findUnique({
  where: {
    id: Number(movieId),
  },
});

if (!movie) {
  return res.status(404).json({
    message: 'Movie not found',
  });
}

// ตรวจว่ามีการเช่าที่ยัง ACTIVE อยู่หรือไม่
const existingRental = await prisma.rental.findFirst({
  where: {
    userId,
    movieId: Number(movieId),
    status: 'ACTIVE',
    expiresAt: {
      gt: new Date(),
    },
  },
});

if (existingRental) {
  return res.status(409).json({
    message: 'You already rented this movie',
    expiresAt: existingRental.expiresAt,
  });
}

const rentedAt = new Date();
const expiresAt = new Date(
  rentedAt.getTime() + movie.rentalDuration * 60 * 60 * 1000
);

const rental = await prisma.rental.create({
  data: {
    userId,
    movieId: Number(movieId),
    rentedAt,
    expiresAt,
    status: 'ACTIVE',
    price: movie.rentalPrice,
    updatedAt: new Date(),
  },
});

res.status(201).json({
  message: 'Movie rented successfully',
  rental,
});

} catch (error) {
console.error(error);
res.status(500).json({
message: 'Failed to rent movie',
});
}
});

// GET /api/rentals/my
router.get('/my', authenticateToken, async (req: AuthRequest, res) => {
res.set('Cache-Control', 'no-store');

try {
const userId = req.user!.userId;

const rentals = await prisma.rental.findMany({
  where: {
    userId,
  },
  include: {
    movie: true,
  },
  orderBy: {
    rentedAt: 'desc',
  },
});

res.json(rentals);

} catch (error) {
console.error(error);
res.status(500).json({
message: 'Failed to fetch rentals',
});
}
});

export default router;
