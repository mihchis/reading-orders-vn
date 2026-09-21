import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { supabaseAdmin } from '../database/supabase';
import { adminOnlyMiddleware, AuthRequest } from '../middleware/auth';
import { parseReadingOrderHtml } from '../utils/htmlParser';

// Helper: chuyển cleanPath → reading_order slug để query Supabase
// cleanPath ví dụ: /marvel/ultimate-spider-man-reading-order
// Thử match direct_slug hoặc universe_slug+slug
async function findOrderIdByPath(cleanPath: string): Promise<number | null> {
  // Lấy phần cuối đường dẫn làm direct_slug
  const segments = cleanPath.replace(/^\//, '').split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const directSlug = segments[segments.length - 1];
  const universeSlug = segments.length >= 2 ? segments[segments.length - 2] : null;

  // Tìm theo direct_slug trước
  let query = supabaseAdmin
    .from('reading_orders')
    .select('id')
    .eq('direct_slug', directSlug);

  if (universeSlug) {
    query = query.eq('universe_slug', universeSlug);
  }

  const { data } = await query.maybeSingle();
  if (data?.id) return data.id;

  // Fallback: tìm theo slug
  const { data: data2 } = await supabaseAdmin
    .from('reading_orders')
    .select('id')
    .eq('slug', directSlug)
    .maybeSingle();

  return data2?.id || null;
}

const router = Router();

// Tất cả các route bên dưới đều bắt buộc phải là Admin
router.use(adminOnlyMiddleware);

// GET /api/admin/stats - Thống kê tổng quan cho Dashboard
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const [ordersRes, issuesRes, readLinksRes, universesRes] = await Promise.all([
      supabaseAdmin.from('reading_orders').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('issues').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('issues').select('*', { count: 'exact', head: true }).not('read_url', 'is', null).neq('read_url', ''),
      supabaseAdmin.from('universes').select('*', { count: 'exact', head: true })
    ]);

    res.json({
      success: true,
      data: {
        totalOrders: ordersRes.count || 0,
        totalIssues: issuesRes.count || 0,
        totalReadLinks: readLinksRes.count || 0,
        totalUniverses: universesRes.count || 0,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/reading-orders - Danh sách reading orders có phân trang, tìm kiếm & bộ lọc cho Admin
router.get('/reading-orders', async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 25));
    const search = (req.query.search as string || '').trim();
    const universe = req.query.universe as string;
    const category = req.query.category as string;

    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('reading_orders')
      .select(`
        *,
        universes(id, name, slug, accent_color),
        categories(id, name, slug)
      `, { count: 'exact' });

    if (search) {
      query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%,featured_characters.ilike.%${search}%`);
    }

    if (universe) {
      query = query.eq('universe_slug', universe);
    }

    if (category) {
      query = query.eq('category_slug', category);
    }

    query = query.order('id', { ascending: false }).range(offset, offset + limit - 1);

    const { data: rows, count, error } = await query;
    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: rows || [],
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/reading-orders/:id - Chi tiết 1 reading order kèm toàn bộ issues
router.get('/reading-orders/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabaseAdmin
      .from('reading_orders')
      .select(`
        *,
        universes(id, name, slug, accent_color),
        categories(id, name, slug)
      `)
      .eq('id', Number(id))
      .maybeSingle();

    if (error || !order) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thứ tự đọc' });
      return;
    }

    const { data: issues = [] } = await supabaseAdmin
      .from('issues')
      .select('*')
      .eq('reading_order_id', Number(id))
      .order('sort_order', { ascending: true });

    res.json({
      success: true,
      data: {
        ...order,
        issues: issues || []
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users - Danh sách độc giả từ Supabase Auth kèm thống kê tiến độ
router.get('/users', async (req: AuthRequest, res) => {
  try {
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
    if (authErr) throw authErr;

    const { data: progressRows } = await supabaseAdmin
      .from('user_progress')
      .select('user_id');

    const progressCountMap: Record<string, number> = {};
    (progressRows || []).forEach((r: any) => {
      progressCountMap[r.user_id] = (progressCountMap[r.user_id] || 0) + 1;
    });

    const users = (authData.users || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      username: u.user_metadata?.username || u.email?.split('@')[0],
      display_name: u.user_metadata?.display_name || u.user_metadata?.username || 'Độc giả',
      role: u.user_metadata?.role || 'user',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      read_issues_count: progressCountMap[u.id] || 0
    }));

    res.json({
      success: true,
      data: users
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/universes - Danh sách vũ trụ & danh mục
router.get('/universes', async (req: AuthRequest, res) => {
  try {
    const { data: universes = [], error: uErr } = await supabaseAdmin
      .from('universes')
      .select('*')
      .order('sort_order', { ascending: true });

    const { data: categories = [], error: cErr } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (uErr) throw uErr;
    if (cErr) throw cErr;

    const result = (universes || []).map((u: any) => ({
      ...u,
      categories: (categories || []).filter((c: any) => c.universe_id === u.id),
    }));

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/reading-orders - Tạo mới thứ tự đọc
router.post('/reading-orders', async (req: AuthRequest, res) => {
  try {
    const {
      title,
      slug,
      universe_id,
      category_id,
      description,
      year_published,
      featured_characters,
      previous_event_title,
      previous_event_slug,
      next_event_title,
      next_event_slug,
      cover_image,
      is_published = true,
    } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: 'Vui lòng nhập tiêu đề thứ tự đọc' });
      return;
    }

    const finalSlug = slug || title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data: newOrder, error } = await supabaseAdmin
      .from('reading_orders')
      .insert({
        title,
        slug: finalSlug,
        direct_slug: `${finalSlug}-reading-order`,
        universe_id: universe_id || null,
        category_id: category_id || null,
        description: description || '',
        year_published: year_published || '',
        featured_characters: featured_characters || '',
        previous_event_title: previous_event_title || '',
        previous_event_slug: previous_event_slug || '',
        next_event_title: next_event_title || '',
        next_event_slug: next_event_slug || '',
        cover_image: cover_image || '',
        is_published: !!is_published,
      })
      .select('id, slug')
      .single();

    if (error) {
      if (error.message.includes('duplicate key') || error.message.includes('unique')) {
        res.status(400).json({ success: false, message: 'Đường dẫn tĩnh (slug) đã tồn tại, vui lòng chọn đường dẫn khác' });
        return;
      }
      throw error;
    }

    res.json({
      success: true,
      message: 'Tạo thứ tự đọc thành công',
      id: newOrder.id,
      slug: newOrder.slug,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/reading-orders/:id - Cập nhật thứ tự đọc
router.put('/reading-orders/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    const allowedFields = [
      'title', 'slug', 'universe_id', 'category_id', 'description',
      'year_published', 'featured_characters', 'previous_event_title',
      'previous_event_slug', 'next_event_title', 'next_event_slug',
      'cover_image', 'is_published'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updatePayload[field] = body[field];
      }
    }

    const { error } = await supabaseAdmin
      .from('reading_orders')
      .update(updatePayload)
      .eq('id', Number(id));

    if (error) throw error;

    res.json({ success: true, message: 'Cập nhật thứ tự đọc thành công' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/reading-orders/:id - Xóa thứ tự đọc
router.delete('/reading-orders/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('reading_orders')
      .delete()
      .eq('id', Number(id));

    if (error) throw error;

    res.json({ success: true, message: 'Đã xóa thứ tự đọc thành công' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/reading-orders/:id/issues - Thêm một hoặc nhiều tập truyện
router.post('/reading-orders/:id/issues', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { issues } = req.body;

    const { data: orderExists, error: checkErr } = await supabaseAdmin
      .from('reading_orders')
      .select('id')
      .eq('id', Number(id))
      .maybeSingle();

    if (checkErr || !orderExists) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thứ tự đọc' });
      return;
    }

    const { data: lastIssue } = await supabaseAdmin
      .from('issues')
      .select('sort_order')
      .eq('reading_order_id', Number(id))
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    let currentMaxSort = lastIssue?.sort_order || 0;
    const issueList = Array.isArray(issues) ? issues : [req.body];

    const toInsert = [];
    for (const item of issueList) {
      if (!item.title || !item.title.trim()) continue;
      currentMaxSort += 1;
      toInsert.push({
        reading_order_id: Number(id),
        tab_type: item.tab_type || 'single',
        title: item.title.trim(),
        issue_type: item.issue_type || 'ongoing',
        year: item.year || null,
        note: item.note || null,
        read_url: item.read_url || null,
        sort_order: item.sort_order !== undefined ? Number(item.sort_order) : currentMaxSort,
        is_noncanon: !!item.is_noncanon
      });
    }

    if (toInsert.length === 0) {
      res.status(400).json({ success: false, message: 'Không có tập truyện hợp lệ nào để thêm' });
      return;
    }

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('issues')
      .insert(toInsert)
      .select('id');

    if (insErr) throw insErr;

    // Cập nhật lại total_issues
    const { count: totalCount } = await supabaseAdmin
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('reading_order_id', Number(id));

    await supabaseAdmin
      .from('reading_orders')
      .update({ total_issues: totalCount || 0 })
      .eq('id', Number(id));

    res.json({
      success: true,
      message: `Đã thêm thành công ${inserted?.length || 0} tập truyện`,
      insertedIds: (inserted || []).map((i: any) => i.id),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/issues/:id - Chỉnh sửa tập truyện
router.put('/issues/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, issue_type, year, note, read_url, sort_order, tab_type, is_noncanon } = req.body;

    const payload: Record<string, any> = {};
    if (title !== undefined) payload.title = title;
    if (issue_type !== undefined) payload.issue_type = issue_type;
    if (year !== undefined) payload.year = year;
    if (note !== undefined) payload.note = note;
    if (read_url !== undefined) payload.read_url = read_url;
    if (sort_order !== undefined) payload.sort_order = Number(sort_order);
    if (tab_type !== undefined) payload.tab_type = tab_type;
    if (is_noncanon !== undefined) payload.is_noncanon = !!is_noncanon;

    const { error } = await supabaseAdmin
      .from('issues')
      .update(payload)
      .eq('id', Number(id));

    if (error) throw error;

    res.json({
      success: true,
      message: 'Cập nhật tập truyện thành công',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/issues/:id - Xóa tập truyện
router.delete('/issues/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data: issue } = await supabaseAdmin
      .from('issues')
      .select('reading_order_id')
      .eq('id', Number(id))
      .maybeSingle();

    const { error } = await supabaseAdmin.from('issues').delete().eq('id', Number(id));
    if (error) throw error;

    if (issue?.reading_order_id) {
      const { count: totalCount } = await supabaseAdmin
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .eq('reading_order_id', issue.reading_order_id);

      await supabaseAdmin
        .from('reading_orders')
        .update({ total_issues: totalCount || 0 })
        .eq('id', issue.reading_order_id);
    }

    res.json({ success: true, message: 'Đã xóa tập truyện thành công' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/reading-orders/:id/reorder-issues - Cập nhật vị trí sắp xếp của các tập
router.put('/reading-orders/:id/reorder-issues', async (req: AuthRequest, res) => {
  try {
    const { issue_orders } = req.body;
    if (!Array.isArray(issue_orders)) {
      res.status(400).json({ success: false, message: 'Dữ liệu sắp xếp không hợp lệ' });
      return;
    }

    for (const item of issue_orders) {
      await supabaseAdmin
        .from('issues')
        .update({ sort_order: Number(item.sort_order) })
        .eq('id', Number(item.id));
    }

    res.json({ success: true, message: 'Đã lưu thứ tự các tập thành công' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/parse-html - Bóc tách nội dung HTML
router.post('/parse-html', (req: AuthRequest, res) => {
  try {
    const { htmlContent, fileName } = req.body;
    if (!htmlContent) {
      res.status(400).json({ success: false, message: 'Thiếu nội dung HTML cần bóc tách' });
      return;
    }

    const parsed = parseReadingOrderHtml(htmlContent, fileName);
    res.json({
      success: true,
      data: parsed
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Không thể bóc tách HTML: ' + err.message });
  }
});

// POST /api/admin/import-reading-order - Nhập thứ tự đọc đã bóc tách vào Supabase Cloud
router.post('/import-reading-order', async (req: AuthRequest, res) => {
  try {
    const { orderData, deleteSourceFile, fileName } = req.body;
    if (!orderData || !orderData.title || !orderData.slug) {
      res.status(400).json({ success: false, message: 'Dữ liệu thứ tự đọc không hợp lệ' });
      return;
    }

    const { data: univ } = await supabaseAdmin
      .from('universes')
      .select('id')
      .eq('slug', orderData.universe_slug || 'other')
      .maybeSingle();
    const universe_id = univ?.id || 1;

    const { data: cat } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('universe_id', universe_id)
      .eq('slug', orderData.category_slug || 'events')
      .maybeSingle();
    const category_id = cat?.id || null;

    // Upsert reading_orders
    const payload = {
      title: orderData.title,
      slug: orderData.slug,
      direct_slug: `${orderData.slug}-reading-order`,
      universe_id,
      category_id,
      universe_slug: orderData.universe_slug || 'other',
      category_slug: orderData.category_slug || 'events',
      description: orderData.description || '',
      year_published: orderData.year_published || '',
      featured_characters: orderData.featured_characters || '',
      previous_event_title: orderData.previous_event_title || '',
      previous_event_slug: orderData.previous_event_slug || '',
      next_event_title: orderData.next_event_title || '',
      next_event_slug: orderData.next_event_slug || '',
      cover_image: orderData.cover_image || 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=600&auto=format&fit=crop&q=80',
      is_published: true,
      total_issues: (orderData.issues || []).length,
      updated_at: new Date().toISOString()
    };

    const { data: savedOrder, error: upsertErr } = await supabaseAdmin
      .from('reading_orders')
      .upsert(payload, { onConflict: 'slug' })
      .select('id')
      .single();

    if (upsertErr) throw upsertErr;
    const orderId = savedOrder.id;

    // Xóa issues cũ của order này và nạp lại
    await supabaseAdmin.from('issues').delete().eq('reading_order_id', orderId);

    const issuesToInsert = (orderData.issues || []).map((issue: any, index: number) => ({
      reading_order_id: orderId,
      tab_type: 'single',
      title: issue.title,
      issue_type: issue.issue_type || 'ongoing',
      year: issue.year || null,
      note: issue.note || null,
      is_noncanon: !!issue.is_noncanon,
      sort_order: index + 1
    }));

    if (issuesToInsert.length > 0) {
      const batchSize = 200;
      for (let i = 0; i < issuesToInsert.length; i += batchSize) {
        await supabaseAdmin.from('issues').insert(issuesToInsert.slice(i, i + batchSize));
      }
    }

    // Xóa file nguồn nếu có yêu cầu
    if (deleteSourceFile && fileName) {
      const p = path.resolve(process.cwd(), 'tham_khao', path.basename(fileName));
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    }

    res.json({
      success: true,
      message: `Đã nhập thành công thứ tự đọc [${orderData.title}] với ${(orderData.issues || []).length} tập vào Supabase Cloud.`,
      slug: orderData.slug,
      id: orderId
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi khi nhập thứ tự đọc: ' + err.message });
  }
});

// GET /api/admin/issue-links - Lấy danh sách link đọc từ Supabase
router.get('/issue-links', async (req: AuthRequest, res) => {
  try {
    const orderPath = req.query.path as string;

    if (orderPath) {
      // Lấy links cho 1 trang cụ thể
      const clean = orderPath.replace(/\/index\.html$/i, '').replace(/\/+$/, '') || '/';
      const orderId = await findOrderIdByPath(clean);
      if (!orderId) {
        return res.json({ success: true, data: {} });
      }

      const { data: issues } = await supabaseAdmin
        .from('issues')
        .select('sort_order, read_url')
        .eq('reading_order_id', orderId)
        .not('read_url', 'is', null)
        .neq('read_url', '')
        .order('sort_order', { ascending: true });

      const linkMap: Record<string, string> = {};
      (issues || []).forEach((issue: any) => {
        // sort_order là 1-based, issueId frontend là issue_N (0-based)
        linkMap[`issue_${issue.sort_order - 1}`] = issue.read_url;
      });

      return res.json({ success: true, data: linkMap });
    }

    // Lấy toàn bộ links, nhóm theo path
    const { data: orders } = await supabaseAdmin
      .from('reading_orders')
      .select('id, universe_slug, direct_slug');

    const { data: issues } = await supabaseAdmin
      .from('issues')
      .select('reading_order_id, sort_order, read_url')
      .not('read_url', 'is', null)
      .neq('read_url', '');

    const allLinks: Record<string, Record<string, string>> = {};
    const orderMap: Record<number, { universe_slug: string; direct_slug: string }> = {};
    (orders || []).forEach((o: any) => {
      orderMap[o.id] = { universe_slug: o.universe_slug, direct_slug: o.direct_slug };
    });

    (issues || []).forEach((issue: any) => {
      const order = orderMap[issue.reading_order_id];
      if (!order) return;
      const cleanPath = `/${order.universe_slug}/${order.direct_slug}`;
      if (!allLinks[cleanPath]) allLinks[cleanPath] = {};
      allLinks[cleanPath][`issue_${issue.sort_order - 1}`] = issue.read_url;
    });

    res.json({ success: true, data: allLinks });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/issue-links - Lưu link đọc vào Supabase (issues.read_url)
router.post('/issue-links', async (req: AuthRequest, res) => {
  try {
    const { path: orderPath, issueId, link } = req.body;
    if (!orderPath || !issueId) {
      res.status(400).json({ success: false, message: 'Thiếu path hoặc issueId' });
      return;
    }

    const clean = orderPath.replace(/\/index\.html$/i, '').replace(/\/+$/, '') || '/';

    // Tìm reading order từ path
    const orderId = await findOrderIdByPath(clean);
    if (!orderId) {
      res.status(404).json({ success: false, message: `Không tìm thấy reading order cho path: ${clean}` });
      return;
    }

    // Chuyển issueId (issue_N, 0-based) sang sort_order (1-based)
    const issueMatch = String(issueId).match(/^(?:issue_|tpb_)?(\d+)/);
    if (!issueMatch) {
      res.status(400).json({ success: false, message: `issueId không hợp lệ: ${issueId}` });
      return;
    }
    const sortOrder = parseInt(issueMatch[1], 10) + 1;
    const cleanLink = link && String(link).trim() ? String(link).trim() : null;

    // Cập nhật read_url trong bảng issues
    const { error } = await supabaseAdmin
      .from('issues')
      .update({ read_url: cleanLink })
      .eq('reading_order_id', orderId)
      .eq('sort_order', sortOrder);

    if (error) throw error;

    res.json({
      success: true,
      message: cleanLink
        ? 'Đã lưu link đọc vào Supabase thành công!'
        : 'Đã xóa link đọc khỏi Supabase',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi khi lưu link: ' + err.message });
  }
});

export default router;

