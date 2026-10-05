import { Router } from 'express';

import { prisma } from '../lib/prisma';

import {
  authenticateToken,
  AuthRequest,
} from '../middleware/auth.middleware';

const router = Router();

// POST /api/my-list/:movieId
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

    const existingItem = await prisma.myList.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
    });

    if (existingItem) {
      return res.status(409).json({
        message: 'Movie is already in My List',
        saved: true,
      });
    }

    const item = await prisma.myList.create({
      data: {
        userId,
        movieId,
      },
      include: {
        movie: true,
      },
    });

    return res.status(201).json({
      message: 'Movie added to My List',
      saved: true,
      item,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Failed to add movie to My List',
    });
  }
});

// DELETE /api/my-list/:movieId
router.delete('/:movieId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const movieId = Number(req.params.movieId);

    if (!movieId || Number.isNaN(movieId)) {
      return res.status(400).json({
        message: 'Invalid movie ID',
      });
    }

    const existingItem = await prisma.myList.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
    });

    if (!existingItem) {
      return res.status(404).json({
        message: 'Movie is not in My List',
        saved: false,
      });
    }

    await prisma.myList.delete({
      where: {
        id: existingItem.id,
      },
    });

    return res.json({
      message: 'Movie removed from My List',
      saved: false,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Failed to remove movie from My List',
    });
  }
});

// GET /api/my-list/my
router.get('/my', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    const items = await prisma.myList.findMany({
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

    return res.json(items);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Failed to fetch My List',
    });
  }
});

// GET /api/my-list/:movieId
router.get('/:movieId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const movieId = Number(req.params.movieId);

    if (!movieId || Number.isNaN(movieId)) {
      return res.status(400).json({
        message: 'Invalid movie ID',
      });
    }

    const item = await prisma.myList.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
    });

    return res.json({
      saved: Boolean(item),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Failed to check My List status',
    });
  }
});

export default router;