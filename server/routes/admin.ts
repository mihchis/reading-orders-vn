import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { supabaseAdmin } from '../database/supabase';
import { adminOnlyMiddleware, AuthRequest } from '../middleware/auth';
import { parseReadingOrderHtml } from '../utils/htmlParser';

// Danh sách các reading orders đang ở trạng thái Coming Soon (Chưa có danh sách tập)
export const COMING_SOON_SLUGS = new Set([
  'absolute-universe',
  'agatha-harkness',
  'clayface',
  'cyborg-superman',
  'dc-all-in',
  'dc-k-o',
  'hobgoblin',
  'imperial',
  'invincible',
  'jeff-the-land-shark',
  'malekith',
  'marvel-master-reading-order-part-15',
  'one-world-under-doom',
  'peacemaker',
  'red-skull',
  'reverse-flash',
  'scarecrow',
  'scorpion',
  'the-atom',
  'the-leader',
  'the-mandarin',
  'the-massive-verse',
  'the-titans',
  'ultimate-universe',
  'winter-soldier',
  'x-men-age-of-revelation'
]);

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

// Helper: tìm file HTML trên đĩa dựa vào request path hoặc slug
function resolveHtmlPath(reqPath: string): string | null {
  const rootDir = process.cwd();
  const clean = reqPath.replace(/\/index\.html$/i, '').replace(/\/+$/, '').replace(/^\//, '');

  const p1 = path.join(rootDir, clean, 'index.html');
  if (fs.existsSync(p1)) return p1;

  const p2 = path.join(rootDir, clean + '.html');
  if (fs.existsSync(p2)) return p2;

  const p3 = path.join(rootDir, clean);
  if (fs.existsSync(p3) && fs.statSync(p3).isFile()) return p3;

  // Nếu không thấy, tìm kiếm trong các thư mục marvel, dc, other theo slug
  const slug = clean.split('/').pop() || clean;
  const searchDirs = ['marvel', 'dc', 'other'];
  for (const sDir of searchDirs) {
    const baseDir = path.join(rootDir, sDir);
    if (!fs.existsSync(baseDir)) continue;
    try {
      const subdirs = fs.readdirSync(baseDir, { withFileTypes: true });
      for (const sub of subdirs) {
        if (sub.isDirectory()) {
          const cand = path.join(baseDir, sub.name, slug, 'index.html');
          if (fs.existsSync(cand)) return cand;
          const candDirect = path.join(baseDir, slug, 'index.html');
          if (fs.existsSync(candDirect)) return candDirect;
        }
      }
    } catch {}
  }

  return null;
}

// Helper: bóc tách HTML danh sách tập lẻ thành các object có cấu trúc
function parseSingleIssuesHtml(html: string): any[] {
  const panelMatch = html.match(/<div id="panel-(?:reading-order-1|[^"]+)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i)
    || html.match(/<div id="panel-reading-order-1"[^>]*>([\s\S]*?)<\/div>/i);
  if (!panelMatch) return [];

  let content = panelMatch[1];
  const textMatch = content.match(/<div class="x-text x-content"[^>]*>([\s\S]*?)<\/div>/i);
  if (textMatch) content = textMatch[1];

  const pTags = content.match(/<p[\s\S]*?<\/p>/gi) || [content];
  const items: any[] = [];

  pTags.forEach(p => {
    // 1. Giai đoạn (Phase header)
    if (p.includes('#0066aa') || /^(?:giai đoạn|phase)/i.test(p.replace(/<[^>]+>/g, '').trim())) {
      if (p.includes('<br')) {
        const parts = p.split(/<br\s*\/?>/i);
        const titlePart = parts[0].replace(/<[^>]+>/g, '').trim();
        const notePart = parts.slice(1).join(' ').replace(/<[^>]+>/g, '').trim();
        items.push({ type: 'phase', title: titlePart, year: '', note: notePart, link: '' });
        return;
      } else {
        const title = p.replace(/<[^>]+>/g, '').trim();
        if (title) {
          items.push({ type: 'phase', title, year: '', note: '', link: '' });
          return;
        }
      }
    }

    // 2. Ghi chú thuần túy cả đoạn (Standalone Note paragraph)
    if (!p.includes('<br') && (/^\s*<p>\s*<em>[\s\S]*?<\/em>\s*<\/p>\s*$/i.test(p) || /^\s*<p>\s*<span[^>]*style="[^"]*color:\s*(?:#0000ff|blue)[^"]*"[^>]*>[\s\S]*?<\/span>\s*<\/p>\s*$/i.test(p) || /^(?:ghi chú|lưu ý|note):/i.test(p.replace(/<[^>]+>/g, '').trim()))) {
      const text = p.replace(/<[^>]+>/g, '').trim();
      if (text) {
        items.push({ type: 'note', title: text, year: '', note: '', link: '' });
        return;
      }
    }

    // 3. Tách từng dòng theo <br />
    const lines = p.split(/<br\s*\/?>/i);
    lines.forEach(line => {
      const cleanHtml = line.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '').trim();
      if (!cleanHtml) return;

      let type = 'ongoing';
      if (cleanHtml.includes('#008000') || cleanHtml.includes('green')) {
        type = 'mini';
      } else if (cleanHtml.includes('#ff0000') || cleanHtml.includes('red') || /one-shot/i.test(cleanHtml)) {
        type = 'oneshot';
      }

      // Trích xuất link đọc nếu có sẵn thẻ <a>
      const aMatch = cleanHtml.match(/<a[^>]*href="([^"]+)"[^>]*>/i);
      const link = aMatch ? aMatch[1] : '';

      // Tách ghi chú nếu có (trong thẻ span màu xanh dương #0000ff hoặc <em>)
      let note = '';
      let remainingHtml = cleanHtml;
      const blueNoteMatch = cleanHtml.match(/<span[^>]*style="[^"]*color:\s*(?:#0000ff|blue)[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const emNoteMatch = cleanHtml.match(/<em>([\s\S]*?)<\/em>/i);

      if (blueNoteMatch) {
        note = blueNoteMatch[1].replace(/<[^>]+>/g, '').trim().replace(/^\((.*)\)$/, '$1').trim();
        remainingHtml = remainingHtml.replace(blueNoteMatch[0], '');
      } else if (emNoteMatch && !cleanHtml.startsWith('<em>')) {
        note = emNoteMatch[1].replace(/<[^>]+>/g, '').trim().replace(/^\((.*)\)$/, '$1').trim();
        remainingHtml = remainingHtml.replace(emNoteMatch[0], '');
      }

      // Tách tên và năm từ remainingHtml
      const rawText = remainingHtml.replace(/<[^>]+>/g, '').trim().replace(/[-–—\s]+$/, '');
      if (!rawText && !note) return;

      const yearMatch = rawText.match(/\(([^)]+)\)$/);
      let title = rawText;
      let year = '';
      if (yearMatch) {
        year = yearMatch[1];
        title = rawText.replace(/\s*\([^)]+\)$/, '').trim();
      }

      // Nếu chỉ có ghi chú thuần túy
      if (!title && note) {
        type = 'note';
        title = note;
        note = '';
      }

      items.push({ type, title, year, note, link });
    });
  });

  return items;
}

