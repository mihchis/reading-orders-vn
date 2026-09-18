import fs from 'node:fs';
import path from 'node:path';
import { supabaseAdmin } from '../server/database/supabase';

async function syncToSupabase() {
  console.log('🚀 Bắt đầu đồng bộ dữ liệu lên Supabase Cloud (lhllsgrvedsumyjhzssy)...');

  // 1. Kiểm tra bảng universes
  const { data: testUniv, error: testErr } = await supabaseAdmin.from('universes').select('id').limit(1);
  if (testErr) {
    console.error('❌ Lỗi kết nối hoặc bảng chưa được tạo:', testErr.message);
    console.log('👉 Vui lòng mở Supabase Dashboard > SQL Editor và chạy nội dung file data/supabase_schema.sql trước!');
    return;
  }

  // 2. Chèn Universes
  console.log('-> Đang cập nhật Universes...');
  const universes = [
    { slug: 'marvel', name: 'Marvel Comics', accent_color: '#e23636', description: 'Vũ trụ Marvel - Nơi hội tụ các siêu anh hùng Avengers, Spider-Man, X-Men...', sort_order: 1 },
    { slug: 'dc', name: 'DC Comics', accent_color: '#0476f2', description: 'Vũ trụ DC - Thế giới của Batman, Superman, Justice League...', sort_order: 2 },
    { slug: 'other', name: 'Truyện Tranh Khác', accent_color: '#10b981', description: 'Vũ trụ độc lập Indie: The Boys, Invincible, Hellboy, Spawn, TMNT...', sort_order: 3 }
  ];
  await supabaseAdmin.from('universes').upsert(universes, { onConflict: 'slug' });

  // Lấy ID của universes
  const { data: univRows } = await supabaseAdmin.from('universes').select('id, slug');
  const univMap = new Map<string, number>();
  univRows?.forEach(u => univMap.set(u.slug, u.id));

  // 3. Đọc danh mục từ data/catalog.json
  const catalogPath = path.resolve(process.cwd(), 'data/catalog.json');
  if (fs.existsSync(catalogPath)) {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    console.log(`-> Tìm thấy ${catalog.length} reading orders trong catalog.json. Bắt đầu đẩy lên Supabase...`);

    const batchSize = 100;
    for (let i = 0; i < catalog.length; i += batchSize) {
      const chunk = catalog.slice(i, i + batchSize).map((item: any) => ({
        slug: item.slug,
        direct_slug: item.direct_slug || `${item.slug}-reading-order`,
        title: item.title,
        universe_id: univMap.get(item.universe_slug) || null,
        universe_slug: item.universe_slug,
        category_slug: item.category_slug || 'events',
        url: item.url,
        year_published: item.year_published || '',
        total_issues: item.total_issues || 0,
        description: item.description || ''
      }));

      const { error: chunkErr } = await supabaseAdmin.from('reading_orders').upsert(chunk, { onConflict: 'slug' });
      if (chunkErr) {
        console.warn(`Lỗi chèn batch ${i} - ${i + chunk.length}:`, chunkErr.message);
      }
    }
    console.log(`✅ Đã đồng bộ xong ${catalog.length} reading orders.`);
  }

  // 4. Lấy map của reading_orders từ Supabase
  console.log('-> Đang nạp danh sách ID reading_orders từ Supabase Cloud...');
  const { data: roRows, error: roErr } = await supabaseAdmin
    .from('reading_orders')
    .select('id, slug')
    .limit(10000);

  if (roErr || !roRows) {
    console.error('❌ Không thể lấy danh sách reading_orders:', roErr?.message);
    return;
  }

  const roMap = new Map<string, number>();
  roRows.forEach(ro => roMap.set(ro.slug, ro.id));

  // 5. Đọc các tập truyện (issues) từ data/orders/*.json
  const ordersDir = path.resolve(process.cwd(), 'data/orders');
  if (fs.existsSync(ordersDir)) {
    const orderFiles = fs.readdirSync(ordersDir).filter(f => f.endsWith('.json'));
    console.log(`-> Tìm thấy ${orderFiles.length} file chi tiết trong data/orders/. Bắt đầu đẩy issues...`);

    // Xóa sạch issues cũ trước khi nạp mới
    await supabaseAdmin.from('issues').delete().neq('id', 0);

    let allIssues: any[] = [];
    let processedOrders = 0;

    for (const file of orderFiles) {
      const filePath = path.join(ordersDir, file);
      try {
        const orderData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const roId = roMap.get(orderData.slug);
        if (!roId) continue;

        if (Array.isArray(orderData.issues) && orderData.issues.length > 0) {
          for (const iss of orderData.issues) {
            allIssues.push({
              reading_order_id: roId,
              tab_type: iss.tab_type || 'single',
              title: iss.title,
              issue_type: iss.issue_type || 'ongoing',
              year: iss.year ? String(iss.year) : null,
              note: iss.note || null,
              read_url: iss.read_url || null,
              sort_order: iss.sort_order || 0,
              is_noncanon: Boolean(iss.is_noncanon)
            });
          }
        }
        processedOrders++;

        // Batch insert mỗi 1,000 issues để tối ưu tốc độ và không vượt quá payload limit
        if (allIssues.length >= 1000) {
          const toInsert = allIssues;
          allIssues = [];
          const { error: insErr } = await supabaseAdmin.from('issues').insert(toInsert);
          if (insErr) {
            console.warn('Lỗi chèn batch issues:', insErr.message);
          } else {
            process.stdout.write(`.`);
          }
        }
      } catch (err: any) {
        console.warn(`Lỗi đọc file ${file}:`, err.message);
      }
    }

    if (allIssues.length > 0) {
      const { error: insErr } = await supabaseAdmin.from('issues').insert(allIssues);
      if (insErr) console.warn('Lỗi chèn batch issues cuối:', insErr.message);
    }

    console.log(`\n✅ Hoàn tất đồng bộ toàn bộ tập truyện (issues) cho ${processedOrders} bộ truyện lên Supabase Cloud!`);
  }
}

syncToSupabase().catch(console.error);
