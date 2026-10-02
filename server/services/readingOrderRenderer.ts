import path from 'node:path';
import fs from 'node:fs';
import { supabaseAdmin } from '../database/supabase';

const rootDir = process.cwd();
const templatePath = path.join(rootDir, 'templates', 'reading-order.html');
const ordersDir = path.join(rootDir, 'data', 'orders');
const backupOrdersDir = path.join(rootDir, 'archive', 'data_backup', 'orders');
const effectiveOrdersDir = fs.existsSync(ordersDir) ? ordersDir : backupOrdersDir;
const componentsDir = path.join(rootDir, 'components');

const headerNavComponentPath = path.join(componentsDir, 'header-nav.html');
const footerComponentPath = path.join(componentsDir, 'footer.html');
const overlaysComponentPath = path.join(componentsDir, 'overlays.html');
const footerScriptsComponentPath = path.join(componentsDir, 'footer-scripts.html');
const readingLegendComponentPath = path.join(componentsDir, 'reading-legend.html');

export interface ReadingOrderIssue {
  sort_order?: number;
  title: string;
  issue_type?: 'ongoing' | 'limited' | 'mini' | 'oneshot' | 'note' | 'phase' | string;
  year?: string | null;
  note?: string | null;
  is_noncanon?: number;
  link?: string | null;
  anchor_id?: string | null;
}

export interface ReadingOrderTpb {
  title: string;
  buyLink?: string;
  subIssues?: string[];
}

export interface ReadingOrderData {
  id?: number | string;
  slug: string;
  direct_slug?: string;
  title: string;
  universe_slug?: string;
  universe_name?: string;
  category_slug?: string;
  category_name?: string;
  url?: string;
  description?: string;
  first_appearance?: string;
  creators?: string;
  powers?: string;
  year_published?: string;
  featured_characters?: string;
  previous_event_title?: string;
  previous_event_slug?: string;
  next_event_title?: string;
  next_event_slug?: string;
  cover_image?: string;
  total_issues?: number;
  comic_issues_count?: number;
  comments_count?: number;
  status?: string;
  updated_at?: string;
  issues?: ReadingOrderIssue[];
  starting_points?: Array<{ title: string; link: string }>;
  essential_issues?: ReadingOrderIssue[] | string[];
  tpbs?: ReadingOrderTpb[];
  notes?: string;
}

// In-memory cache lưu trữ dữ liệu đã tra cứu để đạt tốc độ < 0.5ms
const memoryOrderCache = new Map<string, ReadingOrderData>();
let orderFileIndex: Map<string, string> | null = null;
let templateCache: string | null = null;

function buildLocalOrderIndex(): Map<string, string> {
  const index = new Map<string, string>();
  if (!fs.existsSync(effectiveOrdersDir)) return index;

  try {
    const files = fs.readdirSync(effectiveOrdersDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const filePath = path.join(effectiveOrdersDir, file);
      const baseName = file.replace(/\.json$/, '');
      index.set(baseName.toLowerCase(), filePath);

      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data: Partial<ReadingOrderData> = JSON.parse(raw);
        if (data.slug) index.set(data.slug.toLowerCase(), filePath);
        if (data.direct_slug) index.set(data.direct_slug.toLowerCase(), filePath);
        if (data.url) {
          const cleanUrl = data.url.replace(/\/+$/, '').toLowerCase();
          index.set(cleanUrl, filePath);
          const lastPart = cleanUrl.split('/').filter(Boolean).pop();
          if (lastPart) index.set(lastPart, filePath);
        }
      } catch {}
    }
  } catch {}
  return index;
}

export function reloadRendererCache(): void {
  memoryOrderCache.clear();
  orderFileIndex = buildLocalOrderIndex();
  templateCache = null;
}

