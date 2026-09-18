import { Router } from 'express';
import { supabaseAdmin } from '../database/supabase';

const router = Router();

// GET /api/reading-orders - Lấy danh sách thứ tự đọc kèm bộ lọc
router.get('/', async (req, res) => {
  try {
    const { universe, category, letter, search, sort, limit = 500, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('reading_orders')
      .select(`
        *,
        universes(id, slug, name, accent_color),
        categories(id, slug, name)
      `)
      .eq('is_published', true);

    if (universe) {
      query = query.eq('universe_slug', String(universe));
    }

    if (category) {
      query = query.eq('category_slug', String(category));
    }

    if (letter) {
      const l = String(letter).trim();
      if (l === '#') {
        query = query.or('title.ilike.0%,title.ilike.1%,title.ilike.2%,title.ilike.3%,title.ilike.4%,title.ilike.5%,title.ilike.6%,title.ilike.7%,title.ilike.8%,title.ilike.9%');
      } else {
        query = query.ilike('title', `${l}%`);
      }
      // Khi lọc theo chữ cái, chỉ lấy những bộ đã có tập truyện
      query = query.gt('total_issues', 0);
    }

    if (search) {
      const s = String(search).trim();
      query = query.or(`title.ilike.%${s}%,description.ilike.%${s}%,featured_characters.ilike.%${s}%`);
    }

    // Sắp xếp
    if (sort === 'timeline') {
      query = query
        .order('timeline_order', { ascending: true, nullsFirst: false })
        .order('title', { ascending: true });
    } else {
      query = query.order('title', { ascending: true });
    }

    const lim = Math.min(Number(limit) || 500, 1000);
    const off = Number(offset) || 0;
    query = query.range(off, off + lim - 1);

    const { data: rows = [], error } = await query;
    if (error) {
      throw error;
    }

    // Tính danh sách các chữ cái thực sự có tập truyện
    let lettersQuery = supabaseAdmin
      .from('reading_orders')
      .select('title')
      .eq('is_published', true)
      .gt('total_issues', 0);

    if (universe) {
      lettersQuery = lettersQuery.eq('universe_slug', String(universe));
    }
    if (category) {
      lettersQuery = lettersQuery.eq('category_slug', String(category));
    }

    const { data: titlesData } = await lettersQuery;
    const lettersSet = new Set<string>();
    titlesData?.forEach((r: any) => {
      if (r.title) {
        const firstChar = r.title.trim()[0];
        if (/[0-9]/.test(firstChar)) {
          lettersSet.add('#');
        } else if (/[a-zA-Z]/.test(firstChar)) {
          lettersSet.add(firstChar.toUpperCase());
        }
      }
    });

    const available_letters = Array.from(lettersSet).sort((a, b) => {
      if (a === '#') return -1;
      if (b === '#') return 1;
      return a.localeCompare(b);
    });

    // Format dữ liệu trả về tương thích với giao diện
    const formattedRows = (rows || []).map((ro: any) => ({
      ...ro,
      universe_id: ro.universes?.id || ro.universe_id,
      universe_slug: ro.universe_slug || ro.universes?.slug,
      universe_name: ro.universes?.name || '',
      accent_color: ro.universes?.accent_color || '',
      category_id: ro.categories?.id || ro.category_id,
      category_slug: ro.category_slug || ro.categories?.slug,
      category_name: ro.categories?.name || '',
      issue_count: ro.total_issues || 0
    }));

    res.json({
      success: true,
      data: formattedRows,
      available_letters
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reading-orders/:slug - Lấy chi tiết 1 thứ tự đọc cùng danh sách tập truyện
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const rawSlug = slug.trim();
    const cleanSlug = rawSlug.replace(/-+$/, '');

    const { data: order, error } = await supabaseAdmin
      .from('reading_orders')
      .select(`
        *,
        universes(id, slug, name, accent_color),
        categories(id, slug, name)
      `)
      .or(`slug.eq.${rawSlug},slug.eq.${cleanSlug},direct_slug.eq.${rawSlug},direct_slug.eq.${cleanSlug}`)
      .limit(1)
      .maybeSingle();

    if (error || !order) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thứ tự đọc này' });
      return;
    }

    // Tăng lượt xem (không chặn luồng xử lý)
    supabaseAdmin
      .from('reading_orders')
      .update({ view_count: (order.view_count || 0) + 1 })
      .eq('id', order.id)
      .then(() => {});

    // Lấy danh sách các tập truyện (issues)
    const { data: issues = [] } = await supabaseAdmin
      .from('issues')
      .select('*')
      .eq('reading_order_id', order.id)
      .order('sort_order', { ascending: true });

    res.json({
      success: true,
      data: {
        ...order,
        universe_slug: order.universes?.slug || order.universe_slug,
        universe_name: order.universes?.name || '',
        accent_color: order.universes?.accent_color || '',
        category_slug: order.categories?.slug || order.category_slug,
        category_name: order.categories?.name || '',
        issues: issues || []
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
