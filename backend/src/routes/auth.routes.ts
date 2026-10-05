import { Router } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const router = Router();
// POST /api/auth/register
router.post('/register', async (req, res) => {
try {
const { name, email, password } = req.body;
if (!name || !email || !password) {
  return res.status(400).json({
    message: 'Name, email and password are required',
  });
}

const normalizedEmail = email.trim().toLowerCase();

const existingUser = await prisma.user.findUnique({
  where: {
    email: normalizedEmail,
  },
});

if (existingUser) {
  return res.status(409).json({
    message: 'Email already exists',
  });
}

const hashedPassword = await bcrypt.hash(password, 10);

const user = await prisma.user.create({
  data: {
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    updatedAt: new Date(),
  },
});

res.status(201).json({
  message: 'Registration successful',
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
 profileImage: user.profileImage,
  },
});
} catch (error) {
console.error(error);
res.status(500).json({
  message: 'Failed to register',
});
}
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
try {
const { email, password } = req.body;
if (!email) {
  return res.status(400).json({
    message: 'Email is required',
  });
}

if (!password) {
  return res.status(400).json({
    message: 'Password is required',
  });
}

const normalizedEmail = email.trim().toLowerCase();

const user = await prisma.user.findUnique({
  where: {
    email: normalizedEmail,
  },
});

if (!user) {
  return res.status(404).json({
    message: 'No account found with this email',
  });
}

const passwordMatch = await bcrypt.compare(
  password,
  user.password
);

if (!passwordMatch) {
  return res.status(401).json({
    message: 'Incorrect password',
  });
}

const token = jwt.sign(
  {
    userId: user.id,
    email: user.email,
    role: user.role,
  },
  process.env.JWT_SECRET as string,
  {
    expiresIn: '7d',
  }
);

res.json({
  message: 'Login successful',
  token,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
 profileImage: user.profileImage,
  },
});
} catch (error) {
console.error(error);
res.status(500).json({
  message: 'Failed to login',
});
}
});
// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
try {
const { email, newPassword } = req.body;
if (!email) {
  return res.status(400).json({
    message: 'Email is required',
  });
}

if (!newPassword) {
  return res.status(400).json({
    message: 'New password is required',
  });
}

if (newPassword.length < 6) {
  return res.status(400).json({
    message: 'Password must be at least 6 characters',
  });
}

const normalizedEmail = email.trim().toLowerCase();

const user = await prisma.user.findUnique({
  where: {
    email: normalizedEmail,
  },
});

if (!user) {
  return res.status(404).json({
    message: 'No account found with this email',
  });
}

const hashedPassword = await bcrypt.hash(
  newPassword,
  10
);

await prisma.user.update({
  where: {
    id: user.id,
  },
  data: {
    password: hashedPassword,
    updatedAt: new Date(),
  },
});

res.json({
  message: 'Password reset successful',
});
} catch (error) {
console.error(error);
res.status(500).json({
  message: 'Failed to reset password',
});
}
});
export default router;
