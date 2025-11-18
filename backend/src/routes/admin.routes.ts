import express from 'express';
import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

/**
 * Secure admin reset password endpoint
 * POST /api/admin/reset-password
 * Headers: x-admin-token: ADMIN_RESET_TOKEN (from env)
 * Body: { email: string, password: string }
 */
router.post('/reset-password', async (req, res) => {
  try {
    // normalize header access - express.get returns value or undefined
    const token = (req.get('x-admin-token') || req.get('X-Admin-Token')) as string | undefined;
    const adminToken = process.env.ADMIN_RESET_TOKEN;

    if (!adminToken) {
      return res.status(500).json({ success: false, error: 'Admin reset token not configured' });
    }

    if (!token || token !== adminToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Missing email or password' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await query(`UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2`, [hashed, email]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error: unknown) {
    console.error('❌ Error in admin reset password:', error);
    const message = (error instanceof Error) ? error.message : String(error);
    return res.status(500).json({ success: false, error: message });
  }
});

export default router;
