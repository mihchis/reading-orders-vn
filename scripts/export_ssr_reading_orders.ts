import fs from 'node:fs';
import path from 'node:path';
import { renderReadingOrderHtml, getOrderData } from '../server/services/readingOrderRenderer';
import { supabaseAdmin } from '../server/database/supabase';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const ordersDir = path.join(rootDir, 'data', 'orders');
const backupOrdersDir = path.join(rootDir, 'archive', 'data_backup', 'orders');
const effectiveOrdersDir = fs.existsSync(ordersDir) ? ordersDir : backupOrdersDir;

export async function exportAllReadingOrders(targetDir = distDir): Promise<number> {
  const startTime = Date.now();
  let slugs: string[] = [];

  // Lấy danh sách slugs: từ local cache nếu có, hoặc từ Supabase
  if (fs.existsSync(effectiveOrdersDir)) {
    slugs = fs.readdirSync(effectiveOrdersDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace(/\.json$/, ''));
  } else {
    console.log('📡 Đang lấy danh mục reading orders từ Supabase Cloud...');
    const { data: orders, error } = await supabaseAdmin
      .from('reading_orders')
      .select('slug, direct_slug')
      .limit(2000);

    if (error || !orders) {
      console.error('Lỗi lấy danh sách từ Supabase:', error?.message);
      return 0;
    }
    slugs = orders.map(o => o.direct_slug || o.slug);
  }

  let count = 0;
  for (const slug of slugs) {
    const order = await getOrderData(slug);
    if (!order) continue;

    const html = await renderReadingOrderHtml(slug);
    if (!html) continue;

    // Đường dẫn tương đối: marvel/events/civil-war-reading-order/index.html
    const relUrl = (order.url || `/${order.universe_slug || 'other'}/${order.direct_slug || order.slug}/`)
      .replace(/^\//, '')
      .replace(/\/+$/, '');

    const outDir = path.join(targetDir, relUrl);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
    count++;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`⚡ [SSR Export] Đã xuất thành công ${count}/${slugs.length} reading orders vào ${targetDir} trong ${duration}s.`);
  return count;
}

if (process.argv[1] && process.argv[1].endsWith('export_ssr_reading_orders.ts')) {
  exportAllReadingOrders().catch(console.error);
}