// Helper: bóc tách HTML TPBs thành các object có cấu trúc
function parseTpbHtml(html: string): any[] {
  const panelMatch = html.match(/<div id="panel-(?:reading-order-2|[^"]+)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i)
    || html.match(/<div id="panel-reading-order-2"[^>]*>([\s\S]*?)<\/div>/i);
  if (!panelMatch) return [];

  let content = panelMatch[1];
  const textMatch = content.match(/<div class="x-text x-content"[^>]*>([\s\S]*?)<\/div>/i);
  if (textMatch) content = textMatch[1];

  const pTags = content.match(/<p[\s\S]*?<\/p>/gi) || [];
  const tpbs: any[] = [];
  let currentTpb: any = null;

  pTags.forEach(p => {
    const text = p.replace(/<[^>]+>/g, '').trim();
    if (!text) return;

    if (text.startsWith('•') || text.includes('Thu thập:') || text.includes('Collects:')) {
      const subIssues = text.replace(/^[•\s]+/, '').split(/<br\s*\/?>/i).map(s => s.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
      if (currentTpb) {
        currentTpb.subIssues = currentTpb.subIssues.concat(subIssues);
        tpbs.push(currentTpb);
        currentTpb = null;
      } else {
        tpbs.push({ title: 'Tập tổng hợp', buyLink: '', subIssues });
      }
    } else {
      if (currentTpb) tpbs.push(currentTpb);
      const a = p.match(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/i);
      currentTpb = {
        title: a ? a[2].replace(/<[^>]+>/g, '').trim() : text,
        buyLink: a ? a[1] : '',
        subIssues: []
      };
    }
  });

  if (currentTpb) tpbs.push(currentTpb);
  return tpbs;
}

