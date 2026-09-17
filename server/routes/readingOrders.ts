import { Router } from 'express';
import { db } from '../database/db';

const router = Router();

// GET /api/reading-orders - Lấy danh sách thứ tự đọc kèm bộ lọc
router.get('/', (req, res) => {
  try {
    const { universe, category, letter, search, sort, limit = 500, offset = 0 } = req.query;

    let sql = `
      SELECT 
        ro.id, ro.slug, ro.title, ro.description, ro.year_published,
        ro.featured_characters, ro.previous_event_title, ro.previous_event_slug,
        ro.next_event_title, ro.next_event_slug, ro.cover_image, ro.is_published,
        ro.timeline_order,
        ro.created_at, ro.updated_at,
        u.id as universe_id, u.slug as universe_slug, u.name as universe_name, u.accent_color,
        c.id as category_id, c.slug as category_slug, c.name as category_name,
        (SELECT COUNT(*) FROM issues WHERE reading_order_id = ro.id AND issue_type != 'comment') as issue_count
      FROM reading_orders ro
      LEFT JOIN universes u ON ro.universe_id = u.id
      LEFT JOIN categories c ON ro.category_id = c.id
      WHERE ro.is_published = 1
    `;

    const params: any[] = [];

    if (universe) {
      sql += ` AND u.slug = ?`;
      params.push(universe);
    }

    if (category) {
      sql += ` AND c.slug = ?`;
      params.push(category);
    }

    if (letter) {
      if (letter === '#') {
        sql += ` AND ro.title GLOB '[0-9]*'`;
      } else {
        sql += ` AND ro.title LIKE ?`;
        params.push(`${letter}%`);
      }
      // Sắp xếp / lọc theo chữ cái chỉ hoạt động với các bộ đã có tập truyện
      sql += ` AND (SELECT COUNT(*) FROM issues WHERE reading_order_id = ro.id AND issue_type != 'comment') > 0`;
    }

    if (search) {
      sql += ` AND (ro.title LIKE ? OR ro.description LIKE ? OR ro.featured_characters LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    // Sắp xếp: Nếu sort=timeline thì xếp theo dòng thời gian chuẩn, ngược lại ưu tiên bộ đã có tập truyện rồi theo bảng chữ cái
    if (sort === 'timeline') {
      sql += ` ORDER BY (CASE WHEN ro.timeline_order IS NOT NULL THEN 0 ELSE 1 END) ASC, ro.timeline_order ASC, ro.title ASC LIMIT ? OFFSET ?`;
    } else {
      sql += ` ORDER BY (CASE WHEN (SELECT COUNT(*) FROM issues WHERE reading_order_id = ro.id AND issue_type != 'comment') > 0 THEN 0 ELSE 1 END) ASC, ro.title ASC LIMIT ? OFFSET ?`;
    }
    params.push(Number(limit), Number(offset));

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);

    // Tính danh sách các chữ cái thực sự có tập truyện
    let lettersSql = `
      SELECT DISTINCT 
        CASE 
          WHEN ro.title GLOB '[0-9]*' THEN '#'
          ELSE UPPER(SUBSTR(ro.title, 1, 1))
        END as letter
      FROM reading_orders ro
      LEFT JOIN universes u ON ro.universe_id = u.id
      LEFT JOIN categories c ON ro.category_id = c.id
      WHERE ro.is_published = 1
        AND (SELECT COUNT(*) FROM issues WHERE reading_order_id = ro.id AND issue_type != 'comment') > 0
    `;
    const lettersParams: any[] = [];
    if (universe) {
      lettersSql += ` AND u.slug = ?`;
      lettersParams.push(universe);
    }
    if (category) {
      lettersSql += ` AND c.slug = ?`;
      lettersParams.push(category);
    }
    const availableLettersRows = db.prepare(lettersSql).all(...lettersParams) as any[];
    const available_letters = availableLettersRows.map(r => r.letter);

    res.json({
      success: true,
      data: rows,
      available_letters
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reading-orders/:slug - Lấy chi tiết 1 thứ tự đọc cùng danh sách tập truyện
router.get('/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const rawSlug = slug.trim();
    const cleanSlug = rawSlug.replace(/-+$/, '');

    const orderQuery = db.prepare(`
      SELECT 
        ro.*,
        u.slug as universe_slug, u.name as universe_name, u.accent_color,
        c.slug as category_slug, c.name as category_name
      FROM reading_orders ro
      LEFT JOIN universes u ON ro.universe_id = u.id
      LEFT JOIN categories c ON ro.category_id = c.id
      WHERE ro.slug = ? OR ro.slug = ?
    `);

    const order = orderQuery.get(rawSlug, cleanSlug) as any;
    if (!order) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thứ tự đọc này' });
      return;
    }

    // Tăng lượt xem
    db.prepare('UPDATE reading_orders SET view_count = view_count + 1 WHERE id = ?').run(order.id);

    // Lấy danh sách các tập truyện (issues)
    const issuesQuery = db.prepare(`
      SELECT * FROM issues
      WHERE reading_order_id = ?
      ORDER BY tab_type ASC, sort_order ASC, id ASC
    `);
    const issues = issuesQuery.all(order.id);

    res.json({
      success: true,
      data: {
        ...order,
        issues,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
