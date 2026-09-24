const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. UPDATE server/routes/admin.ts
const serverAdminPath = path.join(rootDir, 'server', 'routes', 'admin.ts');
let serverAdminCode = fs.readFileSync(serverAdminPath, 'utf8');

if (!serverAdminCode.includes("else if (sortBy === 'category')")) {
  serverAdminCode = serverAdminCode.replace(
    "} else if (sortBy === 'universe') {\n      query = query.order('universe_slug', { ascending });\n    } else {",
    "} else if (sortBy === 'universe') {\n      query = query.order('universe_slug', { ascending });\n    } else if (sortBy === 'category') {\n      query = query.order('category_slug', { ascending });\n    } else {"
  );
  fs.writeFileSync(serverAdminPath, serverAdminCode, 'utf8');
  console.log('Updated server/routes/admin.ts with category sorting');
} else {
  console.log('server/routes/admin.ts already has category sorting');
}

// 2. UPDATE admin/index.html
const adminHtmlPath = path.join(rootDir, 'admin', 'index.html');
let adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');

// A. Add Category filter dropdown in the toolbar
const oldToolbarFilters = `<select id="order-universe-filter" class="select-filter" onchange="loadOrders(1)">
                  <option value="">Tất cả vũ trụ</option>
                  <option value="marvel">Marvel Comics</option>
                  <option value="dc">DC Comics</option>
                  <option value="other">Khác (Other)</option>
                </select>`;

const newToolbarFilters = `<select id="order-universe-filter" class="select-filter" onchange="loadOrders(1)">
                  <option value="">Tất cả vũ trụ</option>
                  <option value="marvel">Marvel Comics</option>
                  <option value="dc">DC Comics</option>
                  <option value="other">Khác (Other)</option>
                </select>

                <select id="order-category-filter" class="select-filter" style="border-color: #9333ea; font-weight: 600;" onchange="loadOrders(1)">
                  <option value="" style="color: var(--text-main); font-weight: normal;">Tất cả phân loại</option>
                  <option value="characters" style="color: #7e22ce; font-weight: 700;">👤 Nhân vật (Characters)</option>
                  <option value="events" style="color: #c2410c; font-weight: 700;">⚡ Sự kiện (Events)</option>
                  <option value="master" style="color: #be123c; font-weight: 700;">👑 Toàn diện (Master)</option>
                  <option value="series" style="color: #0e7490; font-weight: 700;">📖 Tuyến truyện (Series)</option>
                </select>`;

if (adminHtml.includes(oldToolbarFilters)) {
  adminHtml = adminHtml.replace(oldToolbarFilters, newToolbarFilters);
  console.log('Added order-category-filter dropdown to toolbar');
}

// B. Add sort options for category in order-sort-select
const oldSortSelect = `<option value="title-desc">Sắp xếp: Tên Z ➔ A</option>`;
const newSortSelect = `<option value="title-desc">Sắp xếp: Tên Z ➔ A</option>
                  <option value="category-asc">Sắp xếp: Phân loại A ➔ Z</option>
                  <option value="category-desc">Sắp xếp: Phân loại Z ➔ A</option>`;

if (adminHtml.includes(oldSortSelect) && !adminHtml.includes('category-asc')) {
  adminHtml = adminHtml.replace(oldSortSelect, newSortSelect);
  console.log('Added category sort options to order-sort-select');
}

// C. Add Phân Loại column header in table
const oldThead = `<tr>
                    <th class="sortable active-sort" onclick="setOrderSort('id')" title="Bấm để sắp xếp theo ID">
                      ID <i id="sort-icon-id" class="fa-solid fa-sort-down sort-icon active"></i>
                    </th>
                    <th class="sortable" onclick="setOrderSort('title')" title="Bấm để sắp xếp theo Tiêu đề">
                      Tiêu đề bộ đọc <i id="sort-icon-title" class="fa-solid fa-sort sort-icon"></i>
                    </th>
                    <th class="sortable" onclick="setOrderSort('universe')" title="Bấm để sắp xếp theo Vũ trụ">
                      Vũ trụ <i id="sort-icon-universe" class="fa-solid fa-sort sort-icon"></i>
                    </th>`;

