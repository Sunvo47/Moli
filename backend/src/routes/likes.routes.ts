import { Router } from 'express';
import { prisma } from '../lib/prisma';
import {
authenticateToken,
AuthRequest,
} from '../middleware/auth.middleware';
const router = Router();
// POST /api/likes/:movieId
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

const existingLike = await prisma.movieLike.findUnique({
  where: {
    userId_movieId: {
      userId,
      movieId,
    },
  },
});

if (existingLike) {
  await prisma.$transaction([
    prisma.movieLike.delete({
      where: {
        id: existingLike.id,
      },
    }),
    prisma.movie.update({
      where: {
        id: movieId,
      },
      data: {
        likeCount: {
          decrement: 1,
        },
      },
    }),
  ]);

  return res.json({
    message: 'Movie unliked',
    liked: false,
    likeCount: Math.max(movie.likeCount - 1, 0),
  });
}

await prisma.$transaction([
  prisma.movieLike.create({
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
      likeCount: {
        increment: 1,
      },
    },
  }),
]);

res.status(201).json({
  message: 'Movie liked',
  liked: true,
  likeCount: movie.likeCount + 1,
});
} catch (error) {
console.error(error);
res.status(500).json({
  message: 'Failed to update like',
});
}
});
// GET /api/likes/my
router.get('/my', authenticateToken, async (req: AuthRequest, res) => {
try {
const userId = req.user!.userId;
const likes = await prisma.movieLike.findMany({
  where: {
    userId,
  },
  orderBy: {
    createdAt: 'desc',
  },
  include: {
    movie: true,
  },
});

res.json(likes);
} catch (error) {
console.error(error);
res.status(500).json({
  message: 'Failed to fetch liked movies',
});
}
});
// GET /api/likes/:movieId
router.get('/:movieId', authenticateToken, async (req: AuthRequest, res) => {
try {
const userId = req.user!.userId;
const movieId = Number(req.params.movieId);
const movie = await prisma.movie.findUnique({
  where: {
    id: movieId,
  },
  select: {
    id: true,
    likeCount: true,
  },
});

if (!movie) {
  return res.status(404).json({
    message: 'Movie not found',
  });
}

const like = await prisma.movieLike.findUnique({
  where: {
    userId_movieId: {
      userId,
      movieId,
    },
  },
});

res.json({
  liked: Boolean(like),
  likeCount: movie.likeCount,
});
} catch (error) {
console.error(error);
res.status(500).json({
  message: 'Failed to fetch like count',
});
}
});
export default router;
