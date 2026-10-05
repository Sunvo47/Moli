import { Router } from 'express';

import { prisma } from '../lib/prisma';

import {
  authenticateToken,
  requireAdmin,
} from '../middleware/auth.middleware';

const router = Router();

// GET /api/movies
// Search: /api/movies?search=horizon
// Filter: /api/movies?genre=Sci-Fi
// Filter: /api/movies?type=ANIME
// Public: ทุกคนเข้าดูได้

router.get('/', async (req, res) => {
  try {
    const search = req.query.search as string | undefined;
    const genre = req.query.genre as string | undefined;
    const type = req.query.type as string | undefined;

    const movies = await prisma.movie.findMany({
      where: {
        ...(search
          ? {
              title: {
                contains: search,
                mode: 'insensitive',
              },
            }
          : {}),

        ...(genre
          ? {
              genre: {
                equals: genre,
                mode: 'insensitive',
              },
            }
          : {}),

        ...(type
          ? {
              type: {
                equals: type,
                mode: 'insensitive',
              },
            }
          : {}),
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(movies);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to fetch movies',
    });
  }
});

// POST /api/movies
// Admin only

router.post(
  '/',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        title,
        description,
        poster,
        backdrop,
        type,
        genre,
        duration,
        rating,
        rentalPrice,
        rentalDuration,
        releaseDate,
      } = req.body;

      const movie = await prisma.movie.create({
        data: {
          title,
          description,
          poster,
          backdrop,
          type,
          genre,
          duration: Number(duration),
          rating: Number(rating),
          rentalPrice: Number(rentalPrice),
          rentalDuration: Number(rentalDuration),
          releaseDate: new Date(releaseDate),
        },
      });

      res.status(201).json(movie);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: 'Failed to create movie',
      });
    }
  }
);

// PUT /api/movies/:id
// Admin only

router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const {
        title,
        description,
        poster,
        backdrop,
        type,
        genre,
        duration,
        rating,
        rentalPrice,
        rentalDuration,
        releaseDate,
      } = req.body;

      const movie = await prisma.movie.update({
        where: {
          id,
        },

        data: {
          title,
          description,
          poster,
          backdrop,
          type,
          genre,
          duration: Number(duration),
          rating: Number(rating),
          rentalPrice: Number(rentalPrice),
          rentalDuration: Number(rentalDuration),
          releaseDate: new Date(releaseDate),
        },
      });

      res.json(movie);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: 'Failed to update movie',
      });
    }
  }
);

// DELETE /api/movies/:id
// Admin only

router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      await prisma.movie.delete({
        where: {
          id,
        },
      });

      res.json({
        message: 'Movie deleted successfully',
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: 'Failed to delete movie',
      });
    }
  }
);

// GET /api/movies/:id
// Public: ทุกคนดูรายละเอียดหนังได้

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    const movie = await prisma.movie.findUnique({
      where: {
        id,
      },
    });

    if (!movie) {
      return res.status(404).json({
        message: 'Movie not found',
      });
    }

    res.json(movie);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to fetch movie',
    });
  }
});

export default router;