const newThead = `<tr>
                    <th class="sortable active-sort" onclick="setOrderSort('id')" title="Bấm để sắp xếp theo ID">
                      ID <i id="sort-icon-id" class="fa-solid fa-sort-down sort-icon active"></i>
                    </th>
                    <th class="sortable" onclick="setOrderSort('title')" title="Bấm để sắp xếp theo Tiêu đề">
                      Tiêu đề bộ đọc <i id="sort-icon-title" class="fa-solid fa-sort sort-icon"></i>
                    </th>
                    <th class="sortable" onclick="setOrderSort('category')" title="Bấm để sắp xếp theo Phân loại (Nhân vật / Sự kiện / Toàn diện)">
                      Phân loại <i id="sort-icon-category" class="fa-solid fa-sort sort-icon"></i>
                    </th>
                    <th class="sortable" onclick="setOrderSort('universe')" title="Bấm để sắp xếp theo Vũ trụ">
                      Vũ trụ <i id="sort-icon-universe" class="fa-solid fa-sort sort-icon"></i>
                    </th>`;

if (adminHtml.includes(oldThead)) {
  adminHtml = adminHtml.replace(oldThead, newThead);
  console.log('Added Phân loại column to table thead');
}

// D. Helper getCategoryBadge and updated row rendering in loadOrders
const oldLoadOrdersSearch = `const universe = document.getElementById('order-universe-filter').value;
      const status = document.getElementById('order-status-filter')?.value || '';
      const issueRange = document.getElementById('order-issues-filter')?.value || '';`;

const newLoadOrdersSearch = `const universe = document.getElementById('order-universe-filter').value;
      const category = document.getElementById('order-category-filter')?.value || '';
      const status = document.getElementById('order-status-filter')?.value || '';
      const issueRange = document.getElementById('order-issues-filter')?.value || '';`;

if (adminHtml.includes(oldLoadOrdersSearch)) {
  adminHtml = adminHtml.replace(oldLoadOrdersSearch, newLoadOrdersSearch);
}

// Update API URL in loadOrders
adminHtml = adminHtml.replace(
  `const url = \`/api/admin/reading-orders?page=\${page}&limit=20&search=\${encodeURIComponent(search)}&universe=\${encodeURIComponent(universe)}&status=\${encodeURIComponent(status)}&issueRange=\${encodeURIComponent(issueRange)}&sortBy=\${encodeURIComponent(currentOrderSort)}&sortOrder=\${encodeURIComponent(currentOrderSortDir)}\`;`,
  `const url = \`/api/admin/reading-orders?page=\${page}&limit=20&search=\${encodeURIComponent(search)}&universe=\${encodeURIComponent(universe)}&category=\${encodeURIComponent(category)}&status=\${encodeURIComponent(status)}&issueRange=\${encodeURIComponent(issueRange)}&sortBy=\${encodeURIComponent(currentOrderSort)}&sortOrder=\${encodeURIComponent(currentOrderSortDir)}\`;`
);

// Update colspan from 7 to 8 for empty/loading rows
adminHtml = adminHtml.replace(/colspan="7"/g, 'colspan="8"');

// Update row template to include getCategoryBadge
const oldRowTemplate = `tbody.innerHTML = rows.map(ro => {
            const isComingSoon = ro.is_coming_soon;
            return \`
            <tr style="\${isComingSoon ? 'background: rgba(254, 243, 199, 0.25);' : ''}">
              <td><span style="color: var(--text-dim); font-size: 12px;">#\${ro.id}</span></td>
              <td>
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                  <strong style="color: var(--text-main); font-size: 14px;">\${ro.title}</strong>
                  \${isComingSoon ? \`
                    <span class="badge" style="background: #fffbeb; color: #b45309; border: 1px solid #fde68a; font-size: 10.5px; padding: 2px 7px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                      <i class="fa-solid fa-clock-rotate-left" style="color: #d97706;"></i> Coming Soon
                    </span>
                  \` : ''}
                </div>
                <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">/\${ro.slug}/</div>
              </td>
              <td>
                <span class="badge badge-\${ro.universe_slug || 'other'}">\${(ro.universe_slug || 'other').toUpperCase()}</span>
              </td>`;