// Helper: chuyển đổi danh sách items có cấu trúc thành mã HTML chuẩn trang web
function serializeItemsToHtml(items: any[]): string {
  let html = '<div class="x-text x-content" style="padding: 1.5rem 30px; text-align: left;">\n';
  let openP = false;

  items.forEach(item => {
    const type = item.type || 'ongoing';
    const title = (item.title || '').trim();
    const yearStr = item.year && item.year.trim() ? ` (${item.year.trim()})` : '';
    const noteStr = item.note && item.note.trim() ? ` <span style="color: #0000ff;"><em>(${item.note.trim()})</em></span>` : '';

    if (type === 'phase') {
      if (openP) { html += '</p>\n'; openP = false; }
      const phaseNote = item.note && item.note.trim() ? `<br />\n  <span style="color: #666; font-size: 0.9em;"><em>${item.note.trim()}</em></span>` : '';
      html += `  <p><span style="color: #0066aa;"><strong>${title}</strong></span>${phaseNote}</p>\n`;
    } else if (type === 'note') {
      if (openP) { html += '</p>\n'; openP = false; }
      html += `  <p><span style="color: #0000ff;"><em>${title}</em></span></p>\n`;
    } else {
      let formattedLine = '';
      if (type === 'mini') {
        formattedLine = `<span style="color: #008000;">${title}</span>${yearStr}${noteStr}`;
      } else if (type === 'oneshot') {
        formattedLine = `<span style="color: #ff0000;">${title}</span>${yearStr}${noteStr}`;
      } else {
        formattedLine = `${title}${yearStr}${noteStr}`;
      }

      if (!openP) {
        html += `  <p>${formattedLine}`;
        openP = true;
      } else {
        html += `<br />\n  ${formattedLine}`;
      }
    }
  });

  if (openP) html += '</p>\n';
  html += '</div>';
  return html;
}

// Helper: chuyển đổi danh sách TPBs có cấu trúc thành HTML chuẩn
function serializeTpbToHtml(tpbs: any[]): string {
  let html = '<div class="x-text x-content" style="padding: 1.5rem 30px; text-align: left;">\n';
  tpbs.forEach(tpb => {
    const title = (tpb.title || '').trim();
    const buyLink = (tpb.buyLink || '').trim();
    let subIssues = Array.isArray(tpb.subIssues) ? tpb.subIssues : (tpb.subIssues ? String(tpb.subIssues).split('\n') : []);
    subIssues = subIssues.map((s: string) => s.trim()).filter(Boolean);

    html += '  <p>';
    if (buyLink) {
      html += `<a href="${buyLink}" target="_blank" rel="noopener"><strong>${title}</strong></a>`;
    } else {
      html += `<strong>${title}</strong>`;
    }
    if (subIssues.length > 0) {
      html += '<br />\n';
      html += subIssues.map((s: string) => `  • ${s}`).join('<br />\n');
    }
    html += '</p>\n';
  });
  html += '</div>';
  return html;
}

