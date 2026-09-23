import { Router } from 'express';
import { supabase, supabaseAdmin } from '../database/supabase';
import { authMiddleware, AuthRequest, AuthUser } from '../middleware/auth';

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
            readIssueIds: progressRows.map(r => `issue_${r.issue_sort_order - 1}`)
          }
        });
      }
    }

    // Không tìm thấy user trong Supabase
    res.json({ success: true, data: { orderId: orderIdParam, readIssueIds: [] } });
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

    // Chuyển đổi userId nếu là admin fallback
    let finalUserId = String(userId);
    if (finalUserId === '1' || finalUserId === 'admin') {
      try {
        const { data: adminList } = await supabaseAdmin.auth.admin.listUsers();
        const adm = adminList?.users?.find((u: any) => u.email === 'admin@readingorders.vn' || u.user_metadata?.role === 'admin');
        if (adm) finalUserId = adm.id;
      } catch {}
    }

    // Nếu userId là UUID trên Supabase Cloud
    if (typeof finalUserId === 'string' && finalUserId.length > 20) {
      // issueId là "issue_N" (0-based) → sort_order = N+1 (1-based trong Supabase)
      const sortOrderMatch = String(issueId).match(/\d+/);
      const sortOrder = sortOrderMatch ? parseInt(sortOrderMatch[0], 10) + 1 : 1;

      // Kiểm tra trạng thái hiện tại
      const { data: existing } = await supabaseAdmin
        .from('user_progress')
        .select('id, is_read')
        .eq('user_id', finalUserId)
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
          user_id: finalUserId,
          reading_order_slug: orderIdParam,
          issue_sort_order: sortOrder,
          is_read: true
        });
        newStatus = true;
      }

      const { data: currentRows } = await supabaseAdmin
        .from('user_progress')
        .select('issue_sort_order')
        .eq('user_id', finalUserId)
        .eq('reading_order_slug', orderIdParam)
        .eq('is_read', true);

      return res.json({
        success: true,
        issueId,
        isRead: newStatus,
        readIssueIds: (currentRows || []).map(r => `issue_${r.issue_sort_order - 1}`)
      });
    }

    // Không hỗ trợ user không hợp lệ
    res.status(400).json({ success: false, message: 'Tài khoản không hợp lệ' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/progress/:orderId/bulk - Đánh dấu tất cả hoặc bỏ đánh dấu tất cả các tập
router.post('/progress/:orderId/bulk', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let finalUserId = String(req.user!.id);
    if (finalUserId === '1' || finalUserId === 'admin') {
      try {
        const { data: adminList } = await supabaseAdmin.auth.admin.listUsers();
        const adm = adminList?.users?.find((u: any) => u.email === 'admin@readingorders.vn' || u.user_metadata?.role === 'admin');
        if (adm) finalUserId = adm.id;
      } catch {}
    }

    const orderIdParam = req.params.orderId;
    const { action, totalIssues } = req.body;

    if (action === 'unmark_all') {
      await supabaseAdmin
        .from('user_progress')
        .delete()
        .eq('user_id', finalUserId)
        .eq('reading_order_slug', orderIdParam);

      return res.json({ success: true, readIssueIds: [] });
    }

    if (action === 'mark_all') {
      const total = Math.max(1, Number(totalIssues) || 50);
      const rowsToInsert = [];
      const readIssueIds = [];
      for (let i = 1; i <= total; i++) {
        rowsToInsert.push({
          user_id: finalUserId,
          reading_order_slug: orderIdParam,
          issue_sort_order: i,
          is_read: true
        });
        readIssueIds.push(`issue_${i - 1}`);
      }
      await supabaseAdmin.from('user_progress').upsert(rowsToInsert, { onConflict: 'user_id,reading_order_slug,issue_sort_order' });
      return res.json({ success: true, readIssueIds });
    }

    res.status(400).json({ success: false, message: 'Hành động không hợp lệ' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/auth/progress/all - Xóa toàn bộ tiến độ đọc của user hiện tại
router.delete('/progress/all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    if (typeof userId !== 'string' || userId.length <= 20) {
      return res.status(400).json({ success: false, message: 'Tài khoản không hợp lệ' });
    }

    const { error } = await supabaseAdmin
      .from('user_progress')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true, message: 'Đã xóa toàn bộ tiến độ đọc' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Đăng xuất thành công' });
});


// GET /api/auth/reading-list - Lấy danh sách reading orders + tiến độ đọc của user hiện tại
// Trả về: { "/marvel/slug": { path, title, total, completed, percent, lastReadTime } }
router.get('/reading-list', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    if (typeof userId !== 'string' || userId.length <= 20) {
      return res.json({ success: true, data: {} });
    }

    // Lấy tất cả progress của user
    const { data: progressRows } = await supabaseAdmin
      .from('user_progress')
      .select('reading_order_slug, issue_sort_order, updated_at')
      .eq('user_id', userId)
      .eq('is_read', true);

    if (!progressRows || progressRows.length === 0) {
      return res.json({ success: true, data: {} });
    }

    // Nhóm theo slug
    const slugSet = new Set(progressRows.map((r: any) => r.reading_order_slug));
    const slugList = Array.from(slugSet) as string[];

    // Lấy thông tin reading orders
    const { data: orders } = await supabaseAdmin
      .from('reading_orders')
      .select('id, title, slug, direct_slug, universe_slug, total_issues')
      .in('slug', slugList);

    if (!orders) return res.json({ success: true, data: {} });

    // Tính completed count cho mỗi slug
    const completedMap: Record<string, { count: number; lastReadTime: string }> = {};
    progressRows.forEach((r: any) => {
      const slug = r.reading_order_slug;
      if (!completedMap[slug]) {
        completedMap[slug] = { count: 0, lastReadTime: r.updated_at };
      }
      completedMap[slug].count++;
      if (r.updated_at > completedMap[slug].lastReadTime) {
        completedMap[slug].lastReadTime = r.updated_at;
      }
    });

    const result: Record<string, any> = {};
    orders.forEach((order: any) => {
      const slug = order.slug;
      const progress = completedMap[slug];
      if (!progress || progress.count === 0) return;

      const total = order.total_issues || 0;
      const completed = progress.count;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      const path = `/${order.universe_slug}/${order.direct_slug || order.slug}`;

      result[path] = {
        path,
        title: order.title,
        universe: order.universe_slug,
        total,
        completed,
        percent,
        lastReadTime: new Date(progress.lastReadTime).getTime(),
      };
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