const newRowTemplate = `tbody.innerHTML = rows.map(ro => {
            const isComingSoon = ro.is_coming_soon;
            const catBadge = renderOrderCategoryBadge(ro);
            return \`
            <tr style="\${isComingSoon ? 'background: rgba(254, 243, 199, 0.25);' : ''}">
              <td><span style="color: var(--text-dim); font-size: 12px;">#\${ro.id}</span></td>
              <td>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <strong style="color: var(--text-main); font-size: 14px;">\${ro.title}</strong>
                  \${catBadge}
                  \${isComingSoon ? \`
                    <span class="badge" style="background: #fffbeb; color: #b45309; border: 1px solid #fde68a; font-size: 10.5px; padding: 2px 7px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                      <i class="fa-solid fa-clock-rotate-left" style="color: #d97706;"></i> Coming Soon
                    </span>
                  \` : ''}
                </div>
                <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">/\${ro.slug}/</div>
              </td>
              <td>
                \${catBadge}
              </td>
              <td>
                <span class="badge badge-\${ro.universe_slug || 'other'}">\${(ro.universe_slug || 'other').toUpperCase()}</span>
              </td>`;

if (adminHtml.includes(oldRowTemplate)) {
  adminHtml = adminHtml.replace(oldRowTemplate, newRowTemplate);
  console.log('Updated row template with category badge column and inline badge');
}

// Add renderOrderCategoryBadge function before loadOrders
const catBadgeFunction = `
    // Helper hiển thị Huy hiệu Phân loại (Nhân vật / Sự kiện / Toàn diện / Tuyến truyện)
    function renderOrderCategoryBadge(ro) {
      const cat = (ro.category_slug || (ro.categories ? ro.categories.slug : '') || '').toLowerCase();
      if (cat === 'characters') {
        return \`<span class="badge" style="background: rgba(147, 51, 234, 0.12); color: #7e22ce; border: 1px solid rgba(147, 51, 234, 0.35); font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;" title="Bộ thứ tự đọc theo Nhân vật">
          <i class="fa-solid fa-user"></i> Nhân vật
        </span>\`;
      }
      if (cat === 'events') {
        return \`<span class="badge" style="background: rgba(234, 88, 12, 0.12); color: #c2410c; border: 1px solid rgba(234, 88, 12, 0.35); font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;" title="Bộ thứ tự đọc Đại Sự Kiện Crossover">
          <i class="fa-solid fa-bolt"></i> Sự kiện
        </span>\`;
      }
      if (cat === 'master') {
        return \`<span class="badge" style="background: rgba(225, 29, 72, 0.12); color: #be123c; border: 1px solid rgba(225, 29, 72, 0.35); font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;" title="Thứ Tự Đọc Toàn Diện (Master Reading Order)">
          <i class="fa-solid fa-crown"></i> Toàn diện
        </span>\`;
      }
      if (cat === 'series') {
        return \`<span class="badge" style="background: rgba(14, 116, 144, 0.12); color: #0e7490; border: 1px solid rgba(14, 116, 144, 0.35); font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;" title="Tuyến truyện / Đầu truyện độc lập">
          <i class="fa-solid fa-book-open"></i> Tuyến truyện
        </span>\`;
      }
      return \`<span class="badge" style="background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; font-size: 11px; padding: 3px 8px; border-radius: 4px;">Khác</span>\`;
    }
`;

if (!adminHtml.includes('function renderOrderCategoryBadge')) {
  adminHtml = adminHtml.replace('// TAB 2: TẢI ORDERS', catBadgeFunction + '\n    // TAB 2: TẢI ORDERS');
  console.log('Injected renderOrderCategoryBadge function');
}

// E. Update resetOrderFilters to reset category filter
adminHtml = adminHtml.replace(
  `document.getElementById('order-universe-filter').value = '';`,
  `document.getElementById('order-universe-filter').value = '';\n      const catFilter = document.getElementById('order-category-filter');\n      if (catFilter) catFilter.value = '';`
);

// F. Update syncSortControls to include 'category'
adminHtml = adminHtml.replace(
  `const fields = ['id', 'title', 'universe', 'year', 'issues'];`,
  `const fields = ['id', 'title', 'category', 'universe', 'year', 'issues'];`
);

// G. In Tab 1: Add Category Breakdown box with one-click filter actions
const oldOverviewBox = `<div class="data-box">
            <div class="box-header">
              <div class="box-title">
                <i class="fa-solid fa-chart-column" style="color: #60a5fa;"></i> Phân Bổ Theo Vũ Trụ
              </div>
            </div>`;

