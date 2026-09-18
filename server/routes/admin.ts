import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { supabaseAdmin } from '../database/supabase';
import { adminOnlyMiddleware, AuthRequest } from '../middleware/auth';
import { parseReadingOrderHtml } from '../utils/htmlParser';

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

// GET /api/admin/issue-links - Lấy danh sách link đọc theo trang hoặc toàn bộ
router.get('/issue-links', (req: AuthRequest, res) => {
  try {
    const filePath = path.resolve(process.cwd(), 'assets', 'issue_links.json');
    let allLinks: Record<string, any> = {};
    if (fs.existsSync(filePath)) {
      try {
        allLinks = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        allLinks = {};
      }
    }

    const orderPath = req.query.path as string;
    if (orderPath) {
      const clean = orderPath.replace(/\/index\.html$/i, '').replace(/\/+$/, '') || '/';
      return res.json({ success: true, data: allLinks[clean] || {} });
    }

    res.json({ success: true, data: allLinks });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/issue-links - Lưu link đọc của tập vào assets/issue_links.json (dùng khi deploy Vercel)
router.post('/issue-links', (req: AuthRequest, res) => {
  try {
    const { path: orderPath, issueId, link, links } = req.body;
    if (!orderPath) {
      res.status(400).json({ success: false, message: 'Thiếu đường dẫn bài viết (path)' });
      return;
    }

    const clean = orderPath.replace(/\/index\.html$/i, '').replace(/\/+$/, '') || '/';
    const filePath = path.resolve(process.cwd(), 'assets', 'issue_links.json');
    const dataPath = path.resolve(process.cwd(), 'data', 'issue_links.json');

    let allLinks: Record<string, Record<string, string>> = {};
    if (fs.existsSync(filePath)) {
      try {
        allLinks = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        allLinks = {};
      }
    }

    if (!allLinks[clean]) {
      allLinks[clean] = {};
    }

    if (links && typeof links === 'object') {
      allLinks[clean] = links;
    } else if (issueId) {
      if (link && String(link).trim()) {
        allLinks[clean][issueId] = String(link).trim();
      } else {
        delete allLinks[clean][issueId];
      }
    }

    // Nếu trang đó không còn link nào, dọn dẹp key
    if (Object.keys(allLinks[clean]).length === 0) {
      delete allLinks[clean];
    }

    const jsonStr = JSON.stringify(allLinks, null, 2);
    fs.writeFileSync(filePath, jsonStr, 'utf8');

    try {
      fs.writeFileSync(dataPath, jsonStr, 'utf8');
    } catch (e) {}

    res.json({
      success: true,
      message: 'Đã lưu link đọc vào assets/issue_links.json thành công!',
      data: allLinks[clean] || {}
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi khi lưu link: ' + err.message });
  }
});

export default router;

