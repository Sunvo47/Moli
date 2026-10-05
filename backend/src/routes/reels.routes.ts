import { Router } from 'express';
import { prisma } from '../lib/prisma';
import {
  authenticateToken,
  AuthRequest,
} from '../middleware/auth.middleware';

const router = Router();

const movieSelect = {
  id: true,
  title: true,
  poster: true,
  genre: true,
  rating: true,
};

// GET /api/reels
router.get('/', async (_req, res) => {
  try {
    const reels = await prisma.reel.findMany({
      include: {
        movie: {
          select: movieSelect,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(reels);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to fetch reels',
    });
  }
});

// GET /api/reels/:id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        message: 'Invalid reel ID',
      });
    }

    const reel = await prisma.reel.findUnique({
      where: { id },
      include: {
        movie: {
          select: movieSelect,
        },
      },
    });

    if (!reel) {
      return res.status(404).json({
        message: 'Reel not found',
      });
    }

    res.json(reel);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to fetch reel',
    });
  }
});

// POST /api/reels
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    const {
      title,
      description,
      videoUrl,
      thumbnail,
      movieId,
    } = req.body;

    if (!title || !videoUrl || !thumbnail || !movieId) {
      return res.status(400).json({
        message:
          'Title, video URL, thumbnail and movie ID are required',
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

    const reel = await prisma.reel.create({
      data: {
        title,
        description: description || '',
        videoUrl,
        thumbnail,
        movieId: Number(movieId),
        createdBy: userId,
      },
      include: {
        movie: {
          select: movieSelect,
        },
      },
    });

    res.status(201).json({
      message: 'Reel created successfully',
      reel,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to create reel',
    });
  }
});

// POST /api/reels/:id/view
router.post('/:id/view', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        message: 'Invalid reel ID',
      });
    }

    const reel = await prisma.reel.findUnique({
      where: { id },
    });

    if (!reel) {
      return res.status(404).json({
        message: 'Reel not found',
      });
    }

    const updatedReel = await prisma.reel.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    res.json({
      message: 'Reel view recorded',
      viewCount: updatedReel.viewCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to record reel view',
    });
  }
});

// GET /api/reels/:id/like
router.get(
  '/:id/like',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const reelId = Number(req.params.id);

      if (!reelId || Number.isNaN(reelId)) {
        return res.status(400).json({
          message: 'Invalid reel ID',
        });
      }

      const reel = await prisma.reel.findUnique({
        where: { id: reelId },
      });

      if (!reel) {
        return res.status(404).json({
          message: 'Reel not found',
        });
      }

      const existingLike = await prisma.reelLike.findUnique({
        where: {
          userId_reelId: {
            userId,
            reelId,
          },
        },
      });

      res.json({
        reelId,
        liked: !!existingLike,
        likeCount: reel.likeCount,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: 'Failed to check reel like',
      });
    }
  }
);

// POST /api/reels/:id/like
router.post(
  '/:id/like',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const reelId = Number(req.params.id);

      if (!reelId || Number.isNaN(reelId)) {
        return res.status(400).json({
          message: 'Invalid reel ID',
        });
      }

      const reel = await prisma.reel.findUnique({
        where: { id: reelId },
      });

      if (!reel) {
        return res.status(404).json({
          message: 'Reel not found',
        });
      }

      const existingLike = await prisma.reelLike.findUnique({
        where: {
          userId_reelId: {
            userId,
            reelId,
          },
        },
      });

      if (existingLike) {
        await prisma.$transaction([
          prisma.reelLike.delete({
            where: {
              id: existingLike.id,
            },
          }),
          prisma.reel.update({
            where: {
              id: reelId,
            },
            data: {
              likeCount: {
                decrement: 1,
              },
            },
          }),
        ]);

        return res.json({
          message: 'Reel unliked',
          liked: false,
          likeCount: Math.max(reel.likeCount - 1, 0),
        });
      }

      await prisma.$transaction([
        prisma.reelLike.create({
          data: {
            userId,
            reelId,
          },
        }),
        prisma.reel.update({
          where: {
            id: reelId,
          },
          data: {
            likeCount: {
              increment: 1,
            },
          },
        }),
      ]);

      res.status(201).json({
        message: 'Reel liked',
        liked: true,
        likeCount: reel.likeCount + 1,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: 'Failed to update reel like',
      });
    }
  }
);

// PUT /api/reels/:id
router.put(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const userId = req.user!.userId;

      if (!id || Number.isNaN(id)) {
        return res.status(400).json({
          message: 'Invalid reel ID',
        });
      }

      const existingReel = await prisma.reel.findUnique({
        where: { id },
      });

      if (!existingReel) {
        return res.status(404).json({
          message: 'Reel not found',
        });
      }

      if (existingReel.createdBy !== userId) {
        return res.status(403).json({
          message: 'You can only edit your own reel',
        });
      }

      const {
        title,
        description,
        videoUrl,
        thumbnail,
        movieId,
      } = req.body;

      if (!title || !videoUrl || !thumbnail || !movieId) {
        return res.status(400).json({
          message:
            'Title, video URL, thumbnail and movie ID are required',
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

      const reel = await prisma.reel.update({
        where: { id },
        data: {
          title,
          description: description || '',
          videoUrl,
          thumbnail,
          movieId: Number(movieId),
        },
        include: {
          movie: {
            select: movieSelect,
          },
        },
      });

      res.json({
        message: 'Reel updated successfully',
        reel,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: 'Failed to update reel',
      });
    }
  }
);

// DELETE /api/reels/:id
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const userId = req.user!.userId;

      if (!id || Number.isNaN(id)) {
        return res.status(400).json({
          message: 'Invalid reel ID',
        });
      }

      const existingReel = await prisma.reel.findUnique({
        where: { id },
      });

      if (!existingReel) {
        return res.status(404).json({
          message: 'Reel not found',
        });
      }

      if (existingReel.createdBy !== userId) {
        return res.status(403).json({
          message: 'You can only delete your own reel',
        });
      }

      await prisma.$transaction([
        prisma.reelLike.deleteMany({
          where: { reelId: id },
        }),
        prisma.reel.delete({
          where: { id },
        }),
      ]);

      res.json({
        message: 'Reel deleted successfully',
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: 'Failed to delete reel',
      });
    }
  }
);

export default router;