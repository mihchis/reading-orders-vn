import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/db';
import { JWT_SECRET, authMiddleware, AuthRequest, AuthUser } from '../middleware/auth';

const router = Router();

// POST /api/auth/register - Đăng ký tài khoản độc giả mới
router.post('/register', (req, res) => {
  try {
    const { username, password, display_name } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ tên đăng nhập và mật khẩu' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      res.status(400).json({ success: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
      return;
    }

    // Kiểm tra trùng username trong cả admins và users
    const checkAdmin = db.prepare('SELECT id FROM admins WHERE username = ?').get(cleanUsername);
    const checkUser = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
    if (checkAdmin || checkUser) {
      res.status(400).json({ success: false, message: 'Tên đăng nhập này đã được sử dụng' });
      return;
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const displayName = (display_name && display_name.trim()) || cleanUsername;

    const result = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role)
      VALUES (?, ?, ?, 'user')
    `).run(cleanUsername, password_hash, displayName);

    const newUserId = Number(result.lastInsertRowid);
    const authUser: AuthUser = {
      id: newUserId,
      username: cleanUsername,
      display_name: displayName,
      role: 'user'
    };

    const token = jwt.sign(authUser, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Chào mừng bạn đến với Reading Orders.',
      token,
      user: authUser,
      admin: null
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login - Đăng nhập cho cả Admin và Độc giả
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ tên đăng nhập và mật khẩu' });
    return;
  }

  const cleanUsername = username.trim().toLowerCase();

  // 1. Kiểm tra trong bảng Admins trước
  const adminQuery = db.prepare('SELECT * FROM admins WHERE LOWER(username) = ?');
  const admin = adminQuery.get(cleanUsername) as any;

  if (admin && bcrypt.compareSync(password, admin.password_hash)) {
    const authUser: AuthUser = {
      id: admin.id,
      username: admin.username,
      display_name: admin.display_name || admin.username,
      role: 'admin'
    };

    const token = jwt.sign(authUser, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Đăng nhập Quản trị viên thành công',
      token,
      user: authUser,
      admin: authUser
    });
    return;
  }

  // 2. Nếu không phải Admin, kiểm tra trong bảng Users (Độc giả)
  const userQuery = db.prepare('SELECT * FROM users WHERE LOWER(username) = ?');
  const user = userQuery.get(cleanUsername) as any;

  if (user && bcrypt.compareSync(password, user.password_hash)) {
    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      display_name: user.display_name || user.username,
      role: 'user'
    };

    const token = jwt.sign(authUser, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      message: 'Đăng nhập thành công! Đã kết nối tiến độ đọc cá nhân.',
      token,
      user: authUser,
      admin: null
    });
    return;
  }

  res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
});

// GET /api/auth/me - Kiểm tra phiên đăng nhập hiện tại
router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  res.json({
    success: true,
    user: req.user,
    admin: req.admin || null,
  });
});

// GET /api/auth/progress/:orderId - Lấy tiến độ đọc của user cho 1 sự kiện
router.get('/progress/:orderId', authMiddleware, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const orderId = Number(req.params.orderId);

    const rows = db.prepare(`
      SELECT issue_id FROM user_progress
      WHERE user_id = ? AND reading_order_id = ? AND is_read = 1
    `).all(userId, orderId) as any[];

    const readIds = rows.map(r => r.issue_id);

    res.json({
      success: true,
      data: {
        orderId,
        readIssueIds: readIds
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/progress/:orderId/toggle - Đánh dấu hoặc bỏ đánh dấu 1 tập truyện
router.post('/progress/:orderId/toggle', authMiddleware, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const orderId = Number(req.params.orderId);
    const { issueId } = req.body;

    if (!issueId) {
      res.status(400).json({ success: false, message: 'Thiếu issueId' });
      return;
    }

    const existing = db.prepare(`
      SELECT id, is_read FROM user_progress
      WHERE user_id = ? AND reading_order_id = ? AND issue_id = ?
    `).get(userId, orderId, issueId) as any;

    let newStatus = true;
    if (existing) {
      newStatus = existing.is_read ? false : true;
      if (newStatus) {
        db.prepare(`UPDATE user_progress SET is_read = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(existing.id);
      } else {
        db.prepare(`DELETE FROM user_progress WHERE id = ?`).run(existing.id);
      }
    } else {
      db.prepare(`
        INSERT INTO user_progress (user_id, reading_order_id, issue_id, is_read)
        VALUES (?, ?, ?, 1)
      `).run(userId, orderId, issueId);
      newStatus = true;
    }

    const currentRows = db.prepare(`
      SELECT issue_id FROM user_progress
      WHERE user_id = ? AND reading_order_id = ? AND is_read = 1
    `).all(userId, orderId) as any[];

    res.json({
      success: true,
      issueId,
      isRead: newStatus,
      readIssueIds: currentRows.map(r => r.issue_id)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/progress/:orderId/mark-all - Đánh dấu tất cả hoặc bỏ chọn tất cả
router.post('/progress/:orderId/mark-all', authMiddleware, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const orderId = Number(req.params.orderId);
    const { markAllRead, issueIds } = req.body;

    if (markAllRead && Array.isArray(issueIds)) {
      const insertStmt = db.prepare(`
        INSERT INTO user_progress (user_id, reading_order_id, issue_id, is_read)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(user_id, reading_order_id, issue_id) DO UPDATE SET is_read = 1
      `);
      for (const id of issueIds) {
        insertStmt.run(userId, orderId, id);
      }
    } else {
      db.prepare(`
        DELETE FROM user_progress
        WHERE user_id = ? AND reading_order_id = ?
      `).run(userId, orderId);
    }

    const currentRows = db.prepare(`
      SELECT issue_id FROM user_progress
      WHERE user_id = ? AND reading_order_id = ? AND is_read = 1
    `).all(userId, orderId) as any[];

    res.json({
      success: true,
      readIssueIds: currentRows.map(r => r.issue_id)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Đăng xuất thành công' });
});

export default router;
