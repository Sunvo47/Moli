import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import {
authenticateToken,
AuthRequest,
} from '../middleware/auth.middleware';
const router = Router();
const profileSelect = {
id: true,
name: true,
email: true,
role: true,
profileImage: true,
createdAt: true,
updatedAt: true,
};
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
try {
if (!req.user) {
return res.status(401).json({
message: 'Authentication required',
});
}
const user = await prisma.user.findUnique({
  where: {
    id: req.user.userId,
  },
  select: profileSelect,
});

if (!user) {
  return res.status(404).json({
    message: 'User not found',
  });
}

return res.json(user);
} catch (error) {
console.error('Get profile error:', error);
return res.status(500).json({
  message: 'Failed to get profile',
});
}
});
router.put('/me', authenticateToken, async (req: AuthRequest, res) => {
try {
console.log('PROFILE UPDATE: REQUEST RECEIVED');
if (!req.user) {
  return res.status(401).json({
    message: 'Authentication required',
  });
}

console.log('PROFILE UPDATE: USER', req.user.userId);

const { name, profileImage } = req.body;

// -------------------------
// ตรวจว่ามีข้อมูลที่จะอัปเดต
// -------------------------

if (
  name === undefined &&
  profileImage === undefined
) {
  return res.status(400).json({
    message: 'No profile data to update',
  });
}

// -------------------------
// เตรียมข้อมูลสำหรับ Prisma
// -------------------------

const updateData: {
  name?: string;
  profileImage?: string | null;
} = {};

// -------------------------
// ตรวจและอัปเดตชื่อ
// -------------------------

if (name !== undefined) {

  if (
    typeof name !== 'string' ||
    !name.trim()
  ) {
    return res.status(400).json({
      message: 'Name is required',
    });
  }

  const trimmedName = name.trim();

  if (trimmedName.length > 50) {
    return res.status(400).json({
      message:
        'Name must be 50 characters or less',
    });
  }

  updateData.name = trimmedName;
}

// -------------------------
// ตรวจและอัปเดตรูป
// -------------------------

if (profileImage !== undefined) {

  if (
    profileImage !== null &&
    typeof profileImage !== 'string'
  ) {
    return res.status(400).json({
      message: 'Invalid profile image',
    });
  }

  if (
    typeof profileImage === 'string' &&
    profileImage.length > 500000
  ) {
    return res.status(400).json({
      message: 'Profile image is too large',
    });
  }

  if (
    typeof profileImage === 'string' &&
    profileImage &&
    !/^data:image\/(jpeg|png|webp);base64,/.test(
      profileImage
    )
  ) {
    return res.status(400).json({
      message:
        'Profile image must be a valid image',
    });
  }

  updateData.profileImage =
    profileImage;
}

console.log(
  'PROFILE UPDATE: DATA',
  Object.keys(updateData)
);

console.log(
  'PROFILE UPDATE: BEFORE PRISMA'
);

const user = await prisma.user.update({
  where: {
    id: req.user.userId,
  },
  data: updateData,
  select: profileSelect,
});

console.log(
  'PROFILE UPDATE: AFTER PRISMA'
);

return res.json(user);
} catch (error) {
console.error(
  'Update profile error:',
  error
);

return res.status(500).json({
  message: 'Failed to update profile',
});
}
});
router.put('/email', authenticateToken, async (req: AuthRequest, res) => {
try {
if (!req.user) {
return res.status(401).json({
message: 'Authentication required',
});
}
const { email, currentPassword } = req.body;

if (!email || typeof email !== 'string') {
  return res.status(400).json({
    message: 'Email is required',
  });
}

if (
  !currentPassword ||
  typeof currentPassword !== 'string'
) {
  return res.status(400).json({
    message: 'Current password is required',
  });
}

const normalizedEmail =
  email.trim().toLowerCase();

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailPattern.test(normalizedEmail)) {
  return res.status(400).json({
    message: 'Invalid email address',
  });
}

const user =
  await prisma.user.findUnique({
    where: {
      id: req.user.userId,
    },
  });

if (!user) {
  return res.status(404).json({
    message: 'User not found',
  });
}

const passwordMatch =
  await bcrypt.compare(
    currentPassword,
    user.password
  );

if (!passwordMatch) {
  return res.status(400).json({
    message:
      'Current password is incorrect',
  });
}

const existingUser =
  await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

if (
  existingUser &&
  existingUser.id !== user.id
) {
  return res.status(409).json({
    message: 'Email is already in use',
  });
}

const updatedUser =
  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      email: normalizedEmail,
    },
    select: profileSelect,
  });

return res.json(updatedUser);
} catch (error) {
console.error(
  'Update email error:',
  error
);

return res.status(500).json({
  message: 'Failed to update email',
});
}
});
router.put('/password', authenticateToken, async (req: AuthRequest, res) => {
try {
if (!req.user) {
return res.status(401).json({
message: 'Authentication required',
});
}
const {
  currentPassword,
  newPassword,
} = req.body;

if (
  !currentPassword ||
  typeof currentPassword !== 'string'
) {
  return res.status(400).json({
    message:
      'Current password is required',
  });
}

if (
  !newPassword ||
  typeof newPassword !== 'string'
) {
  return res.status(400).json({
    message:
      'New password is required',
  });
}

if (newPassword.length < 8) {
  return res.status(400).json({
    message:
      'New password must be at least 8 characters',
  });
}

const user =
  await prisma.user.findUnique({
    where: {
      id: req.user.userId,
    },
  });

if (!user) {
  return res.status(404).json({
    message: 'User not found',
  });
}

const passwordMatch =
  await bcrypt.compare(
    currentPassword,
    user.password
  );

if (!passwordMatch) {
  return res.status(400).json({
    message:
      'Current password is incorrect',
  });
}

const hashedPassword =
  await bcrypt.hash(
    newPassword,
    10
  );

await prisma.user.update({
  where: {
    id: user.id,
  },
  data: {
    password: hashedPassword,
  },
});

return res.json({
  message:
    'Password updated successfully',
});
} catch (error) {
console.error(
  'Update password error:',
  error
);

return res.status(500).json({
  message:
    'Failed to update password',
});
}
});
export default router;