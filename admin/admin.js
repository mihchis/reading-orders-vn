// Helper bảo mật chuỗi HTML
    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // State Quản trị
    let currentAdminToken = localStorage.getItem('admin_token') || localStorage.getItem('ro_token') || '';
    let currentAdminUser = null;
    let currentOrderPage = 1;
    let searchDebounceTimer = null;
    let currentEditingIssues = [];
    let currentSelectedOrderId = null;

    // Khởi tạo
    document.addEventListener('DOMContentLoaded', async () => {
      checkAuthAndInit();
    });

    // Điền tài khoản admin mặc định
    function fillAdminDefaults() {
      const u = document.getElementById('admin-username');
      const p = document.getElementById('admin-password');
      if (u) {
        u.disabled = false;
        u.removeAttribute('disabled');
        u.value = 'admin';
      }
      if (p) {
        p.type = 'password';
        p.disabled = false;
        p.removeAttribute('disabled');
        p.value = 'admin123';
        // Không gọi p.focus() trên mobile để tránh ép bật bàn phím
      }
    }

    // Kiểm tra đăng nhập
    async function checkAuthAndInit() {
      // Ưu tiên đọc admin_token, sau đó đến ro_token
      currentAdminToken = localStorage.getItem('admin_token') || localStorage.getItem('ro_token') || '';

      const cachedUser = (function() {
        try {
          return JSON.parse(localStorage.getItem('ro_user') || 'null');
        } catch { return null; }
      })();

      if (!currentAdminToken) {
        showLoginScreen(cachedUser);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${currentAdminToken}` }
        });
        const data = await res.json();

        if (data.success && (data.user?.role === 'admin' || data.admin)) {
          currentAdminUser = data.user || data.admin;
          localStorage.setItem('admin_token', currentAdminToken);
          localStorage.setItem('ro_token', currentAdminToken);
          localStorage.setItem('ro_user', JSON.stringify(currentAdminUser));
          initDashboardView();
        } else if (data.success && data.user) {
          // Người dùng đang đăng nhập với tư cách Độc giả (reader/user)
          showLoginScreen(data.user);
        } else {
          // Token hết hạn hoặc không hợp lệ
          showLoginScreen(cachedUser, data.message || 'Phiên đăng nhập đã hết hạn.');
        }
      } catch (err) {
        // Fallback: Nếu mất mạng / offline nhưng có session admin cached
        if (cachedUser && cachedUser.role === 'admin') {
          currentAdminUser = cachedUser;
          initDashboardView();
        } else {
          showLoginScreen(cachedUser);
        }
      }
    }

    function showLoginScreen(readerUser = null, errorMsg = null) {
      const loader = document.getElementById('admin-init-loader');
      if (loader) loader.style.display = 'none';

      const p = document.getElementById('admin-password');
      if (p) {
        p.type = 'password';
        p.disabled = false;
        p.removeAttribute('disabled');
      }
      const u = document.getElementById('admin-username');
      if (u) {
        u.disabled = false;
        u.removeAttribute('disabled');
      }

      document.getElementById('login-screen').style.display = 'flex';
      document.getElementById('dashboard-screen').style.display = 'none';

      const noticeBox = document.getElementById('reader-notice');
      const errorBox = document.getElementById('login-error');

      if (readerUser && readerUser.role !== 'admin') {
        const displayName = readerUser.display_name || readerUser.username || 'Độc giả';
        if (noticeBox) {
          noticeBox.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; color: #92400e;">
              <i class="fa-solid fa-circle-exclamation" style="font-size: 16px; color: #d97706;"></i>
              <span>Bạn đang đăng nhập tài khoản Độc giả: <strong>${escapeHtml(displayName)}</strong></span>
            </div>
            <div style="font-size: 12.5px; color: #78350f; line-height: 1.5;">
              Trang này là khu vực quản trị dữ liệu dành riêng cho <strong>Quản Trị Viên (Admin)</strong>. Tài khoản độc giả thông thường không có quyền truy cập vào bảng điều khiển Admin.
            </div>
            <div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" onclick="fillAdminDefaults()" class="btn-action" style="font-size: 12px; padding: 5px 12px; background: #fff; border-color: #f59e0b; color: #b45309; font-weight: 700; cursor: pointer;">
                <i class="fa-solid fa-key"></i> Điền tài khoản Admin mẫu
              </button>
              <a href="/" class="btn-action" style="font-size: 12px; padding: 5px 12px; background: #fff; border-color: #d1d5db; color: #374151; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                <i class="fa-solid fa-arrow-left"></i> Quay lại Trang chủ
              </a>
            </div>
          `;
          noticeBox.style.display = 'block';
        }
      } else {
        if (noticeBox) {
          noticeBox.style.display = 'none';
          noticeBox.innerHTML = '';
        }
      }

      if (errorBox) {
        if (errorMsg) {
          errorBox.textContent = errorMsg;
          errorBox.style.display = 'block';
        } else {
          errorBox.style.display = 'none';
        }
      }
    }

    function showDashboardScreen() {
      const loader = document.getElementById('admin-init-loader');
      if (loader) loader.style.display = 'none';

      document.getElementById('login-screen').style.display = 'none';

      // VÔ HIỆU HÓA HOÀN TOÀN INPUT PASSWORD ĐỂ TRÌNH DUYỆT ĐIỆN THOẠI (IOS/ANDROID)
      // KHÔNG TỰ ĐỘNG BẬT BÀN PHÍM HOẶC AUTOFILL MẬT KHẨU KHI ĐANG DÙNG ADMIN
      const p = document.getElementById('admin-password');
      if (p) {
        p.value = '';
        p.disabled = true;
        p.setAttribute('disabled', 'disabled');
        p.type = 'text'; // Chuyển thành text thông thường để triệt tiêu mọi password heuristic
      }
      const u = document.getElementById('admin-username');
      if (u) {
        u.disabled = true;
        u.setAttribute('disabled', 'disabled');
      }

      document.getElementById('dashboard-screen').style.display = 'flex';

      if (currentAdminUser) {
        const name = currentAdminUser.display_name || currentAdminUser.username || 'Admin';
        document.getElementById('display-user-name').textContent = name;
        document.getElementById('avatar-initial').textContent = name.charAt(0).toUpperCase();
      }
    }

    // Xử lý đăng nhập Form
    document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('admin-username').value.trim();
      const password = document.getElementById('admin-password').value;
      const errorBox = document.getElementById('login-error');
      const submitBtn = document.getElementById('btn-login');

      errorBox.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác thực...';

      try {
        let data = null;
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          data = await res.json();
        } catch (fetchErr) {
          // Bỏ qua lỗi kết nối để kiểm tra fallback admin nội bộ
        }

        // Fallback nếu mất mạng hoặc máy chủ chưa sẵn sàng
        if (!data && username === 'admin' && password === 'admin123') {
          data = {
            success: true,
            message: 'Đăng nhập Quản trị viên thành công!',
            token: 'local-admin-token-' + Date.now(),
            user: { id: 1, username: 'admin', display_name: 'Quản Trị Viên', role: 'admin' },
            admin: { id: 1, username: 'admin', display_name: 'Quản Trị Viên', role: 'admin' }
          };
        }

        if (data && data.success && (data.user?.role === 'admin' || data.admin)) {
          currentAdminToken = data.token;
          localStorage.setItem('ro_token', data.token);
          localStorage.setItem('admin_token', data.token);
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('ro_user', JSON.stringify(data.user || data.admin));
          currentAdminUser = data.user || data.admin;
          showToast('Đăng nhập Quản trị viên thành công!', 'success');
          initDashboardView();
        } else {
          errorBox.textContent = data?.message || 'Tài khoản không có quyền Quản trị viên';
          errorBox.style.display = 'block';
        }
      } catch (err) {
        errorBox.textContent = 'Lỗi kết nối tới máy chủ';
        errorBox.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Đăng nhập Quản Trị Viên';
      }
    });

    function handleLogout() {
      if (confirm('Bạn có chắc chắn muốn đăng xuất tài khoản Quản trị?')) {
        localStorage.removeItem('ro_token');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('ro_user');
        currentAdminToken = '';
        currentAdminUser = null;
        showLoginScreen();
      }
    }

    // Toggle Sidebar (dành cho mobile drawer)
    function toggleSidebar() {
      document.body.classList.toggle('sidebar-open');
    }

    // Toggle Thu gọn / Mở rộng Sidebar (dành cho desktop)
    function toggleSidebarCollapse() {
      const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
      localStorage.setItem('admin_sidebar_collapsed', isCollapsed ? 'true' : 'false');

      // Cập nhật icon collapse button nếu có
      const collapseIcon = document.querySelector('#btn-collapse-sidebar i');
      if (collapseIcon) {
        collapseIcon.className = isCollapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left';
      }
      const topbarCollapseIcon = document.querySelector('#topbar-collapse-btn i');
      if (topbarCollapseIcon) {
        topbarCollapseIcon.className = isCollapsed ? 'fa-solid fa-bars' : 'fa-solid fa-bars-staggered';
      }
    }

    // Tự động phục hồi trạng thái thu gọn sidebar từ localStorage khi khởi động
    if (localStorage.getItem('admin_sidebar_collapsed') === 'true' && window.innerWidth > 900) {
      document.body.classList.add('sidebar-collapsed');
    }

    // Hỗ trợ phím tắt Ctrl + B (hoặc Cmd + B) để thu gọn / mở rộng menu nhanh
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          toggleSidebarCollapse();
        }
      }
    });

    const VALID_TABS = ['overview', 'orders', 'issues', 'users', 'universes', 'tools'];

    function getActiveTabState() {
      const urlParams = new URLSearchParams(window.location.search);
      const tabFromQuery = urlParams.get('tab');
      if (tabFromQuery && VALID_TABS.includes(tabFromQuery)) {
        return {
          tab: tabFromQuery,
          orderId: urlParams.get('orderId'),
          page: urlParams.get('page')
        };
      }

      const hash = window.location.hash.replace('#', '').trim();
      if (hash && VALID_TABS.includes(hash)) {
        return {
          tab: hash,
          orderId: null,
          page: null
        };
      }

      const savedTab = localStorage.getItem('admin_active_tab');
      if (savedTab && VALID_TABS.includes(savedTab)) {
        return {
          tab: savedTab,
          orderId: null,
          page: null
        };
      }

      return { tab: 'overview', orderId: null, page: null };
    }

    function initDashboardView() {
      showDashboardScreen();
      const tabState = getActiveTabState();
      switchTab(tabState.tab, false);

      // Đồng bộ URL ngay khi mở để F5 hoặc copy link không bị mất tab
      try {
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.get('tab') !== tabState.tab) {
          currentUrl.searchParams.set('tab', tabState.tab);
          currentUrl.hash = tabState.tab;
          window.history.replaceState({ tab: tabState.tab }, '', currentUrl.pathname + currentUrl.search + currentUrl.hash);
        }
      } catch (e) {}

      // Khởi tạo chế độ hiển thị Bảng / Thẻ
      try {
        const savedViewMode = localStorage.getItem('ro_admin_view_mode');
        const wrapper = document.getElementById('orders-table-wrapper');
        const text = document.getElementById('view-mode-text');
        const icon = document.getElementById('view-mode-icon');
        if (savedViewMode === 'table') {
          if (wrapper) wrapper.classList.add('table-view-forced');
          if (text) text.textContent = 'Thẻ';
          if (icon) icon.className = 'fa-solid fa-grip-vertical';
        } else {
          if (wrapper) wrapper.classList.remove('table-view-forced');
          if (text) text.textContent = 'Bảng';
          if (icon) icon.className = 'fa-solid fa-table-cells-large';
        }
      } catch (e) {}

      if (tabState.tab === 'issues' && tabState.orderId) {
        setTimeout(() => {
          jumpToIssues(tabState.orderId);
        }, 250);
      }
    }

    // Điều hướng Tabs có quản lý URL và lưu trạng thái
    function switchTab(tabId, updateUrl = true) {
      if (!VALID_TABS.includes(tabId)) tabId = 'overview';

      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.sidebar-nav button').forEach(b => b.classList.remove('active'));

      const activePanel = document.getElementById(`tab-${tabId}`);
      if (activePanel) activePanel.classList.add('active');

      const activeBtn = Array.from(document.querySelectorAll('.sidebar-nav button')).find(b => b.getAttribute('onclick')?.includes(`'${tabId}'`));
      if (activeBtn) activeBtn.classList.add('active');

      const headings = {
        overview: 'Tổng Quan Thống Kê',
        orders: 'Quản Lý 608 Thứ Tự Đọc',
        issues: 'Quản Lý Tập & Link Đọc Online',
        users: 'Độc Giả & Tiến Độ Đọc',
        universes: 'Vũ Trụ & Danh Mục',
        tools: 'Đồng Bộ & Sao Lưu Dữ Liệu'
      };
      const headingElem = document.getElementById('page-heading');
      if (headingElem) headingElem.textContent = headings[tabId] || 'Quản Trị';

      // Tự đóng sidebar sau khi chọn tab (dành cho mobile)
      if (window.innerWidth <= 900 && document.body.classList.contains('sidebar-open')) {
        document.body.classList.remove('sidebar-open');
      }

      // Lưu tab vào localStorage để refresh luôn giữ đúng tab
      localStorage.setItem('admin_active_tab', tabId);

      // Cập nhật URL trình duyệt (đồng bộ cả query ?tab= và hash #...)
      if (updateUrl) {
        try {
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('tab', tabId);
          if (tabId !== 'issues') {
            currentUrl.searchParams.delete('orderId');
          }
          currentUrl.hash = tabId;
          window.history.pushState({ tab: tabId }, '', currentUrl.pathname + currentUrl.search + currentUrl.hash);
        } catch (e) {}
      }

      // Nạp dữ liệu tương ứng khi mở tab
      if (tabId === 'overview') loadDashboardStats();
      if (tabId === 'orders') loadOrders(currentOrderPage || 1);
      if (tabId === 'issues') populateOrderDropdownForIssues();
      if (tabId === 'users') loadUsers();
      if (tabId === 'universes') loadUniverses();
    }

    // Lắng nghe sự kiện Back/Forward của trình duyệt
    window.addEventListener('popstate', (e) => {
      const tabState = getActiveTabState();
      switchTab(tabState.tab, false);
      if (tabState.tab === 'issues' && tabState.orderId) {
        jumpToIssues(tabState.orderId);
      }
    });

    window.addEventListener('hashchange', () => {
      const tabState = getActiveTabState();
      switchTab(tabState.tab, false);
    });

    function refreshCurrentTab() {
      const activePanel = document.querySelector('.tab-panel.active');
      if (!activePanel) return;
      const tabId = activePanel.id.replace('tab-', '');
      switchTab(tabId);
      showToast('Đã làm mới dữ liệu', 'success');
    }

    // Helper gọi API có Auth
    async function apiFetch(url, options = {}) {
      options.headers = options.headers || {};
      options.headers['Authorization'] = `Bearer ${currentAdminToken}`;
      if (options.body && typeof options.body === 'object') {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
      }
      return fetch(url, options);
    }

    // TAB 1: TẢI STATS
    async function loadDashboardStats() {
      try {
        const res = await apiFetch('/api/admin/stats');
        const json = await res.json();
        if (json.success) {
          const d = json.data;
          document.getElementById('stat-total-orders').textContent = (d.totalOrders || 608).toLocaleString();
          document.getElementById('stat-total-issues').textContent = (d.totalIssues || 95859).toLocaleString();
          document.getElementById('stat-total-universes').textContent = d.totalUniverses || 3;
          document.getElementById('stat-total-links').textContent = (d.totalReadLinks || 0).toLocaleString();
          if (document.getElementById('stat-total-coming-soon')) {
            document.getElementById('stat-total-coming-soon').textContent = (d.totalComingSoon || 26).toLocaleString();
          }
        }
      } catch (e) {}
    }

    // Trạng thái Sắp xếp & Lọc Orders
    let currentOrderSort = 'id';
    let currentOrderSortDir = 'desc';

    function setOrderSort(field) {
      if (currentOrderSort === field) {
        currentOrderSortDir = currentOrderSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        currentOrderSort = field;
        currentOrderSortDir = (field === 'title' || field === 'universe') ? 'asc' : 'desc';
      }
      syncSortControls();
      loadOrders(1);
    }

    function handleSortSelectChange() {
      const val = document.getElementById('order-sort-select').value;
      const [field, dir] = val.split('-');
      currentOrderSort = field;
      currentOrderSortDir = dir;
      syncSortControls();
      loadOrders(1);
    }

    function syncSortControls() {
      const sel = document.getElementById('order-sort-select');
      if (sel) sel.value = `${currentOrderSort}-${currentOrderSortDir}`;

      const fields = ['id', 'title', 'category', 'universe', 'year', 'issues'];
      fields.forEach(f => {
        const icon = document.getElementById(`sort-icon-${f}`);
        const th = icon?.closest('th');
        if (!icon) return;
        if (f === currentOrderSort) {
          th?.classList.add('active-sort');
          icon.className = `fa-solid fa-sort-${currentOrderSortDir === 'asc' ? 'up' : 'down'} sort-icon active`;
        } else {
          th?.classList.remove('active-sort');
          icon.className = 'fa-solid fa-sort sort-icon';
        }
      });
    }

    function resetOrderFilters() {
      document.getElementById('order-search').value = '';
      document.getElementById('order-universe-filter').value = '';
      const catFilter = document.getElementById('order-category-filter');
      if (catFilter) catFilter.value = '';
      document.getElementById('order-status-filter').value = '';
      const issuesFilter = document.getElementById('order-issues-filter');
      if (issuesFilter) issuesFilter.value = '';
      currentOrderSort = 'id';
      currentOrderSortDir = 'desc';
      syncSortControls();
      loadOrders(1);
    }

    
    function filterByCategory(cat) {
      switchTab('orders');
      const catFilter = document.getElementById('order-category-filter');
      if (catFilter) catFilter.value = cat;
      loadOrders(1);
    }

    // Lọc nhanh các bộ Coming Soon từ Dashboard
    function filterComingSoonOrders() {
      switchTab('orders');
      const filter = document.getElementById('order-status-filter');
      if (filter) filter.value = 'coming_soon';
      loadOrders(1);
    }

    
    // Helper hiển thị Huy hiệu Phân loại (Nhân vật / Sự kiện / Toàn diện / Tuyến truyện)
    function renderOrderCategoryBadge(ro) {
      const cat = (ro.category_slug || (ro.categories ? ro.categories.slug : '') || '').toLowerCase();
      if (cat === 'characters') {
        return `<span class="badge" style="background: rgba(147, 51, 234, 0.12); color: #7e22ce; border: 1px solid rgba(147, 51, 234, 0.35); font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;" title="Bộ thứ tự đọc theo Nhân vật">
          <i class="fa-solid fa-user"></i> Nhân vật
        </span>`;
      }
      if (cat === 'events') {
        return `<span class="badge" style="background: rgba(234, 88, 12, 0.12); color: #c2410c; border: 1px solid rgba(234, 88, 12, 0.35); font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;" title="Bộ thứ tự đọc Đại Sự Kiện Crossover">
          <i class="fa-solid fa-bolt"></i> Sự kiện
        </span>`;
      }
      if (cat === 'master') {
        return `<span class="badge" style="background: rgba(225, 29, 72, 0.12); color: #be123c; border: 1px solid rgba(225, 29, 72, 0.35); font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;" title="Thứ Tự Đọc Toàn Diện (Master Reading Order)">
          <i class="fa-solid fa-crown"></i> Toàn diện
        </span>`;
      }
      if (cat === 'series') {
        return `<span class="badge" style="background: rgba(14, 116, 144, 0.12); color: #0e7490; border: 1px solid rgba(14, 116, 144, 0.35); font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;" title="Tuyến truyện / Đầu truyện độc lập">
          <i class="fa-solid fa-book-open"></i> Tuyến truyện
        </span>`;
      }
      return `<span class="badge" style="background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; font-size: 11px; padding: 3px 8px; border-radius: 4px;">Khác</span>`;
    }

    // TAB 2: TẢI ORDERS
    async function loadOrders(page = 1) {
      currentOrderPage = page;
      const search = document.getElementById('order-search').value.trim();
      const universe = document.getElementById('order-universe-filter').value;
      const category = document.getElementById('order-category-filter')?.value || '';
      const status = document.getElementById('order-status-filter')?.value || '';
      const issueRange = document.getElementById('order-issues-filter')?.value || '';
      const tbody = document.getElementById('orders-table-body');
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 25px;">Đang tải danh sách...</td></tr>';

      try {
        const url = `/api/admin/reading-orders?page=${page}&limit=20&search=${encodeURIComponent(search)}&universe=${encodeURIComponent(universe)}&category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}&issueRange=${encodeURIComponent(issueRange)}&sortBy=${encodeURIComponent(currentOrderSort)}&sortOrder=${encodeURIComponent(currentOrderSortDir)}`;
        const res = await apiFetch(url);
        const json = await res.json();

        if (json.success) {
          const rows = json.data;
          if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 25px; color: var(--text-dim);">Không tìm thấy thứ tự đọc nào</td></tr>';
            return;
          }

          tbody.innerHTML = rows.map(ro => {
            const isComingSoon = ro.is_coming_soon;
            const catBadge = renderOrderCategoryBadge(ro);
            const universeSlug = ro.universe_slug || 'other';
            const yearStr = ro.year_published || '-';
            const issuesStr = isComingSoon 
              ? `<span style="color: #d97706; font-weight: 700; font-size: 12.5px;">0 tập</span>`
              : `<span class="issues-count"><strong>${(ro.total_issues || 0).toLocaleString()}</strong> tập</span>`;
            
            const statusBadge = isComingSoon
              ? `<span class="badge badge-editing" style="background: rgba(245, 158, 11, 0.15); color: #b45309; border: 1px solid rgba(245, 158, 11, 0.35); font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-hourglass-half"></i> Coming Soon</span>`
              : `<span class="badge ${ro.is_published ? 'badge-published' : 'badge-draft'}" style="${ro.is_published ? 'background: rgba(16, 185, 129, 0.18); color: #047857; border: 1px solid rgba(16, 185, 129, 0.35);' : 'background: rgba(107, 114, 128, 0.15); color: #4b5563; border: 1px solid rgba(107, 114, 128, 0.3);'} font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">${ro.is_published ? '<i class="fa-solid fa-circle-check"></i> Xuất bản' : '<i class="fa-regular fa-file"></i> Bản nháp'}</span>`;

            return `
            <tr class="order-row ${isComingSoon ? 'is-coming-soon' : ''} universe-${universeSlug}" style="${isComingSoon ? 'background: rgba(254, 243, 199, 0.25);' : ''}">
              <td class="col-id">
                <div class="mobile-card-header">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="id-badge">#${ro.id}</span>
                    ${catBadge}
                  </div>
                  <div class="mobile-header-badges">
                    <span class="badge badge-${universeSlug}">${universeSlug.toUpperCase()}</span>
                    ${statusBadge}
                  </div>
                </div>
                <span class="desktop-only-id" style="color: var(--text-dim); font-size: 12px; font-weight: 700;">#${ro.id}</span>
              </td>
              <td class="col-title">
                <strong class="order-title" style="color: var(--text-main); font-size: 14.5px; display: block; line-height: 1.4;">${escapeAdminHtml(ro.title)}</strong>
                <div class="order-slug" style="font-size: 11.5px; color: var(--text-dim); margin-top: 3px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">/${escapeAdminHtml(ro.slug)}/</div>
                <div class="mobile-card-meta">
                  <span class="meta-item"><i class="fa-regular fa-calendar"></i> Năm: <strong>${yearStr}</strong></span>
                  <span class="meta-item"><i class="fa-solid fa-book-open"></i> Số tập: ${issuesStr}</span>
                </div>
              </td>
              <td class="col-category desktop-col">
                ${catBadge}
              </td>
              <td class="col-universe desktop-col">
                <span class="badge badge-${universeSlug}">${universeSlug.toUpperCase()}</span>
              </td>
              <td class="col-year desktop-col">${yearStr}</td>
              <td class="col-issues desktop-col">${issuesStr}</td>
              <td class="col-status desktop-col">${statusBadge}</td>
              <td class="col-actions">
                <div class="actions-grid">
                  <button class="btn-action btn-edit" onclick="openEditOrderModal(${ro.id})" title="Chỉnh sửa thông tin"><i class="fa-solid fa-pen"></i> <span>Sửa</span></button>
                  ${isComingSoon
                    ? `<button class="btn-action" style="background: #fffbeb; color: #b45309; border-color: #f59e0b; font-weight: 700;" onclick="openOrderContentEditor('${ro.slug}', '${universeSlug}', '${ro.title.replace(/'/g, "\\'")}')" title="Bấm để cập nhật danh sách tập truyện"><i class="fa-solid fa-file-circle-plus"></i> <span>Cập nhật tập</span></button>`
                    : `<button class="btn-action" onclick="openOrderContentEditor('${ro.slug}', '${universeSlug}', '${ro.title.replace(/'/g, "\\'")}')" title="Sửa danh sách tập HTML"><i class="fa-solid fa-list-check"></i> <span>Sửa tập</span></button>`
                  }
                  <button class="btn-action" onclick="jumpToIssues(${ro.id})" title="Gắn link đọc"><i class="fa-solid fa-link"></i> <span>Link đọc</span></button>
                  <button class="btn-action btn-danger" onclick="deleteOrder(${ro.id}, '${ro.title.replace(/'/g, "\\'")}')" title="Xóa"><i class="fa-solid fa-trash"></i> <span>Xóa</span></button>
                </div>
              </td>
            </tr>
          `;
          }).join('');

          const p = json.pagination;
          document.getElementById('page-info').textContent = `Trang ${p.page} / ${p.totalPages || 1} (${p.total} bộ)`;
          document.getElementById('btn-prev-page').disabled = p.page <= 1;
          document.getElementById('btn-next-page').disabled = p.page >= p.totalPages;
          updateFilterActiveCount();
        }
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--color-danger); padding: 25px;">Lỗi tải danh sách thứ tự đọc</td></tr>';
      }
    }

    function changeOrderPage(delta) {
      loadOrders(currentOrderPage + delta);
    }

    function debounceSearchOrders() {
      const searchVal = document.getElementById('order-search').value.trim();
      const clearBtn = document.getElementById('btn-clear-search');
      if (clearBtn) clearBtn.style.display = searchVal ? 'inline-flex' : 'none';

      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        loadOrders(1);
      }, 350);
    }

    function clearOrderSearch() {
      const searchInput = document.getElementById('order-search');
      searchInput.value = '';
      const clearBtn = document.getElementById('btn-clear-search');
      if (clearBtn) clearBtn.style.display = 'none';
      loadOrders(1);
    }

    // Toggle drawer bộ lọc trên mobile
    function toggleMobileFilters() {
      const drawer = document.getElementById('filter-drawer');
      const toggleBtn = document.getElementById('btn-toggle-filters');
      if (drawer) {
        drawer.classList.toggle('open');
        if (toggleBtn) {
          toggleBtn.classList.toggle('active', drawer.classList.contains('open'));
        }
      }
    }

    // Cập nhật số bộ lọc đang chọn
    function updateFilterActiveCount() {
      let count = 0;
      const universe = document.getElementById('order-universe-filter')?.value || '';
      const category = document.getElementById('order-category-filter')?.value || '';
      const status = document.getElementById('order-status-filter')?.value || '';
      const issueRange = document.getElementById('order-issues-filter')?.value || '';
      const sort = document.getElementById('order-sort-select')?.value || '';
      const search = document.getElementById('order-search')?.value.trim() || '';

      if (universe) count++;
      if (category) count++;
      if (status) count++;
      if (issueRange) count++;
      if (sort && sort !== 'id-desc') count++;
      if (search) count++;

      const badge = document.getElementById('filter-active-count');
      if (badge) {
        if (count > 0) {
          badge.textContent = count;
          badge.style.display = 'inline-flex';
        } else {
          badge.style.display = 'none';
        }
      }
    }

    function onOrderFilterChange() {
      updateFilterActiveCount();
      loadOrders(1);
    }

    // Chuyển đổi giữa Dạng Thẻ và Dạng Bảng trên mobile
    function toggleOrderViewMode() {
      const wrapper = document.getElementById('orders-table-wrapper');
      const text = document.getElementById('view-mode-text');
      const icon = document.getElementById('view-mode-icon');
      if (!wrapper) return;

      const isTableForced = wrapper.classList.toggle('table-view-forced');
      if (isTableForced) {
        if (text) text.textContent = 'Thẻ';
        if (icon) icon.className = 'fa-solid fa-grip-vertical';
        localStorage.setItem('ro_admin_view_mode', 'table');
        showToast('Đã chuyển sang dạng bảng dữ liệu', 'success');
      } else {
        if (text) text.textContent = 'Bảng';
        if (icon) icon.className = 'fa-solid fa-table-cells-large';
        localStorage.setItem('ro_admin_view_mode', 'card');
        showToast('Đã chuyển sang dạng thẻ đọc', 'success');
      }
    }

    // Modal Sửa Order
    async function openEditOrderModal(orderId) {
      try {
        const res = await apiFetch(`/api/admin/reading-orders/${orderId}`);
        const json = await res.json();
        if (json.success) {
          const o = json.data;
          document.getElementById('order-modal-title').textContent = `Chỉnh Sửa: ${o.title}`;
          document.getElementById('edit-order-id').value = o.id;
          document.getElementById('edit-order-title').value = o.title || '';
          document.getElementById('edit-order-slug').value = o.slug || '';
          document.getElementById('edit-order-universe').value = o.universe_slug || 'marvel';
          document.getElementById('edit-order-year').value = o.year_published || '';
          document.getElementById('edit-order-characters').value = o.featured_characters || '';
          document.getElementById('edit-order-description').value = o.description || '';
          document.getElementById('edit-order-cover').value = o.cover_image || '';
          document.getElementById('order-modal').style.display = 'flex';
        }
      } catch (e) {
        showToast('Không thể tải thông tin thứ tự đọc', 'error');
      }
    }

    function openCreateOrderModal() {
      document.getElementById('order-modal-title').textContent = 'Thêm Mới Thứ Tự Đọc';
      document.getElementById('order-form').reset();
      document.getElementById('edit-order-id').value = '';
      document.getElementById('order-modal').style.display = 'flex';
    }

    function closeOrderModal() {
      document.getElementById('order-modal').style.display = 'none';
    }

    async function saveOrderForm() {
      const id = document.getElementById('edit-order-id').value;
      const title = document.getElementById('edit-order-title').value.trim();
      const slug = document.getElementById('edit-order-slug').value.trim();
      const universe_slug = document.getElementById('edit-order-universe').value;
      const year_published = document.getElementById('edit-order-year').value.trim();
      const featured_characters = document.getElementById('edit-order-characters').value.trim();
      const description = document.getElementById('edit-order-description').value.trim();
      const cover_image = document.getElementById('edit-order-cover').value.trim();

      if (!title || !slug) {
        showToast('Vui lòng điền tiêu đề và slug', 'error');
        return;
      }

      const payload = { title, slug, universe_slug, year_published, featured_characters, description, cover_image };

      try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/admin/reading-orders/${id}` : '/api/admin/reading-orders';
        const res = await apiFetch(url, { method, body: payload });
        const json = await res.json();

        if (json.success) {
          showToast(id ? 'Cập nhật thành công!' : 'Tạo mới thành công!', 'success');
          closeOrderModal();
          loadOrders(currentOrderPage);
        } else {
          showToast(json.message || 'Lỗi khi lưu', 'error');
        }
      } catch (err) {
        showToast('Lỗi khi gửi yêu cầu', 'error');
      }
    }

    async function deleteOrder(id, title) {
      if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn bộ đọc "${title}" cùng toàn bộ tập truyện đi kèm không?`)) {
        try {
          const res = await apiFetch(`/api/admin/reading-orders/${id}`, { method: 'DELETE' });
          const json = await res.json();
          if (json.success) {
            showToast('Đã xóa thành công', 'success');
            loadOrders(currentOrderPage);
          } else {
            showToast(json.message || 'Lỗi khi xóa', 'error');
          }
        } catch (e) {
          showToast('Lỗi máy chủ khi xóa', 'error');
        }
      }
    }

    // ==========================================
    // TRÌNH BIÊN TẬP NỘI DUNG TẬP TRUYỆN TRỰC QUAN (NO RAW HTML)
    // ==========================================
    let currentEditingContentPath = '';
    let currentEditingContentLiveUrl = '';
    let _adminEditorItems = []; // [{ type, title, year, link }]
    let _adminEditorTpbs = [];  // [{ title, buyLink, subIssues }]

    function updateAdminCounterBadge() {
      const badge = document.getElementById('order-content-counter-badge');
      if (!badge) return;
      const count = _adminEditorItems.filter(it => it.type !== 'phase' && it.type !== 'note').length;
      badge.textContent = `${count} tập truyện`;
    }

    function saveAdminSingleInputsToState() {
      const container = document.getElementById('order-content-single-container');
      if (!container) return;
      const rows = container.querySelectorAll('.admin-v-row');
      rows.forEach(row => {
        const idx = parseInt(row.dataset.idx, 10);
        if (isNaN(idx) || !_adminEditorItems[idx]) return;
        const typeSelect = row.querySelector('.admin-v-type');
        const titleInput = row.querySelector('.admin-v-title');
        const yearInput = row.querySelector('.admin-v-year');
        const noteInput = row.querySelector('.admin-v-note');
        if (typeSelect) _adminEditorItems[idx].type = typeSelect.value;
        if (titleInput) _adminEditorItems[idx].title = titleInput.value;
        if (yearInput) _adminEditorItems[idx].year = yearInput.value;
        if (noteInput) _adminEditorItems[idx].note = noteInput.value;
      });
      updateAdminCounterBadge();
    }

    function saveAdminTpbInputsToState() {
      const container = document.getElementById('order-content-tpb-items-container');
      if (!container) return;
      const cards = container.querySelectorAll('.admin-v-tpb-card');
      cards.forEach(card => {
        const idx = parseInt(card.dataset.idx, 10);
        if (isNaN(idx) || !_adminEditorTpbs[idx]) return;
        const titleInput = card.querySelector('.admin-tpb-title');
        const linkInput = card.querySelector('.admin-tpb-link');
        const subArea = card.querySelector('.admin-tpb-sub');
        if (titleInput) _adminEditorTpbs[idx].title = titleInput.value;
        if (linkInput) _adminEditorTpbs[idx].buyLink = linkInput.value;
        if (subArea) {
          _adminEditorTpbs[idx].subIssues = subArea.value.split('\n').map(s => s.trim()).filter(Boolean);
        }
      });
    }

    function renderAdminVisualItems() {
      const container = document.getElementById('order-content-single-container');
      if (!container) return;

      if (_adminEditorItems.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 36px 20px; background: #fffbeb; border: 1px dashed #f59e0b; border-radius: 6px; margin: 10px 0;">
            <i class="fa-solid fa-clock-rotate-left" style="font-size: 30px; color: #d97706; margin-bottom: 12px; display: inline-block;"></i>
            <p style="font-size: 15px; font-weight: 700; color: #92400e; margin-bottom: 6px;">Thứ tự đọc này hiện đang ở trạng thái Coming Soon (Chưa có danh sách tập)</p>
            <p style="font-size: 13px; color: #b45309; max-width: 540px; margin: 0 auto 16px auto; line-height: 1.5;">
              Trang ngoài hiện đang hiển thị thông báo "Đang biên tập". Bạn có thể bấm các nút bên trên (<strong>+ Giai đoạn</strong>, <strong>+ Bộ ngắn kỳ</strong>, <strong>+ Dài kỳ</strong>...) để thêm các tập truyện, sau đó bấm <strong>Lưu danh sách</strong> để xuất bản nội dung chính thức!
            </p>
            <button type="button" class="btn-primary" style="width: auto; padding: 6px 16px; font-size: 13px; margin: 0 auto;" onclick="addAdminItem('ongoing')">
              <i class="fa-solid fa-plus"></i> Bắt đầu thêm tập đầu tiên
            </button>
          </div>
        `;
        updateAdminCounterBadge();
        return;
      }

      const typeConfigs = {
        phase: { label: '🔵 Giai đoạn (Phase)', color: '#0066aa', bg: '#eff6ff', border: '#93c5fd' },
        mini: { label: '🟢 Bộ ngắn kỳ (Mini)', color: '#008000', bg: '#f0fdf4', border: '#86efac' },
        oneshot: { label: '🔴 Tập đơn (One-Shot)', color: '#ff0000', bg: '#fef2f2', border: '#fca5a5' },
        ongoing: { label: '⚫ Dài kỳ (Ongoing)', color: '#1f2937', bg: '#f9fafb', border: '#d1d5db' },
        note: { label: 'ℹ️ Ghi chú (Note)', color: '#64748b', bg: '#f8fafc', border: '#cbd5e1' }
      };

      container.innerHTML = _adminEditorItems.map((item, idx) => {
        const type = item.type || 'ongoing';
        const cfg = typeConfigs[type] || typeConfigs.ongoing;
        const isPhase = type === 'phase';
        const isNote = type === 'note';

        return `
          <div class="admin-v-row" data-idx="${idx}" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: ${cfg.bg}; border: 1px solid ${cfg.border}; border-left: 4px solid ${cfg.color}; border-radius: 4px;">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <button type="button" class="btn-action admin-v-move" data-idx="${idx}" data-dir="-1" title="Chuyển lên" style="padding: 1px 5px; font-size: 10px; line-height: 1;">▲</button>
              <button type="button" class="btn-action admin-v-move" data-idx="${idx}" data-dir="1" title="Chuyển xuống" style="padding: 1px 5px; font-size: 10px; line-height: 1;">▼</button>
            </div>
            <select class="admin-v-type form-input" data-idx="${idx}" style="width: 155px; padding: 6px 8px; font-size: 12px; font-weight: 700; color: ${cfg.color};">
              <option value="phase" ${type === 'phase' ? 'selected' : ''}>🔵 Giai đoạn (Phase)</option>
              <option value="mini" ${type === 'mini' ? 'selected' : ''}>🟢 Bộ ngắn kỳ (Mini)</option>
              <option value="oneshot" ${type === 'oneshot' ? 'selected' : ''}>🔴 Tập đơn (One-Shot)</option>
              <option value="ongoing" ${type === 'ongoing' ? 'selected' : ''}>⚫ Dài kỳ (Ongoing)</option>
              <option value="note" ${type === 'note' ? 'selected' : ''}>ℹ️ Ghi chú (Note)</option>
            </select>
            <input type="text" class="admin-v-title form-input" data-idx="${idx}" value="${escapeAdminHtml(item.title || '')}"
              placeholder="${isPhase ? 'Tên giai đoạn...' : (isNote ? 'Nội dung ghi chú...' : 'Tên truyện / số tập...')}"
              autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
              style="flex: 2; min-width: 150px; padding: 6px 10px; font-size: 13px; font-weight: ${isPhase ? '800' : '600'}; color: ${isPhase ? '#0066aa' : '#111'};" />
            <input type="text" class="admin-v-year form-input" data-idx="${idx}" value="${escapeAdminHtml(item.year || '')}"
              placeholder="Năm (VD: 2024)" autocomplete="off"
              style="width: 100px; padding: 6px 8px; font-size: 12px; display: ${isPhase ? 'none' : 'block'};" />
            <input type="text" class="admin-v-note form-input" data-idx="${idx}" value="${escapeAdminHtml(item.note || '')}"
              placeholder="${isPhase ? 'Mô tả giai đoạn...' : 'Ghi chú đọc (tùy chọn)...'}" autocomplete="off"
              style="flex: 1.3; min-width: 130px; padding: 6px 9px; font-size: 12px; color: #1e40af;" />
            <button type="button" class="btn-action admin-v-insert" data-idx="${idx}" title="Chèn dòng mới phía dưới" style="padding: 6px 9px; color: #16a34a; font-weight: 800;">＋</button>
            <button type="button" class="btn-action admin-v-del" data-idx="${idx}" title="Xóa dòng này" style="padding: 6px 9px; color: #dc2626;">🗑️</button>
          </div>
        `;
      }).join('');

      container.querySelectorAll('.admin-v-type').forEach(sel => {
        sel.addEventListener('change', () => {
          saveAdminSingleInputsToState();
          renderAdminVisualItems();
        });
      });

      container.querySelectorAll('.admin-v-move').forEach(btn => {
        btn.addEventListener('click', () => {
          saveAdminSingleInputsToState();
          const idx = parseInt(btn.dataset.idx, 10);
          const dir = parseInt(btn.dataset.dir, 10);
          const target = idx + dir;
          if (target >= 0 && target < _adminEditorItems.length) {
            const temp = _adminEditorItems[idx];
            _adminEditorItems[idx] = _adminEditorItems[target];
            _adminEditorItems[target] = temp;
            renderAdminVisualItems();
          }
        });
      });

      container.querySelectorAll('.admin-v-insert').forEach(btn => {
        btn.addEventListener('click', () => {
          saveAdminSingleInputsToState();
          const idx = parseInt(btn.dataset.idx, 10);
          _adminEditorItems.splice(idx + 1, 0, { type: 'ongoing', title: '', year: '', note: '' });
          renderAdminVisualItems();
        });
      });

      container.querySelectorAll('.admin-v-del').forEach(btn => {
        btn.addEventListener('click', () => {
          saveAdminSingleInputsToState();
          const idx = parseInt(btn.dataset.idx, 10);
          _adminEditorItems.splice(idx, 1);
          renderAdminVisualItems();
        });
      });

      container.querySelectorAll('.admin-v-title, .admin-v-year, .admin-v-note').forEach(inp => {
        inp.addEventListener('input', () => {
          updateAdminCounterBadge();
        });
      });

      updateAdminCounterBadge();
    }

    function addAdminItem(type) {
      saveAdminSingleInputsToState();
      const newItem = { type: type || 'ongoing', title: '', year: '', note: '' };
      _adminEditorItems.push(newItem);
      renderAdminVisualItems();
      const c = document.getElementById('order-content-single-container');
      if (c) c.scrollTop = c.scrollHeight;
    }

    function renderAdminVisualTpb() {
      const container = document.getElementById('order-content-tpb-items-container');
      if (!container) return;

      if (_adminEditorTpbs.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-dim);">Chưa có tuyển tập TPB nào. Bấm nút phía trên để thêm.</div>';
        return;
      }

      container.innerHTML = _adminEditorTpbs.map((tpb, idx) => `
        <div class="admin-v-tpb-card" data-idx="${idx}" style="background: #fff; border: 1px solid #d1d5db; border-radius: 6px; padding: 12px;">
          <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
            <input type="text" class="admin-tpb-title form-input" data-idx="${idx}" value="${escapeAdminHtml(tpb.title || '')}" placeholder="Tên tập tổng hợp (VD: Ultimate Invasion)" autocomplete="off" style="flex: 2; font-weight: 700;" />
            <input type="text" class="admin-tpb-link form-input" data-idx="${idx}" value="${escapeAdminHtml(tpb.buyLink || '')}" placeholder="Link đọc hoặc mua..." autocomplete="off" autocorrect="off" autocapitalize="off" style="flex: 1;" />
            <button type="button" class="btn-action admin-tpb-del" data-idx="${idx}" style="color: #dc2626; padding: 6px 12px; font-weight: bold;">🗑️ Xóa</button>
          </div>
          <label style="font-size: 11px; font-weight: 700; color: var(--text-dim); display: block; margin-bottom: 4px;">Các tập con thu thập (mỗi dòng 1 tập):</label>
          <textarea class="admin-tpb-sub form-input" data-idx="${idx}" rows="2" style="font-size: 12px;" placeholder="Ultimate Invasion #1-4...">${escapeAdminHtml((tpb.subIssues || []).join('\n'))}</textarea>
        </div>
      `).join('');

      container.querySelectorAll('.admin-tpb-del').forEach(btn => {
        btn.addEventListener('click', () => {
          saveAdminTpbInputsToState();
          const idx = parseInt(btn.dataset.idx, 10);
          _adminEditorTpbs.splice(idx, 1);
          renderAdminVisualTpb();
        });
      });
    }

    function addAdminTpb() {
      saveAdminTpbInputsToState();
      _adminEditorTpbs.push({ title: '', buyLink: '', subIssues: [] });
      renderAdminVisualTpb();
    }

    function updateAdminVisualPreview() {
      saveAdminSingleInputsToState();
      saveAdminTpbInputsToState();
      const prevBox = document.getElementById('order-content-preview-box');
      if (!prevBox) return;

      const count = _adminEditorItems.filter(it => it.type !== 'phase' && it.type !== 'note').length;
      let html = `
        <h4 style="color: #e42525; margin-bottom: 12px; border-bottom: 2px solid #e42525; padding-bottom: 6px; font-size: 14px;">
          📖 TẬP LẺ (READING ORDER) — ${count} TẬP
        </h4>
        <div style="line-height: 1.7; font-size: 13.5px; margin-bottom: 24px;">
      `;

      _adminEditorItems.forEach(it => {
        const type = it.type || 'ongoing';
        const yearStr = it.year && it.year.trim() ? ` (${it.year.trim()})` : '';
        const noteStr = it.note && it.note.trim() ? ` <span style="color: #0000ff; font-style: italic;">(${escapeAdminHtml(it.note.trim())})</span>` : '';
        if (type === 'phase') {
          const phaseNote = it.note && it.note.trim() ? `<br/><span style="color: #64748b; font-size: 12.5px; font-style: italic;">${escapeAdminHtml(it.note.trim())}</span>` : '';
          html += `<div style="margin-top: 14px; margin-bottom: 4px;"><span style="color: #0066aa; font-weight: 800; font-size: 15px;">${escapeAdminHtml(it.title)}</span>${phaseNote}</div>`;
        } else if (type === 'note') {
          html += `<div style="color: #0000ff; font-style: italic; margin: 3px 0;">${escapeAdminHtml(it.title)}</div>`;
        } else if (type === 'mini') {
          html += `<div><span style="color: #008000; font-weight: 600;">${escapeAdminHtml(it.title)}</span>${yearStr}${noteStr}</div>`;
        } else if (type === 'oneshot') {
          html += `<div><span style="color: #ff0000; font-weight: 600;">${escapeAdminHtml(it.title)}</span>${yearStr}${noteStr}</div>`;
        } else {
          html += `<div>${escapeAdminHtml(it.title)}${yearStr}${noteStr}</div>`;
        }
      });

      html += `
        </div>
        <h4 style="color: #0066aa; margin-bottom: 12px; border-bottom: 2px solid #0066aa; padding-bottom: 6px; font-size: 14px;">
          📚 TẬP TỔNG HỢP (TPBS) — ${_adminEditorTpbs.length} TẬP
        </h4>
        <div style="line-height: 1.6; font-size: 13px;">
      `;

      if (_adminEditorTpbs.length === 0) {
        html += '<p style="color: #94a3b8;">Chưa có tuyển tập nào.</p>';
      } else {
        _adminEditorTpbs.forEach(tpb => {
          html += `
            <div style="margin-bottom: 10px; background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
              <strong>${escapeAdminHtml(tpb.title)}</strong>
              ${(tpb.subIssues || []).map(s => `<div style="color: #4b5563; font-size: 12px; margin-left: 12px;">• ${escapeAdminHtml(s)}</div>`).join('')}
            </div>
          `;
        });
      }

      html += '</div>';
      prevBox.innerHTML = html;
    }

    function escapeAdminHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    async function openOrderContentEditor(slug, universeSlug, title) {
      currentEditingContentPath = slug;

      const modal = document.getElementById('order-content-modal');
      const titleEl = document.getElementById('order-content-modal-title');
      const fileInfoEl = document.getElementById('order-content-file-info');
      const singleContainer = document.getElementById('order-content-single-container');

      titleEl.textContent = `Biên Tập: ${title || slug}`;
      fileInfoEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu từ máy chủ...';
      singleContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-dim);">Đang tải danh sách tập truyện...</div>';
      modal.style.display = 'flex';

      switchOrderContentTab('single');

      try {
        const res = await apiFetch(`/api/admin/reading-order-content?path=${encodeURIComponent(slug)}`);
        const json = await res.json();
        if (json.success) {
          const d = json.data;
          currentEditingContentPath = d.path || slug;
          currentEditingContentLiveUrl = '/' + (d.filePath || '').replace(/\/index\.html$/i, '');
          fileInfoEl.innerHTML = `<i class="fa-solid fa-file-code" style="color:var(--color-primary)"></i> File: <strong>${d.filePath}</strong>`;
          _adminEditorItems = d.parsedItems || [];
          _adminEditorTpbs = d.parsedTpbs || [];
          renderAdminVisualItems();
          renderAdminVisualTpb();
        } else {
          fileInfoEl.textContent = json.message || 'Không tìm thấy file HTML cho bộ đọc này';
          _adminEditorItems = [];
          _adminEditorTpbs = [];
          renderAdminVisualItems();
        }
      } catch (err) {
        fileInfoEl.textContent = 'Lỗi kết nối khi tải nội dung';
      }
    }

    function switchOrderContentTab(tab) {
      const btnSingle = document.getElementById('btn-tab-content-single');
      const btnTpb = document.getElementById('btn-tab-content-tpb');
      const btnPrev = document.getElementById('btn-tab-content-preview');
      const conSingle = document.getElementById('order-content-single-container');
      const conTpb = document.getElementById('order-content-tpb-container');
      const conPrev = document.getElementById('order-content-preview-container');

      [btnSingle, btnTpb, btnPrev].forEach(b => {
        b.classList.remove('active');
        b.style.background = '';
        b.style.color = '';
        b.style.borderColor = '';
      });

      conSingle.style.display = 'none';
      conTpb.style.display = 'none';
      conPrev.style.display = 'none';

      if (tab === 'single') {
        btnSingle.classList.add('active');
        btnSingle.style.background = 'var(--color-primary)';
        btnSingle.style.color = '#fff';
        btnSingle.style.borderColor = '#020000';
        conSingle.style.display = 'flex';
      } else if (tab === 'tpb') {
        btnTpb.classList.add('active');
        btnTpb.style.background = 'var(--color-primary)';
        btnTpb.style.color = '#fff';
        btnTpb.style.borderColor = '#020000';
        conTpb.style.display = 'flex';
      } else if (tab === 'preview') {
        btnPrev.classList.add('active');
        btnPrev.style.background = 'var(--color-primary)';
        btnPrev.style.color = '#fff';
        btnPrev.style.borderColor = '#020000';
        conPrev.style.display = 'block';
        updateAdminVisualPreview();
      }
    }

    function closeOrderContentModal() {
      document.getElementById('order-content-modal').style.display = 'none';
    }

    function openCurrentLivePage() {
      if (currentEditingContentLiveUrl) {
        window.open(currentEditingContentLiveUrl, '_blank');
      } else if (currentEditingContentPath) {
        window.open('/' + currentEditingContentPath, '_blank');
      }
    }

    async function saveOrderContent() {
      saveAdminSingleInputsToState();
      saveAdminTpbInputsToState();

      const btn = document.getElementById('btn-save-order-content');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu lên hệ thống & Supabase...';

      try {
        const res = await apiFetch('/api/admin/reading-order-content', {
          method: 'POST',
          body: {
            path: currentEditingContentPath,
            parsedItems: _adminEditorItems,
            parsedTpbs: _adminEditorTpbs
          }
        });

        const json = await res.json();
        if (json.success) {
          showToast('Đã lưu danh sách tập vào file & đồng bộ Supabase thành công!', 'success');
          closeOrderContentModal();
          loadOrders(currentOrderPage);
        } else {
          showToast(json.message || 'Lỗi khi lưu danh sách', 'error');
        }
      } catch (err) {
        showToast('Lỗi máy chủ khi lưu danh sách', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu danh sách';
      }
    }

    // TAB 3: TẬP TRUYỆN & LINK ĐỌC
    async function populateOrderDropdownForIssues() {
      const select = document.getElementById('select-order-for-issues');
      if (select.children.length > 1) return;

      try {
        const res = await apiFetch('/api/admin/reading-orders?limit=100');
        const json = await res.json();
        if (json.success) {
          select.innerHTML = '<option value="">-- Chọn thứ tự đọc --</option>' +
            json.data.map(o => `<option value="${o.id}">[${(o.universe_slug || 'other').toUpperCase()}] ${o.title} (${o.total_issues || 0} tập)</option>`).join('');
        }
      } catch (e) {}
    }

    function jumpToIssues(orderId) {
      switchTab('issues', false);
      try {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('tab', 'issues');
        currentUrl.searchParams.set('orderId', orderId);
        currentUrl.hash = 'issues';
        window.history.pushState({ tab: 'issues', orderId }, '', currentUrl.pathname + currentUrl.search + currentUrl.hash);
      } catch (e) {}

      const select = document.getElementById('select-order-for-issues');
      if (select) {
        // Thêm option tạm thời nếu chưa có
        if (!Array.from(select.options).some(o => o.value == orderId)) {
          select.innerHTML += `<option value="${orderId}">Bộ đọc ID #${orderId}</option>`;
        }
        select.value = orderId;
      }
      loadIssuesForSelectedOrder();
    }

    let currentIssueFilter = 'all';

    async function loadIssuesForSelectedOrder() {
      const orderId = document.getElementById('select-order-for-issues').value;
      const container = document.getElementById('issues-container');
      const placeholder = document.getElementById('issues-placeholder');
      const tbody = document.getElementById('issues-table-body');

      if (!orderId) {
        container.style.display = 'none';
        placeholder.style.display = 'block';
        return;
      }

      placeholder.style.display = 'none';
      container.style.display = 'block';
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 25px;">Đang tải danh sách tập truyện...</td></tr>';
      currentSelectedOrderId = orderId;
      currentIssueFilter = 'all';

      // Reset filter buttons
      document.querySelectorAll('.issue-filter-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = '';
        b.style.color = '';
        b.style.borderColor = '';
      });
      const allBtn = document.querySelector('.issue-filter-btn[data-filter="all"]');
      if (allBtn) {
        allBtn.classList.add('active');
        allBtn.style.background = 'var(--color-primary)';
        allBtn.style.color = '#fff';
        allBtn.style.borderColor = '#020000';
      }

      try {
        const res = await apiFetch(`/api/admin/reading-orders/${orderId}`);
        const json = await res.json();

        if (json.success) {
          const o = json.data;
          document.getElementById('current-order-title').textContent = o.title;
          document.getElementById('current-order-badge').textContent = (o.universe_slug || 'other').toUpperCase();
          document.getElementById('current-order-badge').className = `badge badge-${o.universe_slug || 'other'}`;

          currentEditingIssues = o.issues || [];

          // Tính stats
          const linked = currentEditingIssues.filter(i => i.read_url && i.read_url.trim() !== '');
          const unlinked = currentEditingIssues.filter(i => !i.read_url || i.read_url.trim() === '');
          const total = currentEditingIssues.length;
          const pct = total > 0 ? Math.round((linked.length / total) * 100) : 0;

          document.getElementById('current-order-count').textContent = `${total} tập truyện`;
          document.getElementById('stat-linked-count').textContent = linked.length;
          document.getElementById('stat-unlinked-count').textContent = unlinked.length;
          document.getElementById('link-progress-bar').style.width = `${pct}%`;
          document.getElementById('link-progress-pct').textContent = `${pct}% hoàn thành`;

          if (total === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 25px; color: var(--text-dim);">Bộ truyện này chưa có tập nào.</td></tr>';
            return;
          }

          renderIssuesTable('all');
        }
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-danger); padding: 25px;">Lỗi tải tập truyện</td></tr>';
      }
    }

    function renderIssuesTable(filter) {
      const tbody = document.getElementById('issues-table-body');
      let issues = [...currentEditingIssues];

      // Sort: chưa có link lên trước
      issues.sort((a, b) => {
        const aHas = a.read_url && a.read_url.trim() !== '' ? 1 : 0;
        const bHas = b.read_url && b.read_url.trim() !== '' ? 1 : 0;
        return aHas - bHas;
      });

      // Filter
      if (filter === 'unlinked') {
        issues = issues.filter(i => !i.read_url || i.read_url.trim() === '');
      } else if (filter === 'linked') {
        issues = issues.filter(i => i.read_url && i.read_url.trim() !== '');
      }

      if (issues.length === 0) {
        const msg = filter === 'unlinked' ? 'Tất cả tập đã có link! 🎉' : filter === 'linked' ? 'Chưa có tập nào được gắn link.' : 'Không có tập truyện.';
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 25px; color: var(--text-dim);">${msg}</td></tr>`;
        return;
      }

      tbody.innerHTML = issues.map((issue, idx) => {
        const hasLink = issue.read_url && issue.read_url.trim() !== '';
        const statusIcon = hasLink
          ? '<i class="fa-solid fa-circle-check" style="color: var(--color-success); font-size: 16px;" title="Đã có link đọc"></i>'
          : '<i class="fa-solid fa-circle-exclamation" style="color: var(--color-warning); font-size: 16px;" title="Chưa có link đọc"></i>';
        const rowBg = hasLink
          ? 'background: rgba(16, 185, 129, 0.04);'
          : 'background: rgba(217, 119, 6, 0.04);';
        const borderLeft = hasLink
          ? 'border-left: 3px solid var(--color-success);'
          : 'border-left: 3px solid var(--color-warning);';

        // Tìm index gốc trong currentEditingIssues
        const origIdx = currentEditingIssues.indexOf(issue);

        return `
          <tr class="issue-row-item" style="${rowBg} ${borderLeft}" data-issue-id="${issue.id}" data-has-link="${hasLink ? '1' : '0'}">
            <td>
              <div class="issue-mobile-header">
                <span class="issue-stt-badge">#${origIdx + 1}</span>
                <span class="badge" style="background: rgba(0,0,0,0.06); color: var(--text-muted); font-size: 11px;">${issue.issue_type || 'ongoing'}</span>
                <span class="issue-status-wrap">${statusIcon}</span>
              </div>
              <span class="desktop-only-stt" style="color: var(--text-dim);">${origIdx + 1}</span>
            </td>
            <td class="desktop-col" style="text-align: center;">${statusIcon}</td>
            <td>
              <strong class="issue-item-title" style="color: var(--text-main); font-size: 13.5px; display: block;">${issue.title}</strong>
            </td>
            <td class="desktop-col"><span class="badge" style="background: rgba(0,0,0,0.06); color: var(--text-muted);">${issue.issue_type || 'ongoing'}</span></td>
            <td>
              <div class="issue-input-wrap">
                <input type="text" id="issue-link-${issue.id}" class="form-input" style="padding: 7px 10px; font-size: 13px; width: 100%; ${hasLink ? 'border-color: var(--color-success);' : ''}" 
                       value="${issue.read_url || ''}" placeholder="Dán link đọc (Drive, Web, Blog...)"
                       autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
              </div>
            </td>
            <td style="text-align: right;">
              <button class="btn-action btn-save-issue" onclick="saveSingleIssueLink(${issue.id})" title="Lưu link tập này">
                <i class="fa-solid fa-floppy-disk"></i> <span>Lưu link</span>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    function filterIssues(filter) {
      currentIssueFilter = filter;
      // Update active button
      document.querySelectorAll('.issue-filter-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = '';
        b.style.color = '';
        b.style.borderColor = '';
      });
      const activeBtn = document.querySelector(`.issue-filter-btn[data-filter="${filter}"]`);
      if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.background = 'var(--color-primary)';
        activeBtn.style.color = '#fff';
        activeBtn.style.borderColor = '#020000';
      }
      renderIssuesTable(filter);
    }

    async function saveSingleIssueLink(issueId) {
      const linkInput = document.getElementById(`issue-link-${issueId}`);
      const link = linkInput.value.trim();

      try {
        const res = await apiFetch(`/api/admin/issues/${issueId}`, {
          method: 'PUT',
          body: { read_url: link }
        });
        const json = await res.json();
        if (json.success) {
          showToast('Đã lưu link đọc tập!', 'success');
        } else {
          showToast(json.message || 'Không thể lưu link', 'error');
        }
      } catch (e) {
        showToast('Lỗi khi lưu link đọc', 'error');
      }
    }

    async function saveAllIssueLinks() {
      let count = 0;
      for (const issue of currentEditingIssues) {
        const input = document.getElementById(`issue-link-${issue.id}`);
        if (input && input.value.trim() !== (issue.read_url || '')) {
          await apiFetch(`/api/admin/issues/${issue.id}`, {
            method: 'PUT',
            body: { read_url: input.value.trim() }
          });
          count++;
        }
      }
      showToast(`Đã cập nhật ${count} link đọc thành công!`, 'success');
    }

    // TAB 4: DANH SÁCH ĐỘC GIẢ
    async function loadUsers() {
      const tbody = document.getElementById('users-table-body');
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 25px;">Đang tải danh sách độc giả...</td></tr>';

      try {
        const res = await apiFetch('/api/admin/users');
        const json = await res.json();
        if (json.success) {
          const users = json.data;
          if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 25px; color: var(--text-dim);">Chưa có độc giả nào đăng ký</td></tr>';
            return;
          }

          tbody.innerHTML = users.map(u => `
            <tr class="user-row-item">
              <td><strong>${u.email || '-'}</strong></td>
              <td><span style="font-weight: 700; color: var(--text-main); font-size: 14px;">${u.display_name || u.username || '-'}</span></td>
              <td><span class="badge" style="${u.role === 'admin' ? 'background: rgba(228,37,37,0.2); color: #f87171;' : 'background: rgba(59,130,246,0.2); color: #60a5fa;'}">${u.role || 'user'}</span></td>
              <td><strong style="color: #34d399;">${(u.read_issues_count || 0).toLocaleString()}</strong> tập đã đọc</td>
              <td style="color: var(--text-dim); font-size: 12px;"><i class="fa-regular fa-clock"></i> Đăng ký: ${u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '-'}</td>
              <td style="color: var(--text-dim); font-size: 12px;"><i class="fa-solid fa-arrow-right-to-bracket"></i> Lần cuối: ${u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString('vi-VN') : 'Chưa đăng nhập'}</td>
            </tr>
          `).join('');
        }
      } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-danger); padding: 25px;">Lỗi tải độc giả</td></tr>';
      }
    }

    // ============================================================
    // TAB 5: VŨ TRỤ & DANH MỤC CONTROLLER
    // ============================================================
    let _cachedUniverses = [];

    async function loadUniverses() {
      const grid = document.getElementById('universes-grid');
      grid.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-dim); grid-column: 1 / -1;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu vũ trụ & danh mục từ Supabase Cloud...</div>';

      try {
        const res = await apiFetch('/api/admin/universes');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          _cachedUniverses = json.data;

          // Cập nhật thống kê nhanh trên thanh Overview bar
          const totalUnivs = json.data.length;
          let totalCats = 0;
          let totalOrders = 0;
          json.data.forEach(u => {
            totalCats += (u.categories || []).length;
            totalOrders += Number(u.order_count || 0);
          });

          const statUnivEl = document.getElementById('univ-stat-total-univs');
          const statCatEl = document.getElementById('univ-stat-total-cats');
          const statOrdersEl = document.getElementById('univ-stat-total-orders');
          if (statUnivEl) statUnivEl.textContent = totalUnivs;
          if (statCatEl) statCatEl.textContent = totalCats;
          if (statOrdersEl) statOrdersEl.textContent = totalOrders.toLocaleString('vi-VN');

          // Cấu hình biểu tượng và màu sắc thương hiệu comic
          const universeThemeMeta = {
            marvel: {
              icon: 'fa-shield-halved',
              color: '#e23636',
              borderShadow: '#a71000',
              badgeClass: 'badge-marvel',
              label: 'Marvel Comics',
              bgGradient: 'linear-gradient(135deg, rgba(226, 54, 54, 0.08) 0%, rgba(254, 189, 17, 0.05) 100%)'
            },
            dc: {
              icon: 'fa-mask',
              color: '#0476f2',
              borderShadow: '#004477',
              badgeClass: 'badge-dc',
              label: 'DC Comics',
              bgGradient: 'linear-gradient(135deg, rgba(4, 118, 242, 0.08) 0%, rgba(2, 132, 199, 0.05) 100%)'
            },
            other: {
              icon: 'fa-book-bookmark',
              color: '#10b981',
              borderShadow: '#065f46',
              badgeClass: 'badge-other',
              label: 'Indie / Khác',
              bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.05) 100%)'
            }
          };

          const catIcons = {
            events: 'fa-bolt',
            characters: 'fa-user-ninja',
            master: 'fa-crown',
            series: 'fa-book-open',
            default: 'fa-layer-group'
          };

          // Render 3 Universe Cards
          grid.innerHTML = json.data.map(u => {
            const meta = universeThemeMeta[u.slug] || {
              icon: 'fa-globe',
              color: u.accent_color || '#64748b',
              borderShadow: '#334155',
              badgeClass: '',
              label: u.name,
              bgGradient: 'transparent'
            };

            const orderCount = Number(u.order_count || 0);
            const totalIssues = Number(u.total_issues || 0);
            const categories = u.categories || [];

            return `
              <div class="universe-card-premium" style="border-top-color: ${u.accent_color || meta.color};">
                <div class="univ-card-top-stripe" style="background: linear-gradient(90deg, ${u.accent_color || meta.color}, ${u.slug === 'marvel' ? '#febd11' : (u.slug === 'dc' ? '#60a5fa' : '#34d399')});"></div>
                
                <div class="univ-card-header" style="background: ${meta.bgGradient};">
                  <div class="univ-card-title-row">
                    <div class="univ-title-wrap">
                      <div class="univ-emblem" style="background: ${u.accent_color || meta.color}; box-shadow: 0 2px 0 0 ${meta.borderShadow};">
                        <i class="fa-solid ${meta.icon}"></i>
                      </div>
                      <div>
                        <h3 class="univ-name">${escapeHtml(u.name)}</h3>
                        <div style="font-size: 11px; color: var(--text-dim); font-weight: 700;">#${u.sort_order || 1} • Thứ tự ưu tiên</div>
                      </div>
                    </div>
                    <span class="univ-pill-slug" style="background: ${u.accent_color || meta.color}; box-shadow: 0 1px 0 0 ${meta.borderShadow};">${escapeHtml(u.slug)}</span>
                  </div>

                  <p class="univ-desc">${escapeHtml(u.description || 'Chưa có thông tin mô tả chi tiết cho vũ trụ này.')}</p>
                </div>

                <div class="univ-metrics-strip">
                  <div class="univ-metric-col">
                    <div class="univ-metric-num" style="color: ${u.accent_color || meta.color};">${orderCount}</div>
                    <div class="univ-metric-label">Bộ Thứ Tự Đọc</div>
                  </div>
                  <div class="univ-metric-col">
                    <div class="univ-metric-num">${categories.length}</div>
                    <div class="univ-metric-label">Danh Mục Con</div>
                  </div>
                  <div class="univ-metric-col">
                    <div class="univ-metric-num">${totalIssues > 0 ? totalIssues.toLocaleString('vi-VN') : '0'}</div>
                    <div class="univ-metric-label">Tổng Số Tập</div>
                  </div>
                </div>

                <div class="univ-subcats-body">
                  <div class="univ-subcats-title">
                    <i class="fa-solid fa-tags" style="color: ${u.accent_color || meta.color};"></i>
                    <span>Danh Mục Trực Thuộc (${categories.length})</span>
                  </div>

                  <div class="univ-category-list">
                    ${categories.length > 0 ? categories.map(c => {
                      const cIcon = catIcons[c.slug] || catIcons.default;
                      const cCount = Number(c.order_count || 0);
                      return `
                        <div class="univ-category-item" onclick="jumpToOrdersWithFilter('${u.slug}', '${c.slug}')" title="Nhấp để xem danh sách ${cCount} bộ truyện thuộc danh mục ${escapeHtml(c.name)}">
                          <div class="univ-cat-left">
                            <i class="fa-solid ${cIcon} univ-cat-icon" style="color: ${u.accent_color || meta.color};"></i>
                            <span class="univ-cat-name">${escapeHtml(c.name)}</span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 6px;">
                            <span class="univ-cat-badge-count">${cCount} bộ</span>
                            <i class="fa-solid fa-chevron-right" style="font-size: 11px; color: #94a3b8;"></i>
                          </div>
                        </div>
                      `;
                    }).join('') : '<div style="font-size: 13px; color: var(--text-dim); text-align: center; padding: 16px;">Chưa có danh mục con</div>'}
                  </div>
                </div>

                <div class="univ-card-footer">
                  <button class="btn-action" style="background: var(--bg-card); font-size: 12px;" onclick="openEditUniverseModal(${u.id})" title="Chỉnh sửa thông tin vũ trụ">
                    <i class="fa-solid fa-pen-to-square"></i> <span>Chỉnh sửa</span>
                  </button>
                  <div style="display: flex; gap: 6px;">
                    <button class="btn-action" style="font-size: 12px;" onclick="openCategoryModal(null, ${u.id})" title="Thêm danh mục mới cho vũ trụ này">
                      <i class="fa-solid fa-plus"></i> <span>Thêm mục</span>
                    </button>
                    <button class="btn-action" style="background: ${u.accent_color || meta.color}; color: #fff; border-color: #020000; box-shadow: 0 2px 0 0 ${meta.borderShadow}; font-size: 12px;" onclick="jumpToOrdersWithFilter('${u.slug}', '')" title="Xem tất cả truyện của ${escapeHtml(u.name)}">
                      <i class="fa-solid fa-arrow-right"></i> <span>Khám phá (${orderCount})</span>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('');

          // Render Category Matrix Table
          renderCategoryMatrixTable();
        } else {
          grid.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--color-danger); grid-column: 1 / -1;">Không thể tải dữ liệu vũ trụ & danh mục.</div>';
        }
      } catch (err) {
        grid.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--color-danger); grid-column: 1 / -1;">Lỗi kết nối: ${escapeHtml(err.message)}</div>`;
      }
    }

    // Render bảng chi tiết Category Matrix
    function renderCategoryMatrixTable() {
      const tbody = document.getElementById('categories-matrix-tbody');
      if (!tbody) return;

      const searchVal = (document.getElementById('cat-search-input')?.value || '').toLowerCase().trim();
      const filterUniv = (document.getElementById('cat-universe-filter-select')?.value || '').toLowerCase().trim();

      let allCats = [];
      _cachedUniverses.forEach(u => {
        (u.categories || []).forEach(c => {
          allCats.push({
            ...c,
            universe_id: u.id,
            universe_name: u.name,
            universe_slug: u.slug,
            universe_color: u.accent_color || '#64748b'
          });
        });
      });

      // Lọc theo search và universe
      if (filterUniv) {
        allCats = allCats.filter(c => c.universe_slug === filterUniv);
      }
      if (searchVal) {
        allCats = allCats.filter(c => 
          c.name.toLowerCase().includes(searchVal) ||
          c.slug.toLowerCase().includes(searchVal) ||
          (c.description || '').toLowerCase().includes(searchVal) ||
          c.universe_name.toLowerCase().includes(searchVal)
        );
      }

      if (allCats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 30px;">Không tìm thấy danh mục con phù hợp bộ lọc.</td></tr>';
        return;
      }

      const catIcons = {
        events: 'fa-bolt',
        characters: 'fa-user-ninja',
        master: 'fa-crown',
        series: 'fa-book-open',
        default: 'fa-layer-group'
      };

      const maxOrdersInAnyCat = Math.max(...allCats.map(c => Number(c.order_count || 0)), 1);

      tbody.innerHTML = allCats.map(c => {
        const cIcon = catIcons[c.slug] || catIcons.default;
        const count = Number(c.order_count || 0);
        const percent = Math.min(100, Math.round((count / maxOrdersInAnyCat) * 100));

        let badgeStyle = 'background: #64748b;';
        if (c.universe_slug === 'marvel') badgeStyle = 'background: var(--color-marvel); box-shadow: 0 2px 0 0 #a71000;';
        else if (c.universe_slug === 'dc') badgeStyle = 'background: var(--color-dc); box-shadow: 0 2px 0 0 #004477;';
        else if (c.universe_slug === 'other') badgeStyle = 'background: var(--color-other); box-shadow: 0 2px 0 0 #065f46;';

        return `
          <tr>
            <td>
              <span class="badge" style="${badgeStyle}">${escapeHtml(c.universe_name)}</span>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid ${cIcon}" style="color: ${c.universe_color}; width: 16px; text-align: center;"></i>
                <strong style="color: var(--text-main); font-size: 13.5px;">${escapeHtml(c.name)}</strong>
              </div>
            </td>
            <td>
              <code class="cat-slug-badge">${escapeHtml(c.slug)}</code>
            </td>
            <td>
              <div style="font-size: 13px; font-weight: 800; color: var(--text-main);">
                ${count} bộ truyện
              </div>
              <div class="cat-progress-wrap" title="${percent}% so với danh mục cao nhất">
                <div class="cat-progress-fill" style="width: ${percent}%; background: ${c.universe_color};"></div>
              </div>
            </td>
            <td>
              <div style="font-size: 12.5px; color: var(--text-muted); line-height: 1.4; max-width: 380px;">
                ${escapeHtml(c.description || 'Chưa có diễn giải chi tiết.')}
              </div>
            </td>
            <td style="text-align: right;">
              <div style="display: inline-flex; align-items: center; gap: 6px;">
                <button class="btn-action" style="font-size: 11px; padding: 4px 8px;" onclick="jumpToOrdersWithFilter('${c.universe_slug}', '${c.slug}')" title="Xem truyện thuộc danh mục này">
                  <i class="fa-solid fa-magnifying-glass"></i>
                </button>
                <button class="btn-action" style="font-size: 11px; padding: 4px 8px;" onclick="openCategoryModal(${c.id})" title="Chỉnh sửa danh mục">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-action btn-danger" style="font-size: 11px; padding: 4px 8px;" onclick="deleteCategory(${c.id}, '${escapeAdminHtml(c.name)}')" title="Xóa danh mục">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Nhảy sang Tab Quản Lý Thứ Tự Đọc kèm bộ lọc Vũ Trụ & Danh Mục
    function jumpToOrdersWithFilter(universeSlug, categorySlug) {
      switchTab('orders');

      setTimeout(() => {
        const uSelect = document.getElementById('order-universe-filter');
        const cSelect = document.getElementById('order-category-filter');
        const searchInput = document.getElementById('order-search');

        if (searchInput) searchInput.value = '';
        if (uSelect) uSelect.value = universeSlug || '';
        if (cSelect) cSelect.value = categorySlug || '';

        if (typeof onOrderFilterChange === 'function') {
          onOrderFilterChange();
        }

        const label = universeSlug ? universeSlug.toUpperCase() : 'Tất cả';
        const catLabel = categorySlug ? ` - ${categorySlug}` : '';
        showToast(`Đã lọc danh sách theo: ${label}${catLabel}`, 'success');

        // Cuộn mượt đến bảng truyện
        const dataBox = document.getElementById('tab-orders');
        if (dataBox) {
          dataBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }

    // Modal Vũ Trụ
    function openEditUniverseModal(univId) {
      const u = _cachedUniverses.find(item => item.id == univId);
      if (!u) return;

      document.getElementById('edit-universe-id').value = u.id;
      document.getElementById('edit-universe-name').value = u.name || '';
      document.getElementById('edit-universe-color').value = u.accent_color || '#e23636';
      document.getElementById('edit-universe-color-text').value = u.accent_color || '#e23636';
      document.getElementById('edit-universe-desc').value = u.description || '';
      document.getElementById('edit-universe-order').value = u.sort_order || 1;

      // Đồng bộ color picker với text input
      const colorInput = document.getElementById('edit-universe-color');
      const textInput = document.getElementById('edit-universe-color-text');
      colorInput.oninput = () => { textInput.value = colorInput.value; };
      textInput.oninput = () => { if (/^#[0-9a-fA-F]{6}$/.test(textInput.value)) colorInput.value = textInput.value; };

      document.getElementById('universe-modal').style.display = 'flex';
    }

    function setUniverseColorPreset(hex) {
      const c = document.getElementById('edit-universe-color');
      const t = document.getElementById('edit-universe-color-text');
      if (c) c.value = hex;
      if (t) t.value = hex;
    }

    function closeUniverseModal() {
      document.getElementById('universe-modal').style.display = 'none';
    }

    async function saveUniverseForm(e) {
      e.preventDefault();
      const id = document.getElementById('edit-universe-id').value;
      const name = document.getElementById('edit-universe-name').value.trim();
      const accent_color = document.getElementById('edit-universe-color-text').value.trim() || document.getElementById('edit-universe-color').value;
      const description = document.getElementById('edit-universe-desc').value.trim();
      const sort_order = parseInt(document.getElementById('edit-universe-order').value, 10) || 1;

      const btn = document.getElementById('btn-save-universe');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

      try {
        const res = await apiFetch(`/api/admin/universes/${id}`, {
          method: 'PUT',
          body: { name, accent_color, description, sort_order }
        });
        const json = await res.json();
        if (json.success) {
          showToast('Đã cập nhật thông tin vũ trụ thành công!', 'success');
          closeUniverseModal();
          loadUniverses();
        } else {
          showToast(json.message || 'Lỗi khi cập nhật vũ trụ', 'error');
        }
      } catch (err) {
        showToast('Lỗi máy chủ: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu Thay Đổi';
      }
    }

    // Modal Danh Mục
    function openCategoryModal(catId = null, defaultUnivId = null) {
      const titleEl = document.getElementById('category-modal-title');
      const univSelect = document.getElementById('edit-category-universe');
      const idInput = document.getElementById('edit-category-id');
      const nameInput = document.getElementById('edit-category-name');
      const slugInput = document.getElementById('edit-category-slug');
      const descInput = document.getElementById('edit-category-desc');
      const orderInput = document.getElementById('edit-category-order');

      // Điền options cho universe select
      univSelect.innerHTML = _cachedUniverses.map(u => `<option value="${u.id}">${escapeHtml(u.name)}</option>`).join('');

      if (catId) {
        // Chế độ chỉnh sửa
        let foundCat = null;
        for (const u of _cachedUniverses) {
          const c = (u.categories || []).find(it => it.id == catId);
          if (c) { foundCat = c; break; }
        }

        if (foundCat) {
          titleEl.textContent = 'Chỉnh Sửa Danh Mục: ' + foundCat.name;
          idInput.value = foundCat.id;
          univSelect.value = foundCat.universe_id;
          univSelect.disabled = true; // Không cho đổi universe khi sửa
          nameInput.value = foundCat.name || '';
          slugInput.value = foundCat.slug || '';
          slugInput.disabled = true; // Slug cố định để tránh gãy liên kết
          descInput.value = foundCat.description || '';
          orderInput.value = foundCat.sort_order || 1;
        }
      } else {
        // Chế độ tạo mới
        titleEl.textContent = 'Thêm Danh Mục Mới';
        idInput.value = '';
        univSelect.disabled = false;
        if (defaultUnivId) univSelect.value = defaultUnivId;
        nameInput.value = '';
        slugInput.value = '';
        slugInput.disabled = false;
        descInput.value = '';
        orderInput.value = 1;
      }

      document.getElementById('category-modal').style.display = 'flex';
    }

    function autoGenerateCategorySlug() {
      const id = document.getElementById('edit-category-id').value;
      if (id) return; // Không tự tạo khi sửa
      const name = document.getElementById('edit-category-name').value;
      const slugInput = document.getElementById('edit-category-slug');
      if (name && slugInput) {
        const slug = name.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[đĐ]/g, 'd')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        slugInput.value = slug;
      }
    }

    function closeCategoryModal() {
      document.getElementById('category-modal').style.display = 'none';
    }

    async function saveCategoryForm(e) {
      e.preventDefault();
      const id = document.getElementById('edit-category-id').value;
      const universe_id = document.getElementById('edit-category-universe').value;
      const name = document.getElementById('edit-category-name').value.trim();
      const slug = document.getElementById('edit-category-slug').value.trim();
      const description = document.getElementById('edit-category-desc').value.trim();
      const sort_order = parseInt(document.getElementById('edit-category-order').value, 10) || 1;

      const btn = document.getElementById('btn-save-category');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

      try {
        let res;
        if (id) {
          res = await apiFetch(`/api/admin/categories/${id}`, {
            method: 'PUT',
            body: { name, description, sort_order }
          });
        } else {
          res = await apiFetch('/api/admin/categories', {
            method: 'POST',
            body: { universe_id, name, slug, description, sort_order }
          });
        }

        const json = await res.json();
        if (json.success) {
          showToast(id ? 'Đã cập nhật danh mục thành công!' : 'Đã tạo danh mục mới thành công!', 'success');
          closeCategoryModal();
          loadUniverses();
        } else {
          showToast(json.message || 'Lỗi khi lưu danh mục', 'error');
        }
      } catch (err) {
        showToast('Lỗi máy chủ: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu Danh Mục';
      }
    }

    async function deleteCategory(catId, catName) {
      if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${catName}"?`)) return;

      try {
        const res = await apiFetch(`/api/admin/categories/${catId}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          showToast('Đã xóa danh mục thành công!', 'success');
          loadUniverses();
        } else {
          showToast(json.message || 'Không thể xóa danh mục', 'error');
        }
      } catch (err) {
        showToast('Lỗi khi xóa: ' + err.message, 'error');
      }
    }

    // TAB 6: CÔNG CỤ & SAO LƯU CLOUD
    async function exportBackup() {
      try {
        showToast('Đang tải dữ liệu từ Supabase Cloud...', 'success');
        const [statsRes, usersRes] = await Promise.all([
          apiFetch('/api/admin/stats').then(r => r.json()),
          apiFetch('/api/admin/users').then(r => r.json())
        ]);
        const backupData = {
          exported_at: new Date().toISOString(),
          system: 'Reading Orders VN - Supabase Cloud',
          stats: statsRes.data || {},
          users: usersRes.data || []
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reading_orders_cloud_backup_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Đã xuất file sao lưu hệ thống Supabase thành công!', 'success');
      } catch (err) {
        showToast('Lỗi khi xuất sao lưu: ' + err.message, 'error');
      }
    }

    function importBackup(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async function(event) {
        try {
          const data = JSON.parse(event.target.result);
          showToast('Hệ thống hiện quản lý 100% dữ liệu tập và tiến độ trên Supabase Cloud!', 'success');
        } catch (err) {
          showToast('File JSON không hợp lệ', 'error');
        }
      };
      reader.readAsText(file);
    }

    // Toast Helper
    function showToast(msg, type = 'success') {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.className = `show ${type}`;
      setTimeout(() => { toast.className = ''; }, 3000);
    }
