import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { db } from '../database/db';
import { adminOnlyMiddleware, AuthRequest } from '../middleware/auth';
import { parseReadingOrderHtml } from '../utils/htmlParser';

const router = Router();

// Tất cả các route bên dưới đều bắt buộc phải là Admin
router.use(adminOnlyMiddleware);

// GET /api/admin/stats - Thống kê tổng quan cho Dashboard
router.get('/stats', (req: AuthRequest, res) => {
  try {
    const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM reading_orders').get() as any).count;
    const totalIssues = (db.prepare('SELECT COUNT(*) as count FROM issues').get() as any).count;
    const totalReadLinks = (db.prepare("SELECT COUNT(*) as count FROM issues WHERE read_url IS NOT NULL AND TRIM(read_url) != ''").get() as any).count;
    const totalUniverses = (db.prepare('SELECT COUNT(*) as count FROM universes').get() as any).count;

    res.json({
      success: true,
      data: {
        totalOrders,
        totalIssues,
        totalReadLinks,
        totalUniverses,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/reading-orders - Tạo mới thứ tự đọc
router.post('/reading-orders', (req: AuthRequest, res) => {
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
      is_published = 1,
    } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: 'Vui lòng nhập tiêu đề thứ tự đọc' });
      return;
    }

    const finalSlug = slug || title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const insert = db.prepare(`
      INSERT INTO reading_orders (
        title, slug, universe_id, category_id, description,
        year_published, featured_characters, previous_event_title, previous_event_slug,
        next_event_title, next_event_slug, cover_image, is_published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      title,
      finalSlug,
      universe_id || null,
      category_id || null,
      description || '',
      year_published || '',
      featured_characters || '',
      previous_event_title || '',
      previous_event_slug || '',
      next_event_title || '',
      next_event_slug || '',
      cover_image || '',
      is_published ? 1 : 0
    );

    res.json({
      success: true,
      message: 'Tạo thứ tự đọc thành công',
      id: Number(result.lastInsertRowid),
      slug: finalSlug,
    });
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ success: false, message: 'Đường dẫn tĩnh (slug) đã tồn tại, vui lòng chọn đường dẫn khác' });
      return;
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/reading-orders/:id - Cập nhật thứ tự đọc
router.put('/reading-orders/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
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
      is_published,
    } = req.body;

    const update = db.prepare(`
      UPDATE reading_orders SET
        title = COALESCE(?, title),
        slug = COALESCE(?, slug),
        universe_id = COALESCE(?, universe_id),
        category_id = COALESCE(?, category_id),
        description = COALESCE(?, description),
        year_published = COALESCE(?, year_published),
        featured_characters = COALESCE(?, featured_characters),
        previous_event_title = COALESCE(?, previous_event_title),
        previous_event_slug = COALESCE(?, previous_event_slug),
        next_event_title = COALESCE(?, next_event_title),
        next_event_slug = COALESCE(?, next_event_slug),
        cover_image = COALESCE(?, cover_image),
        is_published = COALESCE(?, is_published),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(
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
      is_published !== undefined ? (is_published ? 1 : 0) : null,
      Number(id)
    );

    res.json({ success: true, message: 'Cập nhật thứ tự đọc thành công' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/reading-orders/:id - Xóa thứ tự đọc
router.delete('/reading-orders/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM issues WHERE reading_order_id = ?').run(Number(id));
    db.prepare('DELETE FROM reading_orders WHERE id = ?').run(Number(id));

    res.json({ success: true, message: 'Đã xóa thứ tự đọc thành công' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/reading-orders/:id/issues - Thêm một hoặc nhiều tập truyện
router.post('/reading-orders/:id/issues', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { issues } = req.body; // Có thể là object đơn hoặc mảng các object

    const orderExists = db.prepare('SELECT id FROM reading_orders WHERE id = ?').get(Number(id));
    if (!orderExists) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thứ tự đọc' });
      return;
    }

    const maxOrderQuery = db.prepare('SELECT MAX(sort_order) as max_sort FROM issues WHERE reading_order_id = ?');
    let currentMaxSort = (maxOrderQuery.get(Number(id)) as any)?.max_sort || 0;

    const insert = db.prepare(`
      INSERT INTO issues (reading_order_id, tab_type, title, issue_type, year, note, read_url, sort_order, is_noncanon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const issueList = Array.isArray(issues) ? issues : [req.body];
    const insertedIds: number[] = [];

    for (const item of issueList) {
      if (!item.title || !item.title.trim()) continue;
      currentMaxSort += 1;
      const resRun = insert.run(
        Number(id),
        item.tab_type || 'single',
        item.title.trim(),
        item.issue_type || 'ongoing',
        item.year || null,
        item.note || null,
        item.read_url || null,
        item.sort_order !== undefined ? item.sort_order : currentMaxSort,
        item.is_noncanon ? 1 : 0
      );
      insertedIds.push(Number(resRun.lastInsertRowid));
    }

    res.json({
      success: true,
      message: `Đã thêm thành công ${insertedIds.length} tập truyện`,
      insertedIds,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/issues/:id - Chỉnh sửa tập truyện (bao gồm cả link đọc truyện)
router.put('/issues/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, issue_type, year, note, read_url, sort_order, tab_type, is_noncanon } = req.body;

    const update = db.prepare(`
      UPDATE issues SET
        title = COALESCE(?, title),
        issue_type = COALESCE(?, issue_type),
        year = COALESCE(?, year),
        note = COALESCE(?, note),
        read_url = ?,
        sort_order = COALESCE(?, sort_order),
        tab_type = COALESCE(?, tab_type),
        is_noncanon = COALESCE(?, is_noncanon)
      WHERE id = ?
    `);

    update.run(
      title !== undefined ? title : null,
      issue_type !== undefined ? issue_type : null,
      year !== undefined ? year : null,
      note !== undefined ? note : null,
      read_url !== undefined ? read_url : null,
      sort_order !== undefined ? Number(sort_order) : null,
      tab_type !== undefined ? tab_type : null,
      is_noncanon !== undefined ? (is_noncanon ? 1 : 0) : null,
      Number(id)
    );

    res.json({
      success: true,
      message: 'Cập nhật tập truyện thành công',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/issues/:id - Xóa tập truyện
router.delete('/issues/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM issues WHERE id = ?').run(Number(id));
    res.json({ success: true, message: 'Đã xóa tập truyện thành công' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/reading-orders/:id/reorder-issues - Cập nhật vị trí sắp xếp của các tập
router.put('/reading-orders/:id/reorder-issues', (req: AuthRequest, res) => {
  try {
    const { issue_orders } = req.body; // Mảng [{ id: 1, sort_order: 1 }, { id: 2, sort_order: 2 }]
    if (!Array.isArray(issue_orders)) {
      res.status(400).json({ success: false, message: 'Dữ liệu sắp xếp không hợp lệ' });
      return;
    }

    const updateStmt = db.prepare('UPDATE issues SET sort_order = ? WHERE id = ?');
    for (const item of issue_orders) {
      updateStmt.run(Number(item.sort_order), Number(item.id));
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

// POST /api/admin/import-reading-order - Nhập thứ tự đọc đã bóc tách vào Database
router.post('/import-reading-order', (req: AuthRequest, res) => {
  try {
    const { orderData, deleteSourceFile, fileName } = req.body;
    if (!orderData || !orderData.title || !orderData.slug) {
      res.status(400).json({ success: false, message: 'Dữ liệu thứ tự đọc không hợp lệ' });
      return;
    }

    const getUniv = db.prepare('SELECT id FROM universes WHERE slug = ?').get(orderData.universe_slug || 'other') as any;
    const universe_id = getUniv ? getUniv.id : 1;
    const getCat = db.prepare('SELECT id FROM categories WHERE universe_id = ? AND slug = ?').get(universe_id, orderData.category_slug || 'events') as any;
    const category_id = getCat ? getCat.id : null;

    const checkOrder = db.prepare('SELECT id FROM reading_orders WHERE slug = ?').get(orderData.slug) as any;
    let orderId: number;

    if (checkOrder) {
      orderId = checkOrder.id;
      db.prepare(`
        UPDATE reading_orders
        SET title = ?,
            universe_id = ?,
            category_id = ?,
            description = ?,
            year_published = ?,
            featured_characters = ?,
            previous_event_title = ?,
            previous_event_slug = ?,
            next_event_title = ?,
            next_event_slug = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        orderData.title,
        universe_id,
        category_id,
        orderData.description || '',
        orderData.year_published || '',
        orderData.featured_characters || '',
        orderData.previous_event_title || '',
        orderData.previous_event_slug || '',
        orderData.next_event_title || '',
        orderData.next_event_slug || '',
        orderId
      );
    } else {
      const insert = db.prepare(`
        INSERT INTO reading_orders (
          title, slug, universe_id, category_id, description,
          year_published, featured_characters, previous_event_title, previous_event_slug,
          next_event_title, next_event_slug, cover_image, is_published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderData.title,
        orderData.slug,
        universe_id,
        category_id,
        orderData.description || '',
        orderData.year_published || '',
        orderData.featured_characters || '',
        orderData.previous_event_title || '',
        orderData.previous_event_slug || '',
        orderData.next_event_title || '',
        orderData.next_event_slug || '',
        'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=600&auto=format&fit=crop&q=80',
        1
      );
      orderId = Number(insert.lastInsertRowid);
    }

    // Xóa issues cũ và nạp issues mới
    db.prepare('DELETE FROM issues WHERE reading_order_id = ?').run(orderId);
    const insertIssue = db.prepare(`
      INSERT INTO issues (reading_order_id, tab_type, title, issue_type, year, note, is_noncanon, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let idx = 1;
    for (const issue of (orderData.issues || [])) {
      insertIssue.run(
        orderId,
        'single',
        issue.title,
        issue.issue_type || 'ongoing',
        issue.year || null,
        issue.note || null,
        issue.is_noncanon ? 1 : 0,
        idx++
      );
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
      message: `Đã nhập thành công thứ tự đọc [${orderData.title}] với ${(orderData.issues || []).length} tập.`,
      slug: orderData.slug,
      id: orderId
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi khi nhập thứ tự đọc: ' + err.message });
  }
});

export default router;