export async function getOrderData(slugOrPath: string): Promise<ReadingOrderData | null> {
  const clean = slugOrPath.trim().toLowerCase().replace(/\/+$/, '').replace(/^\//, '');
  const slugOnly = clean.split('/').pop() || clean;
  const withoutReadingOrder = slugOnly.replace(/-reading-order$/, '');

  // Danh sách các trang Hub, danh mục, điều hướng cố định - tuyệt đối không SSR dạng reading order đơn
  const reservedHubSlugs = new Set([
    'events',
    'characters',
    'marvel',
    'dc',
    'other',
    'marvel-master-reading-order',
    'dc-master-reading-order',
    'all-new-all-different-marvel-reading-order',
    'all-new-all-different-marvel',
    'faq',
    'contact',
    'updates',
    'admin',
    'api'
  ]);

  if (reservedHubSlugs.has(slugOnly) || reservedHubSlugs.has(clean)) {
    return null;
  }

  // 1. Kiểm tra Cache bộ nhớ trước (O(1), < 0.1ms)
  if (memoryOrderCache.has(clean)) return memoryOrderCache.get(clean)!;
  if (memoryOrderCache.has(slugOnly)) return memoryOrderCache.get(slugOnly)!;
  if (memoryOrderCache.has(withoutReadingOrder)) return memoryOrderCache.get(withoutReadingOrder)!;

  // 2. Thử đọc từ local data/orders nếu thư mục còn tồn tại
  if (!orderFileIndex) {
    orderFileIndex = buildLocalOrderIndex();
  }
  let filePath = orderFileIndex.get(clean) ||
                 orderFileIndex.get(slugOnly) ||
                 orderFileIndex.get(withoutReadingOrder) ||
                 orderFileIndex.get(`${slugOnly}-reading-order`);

  if (filePath && fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw) as ReadingOrderData;
      memoryOrderCache.set(clean, parsed);
      memoryOrderCache.set(slugOnly, parsed);
      if (parsed.slug) memoryOrderCache.set(parsed.slug.toLowerCase(), parsed);
      if (parsed.direct_slug) memoryOrderCache.set(parsed.direct_slug.toLowerCase(), parsed);
      return parsed;
    } catch {}
  }

  // 3. Truy vấn trực tiếp từ Supabase Cloud
  try {
    const { data: order, error } = await supabaseAdmin
      .from('reading_orders')
      .select(`
        *,
        universes(id, slug, name, accent_color),
        categories(id, slug, name)
      `)
      .or(`slug.eq.${slugOnly},slug.eq.${withoutReadingOrder},direct_slug.eq.${slugOnly},direct_slug.eq.${withoutReadingOrder}-reading-order,url.ilike.%/${slugOnly}/`)
      .limit(1)
      .maybeSingle();

    if (error || !order) {
      return null;
    }

    // Lấy danh sách các tập truyện (issues) từ Supabase
    const { data: issues = [] } = await supabaseAdmin
      .from('issues')
      .select('*')
      .eq('reading_order_id', order.id)
      .order('sort_order', { ascending: true });

    const formattedOrder: ReadingOrderData = {
      id: order.id,
      slug: order.slug,
      direct_slug: order.direct_slug || `${order.slug}-reading-order`,
      title: order.title,
      universe_slug: order.universes?.slug || order.universe_slug,
      universe_name: order.universes?.name,
      category_slug: order.categories?.slug || order.category_slug,
      category_name: order.categories?.name,
      url: order.url || `/${order.universes?.slug || order.universe_slug || 'other'}/${order.direct_slug || order.slug}/`,
      description: order.description,
      year_published: order.year_published,
      featured_characters: order.featured_characters,
      previous_event_title: order.previous_event_title,
      previous_event_slug: order.previous_event_slug,
      next_event_title: order.next_event_title,
      next_event_slug: order.next_event_slug,
      cover_image: order.cover_image,
      total_issues: order.total_issues !== undefined && order.total_issues !== null ? order.total_issues : (issues?.length || 0),
      status: order.status || (order.total_issues === 0 ? 'coming_soon' : 'published'),
      updated_at: order.updated_at,
      issues: (issues || []).map((it: any) => ({
        sort_order: it.sort_order,
        title: it.title,
        issue_type: it.issue_type || 'ongoing',
        year: it.year,
        note: it.note,
        is_noncanon: it.is_noncanon ? 1 : 0
      })),
      essential_issues: order.essential_issues || undefined,
      notes: order.notes || undefined
    };

    memoryOrderCache.set(clean, formattedOrder);
    memoryOrderCache.set(slugOnly, formattedOrder);
    if (order.slug) memoryOrderCache.set(order.slug.toLowerCase(), formattedOrder);
    if (order.direct_slug) memoryOrderCache.set(order.direct_slug.toLowerCase(), formattedOrder);
    return formattedOrder;
  } catch (err) {
    console.error(`[Renderer] Lỗi truy vấn Supabase cho ${slugOrPath}:`, err);
    return null;
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatUniverseName(slug?: string, defaultName?: string): string {
  if (defaultName) return defaultName;
  if (!slug) return 'Truyện Khác';
  if (slug === 'marvel') return 'Marvel';
  if (slug === 'dc') return 'DC';
  return 'Truyện Khác';
}

function formatCategoryName(catSlug?: string, universeSlug?: string, defaultName?: string): string {
  if (defaultName) return defaultName;
  if (catSlug === 'events') {
    if (universeSlug === 'marvel') return 'Sự Kiện Marvel';
    if (universeSlug === 'dc') return 'Sự Kiện DC';
    return 'Sự Kiện';
  }
  if (catSlug === 'characters') {
    if (universeSlug === 'marvel') return 'Nhân Vật Marvel';
    if (universeSlug === 'dc') return 'Nhân Vật DC';
    return 'Nhân Vật';
  }
  return defaultName || 'Danh Mục';
}

function renderBreadcrumbs(order: ReadingOrderData): string {
  const universeSlug = order.universe_slug || 'other';
  const universeName = formatUniverseName(universeSlug, order.universe_name);
  const categorySlug = order.category_slug;
  const categoryName = categorySlug ? formatCategoryName(categorySlug, universeSlug, order.category_name) : '';
  const currentUrl = order.url || `/${universeSlug}/${categorySlug ? `${categorySlug}/` : ''}${order.direct_slug || order.slug}/`;

  let pos = 1;
  let html = `
    <div class="x-breadcrumb-wrap">
      <div class="x-container max width">
        <div class="x-breadcrumbs" itemscope itemtype="https://schema.org/BreadcrumbList" aria-label="Breadcrumb Navigation">
          <span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            <a itemtype="https://schema.org/Thing" itemprop="item" href="/" class="">
              <span itemprop="name"><span class="home"><i class="x-framework-icon x-icon-home" data-x-icon-s="&#xf015;" aria-hidden="true"></i></span><span class="visually-hidden">Trang chủ</span></span>
            </a>
            <span class="delimiter"><i class="x-framework-icon x-icon-angle-right" data-x-icon-s="&#xf105;" aria-hidden="true"></i></span>
            <meta itemprop="position" content="${pos++}">
          </span>
          <span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            <a itemtype="https://schema.org/Thing" itemprop="item" href="/${universeSlug}/" class="">
              <span itemprop="name">${universeName}</span>
            </a>
            <span class="delimiter"><i class="x-framework-icon x-icon-angle-right" data-x-icon-s="&#xf105;" aria-hidden="true"></i></span>
            <meta itemprop="position" content="${pos++}">
          </span>
  `;

  if (categorySlug && categoryName) {
    html += `
          <span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            <a itemtype="https://schema.org/Thing" itemprop="item" href="/${universeSlug}/${categorySlug}/" class="">
              <span itemprop="name">${categoryName}</span>
            </a>
            <span class="delimiter"><i class="x-framework-icon x-icon-angle-right" data-x-icon-s="&#xf105;" aria-hidden="true"></i></span>
            <meta itemprop="position" content="${pos++}">
          </span>
    `;
  }

  html += `
          <span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            <a itemtype="https://schema.org/Thing" itemprop="item" href="${currentUrl}" title="Bạn đang ở đây" class="current ">
              <span itemprop="name">${order.title} Reading Order</span>
            </a>
            <meta itemprop="position" content="${pos}">
          </span>
        </div>
      </div>
    </div>
  `;

  return html;
}

function renderMetaInfo(order: ReadingOrderData): string {
  const parts: string[] = [];

  if (order.first_appearance) {
    parts.push(`<strong>Xuất hiện lần đầu</strong>:&nbsp; ${escapeHtml(order.first_appearance)}`);
  }
  if (order.creators) {
    parts.push(`<strong>Tác giả</strong>:&nbsp; ${escapeHtml(order.creators)}`);
  }
  if (order.powers) {
    parts.push(`<strong>Năng lực</strong>:&nbsp; ${escapeHtml(order.powers)}`);
  }
  if (order.year_published) {
    parts.push(`<strong>Năm xuất bản</strong>:&nbsp; ${escapeHtml(order.year_published)}`);
  }
  if (order.featured_characters) {
    parts.push(`<strong>Nhân vật nổi bật</strong>:&nbsp; ${escapeHtml(order.featured_characters)}`);
  }
  if (order.previous_event_title) {
    const prevSlug = order.previous_event_slug;
    const prevUrl = prevSlug
      ? (prevSlug.startsWith('/') ? prevSlug : (prevSlug.endsWith('/') ? `../${prevSlug}` : `../${prevSlug}/`))
      : '#';
    parts.push(`<strong>Sự kiện trước</strong>:&nbsp; <a href="${prevUrl}">${escapeHtml(order.previous_event_title)}</a>`);
  }
  if (order.next_event_title) {
    const nextSlug = order.next_event_slug;
    const nextUrl = nextSlug
      ? (nextSlug.startsWith('/') ? nextSlug : (nextSlug.endsWith('/') ? `../${nextSlug}` : `../${nextSlug}/`))
      : '#';
    parts.push(`<strong>Sự kiện tiếp theo</strong>:&nbsp; <a href="${nextUrl}">${escapeHtml(order.next_event_title)}</a>`);
  }

  return parts.join('<br />\n');
}

function renderCounterBlock(totalIssues: number): string {
  if (totalIssues <= 0) {
    return `
      <div class="x-section ro-counter-section ro-counter-clean mbm">
        <div class="x-container max width">
          <div class="x-column x-sm x-1-1">
            <div class="x-counter" data-x-element-counter="{&quot;to&quot;:&quot;0&quot;,&quot;speed&quot;:&quot;1.5s&quot;,&quot;commaSeparatedDecimal&quot;:false}">
              <div class="x-counter-number-wrap"><span class="x-counter-number">0</span></div>
              <div class="x-counter-after">TẬP TRUYỆN • ĐANG CẬP NHẬT</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="x-section ro-counter-section ro-counter-clean mbm">
      <div class="x-container max width">
        <div class="x-column x-sm x-1-1">
          <div class="x-counter" data-x-element-counter="{&quot;to&quot;:&quot;${totalIssues}&quot;,&quot;speed&quot;:&quot;1.5s&quot;,&quot;commaSeparatedDecimal&quot;:false}">
            <div class="x-counter-number-wrap"><span class="x-counter-number">${totalIssues}</span></div>
            <div class="x-counter-after">TẬP TRUYỆN</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderIssueItem(issue: ReadingOrderIssue): string {
  const type = (issue.issue_type || 'ongoing').toLowerCase();
  const title = issue.title.trim();
  const yearStr = issue.year && String(issue.year).trim() ? ` (${String(issue.year).trim()})` : '';
  const noteStr = issue.note && String(issue.note).trim() ? ` <span style="color: #0000ff; font-style: italic;">(${escapeHtml(String(issue.note).trim())})</span>` : '';
  const anchorTag = issue.anchor_id ? `<a id="${escapeHtml(issue.anchor_id)}"></a>` : '';

  if (type === 'starting_point' || title.startsWith('Alternate Starting Point') || title.startsWith('Điểm khởi đầu thay thế')) {
    const targetUrl = issue.link || '#';
    const targetTitle = title
      .replace(/^Alternate Starting Point:\s*/i, '')
      .replace(/^Điểm khởi đầu thay thế:\s*/i, '');
    return `<p>${anchorTag}<span style="color: #0000ff;"><strong>Điểm khởi đầu thay thế: </strong></span> <a class="dc-class" href="${escapeHtml(targetUrl)}">${escapeHtml(targetTitle)}</a></p>`;
  }

  if (type === 'event_link' || (issue.link && (issue.link.includes('/events/') || type.includes('event')))) {
    const targetUrl = issue.link || '#';
    const eventName = title
      .replace(/^Read\s+/i, '')
      .replace(/\s+here\.?$/i, '')
      .replace(/^Đọc\s+(sự kiện\s+)?/i, '')
      .replace(/\s+tại đây\.?$/i, '');
    return `<p>${anchorTag}<strong><span style="color: #ff0000;">Đọc sự kiện <a class="dc-class" href="${escapeHtml(targetUrl)}">${escapeHtml(eventName)}</a> tại đây.</span></strong></p>`;
  }

  if (type === 'phase') {
    const phaseNote = issue.note && String(issue.note).trim() ? `<br /><span style="color: #64748b; font-size: 12.5px; font-style: italic;">${escapeHtml(String(issue.note).trim())}</span>` : '';
    return `<p>${anchorTag}<span class="ro-item-phase"><strong>${escapeHtml(title)}</strong></span>${phaseNote}</p>`;
  }

  if (type === 'note' || type === 'comment') {
    return `<p>${anchorTag}<span class="ro-item-note">${escapeHtml(title)}</span></p>`;
  }

  if (type === 'mini' || type === 'limited') {
    return `<p>${anchorTag}<span class="ro-item-mini">${escapeHtml(title)}</span>${yearStr}${noteStr}</p>`;
  }

  if (type === 'oneshot') {
    return `<p>${anchorTag}<span class="ro-item-oneshot">${escapeHtml(title)}</span>${yearStr}${noteStr}</p>`;
  }

  return `<p>${anchorTag}${escapeHtml(title)}${yearStr}${noteStr}</p>`;
}

function renderStartingPointsBox(points?: Array<{ title: string; link: string }>): string {
  if (!points || points.length === 0) return '';
  const items = points.map(p => {
    return `<li style="margin-bottom: 4px;"><strong>Điểm khởi đầu thay thế:</strong> <a class="dc-class" href="${escapeHtml(p.link)}" style="color: #0284c7; font-weight: 600;">${escapeHtml(p.title)}</a></li>`;
  }).join('\n');

  return `
    <div class="ro-starting-points-box" style="margin-bottom: 24px; padding: 14px 18px; background: rgba(2, 132, 199, 0.06); border-left: 4px solid #0284c7; border-radius: 4px;">
      <div style="font-weight: 600; font-size: 14px; color: #0369a1; margin-bottom: 8px;">
        💡 Gợi ý điểm khởi đầu đọc cho độc giả mới:
      </div>
      <ul style="margin: 0; padding-left: 20px; font-size: 13.5px; color: #334155; line-height: 1.8;">
        ${items}
      </ul>
    </div>
  `;
}

function renderSingleIssuesPanel(issues: ReadingOrderIssue[], startingPoints?: Array<{ title: string; link: string }>): string {
  const startingBox = renderStartingPointsBox(startingPoints);

  if (!issues || issues.length === 0) {
    return `
      ${startingBox}
      <div class="x-text x-content ro-tab-content">
        <div class="ro-coming-soon-card" style="text-align: center; padding: 28px 20px; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 4px; margin: 16px 0;">
          <p style="font-size: 14px; color: #64748b; margin: 0;">Danh sách tập truyện đang được biên tập và cập nhật sớm nhất.</p>
        </div>
      </div>
    `;
  }

  return (startingBox ? startingBox + '\n' : '') + issues.map(renderIssueItem).join('\n');
}

function renderEssentialPanel(essentialIssues: ReadingOrderIssue[] | string[]): string {
  if (!essentialIssues || essentialIssues.length === 0) {
    return '';
  }

  const items = essentialIssues.map(item => {
    if (typeof item === 'string') {
      return `<p>${escapeHtml(item)}</p>`;
    }
    return renderIssueItem(item);
  });

  return `
    <div class="x-text x-content">
      ${items.join('\n')}
    </div>
  `;
}

function renderTpbPanel(tpbs?: ReadingOrderTpb[]): string {
  if (!tpbs || tpbs.length === 0) {
    return `
      <div class="x-text x-content ro-tab-content">
        <div class="ro-coming-soon-card" style="text-align: center; padding: 28px 20px; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 4px; margin: 16px 0;">
          <p style="font-size: 14px; color: #64748b; margin: 0;">Tuyển tập (TPBs) đang được cập nhật.</p>
        </div>
      </div>
    `;
  }

  const cardsHtml = tpbs.map(tpb => {
    const subList = (tpb.subIssues || []).map(s => `<p style="margin-left: 20px;">• ${escapeHtml(s)}</p>`).join('\n');
    return `
      <p><strong>${escapeHtml(tpb.title)}</strong></p>
      ${subList}
    `;
  }).join('\n');

  return `
    <div class="x-text x-content">
      ${cardsHtml}
    </div>
  `;
}

function renderNotesPanel(notes?: string): string {
  if (!notes || !notes.trim()) return '';
  return `
    <div class="x-text x-content">
      ${notes}
    </div>
  `;
}

export async function renderReadingOrderHtml(slugOrPath: string): Promise<string | null> {
  const order = await getOrderData(slugOrPath);
  if (!order) return null;

  if (!templateCache) {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at ${templatePath}`);
    }
    templateCache = fs.readFileSync(templatePath, 'utf8');
  }

  // Nạp các components dùng chung
  const sharedHeaderNav = fs.existsSync(headerNavComponentPath) ? fs.readFileSync(headerNavComponentPath, 'utf8').trim() : '';
  const sharedFooter = fs.existsSync(footerComponentPath) ? fs.readFileSync(footerComponentPath, 'utf8').trim() : '';
  const sharedOverlays = fs.existsSync(overlaysComponentPath) ? fs.readFileSync(overlaysComponentPath, 'utf8').trim() : '';
  const sharedFooterScripts = fs.existsSync(footerScriptsComponentPath) ? fs.readFileSync(footerScriptsComponentPath, 'utf8').trim() : '';
  const sharedLegend = fs.existsSync(readingLegendComponentPath) ? fs.readFileSync(readingLegendComponentPath, 'utf8').trim() : '';

  const issues = order.issues || [];
  const totalIssues = order.total_issues !== undefined ? order.total_issues : issues.length;
  const hasEssential = Boolean(order.essential_issues && order.essential_issues.length > 0);
  const hasNotes = Boolean(order.notes && order.notes.trim().length > 0);

  // 1. Sinh Tabs Header
  let tabsHeaderHtml = `
    <li role="presentation">
      <button id="tab-ro-single" class="x-active" role="tab" aria-selected="true" aria-controls="panel-ro-single" data-x-toggle="tab">
        <span>Từng tập truyện</span>
      </button>
    </li>
  `;

  if (hasEssential) {
    tabsHeaderHtml += `
      <li role="presentation">
        <button id="tab-ro-essential" role="tab" aria-selected="false" aria-controls="panel-ro-essential" data-x-toggle="tab">
          <span>Cốt truyện chính (Essential)</span>
        </button>
      </li>
    `;
  }

  tabsHeaderHtml += `
    <li role="presentation">
      <button id="tab-ro-tpb" role="tab" aria-selected="false" aria-controls="panel-ro-tpb" data-x-toggle="tab">
        <span>Tuyển tập (TPBs)</span>
      </button>
    </li>
  `;

  if (hasNotes) {
    tabsHeaderHtml += `
      <li role="presentation">
        <button id="tab-ro-notes" role="tab" aria-selected="false" aria-controls="panel-ro-notes" data-x-toggle="tab">
          <span>Ghi chú</span>
        </button>
      </li>
    `;
  }

  // 2. Sinh Tabs Panels
  let tabsPanelsHtml = `
    <div id="panel-ro-single" class="x-tabs-panel x-active" role="tabpanel" aria-labelledby="tab-ro-single" aria-hidden="false">
      ${renderSingleIssuesPanel(issues, order.starting_points)}
    </div>
  `;

  if (hasEssential) {
    tabsPanelsHtml += `
      <div id="panel-ro-essential" class="x-tabs-panel" role="tabpanel" aria-labelledby="tab-ro-essential" aria-hidden="true">
        ${renderEssentialPanel(order.essential_issues!)}
      </div>
    `;
  }

  tabsPanelsHtml += `
    <div id="panel-ro-tpb" class="x-tabs-panel" role="tabpanel" aria-labelledby="tab-ro-tpb" aria-hidden="true">
      ${renderTpbPanel(order.tpbs)}
    </div>
  `;

  if (hasNotes) {
    tabsPanelsHtml += `
      <div id="panel-ro-notes" class="x-tabs-panel" role="tabpanel" aria-labelledby="tab-ro-notes" aria-hidden="true">
        ${renderNotesPanel(order.notes)}
      </div>
    `;
  }

  const rawTitle = order.title || 'Reading Order';
  const pageTitle = rawTitle.startsWith('Thứ Tự Đọc') ? rawTitle : `Thứ Tự Đọc ${rawTitle}`;
  const rawDesc = order.description || `Thứ tự đọc chi tiết cho bộ truyện ${rawTitle} tại Comic Book Reading Orders VN.`;
  const metaDesc = escapeHtml(rawDesc.replace(/<[^>]+>/g, '').trim().slice(0, 160));
  const canonicalUrl = order.url || `/${order.universe_slug || 'other'}/${order.direct_slug || order.slug}/`;
  const modifiedTime = order.updated_at || '2026-09-29T03:05:02+00:00';

  let html = templateCache
    .replace(/\{\{PAGE_TITLE\}\}/g, escapeHtml(pageTitle))
    .replace(/\{\{TITLE\}\}/g, escapeHtml(rawTitle))
    .replace(/\{\{META_DESCRIPTION\}\}/g, metaDesc)
    .replace(/\{\{CANONICAL_URL\}\}/g, canonicalUrl)
    .replace(/\{\{MODIFIED_TIME\}\}/g, modifiedTime)
    .replace(/\{\{DESCRIPTION\}\}/g, escapeHtml(rawDesc))
    .replace(/\{\{META_INFO\}\}/g, renderMetaInfo(order))
    .replace(/\{\{COUNTER_BLOCK\}\}/g, renderCounterBlock(totalIssues))
    .replace(/\{\{COLOR_LEGEND\}\}/g, sharedLegend)
    .replace(/\{\{BREADCRUMBS\}\}/g, renderBreadcrumbs(order))
    .replace(/\{\{TABS_HEADER\}\}/g, tabsHeaderHtml)
    .replace(/\{\{TABS_PANELS\}\}/g, tabsPanelsHtml)
    .replace(/\{\{HEADER_NAV\}\}/g, sharedHeaderNav)
    .replace(/\{\{FOOTER\}\}/g, sharedFooter)
    .replace(/\{\{OVERLAYS\}\}/g, sharedOverlays)
    .replace(/\{\{FOOTER_SCRIPTS\}\}/g, sharedFooterScripts);

  return html;
}
