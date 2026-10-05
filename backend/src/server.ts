import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';

import moviesRoutes from './routes/movies.routes';
import authRoutes from './routes/auth.routes';
import protectedRoutes from './routes/protected.routes';
import rentalsRoutes from './routes/rentals.routes';
import likesRoutes from './routes/likes.routes';
import myListRoutes from './routes/my-list.routes';
import watchHistoryRoutes from './routes/watch-history.routes';
import reelsRoutes from './routes/reels.routes';
import profileRoutes from './routes/profile.routes';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json({ limit: '2mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      message: 'Moli API is running',
      database: 'connected',
    });
  } catch (error) {
    console.error('Database health check failed:', error);

    res.status(500).json({
      message: 'Database connection failed',
    });
  }
});

app.use('/api/movies', moviesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/rentals', rentalsRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/my-list', myListRoutes);
app.use('/api/watch-history', watchHistoryRoutes);
app.use('/api/reels', reelsRoutes);
app.use('/api/profile', profileRoutes);

app.listen(PORT, () => {
  console.log(`Moli API running at http://localhost:${PORT}`);
});