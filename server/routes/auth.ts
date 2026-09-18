import { Router } from 'express';
import { supabase, supabaseAdmin } from '../database/supabase';
import { authMiddleware, AuthRequest, AuthUser } from '../middleware/auth';
import { db } from '../database/db';

const router = Router();

function formatEmail(usernameOrEmail: string): string {
  const clean = usernameOrEmail.trim().toLowerCase();
  if (clean.includes('@')) return clean;
  return `${clean}@readingorders.vn`;
}

// POST /api/auth/register - Đăng ký tài khoản độc giả mới trên Supabase Auth
router.post('/register', async (req, res) => {
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

    const email = formatEmail(cleanUsername);
    const displayName = (display_name && display_name.trim()) || cleanUsername;

    // 1. Tạo tài khoản trên Supabase Cloud Auth
    const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username: cleanUsername,
        display_name: displayName,
        role: 'user'
      }
    });

    if (createErr) {
      if (createErr.message.toLowerCase().includes('already') || createErr.message.toLowerCase().includes('exists')) {
        res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc email này đã được sử dụng' });
        return;
      }
      res.status(400).json({ success: false, message: createErr.message });
      return;
    }

    // 2. Đăng nhập để lấy Access Token cho client
    const { data: sessionData, error: sessionErr } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (sessionErr || !sessionData?.session) {
      res.status(500).json({ success: false, message: 'Đăng ký thành công nhưng không thể tự động đăng nhập. Vui lòng thử đăng nhập lại.' });
      return;
    }

    const authUser: AuthUser = {
      id: sessionData.user.id,
      username: cleanUsername,
      display_name: displayName,
      role: 'user'
    };

    res.json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Chào mừng bạn đến với Reading Orders VN.',
      token: sessionData.session.access_token,
      user: authUser,
      admin: null
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login - Đăng nhập cho cả Admin và Độc giả qua Supabase Auth
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ tên đăng nhập và mật khẩu' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const email = formatEmail(cleanUsername);

    // 1. Nếu là tài khoản Admin
    if (cleanUsername === 'admin') {
      let { data: adminSession, error: adminErr } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // Nếu admin chưa tạo hoặc mật khẩu mặc định admin123
      if (adminErr && password === 'admin123') {
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: 'admin123',
          email_confirm: true,
          user_metadata: { username: 'admin', display_name: 'Quản Trị Viên', role: 'admin' }
        });
        const retry = await supabase.auth.signInWithPassword({ email, password: 'admin123' });
        adminSession = retry.data;
        adminErr = retry.error;
      }

      if (!adminErr && adminSession?.session) {
        const authUser: AuthUser = {
          id: adminSession.user.id,
          username: 'admin',
          display_name: adminSession.user.user_metadata?.display_name || 'Quản Trị Viên',
          role: 'admin'
        };

        res.json({
          success: true,
          message: 'Đăng nhập Quản trị viên thành công',
          token: adminSession.session.access_token,
          user: authUser,
          admin: authUser
        });
        return;
      }
    }

    // 2. Đăng nhập Độc giả qua Supabase
    const { data: sessionData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInErr || !sessionData?.session) {
      res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
      return;
    }

    const user = sessionData.user;
    const role = (user.user_metadata?.role || (cleanUsername === 'admin' ? 'admin' : 'user')) as 'admin' | 'user';
    const authUser: AuthUser = {
      id: user.id,
      username: user.user_metadata?.username || cleanUsername,
      display_name: user.user_metadata?.display_name || cleanUsername,
      role
    };

    res.json({
      success: true,
      message: role === 'admin' ? 'Đăng nhập Quản trị viên thành công' : 'Đăng nhập thành công',
      token: sessionData.session.access_token,
      user: authUser,
      admin: role === 'admin' ? authUser : null
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
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
router.get('/progress/:orderId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const orderIdParam = req.params.orderId;

    // 1. Kiểm tra trên Supabase Cloud nếu userId là UUID
    if (typeof userId === 'string' && userId.length > 20) {
      const { data: progressRows, error } = await supabaseAdmin
        .from('user_progress')
        .select('issue_sort_order')
        .eq('user_id', userId)
        .eq('reading_order_slug', orderIdParam)
        .eq('is_read', true);

      if (!error && progressRows) {
        return res.json({
          success: true,
          data: {
            orderId: orderIdParam,
            readIssueIds: progressRows.map(r => `issue_${r.issue_sort_order}`)
          }
        });
      }
    }

    // 2. Fallback local SQLite
    const orderIdNum = Number(orderIdParam) || 0;
    const rows = db.prepare(`
      SELECT issue_id FROM user_progress
      WHERE user_id = ? AND reading_order_id = ? AND is_read = 1
    `).all(userId, orderIdNum) as any[];

    res.json({
      success: true,
      data: {
        orderId: orderIdParam,
        readIssueIds: rows.map(r => r.issue_id)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/progress/:orderId/toggle - Đánh dấu hoặc bỏ đánh dấu 1 tập truyện
router.post('/progress/:orderId/toggle', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const orderIdParam = req.params.orderId;
    const { issueId } = req.body;

    if (!issueId) {
      res.status(400).json({ success: false, message: 'Thiếu issueId' });
      return;
    }

    // Nếu userId là UUID trên Supabase Cloud
    if (typeof userId === 'string' && userId.length > 20) {
      const sortOrderMatch = String(issueId).match(/\d+/);
      const sortOrder = sortOrderMatch ? parseInt(sortOrderMatch[0], 10) : 0;

      // Kiểm tra trạng thái hiện tại
      const { data: existing } = await supabaseAdmin
        .from('user_progress')
        .select('id, is_read')
        .eq('user_id', userId)
        .eq('reading_order_slug', orderIdParam)
        .eq('issue_sort_order', sortOrder)
        .maybeSingle();

      let newStatus = true;
      if (existing) {
        newStatus = !existing.is_read;
        if (newStatus) {
          await supabaseAdmin.from('user_progress').update({ is_read: true, updated_at: new Date().toISOString() }).eq('id', existing.id);
        } else {
          await supabaseAdmin.from('user_progress').delete().eq('id', existing.id);
        }
      } else {
        await supabaseAdmin.from('user_progress').insert({
          user_id: userId,
          reading_order_slug: orderIdParam,
          issue_sort_order: sortOrder,
          is_read: true
        });
        newStatus = true;
      }

      const { data: currentRows } = await supabaseAdmin
        .from('user_progress')
        .select('issue_sort_order')
        .eq('user_id', userId)
        .eq('reading_order_slug', orderIdParam)
        .eq('is_read', true);

      return res.json({
        success: true,
        issueId,
        isRead: newStatus,
        readIssueIds: (currentRows || []).map(r => `issue_${r.issue_sort_order}`)
      });
    }

    // Fallback SQLite
    const orderIdNum = Number(orderIdParam) || 0;
    const existingLocal = db.prepare(`
      SELECT id, is_read FROM user_progress
      WHERE user_id = ? AND reading_order_id = ? AND issue_id = ?
    `).get(userId, orderIdNum, issueId) as any;

    let localStatus = true;
    if (existingLocal) {
      localStatus = !existingLocal.is_read;
      if (localStatus) {
        db.prepare(`UPDATE user_progress SET is_read = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(existingLocal.id);
      } else {
        db.prepare(`DELETE FROM user_progress WHERE id = ?`).run(existingLocal.id);
      }
    } else {
      db.prepare(`
        INSERT INTO user_progress (user_id, reading_order_id, issue_id, is_read)
        VALUES (?, ?, ?, 1)
      `).run(userId, orderIdNum, issueId);
      localStatus = true;
    }

    const currentRows = db.prepare(`
      SELECT issue_id FROM user_progress
      WHERE user_id = ? AND reading_order_id = ? AND is_read = 1
    `).all(userId, orderIdNum) as any[];

    res.json({
      success: true,
      issueId,
      isRead: localStatus,
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