const router = Router();

// GET /api/admin/reading-order-content - Cho phép đọc nội dung công khai để nạp vào form biên tập
router.get('/reading-order-content', async (req, res) => {
  try {
    const orderPath = (req.query.path as string || '').trim();
    if (!orderPath) {
      res.status(400).json({ success: false, message: 'Thiếu tham số path' });
      return;
    }

    const filePath = resolveHtmlPath(orderPath);
    if (!filePath) {
      res.status(404).json({ success: false, message: `Không tìm thấy file HTML cho: ${orderPath}` });
      return;
    }

    const html = fs.readFileSync(filePath, 'utf8');

    // Trích xuất tiêu đề
    const titleMatch = html.match(/<h2[^>]*class="[^"]*h-custom-headline[^"]*"[^>]*>[\s\S]*?<span><strong>(.*?)<\/strong><\/span>/i)
      || html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/ - Comic Book Reading Orders.*$/i, '').trim() : '';

    // Bóc tách có cấu trúc danh sách tập lẻ và TPBs
    const parsedItems = parseSingleIssuesHtml(html);
    const parsedTpbs = parseTpbHtml(html);

    // Trích xuất counter (hoặc tự tính từ parsedItems)
    const counterMatch = html.match(/data-x-element-counter="[^"]*?&quot;to&quot;:&quot;(\d+)&quot;/i);
    const calculatedCount = parsedItems.filter(it => it.type !== 'phase' && it.type !== 'note').length;
    const counterTo = counterMatch ? parseInt(counterMatch[1], 10) : calculatedCount;

    // Trích xuất nội dung Tab 1 (Từng tập truyện)
    const panel1Match = html.match(/<div id="panel-(?:reading-order-1|[^"]+)"[^>]*class="[^"]*x-tabs-panel[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i)
      || html.match(/<div id="panel-reading-order-1"[^>]*>([\s\S]*?)<\/div>/i);
    let singleIssuesHtml = '';
    if (panel1Match) {
      const textMatch = panel1Match[1].match(/<div class="x-text x-content"[^>]*>([\s\S]*?)<\/div>/i);
      singleIssuesHtml = textMatch ? textMatch[1].trim() : panel1Match[1].trim();
    }

    // Trích xuất nội dung Tab 2 (TPBs)
    const panel2Match = html.match(/<div id="panel-(?:reading-order-2|[^"]+)"[^>]*class="[^"]*x-tabs-panel[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i)
      || html.match(/<div id="panel-reading-order-2"[^>]*>([\s\S]*?)<\/div>/i);
    let tpbHtml = '';
    if (panel2Match) {
      const textMatch = panel2Match[1].match(/<div class="x-text x-content"[^>]*>([\s\S]*?)<\/div>/i);
      tpbHtml = textMatch ? textMatch[1].trim() : panel2Match[1].trim();
    }

    res.json({
      success: true,
      data: {
        path: orderPath,
        filePath: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
        title,
        counterTo,
        parsedItems,
        parsedTpbs,
        singleIssuesHtml,
        tpbHtml
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Tất cả các route bên dưới (thay đổi, lưu dữ liệu) đều bắt buộc phải là Admin
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
        totalComingSoon: COMING_SOON_SLUGS.size
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
    const status = (req.query.status as string || '').trim(); // 'coming_soon' | 'ready' | ''

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

    if (status === 'coming_soon') {
      const slugArr = Array.from(COMING_SOON_SLUGS);
      query = query.in('slug', slugArr);
    } else if (status === 'ready') {
      const slugListStr = `(${Array.from(COMING_SOON_SLUGS).join(',')})`;
      query = query.not('slug', 'in', slugListStr);
    }

    query = query.order('id', { ascending: false }).range(offset, offset + limit - 1);

    const { data: rows, count, error } = await query;
    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const enrichedRows = (rows || []).map((ro: any) => ({
      ...ro,
      is_coming_soon: COMING_SOON_SLUGS.has(ro.slug) || ro.total_issues === 0
    }));

    res.json({
      success: true,
      data: enrichedRows,
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
    res.status(500).json({ success: false, message: err.message });
  }
});



// POST /api/admin/reading-order-content - Cập nhật nội dung danh sách tập vào file HTML & Supabase
router.post('/reading-order-content', async (req: AuthRequest, res) => {
  try {
    let { path: orderPath, singleIssuesHtml, tpbHtml, counterTo, parsedItems, parsedTpbs } = req.body;
    if (!orderPath) {
      res.status(400).json({ success: false, message: 'Thiếu path của reading order' });
      return;
    }

    const filePath = resolveHtmlPath(orderPath);
    if (!filePath) {
      res.status(404).json({ success: false, message: `Không tìm thấy file HTML cho: ${orderPath}` });
      return;
    }

    // Nếu gửi dữ liệu dạng mảng có cấu trúc từ Visual Editor
    if (Array.isArray(parsedItems)) {
      singleIssuesHtml = serializeItemsToHtml(parsedItems);
      counterTo = parsedItems.filter(it => it.type !== 'phase' && it.type !== 'note').length;
    }

    if (Array.isArray(parsedTpbs)) {
      tpbHtml = serializeTpbToHtml(parsedTpbs);
    }

    let html = fs.readFileSync(filePath, 'utf8');

    // 1. Cập nhật counter
    if (counterTo !== undefined && counterTo !== null) {
      html = html.replace(
        /(data-x-element-counter="[^"]*?&quot;to&quot;:&quot;)\d+(&quot;)/i,
        `$1${counterTo}$2`
      );
    }

    // 2. Cập nhật Tab 1 (Từng tập truyện)
    if (singleIssuesHtml !== undefined) {
      const panel1Regex = /(<div id="panel-(?:reading-order-1|[^"]+)"[^>]*class="[^"]*x-tabs-panel[^"]*"[^>]*>\s*<div class="x-text x-content"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>)/i;
      if (panel1Regex.test(html)) {
        html = html.replace(panel1Regex, `$1\n${singleIssuesHtml.trim()}\n                  $3`);
      }
    }

    // 3. Cập nhật Tab 2 (Tuyển tập TPBs)
    if (tpbHtml !== undefined) {
      const panel2Regex = /(<div id="panel-(?:reading-order-2|[^"]+)"[^>]*class="[^"]*x-tabs-panel[^"]*"[^>]*>\s*<div class="x-text x-content"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>)/i;
      if (panel2Regex.test(html)) {
        html = html.replace(panel2Regex, `$1\n${tpbHtml.trim()}\n                  $3`);
      }
    }

    fs.writeFileSync(filePath, html, 'utf8');

    // 4. Đồng bộ tổng số tập lên Supabase & Cập nhật trạng thái Coming Soon
    const clean = orderPath.replace(/\/index\.html$/i, '').replace(/\/+$/, '') || '/';
    const slug = clean.split('/').pop() || '';
    if (counterTo && counterTo > 0) {
      COMING_SOON_SLUGS.delete(slug);
      COMING_SOON_SLUGS.delete(slug.replace(/-reading-order$/, ''));
    }

    findOrderIdByPath(clean).then(async (orderId) => {
      if (orderId && counterTo !== undefined) {
        await supabaseAdmin.from('reading_orders').update({
          total_issues: counterTo,
          updated_at: new Date().toISOString()
        }).eq('id', orderId);
      }
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Đã cập nhật danh sách tập truyện lên hệ thống thành công!',
      counterTo
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi khi lưu: ' + err.message });
  }
});

export default router;

