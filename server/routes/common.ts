import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { db } from '../database/db';

const router = Router();

// GET /api/universes - Lấy danh sách vũ trụ kèm các danh mục con
router.get('/', (req, res) => {
  try {
    const universes = db.prepare('SELECT * FROM universes ORDER BY sort_order ASC').all() as any[];
    const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all() as any[];

    const result = universes.map(u => ({
      ...u,
      categories: categories.filter(c => c.universe_id === u.id),
    }));

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/faqs - Lấy danh sách câu hỏi thường gặp
router.get('/faqs', (req, res) => {
  try {
    const faqs = db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC').all();
    res.json({ success: true, data: faqs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/search?q=... - Tìm kiếm toàn cục
router.get('/search', (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q || !q.trim()) {
      res.json({ success: true, data: { orders: [], issues: [] } });
      return;
    }

    const term = `%${q.trim()}%`;
    const orders = db.prepare(`
      SELECT ro.id, ro.title, ro.slug, ro.year_published, u.name as universe_name, u.slug as universe_slug
      FROM reading_orders ro
      LEFT JOIN universes u ON ro.universe_id = u.id
      WHERE ro.title LIKE ? OR ro.description LIKE ? OR ro.featured_characters LIKE ?
      LIMIT 15
    `).all(term, term, term);

    const issues = db.prepare(`
      SELECT i.id, i.title, i.read_url, ro.title as order_title, ro.slug as order_slug
      FROM issues i
      JOIN reading_orders ro ON i.reading_order_id = ro.id
      WHERE i.title LIKE ?
      LIMIT 15
    `).all(term);

    res.json({
      success: true,
      data: { orders, issues }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/issue-links - Lấy link đọc công khai cho mọi độc giả (fallback từ assets/issue_links.json)
router.get('/issue-links', (req, res) => {
  try {
    const filePath = path.resolve(process.cwd(), 'assets', 'issue_links.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
    } else {
      res.json({});
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
