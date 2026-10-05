import { Router } from 'express';
import { prisma } from '../lib/prisma';
import {
authenticateToken,
AuthRequest,
} from '../middleware/auth.middleware';

const router = Router();

// GET /api/watch-history/check/:movieId
router.get(
'/check/:movieId',
authenticateToken,
async (req: AuthRequest, res) => {
try {
const userId = req.user!.userId;
const movieId = Number(req.params.movieId);

  if (!movieId || Number.isNaN(movieId)) {
    return res.status(400).json({
      message: 'Invalid movie ID',
    });
  }

  const movie = await prisma.movie.findUnique({
    where: {
      id: movieId,
    },
  });

  if (!movie) {
    return res.status(404).json({
      message: 'Movie not found',
    });
  }

  const rental = await prisma.rental.findFirst({
    where: {
      userId,
      movieId,
      status: 'ACTIVE',
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!rental) {
    return res.status(403).json({
      canWatch: false,
      message: 'You need an active rental to watch this movie',
    });
  }

  res.json({
    canWatch: true,
    message: 'You can watch this movie',
    expiresAt: rental.expiresAt,
  });
} catch (error) {
  console.error(error);

  res.status(500).json({
    message: 'Failed to check watch permission',
  });
}

}
);

// POST /api/watch-history/:movieId
router.post('/:movieId', authenticateToken, async (req: AuthRequest, res) => {
try {
const userId = req.user!.userId;
const movieId = Number(req.params.movieId);

if (!movieId || Number.isNaN(movieId)) {
  return res.status(400).json({
    message: 'Invalid movie ID',
  });
}

const movie = await prisma.movie.findUnique({
  where: {
    id: movieId,
  },
});

if (!movie) {
  return res.status(404).json({
    message: 'Movie not found',
  });
}

const [history] = await prisma.$transaction([
  prisma.watchHistory.create({
    data: {
      userId,
      movieId,
    },
  }),
  prisma.movie.update({
    where: {
      id: movieId,
    },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  }),
]);

res.status(201).json({
  message: 'Watch history recorded',
  history,
  viewCount: movie.viewCount + 1,
});

} catch (error) {
console.error(error);

res.status(500).json({
  message: 'Failed to record watch history',
});

}
});

// GET /api/watch-history/my
router.get('/my', authenticateToken, async (req: AuthRequest, res) => {
try {
const userId = req.user!.userId;

const history = await prisma.watchHistory.findMany({
  where: {
    userId,
  },
  include: {
    Movie: true,
  },
  orderBy: {
    watchedAt: 'desc',
  },
});

res.json(
  history.map(({ Movie, ...item }) => ({
    ...item,
    movie: Movie,
  }))
);

} catch (error) {
console.error(error);

res.status(500).json({
  message: 'Failed to fetch watch history',
});

}
});

export default router;
