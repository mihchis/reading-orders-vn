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

// GET /api/issue-links - Lấy link đọc công khai từ Supabase cho mọi độc giả
// Trả về: { "/marvel/slug": { "issue_0": "url", ... } }
router.get('/issue-links', async (req, res) => {
  try {
    const { data: orders } = await supabaseAdmin
      .from('reading_orders')
      .select('id, universe_slug, direct_slug, slug');

    const { data: issues } = await supabaseAdmin
      .from('issues')
      .select('reading_order_id, sort_order, read_url')
      .not('read_url', 'is', null)
      .neq('read_url', '');

    const orderMap: Record<number, { universe_slug: string; direct_slug: string }> = {};
    (orders || []).forEach((o: any) => {
      orderMap[o.id] = {
        universe_slug: o.universe_slug,
        direct_slug: o.direct_slug || o.slug,
      };
    });

    const allLinks: Record<string, Record<string, string>> = {};
    (issues || []).forEach((issue: any) => {
      const order = orderMap[issue.reading_order_id];
      if (!order) return;
      const cleanPath = `/${order.universe_slug}/${order.direct_slug}`;
      if (!allLinks[cleanPath]) allLinks[cleanPath] = {};
      // sort_order là 1-based → issue_N (0-based)
      allLinks[cleanPath][`issue_${issue.sort_order - 1}`] = issue.read_url;
    });

    res.json(allLinks);
  } catch (err: any) {
    res.status(500).json({});
  }
});

export default router;

