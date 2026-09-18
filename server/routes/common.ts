import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { supabaseAdmin } from '../database/supabase';

const router = Router();

// GET /api - Lấy danh sách vũ trụ kèm các danh mục con
router.get('/', async (req, res) => {
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

// GET /api/faqs - Lấy danh sách câu hỏi thường gặp
router.get('/faqs', async (req, res) => {
  try {
    const { data: faqs = [], error } = await supabaseAdmin
      .from('faqs')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data: faqs || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/search?q=... - Tìm kiếm toàn cục
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q || !q.trim()) {
      res.json({ success: true, data: { orders: [], issues: [] } });
      return;
    }

    const term = q.trim();

    // Tìm kiếm reading orders
    const { data: orders = [] } = await supabaseAdmin
      .from('reading_orders')
      .select('id, title, slug, year_published, universe_slug')
      .or(`title.ilike.%${term}%,description.ilike.%${term}%,featured_characters.ilike.%${term}%`)
      .limit(15);

    // Tìm kiếm issues
    const { data: rawIssues = [] } = await supabaseAdmin
      .from('issues')
      .select(`
        id,
        title,
        read_url,
        reading_orders (
          title,
          slug
        )
      `)
      .ilike('title', `%${term}%`)
      .limit(15);

    const formattedIssues = (rawIssues || []).map((i: any) => ({
      id: i.id,
      title: i.title,
      read_url: i.read_url,
      order_title: i.reading_orders?.title || '',
      order_slug: i.reading_orders?.slug || ''
    }));

    res.json({
      success: true,
      data: {
        orders: orders || [],
        issues: formattedIssues
      }
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