const newOverviewBox = `<div class="data-box" style="margin-bottom: 20px;">
            <div class="box-header">
              <div class="box-title">
                <i class="fa-solid fa-shapes" style="color: #9333ea;"></i> Phân Loại Thứ Tự Đọc (Bấm để lọc nhanh)
              </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
              <div onclick="filterByCategory('characters')" style="cursor: pointer; background: var(--bg-card); border-left: 4px solid #9333ea; padding: 16px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: transform 0.15s ease;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <h4 style="color: #7e22ce; font-size: 15px; display: flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-user"></i> Nhân Vật (Characters)
                  </h4>
                  <span style="background: rgba(147, 51, 234, 0.15); color: #7e22ce; font-weight: 900; font-size: 13px; padding: 2px 8px; border-radius: 12px;">246 bộ</span>
                </div>
                <p style="font-size: 12.5px; color: var(--text-muted); line-height: 1.4;">Thứ tự đọc xoay quanh từng nhân vật, nhóm anh hùng (Batman, Spider-Man, Wolverine...)</p>
              </div>

              <div onclick="filterByCategory('events')" style="cursor: pointer; background: var(--bg-card); border-left: 4px solid #ea580c; padding: 16px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: transform 0.15s ease;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <h4 style="color: #c2410c; font-size: 15px; display: flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-bolt"></i> Sự Kiện (Events)
                  </h4>
                  <span style="background: rgba(234, 88, 12, 0.15); color: #c2410c; font-weight: 900; font-size: 13px; padding: 2px 8px; border-radius: 12px;">282 bộ</span>
                </div>
                <p style="font-size: 12.5px; color: var(--text-muted); line-height: 1.4;">Các đại sự kiện crossover lớn (Civil War, Secret Wars, Death of Superman, Zero Year...)</p>
              </div>

              <div onclick="filterByCategory('master')" style="cursor: pointer; background: var(--bg-card); border-left: 4px solid #e11d48; padding: 16px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: transform 0.15s ease;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <h4 style="color: #be123c; font-size: 15px; display: flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-crown"></i> Toàn Diện (Master)
                  </h4>
                  <span style="background: rgba(225, 29, 72, 0.15); color: #be123c; font-weight: 900; font-size: 13px; padding: 2px 8px; border-radius: 12px;">40 bộ</span>
                </div>
                <p style="font-size: 12.5px; color: var(--text-muted); line-height: 1.4;">Lộ trình đọc toàn diện theo từng Part, kỷ nguyên lớn của toàn bộ vũ trụ Marvel & DC</p>
              </div>

              <div onclick="filterByCategory('series')" style="cursor: pointer; background: var(--bg-card); border-left: 4px solid #0e7490; padding: 16px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: transform 0.15s ease;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <h4 style="color: #0e7490; font-size: 15px; display: flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-book-open"></i> Tuyến Truyện (Series)
                  </h4>
                  <span style="background: rgba(14, 116, 144, 0.15); color: #0e7490; font-weight: 900; font-size: 13px; padding: 2px 8px; border-radius: 12px;">41 bộ</span>
                </div>
                <p style="font-size: 12.5px; color: var(--text-muted); line-height: 1.4;">Các bộ truyện dài kỳ, truyện độc lập (TMNT, The Boys, Transformers, Spawn...)</p>
              </div>
            </div>
          </div>

          <div class="data-box">
            <div class="box-header">
              <div class="box-title">
                <i class="fa-solid fa-chart-column" style="color: #60a5fa;"></i> Phân Bổ Theo Vũ Trụ
              </div>
            </div>`;

if (adminHtml.includes(oldOverviewBox)) {
  adminHtml = adminHtml.replace(oldOverviewBox, newOverviewBox);
  console.log('Added Category breakdown cards to Overview tab');
}

// Add filterByCategory helper function
const filterByCategoryFunction = `
    function filterByCategory(cat) {
      switchTab('orders');
      const catFilter = document.getElementById('order-category-filter');
      if (catFilter) catFilter.value = cat;
      loadOrders(1);
    }
`;

if (!adminHtml.includes('function filterByCategory')) {
  adminHtml = adminHtml.replace('// Lọc nhanh các bộ Coming Soon từ Dashboard', filterByCategoryFunction + '\n    // Lọc nhanh các bộ Coming Soon từ Dashboard');
}

fs.writeFileSync(adminHtmlPath, adminHtml, 'utf8');
console.log('Updated admin/index.html with full category distinction features!');
