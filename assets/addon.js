/**
 * READING ORDERS VIỆT NAM - CLIENT ADDON SCRIPT
 * Tự động kích hoạt các tính năng nâng cao trên nền tảng bản mirror gốc
 */

// Safe grecaptcha stub to avoid ReferenceError on Contact Form 7
window.grecaptcha = window.grecaptcha || {
  ready: function(cb) { if (typeof cb === 'function') { try { cb(); } catch (e) {} } },
  execute: function() { return Promise.resolve(''); }
};

(function () {
  'use strict';

  // Trạng thái dùng chung toàn cục (Khai báo ngay đầu IIFE tránh lỗi Temporal Dead Zone)
  let currentAuthTab = 'login';
  let searchData = [];
  let isSearchLoaded = false;
  let synopsisData = null;

  function initAddon() {
    const tasks = [
      ['createTopBar', createTopBar],
      ['createDashboardModal', createDashboardModal],
      ['createAdminModal', createAdminModal],
      ['createIssueLinkModal', createIssueLinkModal],
      ['createAuthModal', createAuthModal],
      ['updateUserBar', updateUserBar],
      ['updateGlobalBadgeCount', updateGlobalBadgeCount],
      ['renderDirectoryBadges', renderDirectoryBadges],
      ['applyLocalization', applyLocalization],
      ['applyVietnameseSynopsis', applyVietnameseSynopsis],
      ['setupIssueTracker', setupIssueTracker],
      ['setupKeyboardShortcuts', setupKeyboardShortcuts],
      ['applyVietnameseNavigationHints', applyVietnameseNavigationHints]
    ];

    for (const [name, fn] of tasks) {
      try {
        fn();
      } catch (err) {
        console.error(`[Reading Orders VN] Lỗi trong ${name}:`, err);
      }
    }
  }

  /* =========================================================
     1. QUẢN LÝ PHIÊN ĐĂNG NHẬP & NGÔN NGỮ (AUTH & LANG)
     ========================================================= */
  function getCurrentLang() {
    return 'vi';
  }

  function getCurrentUser() {
    try {
      const userStr = localStorage.getItem('ro_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  function setCurrentUser(user, token) {
    if (user && token) {
      localStorage.setItem('ro_user', JSON.stringify(user));
      localStorage.setItem('ro_token', token);
      localStorage.setItem('auth_token', token);
      if (user.role === 'admin') {
        localStorage.setItem('admin_token', token);
      }
    } else {
      localStorage.removeItem('ro_user');
      localStorage.removeItem('ro_token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('user');
      localStorage.removeItem('admin');
    }
    updateUserBar();
    updateGlobalBadgeCount();
    setupIssueTracker();
  }

  /* =========================================================
     2. THANH CÔNG CỤ NHANH TRÊN ĐẦU (TOP BAR)
     ========================================================= */
  function createTopBar() {
    if (document.getElementById('ro-top-bar')) return;

    document.body.classList.add('has-ro-bar');

    const topBar = document.createElement('div');
    topBar.id = 'ro-top-bar';
    topBar.innerHTML = `
      <!-- Desktop layout -->
      <div class="ro-bar-left ro-desktop-only">
        <a href="/" class="ro-brand-link">Reading Orders VN</a>
        <button id="ro-open-dashboard" class="ro-top-link ro-progress-link" title="Tiến độ đọc của bạn">
          Tiến độ <span id="ro-global-count" class="ro-count-pill">0</span>
        </button>
      </div>
      <div class="ro-bar-right ro-desktop-only">
        <a href="/marvel/events/" class="ro-top-link">Marvel</a>
        <a href="/dc/events/" class="ro-top-link">DC Comics</a>
        <a href="/other/" class="ro-top-link">Truyện Khác</a>
        <span class="ro-top-divider"></span>
        <div id="ro-auth-section"></div>
      </div>

      <!-- Mobile layout -->
      <div class="ro-mobile-bar">
        <a href="/" class="ro-brand-link">Reading Orders VN</a>
        <div style="display:flex;align-items:center;gap:8px;">
          <button id="ro-mobile-dashboard" class="ro-top-link ro-progress-link" title="Tiến độ">
            Tiến độ <span id="ro-mobile-count" class="ro-count-pill">0</span>
          </button>
          <button id="ro-mobile-menu" class="ro-hamburger" title="Menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      <!-- Mobile dropdown drawer -->
      <div id="ro-mobile-drawer" class="ro-mobile-drawer">
        <div class="ro-drawer-section">
          <a href="/marvel/events/" class="ro-drawer-link">Marvel</a>
          <a href="/dc/events/" class="ro-drawer-link">DC Comics</a>
          <a href="/other/" class="ro-drawer-link">Truyện Khác</a>
        </div>
        <div class="ro-drawer-divider"></div>
        <div class="ro-drawer-section" id="ro-mobile-auth-section"></div>
      </div>
    `;

    document.body.prepend(topBar);

    // Desktop events
    document.getElementById('ro-open-dashboard')?.addEventListener('click', openDashboardModal);

    // Mobile events
    document.getElementById('ro-mobile-dashboard')?.addEventListener('click', openDashboardModal);

    // Hamburger toggle
    const menuBtn = document.getElementById('ro-mobile-menu');
    const drawer = document.getElementById('ro-mobile-drawer');
    menuBtn?.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('is-open');
      menuBtn.classList.toggle('is-active', isOpen);
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Đóng drawer khi bấm bên ngoài
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#ro-mobile-menu') && !e.target.closest('#ro-mobile-drawer')) {
        drawer?.classList.remove('is-open');
        menuBtn?.classList.remove('is-active');
      }
      // Đăng xuất
      const logoutBtn = e.target?.closest('#ro-logout-btn, #ro-mobile-logout-btn');
      if (logoutBtn) {
        e.preventDefault();
        e.stopPropagation();
        setCurrentUser(null, null);
        window.location.reload();
      }
    });
  }

  function updateUserBar() {
    // Desktop auth
    const authSection = document.getElementById('ro-auth-section');
    // Mobile auth
    const mobileAuth = document.getElementById('ro-mobile-auth-section');

    const user = getCurrentUser();

    if (authSection) {
      if (user) {
        const isAdmin = user.role === 'admin';
        let displayName = user.display_name || user.username || 'Độc giả';
        // Tránh lặp chữ nếu tên hiển thị đã là "Quản Trị Viên"
        if (isAdmin && /quản trị/i.test(displayName)) {
          displayName = 'Quản trị viên';
        }

        authSection.innerHTML = `
          <button id="ro-admin-badge-btn" class="ro-user-btn ${isAdmin ? 'is-admin' : ''}" title="${isAdmin ? 'Mở Bảng Điều Khiển Admin' : ''}">
            ${isAdmin ? '<span class="ro-admin-tag">Admin</span>' : ''}
            <span>${escapeHtml(displayName)}</span>
          </button>
          <button id="ro-logout-btn" class="ro-top-link ro-logout-link" title="Đăng xuất">Đăng xuất</button>
        `;
        if (isAdmin) {
          document.getElementById('ro-admin-badge-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.open('/admin/', '_blank');
          });
        }
        document.getElementById('ro-logout-btn')?.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          setCurrentUser(null, null); window.location.reload();
        });
      } else {
        authSection.innerHTML = `
          <button id="ro-login-btn" class="ro-top-link ro-login-link">Đăng nhập</button>
        `;
        document.getElementById('ro-login-btn')?.addEventListener('click', () => openAuthModal('login'));
      }
    }

    if (mobileAuth) {
      if (user) {
        const isAdmin = user.role === 'admin';
        let displayName = user.display_name || user.username || 'Độc giả';
        if (isAdmin && /quản trị/i.test(displayName)) {
          displayName = 'Quản trị viên';
        }
        mobileAuth.innerHTML = `
          <div class="ro-drawer-user">
            <span>${escapeHtml(displayName)}</span>
            ${isAdmin ? '<span class="ro-admin-tag">Admin</span>' : ''}
          </div>
          <button id="ro-mobile-logout-btn" class="ro-drawer-link ro-drawer-btn" style="color:#ef4444;">Đăng xuất</button>
        `;
        document.getElementById('ro-mobile-logout-btn')?.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          setCurrentUser(null, null); window.location.reload();
        });
      } else {
        mobileAuth.innerHTML = `
          <button id="ro-mobile-login-btn" class="ro-drawer-link ro-drawer-btn" style="color:#e42525;font-weight:600;">Đăng nhập</button>
        `;
        document.getElementById('ro-mobile-login-btn')?.addEventListener('click', () => {
          document.getElementById('ro-mobile-drawer')?.classList.remove('is-open');
          openAuthModal('login');
        });
      }
    }
  }

  /* =========================================================
     3. BẢNG ĐIỀU KHIỂN TIẾN ĐỘ TOÀN TRANG (GLOBAL DASHBOARD)
     ========================================================= */
  function createDashboardModal() {
    if (document.getElementById('ro-dashboard-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'ro-dashboard-modal';
    modal.className = 'ro-modal-backdrop';
    modal.innerHTML = `
      <div class="ro-dashboard-card">
        <div class="ro-dashboard-header">
          <div class="ro-dashboard-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color:#e42525;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span>Tiến độ đọc toàn hệ thống</span>
          </div>
          <button id="ro-dashboard-close" class="ro-btn" style="background:none;border:none;font-size:20px;color:#888;cursor:pointer;">✕</button>
        </div>

        <div class="ro-dashboard-body" id="ro-dashboard-content">
          <!-- Nội dung render động qua renderDashboardContent() -->
        </div>

        <div class="ro-search-footer" style="padding:12px 20px;">
          <span style="color:#777;font-size:12px;">Bấm vào tên bộ truyện để chuyển ngay đến trang tiếp tục đọc</span>
          <button id="ro-clear-all-progress" class="ro-btn" style="background:#e42525;border-color:#e42525;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">
            Đặt lại tất cả
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeDashboardModal();
    });

    document.getElementById('ro-dashboard-close')?.addEventListener('click', closeDashboardModal);

    document.getElementById('ro-clear-all-progress')?.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn xóa tất cả tiến độ đọc trên toàn bộ trang web không?')) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('ro_progress_') || k === 'ro_global_reading_list')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        renderDashboardContent();
        updateGlobalBadgeCount();
        renderDirectoryBadges();
        window.location.reload();
      }
    });
  }

  function renderDashboardContent() {
    const container = document.getElementById('ro-dashboard-content');
    if (!container) return;

    const currentUser = getCurrentUser();
    const isLoggedIn = Boolean(currentUser);

    let list = {};
    try {
      list = JSON.parse(localStorage.getItem('ro_global_reading_list') || '{}');
    } catch {
      list = {};
    }

    const items = Object.values(list);

    if (!isLoggedIn) {
      container.innerHTML = `
        <div style="text-align:center;padding:30px 10px;">
          <div style="font-size:40px;margin-bottom:12px;">🔒</div>
          <h3 style="margin:0 0 8px 0;font-size:17px;color:#222;">Vui lòng đăng nhập để lưu và liên kết tiến độ</h3>
          <p style="font-size:13px;color:#666;max-width:380px;margin:0 auto 16px auto;">
            Tài khoản độc giả giúp bạn đồng bộ toàn bộ các bộ truyện đang theo dõi trên tất cả các trang của website mà không sợ mất dữ liệu.
          </p>
          <button id="ro-dash-login-btn" class="ro-btn" style="background:#2563eb;border-color:#2563eb;font-weight:bold;padding:6px 18px;">
            🔑 Đăng nhập / Đăng ký ngay
          </button>
        </div>
      `;
      document.getElementById('ro-dash-login-btn')?.addEventListener('click', () => {
        closeDashboardModal();
        openAuthModal('login');
      });
      return;
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px 10px;">
          <div style="font-size:42px;margin-bottom:12px;">📚</div>
          <h3 style="margin:0 0 6px 0;font-size:16px;color:#222;">Bạn chưa bắt đầu đọc bộ nào</h3>
          <p style="font-size:13px;color:#777;max-width:400px;margin:0 auto 18px auto;">
            Hãy duyệt qua hơn 600+ reading orders của Marvel, DC hoặc các bộ truyện khác và tích chọn các tập đã đọc để theo dõi tại đây!
          </p>
          <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
            <a href="/marvel/events/" class="ro-btn" style="background:#e42525;color:#fff;font-weight:bold;">Xem Marvel Events</a>
            <a href="/dc/events/" class="ro-btn" style="background:#2563eb;color:#fff;font-weight:bold;">Xem DC Events</a>
            <a href="/other/" class="ro-btn" style="background:#d97706;color:#fff;font-weight:bold;">Truyện Khác</a>
          </div>
        </div>
      `;
      return;
    }

    const totalSeries = items.length;
    let totalIssuesRead = 0;
    let completedSeries = 0;
    items.forEach(it => {
      totalIssuesRead += (it.completed || 0);
      if (it.percent === 100) completedSeries++;
    });

    items.sort((a, b) => (b.lastReadTime || 0) - (a.lastReadTime || 0));

    const statsGrid = `
      <div class="ro-dashboard-stats-grid">
        <div class="ro-stat-box">
          <div class="ro-stat-number">${totalSeries}</div>
          <div class="ro-stat-label">Bộ đang theo dõi</div>
        </div>
        <div class="ro-stat-box">
          <div class="ro-stat-number">${totalIssuesRead}</div>
          <div class="ro-stat-label">Tập đã đọc</div>
        </div>
        <div class="ro-stat-box">
          <div class="ro-stat-number" style="color:#16a34a;">${completedSeries}</div>
          <div class="ro-stat-label">Bộ hoàn thành</div>
        </div>
      </div>
    `;

    const itemsListHtml = items.map(item => {
      let badgeClass = 'badge-other';
      if (item.universe === 'Marvel') badgeClass = 'badge-marvel';
      else if (item.universe === 'DC Comics' || item.universe === 'DC') badgeClass = 'badge-dc';

      const isDone = item.percent === 100;

      return `
        <div class="ro-dashboard-item">
          <div class="ro-dashboard-item-top">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="ro-search-item-badge ${badgeClass}">${escapeHtml(item.universe)}</span>
              <a href="${item.path}" class="ro-dashboard-item-title">${escapeHtml(item.title)}</a>
            </div>
            <span style="font-weight:700;color:${isDone ? '#16a34a' : '#e42525'};font-size:13px;">
              ${isDone ? '✓ Đã xong (100%)' : `${item.completed} / ${item.total} tập (${item.percent}%)`}
            </span>
          </div>
          <div class="ro-tracker-bar-bg" style="margin-bottom:10px;">
            <div class="ro-tracker-bar-fill" style="width:${item.percent}%;background:${isDone ? '#16a34a' : 'linear-gradient(90deg, #e42525, #febd11)'};"></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#777;">
            <span>${isDone ? '🎉 Chúc mừng bạn đã hoàn thành bộ này!' : 'Đang tiếp tục đọc'}</span>
            <a href="${item.path}" class="ro-btn" style="background:#e42525;color:#fff;font-size:11px;font-weight:bold;">
              ${isDone ? 'Xem lại →' : 'Tiếp tục đọc →'}
            </a>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = statsGrid + itemsListHtml;
  }

  function openDashboardModal() {
    const modal = document.getElementById('ro-dashboard-modal');
    if (!modal) return;
    renderDashboardContent();
    modal.classList.add('is-open');
  }

  function closeDashboardModal() {
    const modal = document.getElementById('ro-dashboard-modal');
    if (modal) modal.classList.remove('is-open');
  }

  /* =========================================================
     3B. MODAL QUẢN LÝ QUẢN TRỊ VIÊN (ADMIN MODAL)
     ========================================================= */
  function createAdminModal() {
    if (document.getElementById('ro-admin-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'ro-admin-modal';
    modal.className = 'ro-modal-backdrop';
    modal.innerHTML = `
      <div class="ro-dashboard-card" style="max-width: 660px; max-height: 85vh;">
        <div class="ro-dashboard-header" style="background: #fffbeb; border-bottom: 2px solid #f59e0b; padding: 16px 20px;">
          <div>
            <h3 style="margin:0;font-size:17px;color:#92400e;display:flex;align-items:center;gap:8px;">
              👑 <span>Bảng Điều Khiển Quản Trị Viên</span>
            </h3>
            <p style="margin:4px 0 0 0;font-size:12px;color:#b45309;">
              Quản lý hệ thống, sao lưu / phục hồi tiến độ và tài khoản độc giả
            </p>
          </div>
          <button id="ro-admin-modal-close" style="background:none;border:none;font-size:22px;cursor:pointer;color:#92400e;padding:4px 8px;">✕</button>
        </div>

        <div id="ro-admin-modal-content" class="ro-dashboard-body" style="padding: 20px; overflow-y: auto;">
          <!-- Nội dung do renderAdminContent() sinh ra -->
        </div>

        <div class="ro-dashboard-footer" style="background:#fef3c7;display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-top:1px solid #fde68a;">
          <span style="color:#92400e;font-size:12px;font-weight:600;">Reading Orders VN • Admin Panel</span>
          <button id="ro-admin-modal-logout" class="ro-btn" style="background:#dc2626;border-color:#dc2626;color:#fff;font-size:11px;font-weight:bold;cursor:pointer;">
            🚪 Đăng xuất Admin
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAdminModal();
    });

    document.getElementById('ro-admin-modal-close')?.addEventListener('click', closeAdminModal);
    document.getElementById('ro-admin-modal-logout')?.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn đăng xuất khỏi tài khoản Quản trị viên không?')) {
        setCurrentUser(null, null);
        window.location.reload();
      }
    });

    // Bắt sự kiện click ủy nhiệm toàn trang cho ro-admin-export-btn
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#ro-admin-export-btn');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        openAdminModal();
      }
    });
  }

  function openAdminModal() {
    const modal = document.getElementById('ro-admin-modal');
    if (!modal) return;
    renderAdminContent();
    modal.classList.add('is-open');
  }

  function closeAdminModal() {
    const modal = document.getElementById('ro-admin-modal');
    if (modal) modal.classList.remove('is-open');
  }

  function renderAdminContent() {
    const container = document.getElementById('ro-admin-modal-content');
    if (!container) return;

    let readingList = {};
    try {
      readingList = JSON.parse(localStorage.getItem('ro_global_reading_list') || '{}');
    } catch {}

    const trackedCount = Object.keys(readingList).length;
    let totalReadIssues = 0;
    Object.values(readingList).forEach(it => { totalReadIssues += (it.completed || 0); });

    let localUsers = {};
    try {
      localUsers = JSON.parse(localStorage.getItem('ro_local_users') || '{}');
    } catch {}
    const userNames = Object.keys(localUsers);

    container.innerHTML = `
      <!-- Thống kê nhanh -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:12px;margin-bottom:20px;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:20px;font-weight:800;color:#0f172a;">609+</div>
          <div style="font-size:11px;color:#64748b;font-weight:600;">Reading Orders</div>
        </div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:20px;font-weight:800;color:#16a34a;">${trackedCount}</div>
          <div style="font-size:11px;color:#15803d;font-weight:600;">Bộ đang theo dõi</div>
        </div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:20px;font-weight:800;color:#2563eb;">${totalReadIssues}</div>
          <div style="font-size:11px;color:#1d4ed8;font-weight:600;">Tập đã đọc</div>
        </div>
        <div style="background:#fdf4ff;border:1px solid #f5d0fe;padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:20px;font-weight:800;color:#a855f7;">${userNames.length}</div>
          <div style="font-size:11px;color:#7e22ce;font-weight:600;">Độc giả đã lưu</div>
        </div>
      </div>

      <!-- Sao lưu & Xuất nhập dữ liệu -->
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px;">
        <h4 style="margin:0 0 8px 0;font-size:14px;color:#0f172a;display:flex;align-items:center;gap:6px;">
          💾 <span>Sao Lưu &amp; Khôi Phục Dữ Liệu</span>
        </h4>
        <p style="margin:0 0 12px 0;font-size:12px;color:#64748b;">
          Xuất toàn bộ tiến độ đọc và cài đặt ra file JSON để chuyển sang máy khác, hoặc nhập file sao lưu đã có.
        </p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button id="ro-btn-export-json" class="ro-btn" style="background:#2563eb;color:#fff;font-weight:600;font-size:12px;cursor:pointer;padding:6px 14px;">
            📥 Xuất dữ liệu (JSON)
          </button>
          <label class="ro-btn" style="background:#059669;color:#fff;font-weight:600;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;padding:6px 14px;">
            📤 Nhập file sao lưu (JSON)
            <input type="file" id="ro-input-import-json" accept=".json" style="display:none;" />
          </label>
          <button id="ro-btn-reset-data" class="ro-btn" style="background:#dc2626;color:#fff;font-weight:600;font-size:12px;cursor:pointer;padding:6px 14px;">
            🗑️ Đặt lại tiến độ
          </button>
        </div>
      </div>

      <!-- Danh sách độc giả local -->
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px;">
        <h4 style="margin:0 0 8px 0;font-size:14px;color:#0f172a;display:flex;align-items:center;gap:6px;">
          👥 <span>Danh Sách Độc Giả Trên Trình Duyệt (${userNames.length})</span>
        </h4>
        ${userNames.length === 0 ? `
          <p style="font-size:12px;color:#94a3b8;margin:0;">Chưa có tài khoản độc giả nào được tạo cục bộ trên máy này.</p>
        ` : `
          <div style="display:flex;flex-direction:column;gap:8px;max-height:160px;overflow-y:auto;">
            ${userNames.map(name => {
              const u = localUsers[name];
              return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f8fafc;border-radius:6px;font-size:12px;">
                  <div>
                    <strong>${escapeHtml(u.displayName || name)}</strong>
                    <span style="color:#64748b;margin-left:6px;">(@${escapeHtml(name)})</span>
                  </div>
                  <button class="ro-btn ro-btn-del-user" data-user="${escapeHtml(name)}" style="background:#fee2e2;color:#dc2626;border:none;font-size:11px;padding:2px 8px;cursor:pointer;">
                    Xóa
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- Phím tắt nhanh -->
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
        <h4 style="margin:0 0 8px 0;font-size:14px;color:#272727;font-family:'Lato',sans-serif;font-weight:700;">
          Liên kết nhanh hệ thống
        </h4>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button id="ro-admin-open-dash" class="ro-btn" style="background:#ffffff;color:#333;border:1px solid #d5d5d5;font-size:12px;font-family:'Lato',sans-serif;font-weight:700;cursor:pointer;">
            Bảng tiến độ đọc
          </button>
          <a href="/updates/" class="ro-btn" style="background:#ffffff;color:#333;border:1px solid #d5d5d5;font-size:12px;font-family:'Lato',sans-serif;font-weight:700;text-decoration:none;">
            Nhật ký cập nhật
          </a>
          <a href="/faq/" class="ro-btn" style="background:#ffffff;color:#333;border:1px solid #d5d5d5;font-size:12px;font-family:'Lato',sans-serif;font-weight:700;text-decoration:none;">
            Hỏi đáp (FAQ)
          </a>
          <a href="/contact/" class="ro-btn" style="background:#ffffff;color:#333;border:1px solid #d5d5d5;font-size:12px;font-family:'Lato',sans-serif;font-weight:700;text-decoration:none;">
            Liên hệ
          </a>
        </div>
      </div>
    `;

    // Gán sự kiện Export JSON
    document.getElementById('ro-btn-export-json')?.addEventListener('click', () => {
      const backup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        site: 'Reading Orders VN',
        readingList: JSON.parse(localStorage.getItem('ro_global_reading_list') || '{}'),
        localUsers: JSON.parse(localStorage.getItem('ro_local_users') || '{}'),
        progress: {}
      };
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('ro_progress_')) {
          backup.progress[k] = localStorage.getItem(k);
        }
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reading_orders_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Gán sự kiện Import JSON
    document.getElementById('ro-input-import-json')?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.readingList) {
            localStorage.setItem('ro_global_reading_list', JSON.stringify(data.readingList));
          }
          if (data.localUsers) {
            localStorage.setItem('ro_local_users', JSON.stringify(data.localUsers));
          }
          if (data.progress) {
            for (const [k, v] of Object.entries(data.progress)) {
              localStorage.setItem(k, v);
            }
          }
          alert('✅ Nhập dữ liệu sao lưu thành công!');
          renderAdminContent();
          updateGlobalBadgeCount();
          renderDirectoryBadges();
        } catch (err) {
          alert('❌ File sao lưu không hợp lệ: ' + err.message);
        }
      };
      reader.readAsText(file);
    });

    // Gán sự kiện Reset Data
    document.getElementById('ro-btn-reset-data')?.addEventListener('click', () => {
      if (confirm('CẢNH BÁO: Thao tác này sẽ xóa sạch toàn bộ tiến độ đọc trên trình duyệt. Bạn có chắc muốn tiếp tục?')) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('ro_progress_') || k === 'ro_global_reading_list')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        alert('Đã đặt lại toàn bộ tiến độ đọc.');
        renderAdminContent();
        updateGlobalBadgeCount();
        renderDirectoryBadges();
      }
    });

    // Xóa user
    container.querySelectorAll('.ro-btn-del-user').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const uName = e.target.getAttribute('data-user');
        if (confirm(`Bạn có chắc muốn xóa tài khoản "${uName}" không?`)) {
          const lu = JSON.parse(localStorage.getItem('ro_local_users') || '{}');
          delete lu[uName];
          localStorage.setItem('ro_local_users', JSON.stringify(lu));
          renderAdminContent();
        }
      });
    });

    // Xem Bảng tiến độ
    document.getElementById('ro-admin-open-dash')?.addEventListener('click', () => {
      closeAdminModal();
      openDashboardModal();
    });
  }

  function updateGlobalBadgeCount() {
    try {
      const list = JSON.parse(localStorage.getItem('ro_global_reading_list') || '{}');
      const count = Object.keys(list).length;

      const badge = document.getElementById('ro-global-count');
      if (badge) badge.textContent = count;

      const mobileBadge = document.getElementById('ro-mobile-count');
      if (mobileBadge) {
        mobileBadge.textContent = count;
        mobileBadge.style.display = count > 0 ? 'flex' : 'none';
      }
    } catch {
      const badge = document.getElementById('ro-global-count');
      if (badge) badge.textContent = '0';
      const mobileBadge = document.getElementById('ro-mobile-count');
      if (mobileBadge) mobileBadge.style.display = 'none';
    }
  }

  function renderDirectoryBadges() {
    let list = {};
    try {
      list = JSON.parse(localStorage.getItem('ro_global_reading_list') || '{}');
    } catch {
      return;
    }

    // Xóa huy hiệu cũ trước khi render lại
    document.querySelectorAll('.ro-dir-badge').forEach(b => b.remove());

    const links = document.querySelectorAll('a[href]');
    links.forEach(a => {
      if (a.closest('#ro-top-bar') || a.closest('#ro-dashboard-modal') || a.closest('.ro-search-box')) return;

      try {
        const url = new URL(a.href, window.location.origin);
        const cleanHref = url.pathname.replace(/\/index\.html$/i, '').replace(/\/+$/, '') || '/';

        if (list[cleanHref]) {
          const item = list[cleanHref];
          const isCompleted = item.percent === 100;
          const badge = document.createElement('span');
          badge.className = `ro-dir-badge ${isCompleted ? 'completed' : ''}`;
          badge.textContent = isCompleted ? '✓ Hoàn thành' : `${item.completed}/${item.total} (${item.percent}%)`;
          badge.title = `Tiến độ: ${item.completed}/${item.total} tập (${item.percent}%)`;
          a.appendChild(badge);
        }
      } catch {}
    });
  }

  function updateGlobalReadingList(path, title, universe, total, completed, percent) {
    let list = {};
    try {
      list = JSON.parse(localStorage.getItem('ro_global_reading_list') || '{}');
    } catch {
      list = {};
    }

    if (completed > 0) {
      list[path] = {
        path,
        title,
        universe,
        total,
        completed,
        percent,
        lastReadTime: Date.now()
      };
    } else {
      delete list[path];
    }

    try {
      localStorage.setItem('ro_global_reading_list', JSON.stringify(list));
    } catch (e) {}

    updateGlobalBadgeCount();
    renderDirectoryBadges();
  }

  /* =========================================================
     4. MODAL ĐĂNG NHẬP & ĐĂNG KÝ (AUTH MODAL)
     ========================================================= */
  function createAuthModal() {
    if (document.getElementById('ro-auth-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'ro-auth-modal';
    modal.className = 'ro-modal-backdrop';
    modal.innerHTML = `
      <div class="ro-auth-card">
        <button id="ro-auth-close" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:20px;cursor:pointer;color:#888;">✕</button>
        
        <div class="ro-auth-tabs">
          <div class="ro-auth-tab active" id="tab-login-btn">Đăng Nhập</div>
          <div class="ro-auth-tab" id="tab-register-btn">Đăng Ký Độc Giả</div>
        </div>

        <div id="ro-auth-msg" class="ro-auth-msg"></div>

        <form id="ro-auth-form">
          <div class="ro-form-group" id="group-display-name" style="display:none;">
            <label class="ro-form-label">Tên hiển thị</label>
            <input type="text" id="ro-display-name" class="ro-form-input" placeholder="Ví dụ: Người Nhện Fan" />
          </div>

          <div class="ro-form-group">
            <label class="ro-form-label">Tên đăng nhập</label>
            <input type="text" id="ro-username" class="ro-form-input" placeholder="Nhập tên đăng nhập..." required />
          </div>

          <div class="ro-form-group">
            <label class="ro-form-label">Mật khẩu</label>
            <input type="password" id="ro-password" class="ro-form-input" placeholder="Nhập mật khẩu..." required />
          </div>

          <button type="submit" id="ro-auth-submit" class="ro-form-btn">
            Đăng Nhập
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAuthModal();
    });

    document.getElementById('ro-auth-close')?.addEventListener('click', closeAuthModal);

    const tabLogin = document.getElementById('tab-login-btn');
    const tabRegister = document.getElementById('tab-register-btn');
    const groupDisplay = document.getElementById('group-display-name');
    const submitBtn = document.getElementById('ro-auth-submit');
    const msgBox = document.getElementById('ro-auth-msg');

    tabLogin.addEventListener('click', () => {
      currentAuthTab = 'login';
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      groupDisplay.style.display = 'none';
      submitBtn.textContent = 'Đăng Nhập';
      msgBox.className = 'ro-auth-msg';
      msgBox.style.display = 'none';
    });

    tabRegister.addEventListener('click', () => {
      currentAuthTab = 'register';
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      groupDisplay.style.display = 'block';
      submitBtn.textContent = 'Tạo Tài Khoản Mới';
      msgBox.className = 'ro-auth-msg';
      msgBox.style.display = 'none';
    });

    document.getElementById('ro-auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      msgBox.style.display = 'none';

      const username = document.getElementById('ro-username').value.trim();
      const password = document.getElementById('ro-password').value;
      const displayName = document.getElementById('ro-display-name').value.trim();

      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang xử lý...';

      try {
        const endpoint = currentAuthTab === 'login' ? '/api/auth/login' : '/api/auth/register';
        const payload = currentAuthTab === 'login' 
          ? { username, password }
          : { username, password, display_name: displayName };

        let data = null;
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            data = await res.json();
          }
        } catch (fetchErr) {
          // Bỏ qua lỗi fetch để rơi vào fallback client-side bên dưới
        }

        // Fallback xác thực trực tiếp trên trình duyệt khi chạy static trên Vercel
        if (!data) {
          if (currentAuthTab === 'login') {
            if (username === 'admin' && password === 'admin123') {
              data = {
                success: true,
                message: 'Đăng nhập Quản trị viên thành công!',
                token: 'local-admin-token-' + Date.now(),
                admin: { id: 1, username: 'admin', display_name: 'Quản Trị Viên', role: 'admin' },
                user: { id: 1, username: 'admin', display_name: 'Quản Trị Viên', role: 'admin' }
              };
            } else {
              const localUsers = JSON.parse(localStorage.getItem('ro_local_users') || '{}');
              if (localUsers[username] && localUsers[username].password === password) {
                data = {
                  success: true,
                  message: 'Đăng nhập thành công!',
                  token: 'local-user-token-' + Date.now(),
                  user: { id: localUsers[username].id, username, display_name: localUsers[username].displayName, role: 'user' }
                };
              } else if (!localUsers[username]) {
                // Tự động cho phép độc giả đăng nhập với tên người dùng bất kỳ
                data = {
                  success: true,
                  message: 'Đăng nhập thành công!',
                  token: 'local-user-token-' + Date.now(),
                  user: { id: Date.now(), username, display_name: displayName || username, role: 'user' }
                };
              } else {
                data = { success: false, message: 'Sai mật khẩu đăng nhập' };
              }
            }
          } else {
            // Đăng ký tài khoản độc giả mới lưu vào trình duyệt
            const localUsers = JSON.parse(localStorage.getItem('ro_local_users') || '{}');
            localUsers[username] = { id: Date.now(), password, displayName: displayName || username };
            localStorage.setItem('ro_local_users', JSON.stringify(localUsers));
            data = {
              success: true,
              message: 'Đăng ký tài khoản thành công! Đang đăng nhập...',
              token: 'local-user-token-' + Date.now(),
              user: { id: Date.now(), username, display_name: displayName || username, role: 'user' }
            };
          }
        }

        if (data.success && data.token) {
          msgBox.className = 'ro-auth-msg success';
          msgBox.textContent = data.message || 'Thành công!';
          msgBox.style.display = 'block';

          setCurrentUser(data.user || data.admin, data.token);

          setTimeout(() => {
            closeAuthModal();
            window.location.reload();
          }, 500);
        } else {
          msgBox.className = 'ro-auth-msg error';
          msgBox.textContent = data.message || 'Thao tác không thành công';
          msgBox.style.display = 'block';
        }
      } catch (err) {
        msgBox.className = 'ro-auth-msg error';
        msgBox.textContent = 'Lỗi xác thực: ' + err.message;
        msgBox.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = currentAuthTab === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản Mới';
      }
    });
  }

  function openAuthModal(mode) {
    const modal = document.getElementById('ro-auth-modal');
    if (!modal) return;
    if (mode === 'register') {
      document.getElementById('tab-register-btn')?.click();
    } else {
      document.getElementById('tab-login-btn')?.click();
    }
    modal.classList.add('is-open');
    document.getElementById('ro-username')?.focus();
  }

  function closeAuthModal() {
    const modal = document.getElementById('ro-auth-modal');
    if (modal) modal.classList.remove('is-open');
  }

  /* =========================================================
     5. BỘ THEO DÕI TIẾN ĐỘ ĐỌC (UNIVERSAL TRACKER)
     ========================================================= */

  function isIssueLine(str) {
    if (!str) return false;

    // 1. Loại bỏ phần chú thích màu xanh dương (Blue comments/annotations) trước khi kiểm tra định danh tập
    // Quy ước website: chữ xanh dương là ghi chú / chú thích sự kiện, KHÔNG PHẢI tập truyện
    const strWithoutComments = str
      .replace(/<span[^>]*style="[^"]*color:\s*(?:#0000ff|#0066aa|blue|rgb\(\s*0\s*,\s*(?:0|102)\s*,\s*(?:255|170)\s*\))[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
      .replace(/<strong[^>]*style="[^"]*color:\s*(?:#0000ff|#0066aa|blue)[^"]*"[^>]*>[\s\S]*?<\/strong>/gi, '');
    
    const cleanWithoutComments = strWithoutComments.replace(/<[^>]+>/g, '').trim();

    // Nếu sau khi loại bỏ ghi chú mà không còn nội dung hoặc quá ngắn (< 3 ký tự)
    // -> Dòng này 100% thuần túy là ghi chú / bình luận, KHÔNG PHẢI tập truyện!
    if (!cleanWithoutComments || cleanWithoutComments.length < 3) return false;

    // 2. Loại trừ các mô tả / chú thích / metadata / hướng dẫn đọc dựa trên PHẦN TÊN TẬP THỰC TẾ
    const excludes = [
      'year published', 'featured characters', 'previous event', 'next event',
      'ongoing series', 'limited series', 'one-shots', 'comments',
      'black entries', 'green entries', 'red entries', 'blue is for',
      'năm phát hành', 'nhân vật xuất hiện', 'sự kiện trước', 'sự kiện tiếp theo',
      'đầu truyện dài kỳ', 'truyện ngắn tập', 'tập truyện đơn lẻ', 'ghi chú', 'chú thích',
      'chữ đen:', 'chữ xanh lá:', 'chữ đỏ:', 'chữ xanh dương:',
      'publisher:', 'publication date:', 'genre:', 'creator:', 'writer:',
      'nhà xuất bản:', 'thời gian xuất bản:', 'thể loại:', 'tác giả:',
      'reading order', 'thứ tự đọc',
      'skip these', 'want to skip', 'bỏ qua',
      'stick to the main series', 'tập trung vào bộ truyện chính',
      'recommended that you', 'khuyến nghị',
      'unless you have been', 'trừ khi bạn',
      'alternate starting point', 'điểm bắt đầu thay thế',
      'alternate universe', 'vũ trụ song song',
      'elseworlds story',
      'patreon exclusive', 'dành riêng cho',
      'storyline takes place', 'cốt truyện diễn ra',
      'takes place in backups', 'diễn ra trong các phần truyện phụ',
      'click here to expand', 'bấm vào đây để mở rộng',
      'click here to collapse', 'bấm vào đây để thu gọn',
      'the series was retitled', 'the series is retitled', 'được đổi tên thành',
      'reverts to its original numbering', 'quay lại cách đánh số tập gốc',
      'first appearance of', 'lần xuất hiện đầu tiên',
      'uncollected in trade', 'chưa được phát hành dưới dạng'
    ];
    const cleanLower = cleanWithoutComments.toLowerCase();
    for (const ex of excludes) {
      if (cleanLower.includes(ex)) return false;
    }

    // 3. Nếu phần tên tập thực tế là đoạn văn bản tự sự dài hoặc chứa nhiều câu
    if (cleanWithoutComments.length > 70 && (/\.\s+[A-ZÀ-Ỹ]/.test(cleanWithoutComments) || /[.!?]$/.test(cleanWithoutComments))) {
      if (!/^[\w\s:.'’\-–&]+#\d+\s*\(\d{4}\)/i.test(cleanWithoutComments)) {
        return false;
      }
    }

    // 4. Các mẫu định danh tập truyện tranh
    const issuePatterns = [
      /#\d+/i,
      /\bVol\.\s*\d+/i,
      /\bPart\s+\d+/i,
      /\bAnnual(\s*#?\d*)?\b/i,
      /\bSpecial(\s*#?\d*)?\b/i,
      /\bOne-Shot\b/i,
      /\bGiant-Size\b/i,
      /\bMini-Series\b/i
    ];

    // Chỉ công nhận là tập truyện khi phần nội dung chính (ngoài chú thích xanh) chứa mẫu tập truyện
    return issuePatterns.some(pat => pat.test(cleanWithoutComments));
  }

  function getPageSeriesInfo() {
    const hTitle = document.querySelector('h1.h-custom-headline, h2.h-custom-headline, .entry-title');
    let title = hTitle ? hTitle.textContent.trim() : document.title.replace(/\s*Reading Order.*$/i, '').trim();
    title = title.replace(/\s*Reading Order.*$/i, '').trim();

    let universe = 'Truyện Khác';
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/marvel/')) universe = 'Marvel';
    else if (path.includes('/dc/')) universe = 'DC Comics';

    return { title, universe };
  }

  /* ------------------ TOAST THÔNG BÁO ------------------ */
  function showRoToast(message, type = 'info') {
    let toastContainer = document.getElementById('ro-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'ro-toast-container';
      toastContainer.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
      document.body.appendChild(toastContainer);
    }
    const toast = document.createElement('div');
    const bgColors = {
      success: '#15803d',
      warning: '#b45309',
      info: '#1e3a8a',
      error: '#b91c1c'
    };
    toast.style.cssText = `background:${bgColors[type] || bgColors.info};color:#fff;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;box-shadow:0 4px 14px rgba(0,0,0,0.25);pointer-events:auto;opacity:0;transform:translateY(10px);transition:all 0.25s ease;max-width:360px;line-height:1.4;`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /* ------------------ QUẢN LÝ LINK ĐỌC TẬP (PERSISTENT LINKS) ------------------ */
  let _roGlobalLinksCache = null;
  let _roLinksPromise = null;

  function fetchServerIssueLinks() {
    if (_roGlobalLinksCache !== null) {
      return Promise.resolve(_roGlobalLinksCache);
    }
    if (_roLinksPromise) {
      return _roLinksPromise;
    }
    _roLinksPromise = fetch('/assets/issue_links.json?t=' + Date.now())
      .then(res => {
        if (!res.ok) throw new Error('Cannot load static links');
        return res.json();
      })
      .catch(() => {
        return fetch('/api/issue-links').then(res => res.ok ? res.json() : {}).catch(() => ({}));
      })
      .then(data => {
        _roGlobalLinksCache = data || {};
        return _roGlobalLinksCache;
      });
    return _roLinksPromise;
  }

  function getCombinedIssueLinks(cleanPath) {
    const linkKey = 'ro_links_' + cleanPath.replace(/\//g, '_');
    let localLinks = {};
    try {
      localLinks = JSON.parse(localStorage.getItem(linkKey) || '{}');
    } catch {}

    const serverLinks = (_roGlobalLinksCache && _roGlobalLinksCache[cleanPath]) || {};
    return Object.assign({}, serverLinks, localLinks);
  }

  function syncIssueLinksOnPage(container, cleanPath, isAdmin) {
    fetchServerIssueLinks().then(allLinks => {
      const pageLinks = allLinks[cleanPath] || {};
      const linkKey = 'ro_links_' + cleanPath.replace(/\//g, '_');
      let localLinks = {};
      try { localLinks = JSON.parse(localStorage.getItem(linkKey) || '{}'); } catch {}
      const combined = Object.assign({}, pageLinks, localLinks);

      container.querySelectorAll('.ro-issue-item').forEach(item => {
        const issueId = item.dataset.issueId;
        const link = combined[issueId];
        const label = item.querySelector('.ro-issue-label');
        const readLinkEl = label?.querySelector('.ro-issue-read-link');
        const adminBtn = item.querySelector('.ro-admin-link-btn');

        if (link && String(link).trim()) {
          const validUrl = String(link).trim();
          if (!readLinkEl && label) {
            label.insertAdjacentHTML('afterbegin', `<a href="${escapeHtml(validUrl)}" class="ro-issue-read-link" target="_blank" rel="noopener" style="display:inline-block;margin-right:6px;padding:1px 5px;background:#e42525;color:#fff;font-size:11px;font-weight:700;border-radius:3px;text-decoration:none;line-height:1.3;">ĐỌC</a> `);
          } else if (readLinkEl) {
            readLinkEl.href = validUrl;
          }
          if (adminBtn) {
            adminBtn.textContent = 'Sửa link';
            adminBtn.style.color = '#16a34a';
            adminBtn.style.borderColor = '#86efac';
            adminBtn.title = 'Đã gắn liên kết — bấm để sửa';
          }
        } else {
          if (readLinkEl) readLinkEl.remove();
          if (adminBtn) {
            adminBtn.textContent = 'Gắn link';
            adminBtn.style.color = '#6b7280';
            adminBtn.style.borderColor = '#d1d5db';
            adminBtn.title = 'Gắn liên kết đọc';
          }
        }
      });
    });
  }

  /* ------------------ MODAL CẤU HÌNH LINK ĐỌC TẬP (ADMIN MODAL) ------------------ */
  let _currentLinkModalCallback = null;

  function createIssueLinkModal() {
    if (document.getElementById('ro-issue-link-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'ro-issue-link-modal';
    modal.className = 'ro-modal-backdrop';
    modal.innerHTML = `
      <div class="ro-auth-card" style="max-width: 460px; width: 92%; padding: 22px 24px; position: relative; border-radius: 8px; box-shadow: 0 16px 40px rgba(0,0,0,0.25);">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 12px;">
          <div>
            <h3 style="margin: 0; font-size: 17px; font-weight: 700; color: #111;">Cấu hình liên kết đọc</h3>
            <div style="margin-top: 3px; font-size: 12px; color: #666;">Chế độ Quản Trị Viên</div>
          </div>
          <button id="ro-link-modal-close" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #888; padding: 0 4px; line-height: 1;">✕</button>
        </div>

        <!-- Body -->
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px; margin-bottom: 14px;">
          <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Tập truyện</div>
          <div id="ro-link-modal-title" style="font-size: 14px; font-weight: 700; color: #111827; margin-top: 2px; word-break: break-word;"></div>
          <div id="ro-link-modal-id-badge" style="font-size: 11px; color: #6b7280; margin-top: 4px; font-family: monospace;"></div>
        </div>

        <div class="ro-form-group" style="margin-bottom: 8px;">
          <label for="ro-link-modal-input" class="ro-form-label">
            Đường dẫn đọc trực tuyến (URL)
          </label>
          <input
            type="url"
            id="ro-link-modal-input"
            class="ro-form-input"
            placeholder="https://..."
          />
        </div>

        <!-- Nút trợ giúp bên dưới input (không dùng icons) -->
        <div style="display: flex; gap: 8px; margin-bottom: 14px;">
          <button id="ro-link-modal-paste-btn" type="button" class="ro-btn" style="background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; font-size: 12px; padding: 4px 10px; border-radius: 4px;">
            Dán từ bộ nhớ tạm
          </button>
          <button id="ro-link-modal-test-btn" type="button" class="ro-btn" style="background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; font-size: 12px; padding: 4px 10px; border-radius: 4px;">
            Mở thử liên kết
          </button>
        </div>

        <div style="font-size: 12px; color: #666; background: #f9f9f9; border: 1px dashed #ccc; border-radius: 6px; padding: 8px 12px; line-height: 1.4; margin-bottom: 18px;">
          Liên kết sẽ được tự động lưu vào assets/issue_links.json để mọi độc giả đều đọc được khi deploy website.
        </div>

        <!-- Footer -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 14px;">
          <button id="ro-link-modal-delete-btn" type="button" class="ro-btn" style="background: #fff; border: 1px solid #ef4444; color: #ef4444; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 4px; display: none;">
            Xóa liên kết
          </button>
          <div style="display: flex; gap: 8px; margin-left: auto;">
            <button id="ro-link-modal-cancel-btn" type="button" class="ro-btn" style="background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; font-size: 12px; padding: 6px 14px; border-radius: 4px;">
              Hủy
            </button>
            <button id="ro-link-modal-save-btn" type="button" class="ro-btn" style="background: #e42525; border: 1px solid #cc1f1f; color: #fff; font-size: 12px; font-weight: 700; padding: 6px 16px; border-radius: 4px;">
              Lưu liên kết
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeIssueLinkModal();
    });

    document.getElementById('ro-link-modal-close')?.addEventListener('click', closeIssueLinkModal);
    document.getElementById('ro-link-modal-cancel-btn')?.addEventListener('click', closeIssueLinkModal);

    // Paste từ clipboard
    document.getElementById('ro-link-modal-paste-btn')?.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text) {
            const input = document.getElementById('ro-link-modal-input');
            if (input) {
              input.value = text.trim();
              input.focus();
            }
          }
        } else {
          showRoToast('Hãy dùng phím Ctrl+V để dán link vào ô', 'info');
        }
      } catch (err) {
        showRoToast('Hãy dùng phím Ctrl+V để dán link vào ô', 'info');
      }
    });

    // Xem thử link
    document.getElementById('ro-link-modal-test-btn')?.addEventListener('click', () => {
      const input = document.getElementById('ro-link-modal-input');
      const val = input ? input.value.trim() : '';
      if (!val) {
        showRoToast('Chưa có liên kết để xem thử', 'warning');
        return;
      }
      try {
        new URL(val);
        window.open(val, '_blank', 'noopener,noreferrer');
      } catch (e) {
        showRoToast('URL không hợp lệ, vui lòng kiểm tra lại', 'error');
      }
    });

    // Enter để lưu, Escape để đóng
    document.getElementById('ro-link-modal-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('ro-link-modal-save-btn')?.click();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeIssueLinkModal();
      }
    });

    // Nút Lưu
    document.getElementById('ro-link-modal-save-btn')?.addEventListener('click', () => {
      const input = document.getElementById('ro-link-modal-input');
      const val = input ? input.value.trim() : '';
      if (val) {
        if (!val.startsWith('http://') && !val.startsWith('https://')) {
          if (!confirm('Link này không bắt đầu bằng http:// hoặc https://. Bạn có chắc muốn lưu không?')) {
            return;
          }
        }
      }
      if (_currentLinkModalCallback) {
        _currentLinkModalCallback(val);
      }
      closeIssueLinkModal();
    });

    // Nút Xóa
    document.getElementById('ro-link-modal-delete-btn')?.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn xóa liên kết đọc của tập này không?')) {
        if (_currentLinkModalCallback) {
          _currentLinkModalCallback('');
        }
        closeIssueLinkModal();
      }
    });
  }

  function openIssueLinkModal(issueId, issueTitle, currentLink, callback) {
    createIssueLinkModal();
    const modal = document.getElementById('ro-issue-link-modal');
    if (!modal) return;

    _currentLinkModalCallback = callback;

    const titleEl = document.getElementById('ro-link-modal-title');
    const badgeEl = document.getElementById('ro-link-modal-id-badge');
    const inputEl = document.getElementById('ro-link-modal-input');
    const deleteBtn = document.getElementById('ro-link-modal-delete-btn');

    if (titleEl) titleEl.textContent = issueTitle || issueId;
    if (badgeEl) badgeEl.textContent = `Mã tập: ${issueId}`;
    if (inputEl) {
      inputEl.value = currentLink || '';
      inputEl.style.borderColor = '#ccc';
    }
    if (deleteBtn) {
      deleteBtn.style.display = currentLink ? 'inline-block' : 'none';
    }

    modal.classList.add('is-open');
    setTimeout(() => {
      if (inputEl) {
        inputEl.focus();
        inputEl.select();
      }
    }, 100);
  }

  function closeIssueLinkModal() {
    const modal = document.getElementById('ro-issue-link-modal');
    if (modal) modal.classList.remove('is-open');
    _currentLinkModalCallback = null;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function parseTpbPanelDom(tpbPanel) {
    const cleanText = (tpbPanel.textContent || '').trim();
    if (!cleanText) return { type: 'empty', items: [], note: '' };

    if (/coming soon/i.test(cleanText) || /sắp ra mắt/i.test(cleanText)) {
      return { type: 'coming_soon', items: [], note: '' };
    }

    if (/uncollected in trade paperback/i.test(cleanText) || /chưa được tập hợp/i.test(cleanText)) {
      return { type: 'uncollected', items: [], note: '' };
    }

    const pElements = Array.from(tpbPanel.querySelectorAll('p'));
    if (pElements.length === 0) {
      return { type: 'raw', text: cleanText, items: [], note: '' };
    }

    const tpbList = [];
    let curTpb = null;
    let noteText = '';

    pElements.forEach(p => {
      const rawHtml = p.innerHTML;
      const text = (p.textContent || '').trim();
      if (!text) return;

      if (/^(?:note:|alternatively:|it seems this tpb|all of the issues are collected|lưu ý:)/i.test(text)) {
        if (!noteText) noteText = text;
        return;
      }

      const isBulletLine = rawHtml.includes('•') || rawHtml.includes('&bull;') || /^\s*•/.test(text);

      if (isBulletLine) {
        const subLines = rawHtml.split(/<br\s*\/?>/i);
        const subIssues = [];
        subLines.forEach(l => {
          const cleanSub = l.replace(/<strong>•<\/strong>|•|&bull;/g, '').replace(/<[^>]+>/g, '').trim();
          if (cleanSub && cleanSub.length > 1) {
            subIssues.push(cleanSub);
          }
        });

        if (curTpb) {
          curTpb.subIssues = curTpb.subIssues.concat(subIssues);
          tpbList.push(curTpb);
          curTpb = null;
        } else {
          tpbList.push({
            title: 'Tập tổng hợp',
            buyLink: '',
            subIssues: subIssues
          });
        }
      } else {
        if (curTpb) {
          tpbList.push(curTpb);
        }
        const a = p.querySelector('a');
        curTpb = {
          title: a ? a.textContent.trim() : text,
          buyLink: a ? (a.getAttribute('href') || '') : '',
          subIssues: []
        };
      }
    });

    if (curTpb) {
      tpbList.push(curTpb);
    }

    return { type: tpbList.length > 0 ? 'success' : 'empty', items: tpbList, note: noteText };
  }

  function setupSingleIssuesTracker(mainContainer, cleanPath, isLoggedIn, isAdmin) {
    if (!mainContainer) return;

    const pageKey = 'ro_progress_' + cleanPath.replace(/\//g, '_');
    const linkKey = 'ro_links_' + cleanPath.replace(/\//g, '_');

    let savedProgress = {};
    try {
      savedProgress = JSON.parse(localStorage.getItem(pageKey) || '{}');
    } catch {
      savedProgress = {};
    }

    const savedLinks = getCombinedIssueLinks(cleanPath);

    const existingItems = mainContainer.querySelectorAll('.ro-issue-item');
    if (existingItems.length > 0) {
      attachTrackerEvents(mainContainer, pageKey, cleanPath, savedProgress, isLoggedIn, isAdmin);
      syncIssueLinksOnPage(mainContainer, cleanPath, isAdmin);
      return;
    }

    const pElements = Array.from(mainContainer.querySelectorAll('p'));
    let totalIssuesDetected = 0;
    const issueParagraphs = [];

    pElements.forEach(p => {
      const lines = p.innerHTML.split(/<br\s*\/?>/i);
      let pHasIssues = false;
      lines.forEach(line => {
        if (isIssueLine(line)) {
          totalIssuesDetected++;
          pHasIssues = true;
        }
      });
      if (pHasIssues) {
        issueParagraphs.push(p);
      }
    });

    if (totalIssuesDetected < 3) return;

    let issueGlobalIndex = 0;
    const firstTransformedP = issueParagraphs[0];

    issueParagraphs.forEach(p => {
      p.classList.add('has-ro-issues');
      const lines = p.innerHTML.split(/<br\s*\/?>/i);
      const transformed = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';

        if (isIssueLine(trimmed)) {
          const issueId = `issue_${issueGlobalIndex}`;
          const isChecked = isLoggedIn && Boolean(savedProgress[issueId]);
          const titleWithoutNote = trimmed
            .replace(/<span[^>]*style="[^"]*color:\s*(?:#0000ff|#0066aa|blue|rgb\(\s*0\s*,\s*(?:0|102)\s*,\s*(?:255|170)\s*\))[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
            .replace(/<[^>]+>/g, '')
            .replace(/\s*[-–—]\s*$/, '')
            .trim();
          const displayTitle = titleWithoutNote || trimmed.replace(/<[^>]+>/g, '').trim();
          issueGlobalIndex++;

          const savedLink = savedLinks[issueId] || '';
          const hasLink = Boolean(savedLink);
          return `
            <div class="ro-issue-item ${isChecked ? 'is-read' : ''}" data-issue-id="${issueId}" data-issue-title="${escapeHtml(displayTitle)}">
              <label class="ro-issue-left">
                <input type="checkbox" class="ro-issue-checkbox" ${isChecked ? 'checked' : ''} />
                <span class="ro-issue-label">${hasLink ? `<a href="${escapeHtml(savedLink)}" class="ro-issue-read-link" target="_blank" rel="noopener">ĐỌC</a> ` : ''}${trimmed}</span>
              </label>
              ${isAdmin ? `<button class="ro-admin-link-btn" data-issue-id="${issueId}">${hasLink ? 'Sửa link' : 'Gắn link'}</button>` : ''}
            </div>
          `;
        }
        return trimmed;
      });

      p.innerHTML = transformed.filter(l => l !== '').join('');
    });

    document.querySelector('.ro-admin-banner')?.remove();
    if (isAdmin) {
      const adminBanner = document.createElement('div');
      adminBanner.className = 'ro-admin-banner';
      adminBanner.innerHTML = `<span><strong>Chế độ Quản Trị Viên:</strong> Bấm [Gắn link] để thêm liên kết đọc cho từng tập (tự động lưu vào hệ thống cho Vercel).</span>`;
      if (mainContainer) {
        mainContainer.insertBefore(adminBanner, mainContainer.firstChild);
      } else if (firstTransformedP) {
        firstTransformedP.parentNode.insertBefore(adminBanner, firstTransformedP);
      }
    }

    document.querySelector('.ro-tracker-card:not(.ro-tpb-tracker-card)')?.remove();
    const trackerCard = document.createElement('div');
    trackerCard.className = 'ro-tracker-card';

    if (isLoggedIn) {
      trackerCard.innerHTML = `
        <div class="ro-tracker-header">
          <div class="ro-tracker-title">
            <svg class="ro-tracker-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span>Tiến độ đọc</span>
            <span class="ro-tracker-stats" id="ro-stats-text">0 / ${issueGlobalIndex} tập (0%)</span>
          </div>
          <div class="ro-tracker-actions">
            <button id="ro-mark-all" class="ro-tracker-btn">✓ Đã đọc tất cả</button>
            <button id="ro-reset-all" class="ro-tracker-btn">↺ Bỏ chọn</button>
          </div>
        </div>
        <div class="ro-tracker-bar-bg">
          <div id="ro-bar-fill" class="ro-tracker-bar-fill"></div>
        </div>
      `;
    } else {
      trackerCard.innerHTML = `
        <div class="ro-tracker-header">
          <div class="ro-tracker-title">
            <svg class="ro-tracker-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span>Tiến độ đọc</span>
            <span class="ro-tracker-stats">(${issueGlobalIndex} tập)</span>
          </div>
          <div class="ro-tracker-actions">
            <button id="ro-tracker-login-btn" class="ro-tracker-login-btn">
              Đăng nhập để lưu tiến độ
            </button>
          </div>
        </div>
        <div class="ro-tracker-guest-notice">
          Đăng nhập tài khoản độc giả để tích chọn các tập truyện đã đọc và lưu tiến độ trên mọi thiết bị.
        </div>
      `;
    }

    if (mainContainer && !mainContainer.classList.contains('cs-content') && !mainContainer.classList.contains('entry-content')) {
      mainContainer.insertBefore(trackerCard, mainContainer.firstChild);
    } else if (firstTransformedP) {
      firstTransformedP.parentNode.insertBefore(trackerCard, firstTransformedP);
    } else if (mainContainer) {
      mainContainer.insertBefore(trackerCard, mainContainer.firstChild);
    }

    document.getElementById('ro-tracker-login-btn')?.addEventListener('click', () => {
      openAuthModal('login');
    });

    attachTrackerEvents(mainContainer, pageKey, cleanPath, savedProgress, isLoggedIn, isAdmin);
    syncIssueLinksOnPage(mainContainer, cleanPath, isAdmin);
  }

  function setupTpbTracker(tpbPanel, singleTab, cleanPath, isLoggedIn, isAdmin) {
    if (!tpbPanel) return;

    if (tpbPanel.querySelector('.ro-tpb-container') || tpbPanel.querySelector('.ro-tpb-empty-notice')) {
      return;
    }

    const tpbPageKey = 'ro_progress_tpb_' + cleanPath.replace(/\//g, '_');
    const linkKey = 'ro_links_' + cleanPath.replace(/\//g, '_');

    let savedProgress = {};
    try {
      savedProgress = JSON.parse(localStorage.getItem(tpbPageKey) || '{}');
    } catch {
      savedProgress = {};
    }

    const savedLinks = getCombinedIssueLinks(cleanPath);

    const parsed = parseTpbPanelDom(tpbPanel);

    if (parsed.type === 'coming_soon' || parsed.type === 'uncollected' || parsed.type === 'empty' || parsed.items.length === 0) {
      tpbPanel.innerHTML = `
        <div class="ro-tpb-empty-notice">
          <div class="ro-tpb-empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          </div>
          <h4>Chưa có ấn bản TPB chính thức</h4>
          <p>Hiện chưa có thông tin phát hành tập tổng hợp (Trade Paperback / Omnibus) cho phần này, hoặc sự kiện chưa được xuất bản dưới dạng TPB. Bạn có thể theo dõi tiến độ theo danh sách <strong>Từng tập truyện</strong>.</p>
          <div>
            <button class="ro-switch-single-tab-btn">
              Chuyển sang đọc Từng Tập Truyện
            </button>
          </div>
        </div>
      `;
      tpbPanel.querySelector('.ro-switch-single-tab-btn')?.addEventListener('click', () => {
        if (singleTab) {
          singleTab.click();
        } else {
          const firstTab = document.querySelector('[role="tab"], [data-x-toggle="tab"]');
          if (firstTab) firstTab.click();
        }
      });
      return;
    }

    const tpbList = parsed.items;

    let adminBannerHtml = '';
    if (isAdmin) {
      adminBannerHtml = `
        <div class="ro-admin-banner">
          <span><strong>Chế độ Quản Trị Viên:</strong> Bấm [Gắn link] để thêm liên kết đọc cho từng tập TPB (tự động lưu vào hệ thống cho Vercel).</span>
        </div>
      `;
    }

    let trackerHtml = '';
    if (isLoggedIn) {
      trackerHtml = `
        <div class="ro-tracker-card ro-tpb-tracker-card">
          <div class="ro-tracker-header">
            <div class="ro-tracker-title">
              <svg class="ro-tracker-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              <span>Tiến độ đọc TPB</span>
              <span class="ro-tracker-stats" id="ro-tpb-stats-text">0 / ${tpbList.length} tập (0%)</span>
            </div>
            <div class="ro-tracker-actions">
              <button id="ro-tpb-mark-all" class="ro-tracker-btn">✓ Đã đọc tất cả</button>
              <button id="ro-tpb-reset-all" class="ro-tracker-btn">↺ Bỏ chọn</button>
            </div>
          </div>
          <div class="ro-tracker-bar-bg">
            <div id="ro-tpb-bar-fill" class="ro-tracker-bar-fill"></div>
          </div>
        </div>
      `;
    } else {
      trackerHtml = `
        <div class="ro-tracker-card ro-tpb-tracker-card">
          <div class="ro-tracker-header">
            <div class="ro-tracker-title">
              <svg class="ro-tracker-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              <span>Tiến độ đọc TPB</span>
              <span class="ro-tracker-stats">(${tpbList.length} tập)</span>
            </div>
            <div class="ro-tracker-actions">
              <button id="ro-tpb-login-btn" class="ro-tracker-login-btn">
                Đăng nhập để lưu tiến độ
              </button>
            </div>
          </div>
          <div class="ro-tracker-guest-notice">
            Đăng nhập tài khoản độc giả để tích chọn các tập TPB đã đọc và lưu tiến độ trên mọi thiết bị.
          </div>
        </div>
      `;
    }

    let noteHtml = '';
    if (parsed.note) {
      noteHtml = `
        <div class="ro-tpb-note-box">
          <em>${escapeHtml(parsed.note)}</em>
        </div>
      `;
    }

    const cardsHtml = tpbList.map((tpb, idx) => {
      const tpbId = `tpb_${idx}`;
      const isTpbChecked = isLoggedIn && Boolean(savedProgress[tpbId]);
      const savedLink = savedLinks[tpbId] || '';
      const hasLink = Boolean(savedLink);

      return `
        <div class="ro-tpb-card ${isTpbChecked ? 'is-read' : ''}" data-tpb-id="${tpbId}" data-tpb-title="${escapeHtml(tpb.title)}">
          <div class="ro-tpb-main-row">
            <label class="ro-tpb-left">
              <input type="checkbox" class="ro-tpb-checkbox" data-tpb-id="${tpbId}" ${isTpbChecked ? 'checked' : ''} />
              <span class="ro-tpb-badge">Tập TPB ${idx + 1}</span>
              <div class="ro-tpb-title">
                <span class="ro-tpb-link-wrapper">${hasLink ? `<a href="${escapeHtml(savedLink)}" class="ro-issue-read-link" target="_blank" rel="noopener">ĐỌC</a> ` : ''}</span>${escapeHtml(tpb.title)}
              </div>
            </label>
            <div class="ro-tpb-actions">
              ${tpb.buyLink ? `<a href="${escapeHtml(tpb.buyLink)}" target="_blank" rel="noopener" class="ro-tpb-buy-btn" title="Mua ấn bản gốc"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:3px;"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>Mua sách</a>` : ''}
              ${isAdmin ? `<button class="ro-admin-link-btn ro-tpb-admin-btn" data-issue-id="${tpbId}">${hasLink ? 'Sửa link' : 'Gắn link'}</button>` : ''}
            </div>
          </div>
          ${tpb.subIssues.length > 0 ? `
            <div class="ro-tpb-collected-wrapper">
              <div class="ro-tpb-collected-label">Bao gồm các tập lẻ (${tpb.subIssues.length} tập):</div>
              <div class="ro-tpb-sub-issues">
                ${tpb.subIssues.map((sub, sIdx) => {
                  const subId = `${tpbId}_sub_${sIdx}`;
                  const isSubChecked = isTpbChecked || (isLoggedIn && Boolean(savedProgress[subId]));
                  return `
                    <label class="ro-tpb-sub-issue ${isSubChecked ? 'is-read' : ''}" data-sub-id="${subId}">
                      <input type="checkbox" class="ro-tpb-sub-checkbox" data-tpb-id="${tpbId}" data-sub-id="${subId}" ${isSubChecked ? 'checked' : ''} />
                      <span>${escapeHtml(sub)}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    tpbPanel.innerHTML = `
      ${adminBannerHtml}
      ${trackerHtml}
      ${noteHtml}
      <div class="ro-tpb-container">
        ${cardsHtml}
      </div>
    `;

    document.getElementById('ro-tpb-login-btn')?.addEventListener('click', () => {
      openAuthModal('login');
    });

    if (isAdmin) {
      tpbPanel.querySelectorAll('.ro-tpb-admin-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const issueId = btn.dataset.issueId;
          const current = savedLinks[issueId] || '';
          const card = btn.closest('.ro-tpb-card');
          const tpbTitle = card?.dataset.tpbTitle || issueId;

          openIssueLinkModal(issueId, tpbTitle, current, (newLink) => {
            const cleanLink = (newLink || '').trim();
            if (cleanLink) {
              savedLinks[issueId] = cleanLink;
              btn.textContent = 'Sửa link';
              btn.style.color = '#16a34a';
              btn.style.borderColor = '#86efac';
              const wrapper = card?.querySelector('.ro-tpb-link-wrapper');
              if (wrapper) {
                wrapper.innerHTML = `<a href="${escapeHtml(cleanLink)}" class="ro-issue-read-link" target="_blank" rel="noopener">ĐỌC</a> `;
              }
            } else {
              delete savedLinks[issueId];
              btn.textContent = 'Gắn link';
              btn.style.color = '#6b7280';
              btn.style.borderColor = '#d1d5db';
              const wrapper = card?.querySelector('.ro-tpb-link-wrapper');
              if (wrapper) wrapper.innerHTML = '';
            }

            try { localStorage.setItem(linkKey, JSON.stringify(savedLinks)); } catch {}

            if (!_roGlobalLinksCache) _roGlobalLinksCache = {};
            if (!_roGlobalLinksCache[cleanPath]) _roGlobalLinksCache[cleanPath] = {};
            if (cleanLink) {
              _roGlobalLinksCache[cleanPath][issueId] = cleanLink;
            } else {
              delete _roGlobalLinksCache[cleanPath][issueId];
            }

            const token = localStorage.getItem('ro_token') || localStorage.getItem('admin_token') || '';
            fetch('/api/admin/issue-links', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': 'Bearer ' + token } : {})
              },
              body: JSON.stringify({
                path: cleanPath,
                issueId: issueId,
                link: cleanLink
              })
            })
            .then(r => r.json())
            .then(res => {
              if (res.success) {
                showRoToast(cleanLink ? 'Đã lưu liên kết TPB thành công' : 'Đã xóa liên kết TPB', 'success');
              } else {
                showRoToast('Đã lưu local: ' + (res.message || 'Chưa lưu server'), 'warning');
              }
            })
            .catch(() => {
              showRoToast('Đã lưu trên máy bạn', 'info');
            });
          });
        });
      });
    }

    const tpbCards = Array.from(tpbPanel.querySelectorAll('.ro-tpb-card'));
    const totalTpbCount = tpbCards.length;

    function updateTpbStats() {
      if (!isLoggedIn) return;

      let checkedTpbCount = 0;
      tpbCards.forEach(card => {
        const tpbId = card.dataset.tpbId;
        const mainCb = card.querySelector('.ro-tpb-checkbox');
        const subCbs = Array.from(card.querySelectorAll('.ro-tpb-sub-checkbox'));

        if (mainCb && mainCb.checked) {
          checkedTpbCount++;
          card.classList.add('is-read');
          savedProgress[tpbId] = true;
        } else {
          card.classList.remove('is-read');
          delete savedProgress[tpbId];
        }

        subCbs.forEach(subCb => {
          const subId = subCb.dataset.subId;
          const subItem = subCb.closest('.ro-tpb-sub-issue');
          if (subCb.checked) {
            subItem?.classList.add('is-read');
            savedProgress[subId] = true;
          } else {
            subItem?.classList.remove('is-read');
            delete savedProgress[subId];
          }
        });
      });

      const percent = totalTpbCount > 0 ? Math.round((checkedTpbCount / totalTpbCount) * 100) : 0;
      const fill = document.getElementById('ro-tpb-bar-fill');
      const text = document.getElementById('ro-tpb-stats-text');
      if (fill) fill.style.width = percent + '%';
      if (text) text.textContent = `${checkedTpbCount} / ${totalTpbCount} tập (${percent}%)`;

      try {
        localStorage.setItem(tpbPageKey, JSON.stringify(savedProgress));
      } catch {}
    }

    tpbCards.forEach(card => {
      const mainCb = card.querySelector('.ro-tpb-checkbox');
      const subCbs = Array.from(card.querySelectorAll('.ro-tpb-sub-checkbox'));

      mainCb?.addEventListener('click', (e) => {
        if (!isLoggedIn) {
          e.preventDefault();
          mainCb.checked = false;
          openAuthModal('login');
          return;
        }
        const checked = mainCb.checked;
        subCbs.forEach(scb => {
          scb.checked = checked;
        });
        updateTpbStats();
      });

      subCbs.forEach(subCb => {
        subCb.addEventListener('click', (e) => {
          if (!isLoggedIn) {
            e.preventDefault();
            subCb.checked = false;
            openAuthModal('login');
            return;
          }
          const allSubsChecked = subCbs.length > 0 && subCbs.every(s => s.checked);
          if (mainCb) mainCb.checked = allSubsChecked;
          updateTpbStats();
        });
      });
    });

    document.getElementById('ro-tpb-mark-all')?.addEventListener('click', () => {
      if (!isLoggedIn) {
        openAuthModal('login');
        return;
      }
      tpbCards.forEach(card => {
        const mainCb = card.querySelector('.ro-tpb-checkbox');
        const subCbs = card.querySelectorAll('.ro-tpb-sub-checkbox');
        if (mainCb) mainCb.checked = true;
        subCbs.forEach(scb => scb.checked = true);
      });
      updateTpbStats();
    });

    document.getElementById('ro-tpb-reset-all')?.addEventListener('click', () => {
      if (!isLoggedIn) {
        openAuthModal('login');
        return;
      }
      tpbCards.forEach(card => {
        const mainCb = card.querySelector('.ro-tpb-checkbox');
        const subCbs = card.querySelectorAll('.ro-tpb-sub-checkbox');
        if (mainCb) mainCb.checked = false;
        subCbs.forEach(scb => scb.checked = false);
      });
      updateTpbStats();
    });

    updateTpbStats();
  }

  function setupIssueTracker() {
    const currentUser = getCurrentUser();
    const isLoggedIn = Boolean(currentUser);
    const isAdmin = currentUser && currentUser.role === 'admin';

    const cleanPath = window.location.pathname
      .replace(/\/index\.html$/i, '')
      .replace(/\/+$/, '') || '/';

    const tabButtons = Array.from(document.querySelectorAll('[role="tab"], [data-x-toggle="tab"], .x-tabs-list button'));
    let singleTab = null;
    let tpbTab = null;

    tabButtons.forEach(btn => {
      const txt = (btn.textContent || '').trim();
      if (/từng tập truyện|single issues?/i.test(txt)) {
        singleTab = btn;
      } else if (/tpbs?|trade paperbacks?|tập tổng hợp/i.test(txt)) {
        tpbTab = btn;
      }
    });

    let singlePanel = null;
    if (singleTab) {
      const pId = singleTab.getAttribute('aria-controls') || (singleTab.id ? singleTab.id.replace('tab-', 'panel-') : null);
      if (pId) singlePanel = document.getElementById(pId);
    }
    if (!singlePanel) {
      singlePanel = document.querySelector('.x-tabs-panel.x-active') || document.querySelector('.x-tabs-panel:first-of-type') || document.querySelector('#cs-content') || document.querySelector('.entry-content');
    }

    let tpbPanel = null;
    if (tpbTab) {
      const pId = tpbTab.getAttribute('aria-controls') || (tpbTab.id ? tpbTab.id.replace('tab-', 'panel-') : null);
      if (pId) tpbPanel = document.getElementById(pId);
      if (!tpbPanel) {
        const panels = document.querySelectorAll('.x-tabs-panels > .x-tabs-panel, .x-tabs-panel');
        if (panels.length >= 2) tpbPanel = panels[1];
      }
    }

    if (singlePanel) {
      setupSingleIssuesTracker(singlePanel, cleanPath, isLoggedIn, isAdmin);
    }

    if (tpbPanel) {
      setupTpbTracker(tpbPanel, singleTab, cleanPath, isLoggedIn, isAdmin);
    }
  }


  function attachTrackerEvents(container, pageKey, cleanPath, savedProgress, isLoggedIn, isAdmin) {
    const linkKey = 'ro_links_' + cleanPath.replace(/\//g, '_');
    let savedLinks = getCombinedIssueLinks(cleanPath);

    // Admin: xử lý click nút gắn link đọc qua Modal
    if (isAdmin) {
      container.addEventListener('click', (e) => {
        const btn = e.target.closest('.ro-admin-link-btn');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const issueId = btn.dataset.issueId;
        const current = savedLinks[issueId] || '';
        const item = btn.closest('.ro-issue-item');
        const issueTitle = item?.dataset.issueTitle || issueId;

        openIssueLinkModal(issueId, issueTitle, current, (newLink) => {
          const cleanLink = (newLink || '').trim();
          if (cleanLink) {
            savedLinks[issueId] = cleanLink;
            btn.textContent = 'Sửa link';
            btn.style.color = '#16a34a';
            btn.style.borderColor = '#86efac';
            btn.title = 'Đã gắn liên kết — bấm để sửa';
            // Cập nhật nhãn đọc trong label
            const label = item?.querySelector('.ro-issue-label');
            if (label && !label.querySelector('.ro-issue-read-link')) {
              label.insertAdjacentHTML('afterbegin', `<a href="${escapeHtml(cleanLink)}" class="ro-issue-read-link" target="_blank" rel="noopener">ĐỌC</a> `);
            } else if (label && label.querySelector('.ro-issue-read-link')) {
              label.querySelector('.ro-issue-read-link').href = cleanLink;
            }
          } else {
            delete savedLinks[issueId];
            btn.textContent = 'Gắn link';
            btn.style.color = '#6b7280';
            btn.style.borderColor = '#d1d5db';
            btn.title = 'Gắn liên kết đọc';
            item?.querySelector('.ro-issue-read-link')?.remove();
          }

          // 1. Lưu ngay vào localStorage
          try { localStorage.setItem(linkKey, JSON.stringify(savedLinks)); } catch {}

          // 2. Cập nhật cache bộ nhớ
          if (!_roGlobalLinksCache) _roGlobalLinksCache = {};
          if (!_roGlobalLinksCache[cleanPath]) _roGlobalLinksCache[cleanPath] = {};
          if (cleanLink) {
            _roGlobalLinksCache[cleanPath][issueId] = cleanLink;
          } else {
            delete _roGlobalLinksCache[cleanPath][issueId];
          }

          // 3. Gửi lên Server Local để ghi vào file assets/issue_links.json (cho Vercel deploy)
          const token = localStorage.getItem('ro_token') || localStorage.getItem('admin_token') || '';
          fetch('/api/admin/issue-links', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': 'Bearer ' + token } : {})
            },
            body: JSON.stringify({
              path: cleanPath,
              issueId: issueId,
              link: cleanLink
            })
          })
          .then(r => r.json())
          .then(res => {
            if (res.success) {
              showRoToast(cleanLink ? 'Đã lưu liên kết vào assets/issue_links.json thành công' : 'Đã xóa liên kết đọc của tập này', 'success');
            } else {
              showRoToast('Đã lưu local: ' + (res.message || 'Chưa lưu server'), 'warning');
            }
          })
          .catch(() => {
            showRoToast('Đã lưu trên máy bạn (Server API chưa kết nối)', 'info');
          });
        });
      });
    }

    const checkboxes = container.querySelectorAll('.ro-issue-checkbox');
    const totalCount = checkboxes.length;
    if (totalCount === 0) return;

    function updateStats() {
      if (!isLoggedIn) {
        const topSummary = document.getElementById('ro-global-tracker-summary');
        if (topSummary) topSummary.textContent = '';
        return;
      }

      let checkedCount = 0;
      checkboxes.forEach((cb) => {
        const item = cb.closest('.ro-issue-item');
        const issueId = item.dataset.issueId;
        if (cb.checked) {
          checkedCount++;
          item.classList.add('is-read');
          savedProgress[issueId] = true;
        } else {
          item.classList.remove('is-read');
          delete savedProgress[issueId];
        }
      });

      const percent = Math.round((checkedCount / totalCount) * 100);
      const fill = document.getElementById('ro-bar-fill');
      const text = document.getElementById('ro-stats-text');
      if (fill) fill.style.width = percent + '%';
      if (text) text.textContent = `${checkedCount} / ${totalCount} tập (${percent}%)`;

      const topSummary = document.getElementById('ro-global-tracker-summary');
      if (topSummary) {
        topSummary.textContent = `Tiến độ: ${checkedCount}/${totalCount} (${percent}%)`;
      }

      try {
        localStorage.setItem(pageKey, JSON.stringify(savedProgress));
      } catch (e) {}

      const { title, universe } = getPageSeriesInfo();
      updateGlobalReadingList(cleanPath, title, universe, totalCount, checkedCount, percent);
    }

    checkboxes.forEach(cb => {
      cb.onclick = (e) => {
        if (!isLoggedIn) {
          e.preventDefault();
          cb.checked = false;
          openAuthModal('login');
          return false;
        }
        updateStats();
      };
    });

    document.getElementById('ro-mark-all')?.addEventListener('click', () => {
      if (!isLoggedIn) {
        openAuthModal('login');
        return;
      }
      checkboxes.forEach(cb => cb.checked = true);
      updateStats();
    });

    document.getElementById('ro-reset-all')?.addEventListener('click', () => {
      if (!isLoggedIn) {
        openAuthModal('login');
        return;
      }
      checkboxes.forEach(cb => cb.checked = false);
      updateStats();
    });

    updateStats();
  }

  /* =========================================================
     7. PHÍM TẮT & VIỆT HÓA GIAO DIỆN
     ========================================================= */
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAuthModal();
        closeDashboardModal();
      }
    });
  }

  function applyVietnameseNavigationHints() {
    const menuLinks = document.querySelectorAll('.x-navbar .x-nav > li > a');
    const viLabels = {
      'Marvel': 'Marvel Comics',
      'DC': 'DC Comics',
      'Other': 'Truyện Khác',
      'Updates': 'Cập Nhật',
      'FAQ': 'Hỏi Đáp',
      'Contact': 'Liên Hệ'
    };

    menuLinks.forEach(link => {
      const text = link.textContent.trim();
      if (viLabels[text]) {
        link.setAttribute('title', viLabels[text]);
      }
    });
  }

  /* =========================================================
     8. ĐỘNG CƠ VIỆT HÓA TỰ ĐỘNG & TÓM TẮT SỰ KIỆN (LOCALIZATION ENGINE)
     ========================================================= */
  function applyLocalization() {
    // 1. Menu chính và Submenu - Rút gọn để giữ navbar 1 dòng, không phình to che nội dung
    const navMap = {
      'Marvel': 'Marvel',
      'DC': 'DC',
      'Other': 'Khác',
      'Updates': 'Cập Nhật',
      'FAQ': 'Hỏi Đáp',
      'Contact': 'Liên Hệ',
      'Marvel Events': 'Sự Kiện Marvel',
      'Marvel Characters': 'Nhân Vật Marvel',
      'Marvel Master Reading Order': 'Thứ Tự Đọc Marvel (Toàn bộ)',
      'DC Events': 'Sự Kiện DC',
      'DC Characters': 'Nhân Vật DC',
      'DC Master Reading Order': 'Thứ Tự Đọc DC (Toàn bộ)'
    };

    document.querySelectorAll('.x-navbar .x-nav a span, .x-nav-wrap a span').forEach(span => {
      for (let node of span.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          const t = node.nodeValue.trim();
          if (navMap[t]) {
            node.nodeValue = navMap[t] + ' ';
            break;
          }
        }
      }
    });

    // Nút tìm kiếm mobile
    document.querySelectorAll('.x-btn-navbar-search span.x-hidden-desktop').forEach(el => {
      el.textContent = ' Tìm kiếm';
    });

    // 2. Breadcrumbs Navigation
    const breadcrumbMap = {
      'Home': 'Trang Chủ',
      'DC': 'DC',
      'DC Events': 'Sự Kiện DC',
      'DC Characters': 'Nhân Vật DC',
      'Marvel': 'Marvel',
      'Marvel Events': 'Sự Kiện Marvel',
      'Marvel Characters': 'Nhân Vật Marvel',
      'Other': 'Khác',
      'You Are Here': 'Bạn Đang Ở Đây'
    };
    document.querySelectorAll('.x-breadcrumbs span[itemprop="name"], .x-breadcrumbs .current').forEach(el => {
      const t = el.textContent.trim();
      if (breadcrumbMap[t]) {
        el.textContent = breadcrumbMap[t];
      }
    });

    // 3. Metadata Labels trên các trang Reading Order
    const metaLabels = [
      { re: /Year Published/gi, rep: 'Năm phát hành' },
      { re: /Featured Characters/gi, rep: 'Nhân vật xuất hiện' },
      { re: /Previous Event/gi, rep: 'Sự kiện trước' },
      { re: /Next Event/gi, rep: 'Sự kiện tiếp theo' },
      { re: /Publisher/gi, rep: 'Nhà xuất bản' },
      { re: /Publication Date/gi, rep: 'Thời gian xuất bản' },
      { re: /Genre/gi, rep: 'Thể loại' },
      { re: /Creator/gi, rep: 'Tác giả sáng lập' },
      { re: /Writer/gi, rep: 'Biên kịch' }
    ];

    document.querySelectorAll('.entry-content strong, #cs-content strong').forEach(el => {
      let txt = el.innerHTML;
      metaLabels.forEach(m => {
        txt = txt.replace(m.re, m.rep);
      });
      el.innerHTML = txt;
    });

    // 4. Bộ đếm Issues -> TẬP TRUYỆN
    document.querySelectorAll('.x-counter-after, .x-counter .text-below').forEach(el => {
      if (/issues?/i.test(el.textContent.trim())) {
        el.textContent = 'TẬP TRUYỆN';
      }
    });

    // 5. Bảng chú giải quy ước màu sắc (Color Legend)
    document.querySelectorAll('.entry-content p, #cs-content p').forEach(el => {
      const html = el.innerHTML;
      if (html.includes('Black entries are') || html.includes('Green entries are') || html.includes('Red entries are') || html.includes('Blue is for')) {
        el.innerHTML = `
          <span style="color: #222; font-weight: 600;">Chữ đen: Đầu truyện dài kỳ (Ongoing)</span><br />
          <span style="color: #008000; font-weight: 600;">Chữ xanh lá: Truyện ngắn tập (Limited Series)</span><br />
          <span style="color: #ff0000; font-weight: 600;">Chữ đỏ: Tập truyện đơn lẻ (One-Shot)</span><br />
          <span style="color: #0066aa; font-weight: 600;">Chữ xanh dương: Ghi chú & Chú thích sự kiện</span>
        `;
      }
    });

    document.querySelectorAll('.entry-content .x-text, #cs-content .x-text').forEach(el => {
      const t = el.textContent.trim();
      if (t === 'Ongoing Series' || t === 'Đầu truyện dài kỳ') {
        el.innerHTML = '<span style="color: #111; font-weight: 600;">Đầu truyện dài kỳ</span>';
      } else if (t === 'Limited Series' || t === 'Truyện ngắn tập') {
        el.innerHTML = '<span style="color: #008000; font-weight: 600;">Truyện ngắn tập</span>';
      } else if (t === 'One-Shots' || t === 'Tập đơn lẻ (One-Shot)') {
        el.innerHTML = '<span style="color: #ff0000; font-weight: 600;">Tập đơn lẻ (One-Shot)</span>';
      } else if (t === 'Comments' || t === 'Ghi chú & Chú thích') {
        el.innerHTML = '<span style="color: #0066aa; font-weight: 600;">Ghi chú & Chú thích</span>';
      }
    });

    // 6. Tabs: Single Issues & TPBs
    document.querySelectorAll('[data-x-toggle="tab"], .x-nav-tabs li a, button[data-x-toggle="tab"]').forEach(tab => {
      const span = tab.querySelector('span') || tab;
      const txt = span.textContent.trim();
      if (txt === 'Single Issues') span.textContent = 'Từng Tập Đơn Lẻ';
      else if (txt === 'TPBs') span.textContent = 'Tập Tổng Hợp (TPBs)';
    });

    // 7. Tiêu đề "Reading Order"
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      const strong = h.querySelector('strong') || h.querySelector('span');
      const target = strong || h;
      if (target.textContent.trim() === 'Reading Order') {
        target.textContent = 'Thứ Tự Đọc Chi Tiết';
      }
    });

    // 8. Chân trang (Footer Copyright Disclaimer)
    document.querySelectorAll('footer .x-colophon-content p').forEach(el => {
      if (el.textContent.includes('Amazon Services LLC Associates')) {
        el.innerHTML = `
          Tất cả các nhân vật, biểu tượng và hình ảnh truyện tranh đều thuộc bản quyền của Marvel Comics, DC Comics và các tác giả, nhà xuất bản tương ứng.<br />
          Website Reading Orders VN được phát triển phi thương mại nhằm phục vụ cộng đồng người hâm mộ truyện tranh Việt Nam tra cứu lộ trình đọc mạch lạc và thuận tiện nhất.
        `;
      }
    });

    // 9. Accordion toggles & Coming Soon
    document.querySelectorAll('.x-accordion-toggle span').forEach(sp => {
      const t = sp.textContent.trim();
      if (t === 'Click here to expand') sp.textContent = 'Bấm vào đây để mở rộng';
      else if (t === 'Click here to collapse') sp.textContent = 'Bấm vào đây để thu gọn';
    });

    document.querySelectorAll('.x-tabs-panel').forEach(panel => {
      const txt = panel.textContent.trim();
      if (txt === 'Coming Soon.' || txt === 'Coming Soon') {
        panel.innerHTML = '<p style="color:#888;font-style:italic;padding:12px 0;">Sắp ra mắt.</p>';
      }
    });

    // Dịch giá trị metadata chung (Featured Characters: Everyone -> Tất cả nhân vật)
    document.querySelectorAll('.entry-content p, #cs-content p, .x-text p').forEach(p => {
      if (/\bEveryone\b/.test(p.innerHTML)) {
        p.innerHTML = p.innerHTML.replace(/\bEveryone\b/g, 'Tất cả nhân vật');
      }
    });

    // 10. Việt hóa các ghi chú, lưu ý và chú thích sự kiện (Notes & Annotations)
    applyVietnameseReadingOrderNotes();
  }

  const EXACT_READING_NOTES = {
    'This reading order includes the Pre-Crisis appearances of the Monitor. These are generally short cameos that show the Monitor observing the events of the comic and are unnecessary to understand Crisis on Infinite Earths. If you want to skip these then start at Crisis on Infinite Earths #1.':
      'Thứ tự đọc này bao gồm các lần xuất hiện trước Crisis của Monitor. Đây thường là các vai khách mời (cameo) ngắn cho thấy Monitor đang quan sát các sự kiện trong truyện và không bắt buộc phải đọc để hiểu Crisis on Infinite Earths. Nếu bạn muốn bỏ qua phần này, hãy bắt đầu ngay từ Crisis on Infinite Earths #1.',
    'Pre-Crisis Monitor Appearances': 'Sự Xuất Hiện Trước Crisis Của Monitor',
    'Crisis on Infinite Earths': 'Crisis on Infinite Earths',
    'Unless you have been reading the various tie-in series prior to Crisis on Infinite Earths it is recommended that you skip them and stick to the main series.':
      'Trừ khi bạn đã và đang theo dõi các đầu truyện tie-in khác trước Crisis on Infinite Earths, bạn nên bỏ qua chúng và tập trung vào bộ truyện chính.',
    'Final Crisis: Rage of the Red Lanterns #1 doesn’t really have anything to do with the actual Final Crisis event and I suggest reading it after the event as part of the lead up to Blackest Night. If you want to read it as part of this order read it after Final Crisis #1.':
      'Final Crisis: Rage of the Red Lanterns #1 không thực sự liên quan nhiều đến sự kiện Final Crisis chính, bạn nên đọc nó sau sự kiện như một phần dẫn dắt đến Blackest Night. Nếu bạn vẫn muốn đọc trong thứ tự này, hãy đọc nó sau Final Crisis #1.',
    'This event is uncollected in trade paperback format.': 'Sự kiện này chưa được phát hành dưới dạng sách tổng hợp (TPB).',
    'This reading order is a Patreon exclusive.': 'Thứ tự đọc này dành riêng cho người ủng hộ trên Patreon.',
    'Alternate Universe': 'Vũ trụ song song',
    'Alternate Universe.': 'Vũ trụ song song.',
    'Elseworlds story.': 'Truyện thuộc dòng Elseworlds.',
    'Alternate Starting Point:': 'Điểm bắt đầu thay thế:',
    'Alternate Starting Point': 'Điểm bắt đầu thay thế',
    'Digital Chapters': 'Các chương phát hành kỹ thuật số',
    'Digital First': 'Phát hành kỹ thuật số trước',
    'Marvel Digital Original': 'Bản kỹ thuật số Marvel gốc',
    'Backup story': 'Phần truyện phụ (Backup story)',
    'Most of the storyline takes place in backups in the following issues.': 'Phần lớn cốt truyện diễn ra trong các phần truyện phụ (backup) ở các tập sau.',
    'Click here to expand': 'Bấm vào đây để mở rộng',
    'Click here to collapse': 'Bấm vào đây để thu gọn',
    'Comments': 'Ghi chú & Chú thích sự kiện',
    'Whatever Happened to the Man of Tomorrow?': 'Điều Gì Đã Xảy Ra Với Người Đàn Ông Của Ngày Mai?',
    'The for-real-this-time Post-Crisis origin of Superman.': 'Nguồn gốc thực sự thời kỳ Post-Crisis của Superman.',
    'Wonder Woman tells two different stories in alternating issues.': 'Wonder Woman kể hai câu chuyện khác nhau xen kẽ qua từng tập.',
    'Batman: War Games Book Two also includes the Batman: War Crimes event.': 'Batman: War Games Book Two cũng bao gồm sự kiện Batman: War Crimes.',
    'This comic is not canon.': 'Tập này không thuộc canon (Non-canon).',
    'Non-canon.': 'Không thuộc canon (Non-canon).',
    'Non-canon': 'Không thuộc canon (Non-canon)',
    'Terrible. Recommend to not read, it doesn\'t tie into anything else.':
      'Chất lượng rất tệ. Khuyên bạn không nên đọc, tập này không liên kết với mạch truyện chung.',
    'Ultimate Spider-Man went back to the original numbering at this point.':
      'Bộ truyện Ultimate Spider-Man quay trở lại cách đánh số tập gốc từ thời điểm này.',
    'Coming Soon.': 'Sắp ra mắt.',
    'Coming Soon': 'Sắp ra mắt'
  };

  const READING_NOTE_RULES = [
    {
      re: /^Read\s+(<a[^>]*>[\s\S]*?<\/a>)\s+here\.?$/i,
      fn: (_, link) => `Đọc ${link} tại đây.`
    },
    {
      re: /^Read\s+([\w\s:.'’\-–]+?)\s+here\.?$/i,
      fn: (_, title) => `Đọc ${title} tại đây.`
    },
    {
      re: /The\s+(<a[^>]*>[\s\S]*?<\/a>)\s+can\s+be\s+read\s+here\.?\s*([\w\s:.'’#\-–]+?)\s+is\s+the\s+beginning\s+of\s+the\s+([\w\s:.'’#\-–]+?)\s+universe\.?/i,
      fn: (_, link, iss, univ) => `Có thể đọc ${link} tại đây. ${iss} chính là khởi đầu của vũ trụ ${univ}.`
    },
    {
      re: /The\s+([\w\s:.'’\-–]+?)\s+can\s+be\s+read\s+here\.?\s*([\w\s:.'’#\-–]+?)\s+is\s+the\s+beginning\s+of\s+the\s+([\w\s:.'’#\-–]+?)\s+universe\.?/i,
      fn: (_, name, iss, univ) => `Có thể đọc ${name} tại đây. ${iss} chính là khởi đầu của vũ trụ ${univ}.`
    },
    {
      re: /^After\s+([\w\s:.'’#\-–]+?)\s+the\s+series\s+(?:was|is)\s+retitled\s+([\w\s:.'’#\-–]+?)(?:\s+and\s+continues\s+with\s+issue\s+(#?\d+))?\.?$/i,
      fn: (_, s1, s2, iss) => iss ? `Sau ${s1}, bộ truyện được đổi tên thành ${s2} và tiếp tục với tập ${iss}.` : `Sau ${s1}, bộ truyện được đổi tên thành ${s2}.`
    },
    {
      re: /^After\s+([\w\s:.'’#\-–]+?)\s+the\s+titled\s+was\s+renamed\s+([\w\s:.'’#\-–]+?)\.?$/i,
      fn: (_, s1, s2) => `Sau ${s1}, bộ truyện được đổi tên thành ${s2}.`
    },
    {
      re: /^After\s+([\w\s:.'’#\-–]+?)\s+the\s+series\s+(?:reverts?|reverted)\s+to\s+its\s+original\s+numbering(?:\s+starting\s+with\s+([\w\s:.'’#\-–]+?))?\.?$/i,
      fn: (_, s1, start) => start ? `Sau ${s1}, bộ truyện quay lại cách đánh số tập gốc bắt đầu từ ${start}.` : `Sau ${s1}, bộ truyện quay lại cách đánh số tập gốc.`
    },
    {
      re: /^([\w\s:.'’#\-–]+?)\s+(?:changes\s+title\s+to|is\s+retitled)\s+([\w\s:.'’#\-–]+?)\.?$/i,
      fn: (_, s1, s2) => `${s1} được đổi tên thành ${s2}.`
    },
    {
      re: /^Collects\s+(the\s+)?([\w\s,.'’#\-–&]+?)\.?$/i,
      fn: (_, the, content) => `Tập hợp ${content}.`
    },
    {
      re: /^([\w\s:.'’\-–]+?\.\s*)?First\s+appearance\s+of\s+([\w\s,.'’\-–&]+)$/i,
      fn: (_, prefix, chars) => `${prefix || ''}Lần xuất hiện đầu tiên của ${chars}`
    },
    {
      re: /^([-\s]*)First\s+appearance\s+of\s+([\w\s,.'’\-–&]+)$/i,
      fn: (_, prefix, chars) => `${prefix ? prefix.trim() + ' ' : ''}Lần xuất hiện đầu tiên của ${chars}`
    },
    {
      re: /Contains\s+minor\s+spoilers\s+about\s+([\w\s:.'’#\-–]+?)\s+and\s+can\s+be\s+read\s+after\.?/i,
      fn: (_, target) => `Có chứa tình tiết tiết lộ nhẹ về ${target} và có thể đọc sau đó.`
    },
    {
      re: /Optionally\s+can\s+be\s+read\s+during\s+the\s+([\w\s:.'’\-–]+?)\s+event\.?/i,
      fn: (_, ev) => `Có thể tùy chọn đọc trong sự kiện ${ev}.`
    },
    {
      re: /Collects\s+the\s+backups\s+running\s+through\s+([\w\s:.'’#\-–]+?)\.?$/i,
      fn: (_, iss) => `Tập hợp các phần truyện phụ (backup) trong ${iss}.`
    },
    {
      re: /Optionally\s+you\s+can\s+read\s+([\w\s:.'’#\-–]+?)\s+for\s+further\s+background\.?\s*(?:I\s+recommend\s+skipping\s+([\w\s:.'’#\-–]+?)\s+if\s+you\s+haven't\s+been\s+reading\s+it\s+previously\.?)?/i,
      fn: (_, bkg, skip) => {
        let res = `Tùy chọn: Bạn có thể đọc thêm ${bkg} để hiểu rõ hơn bối cảnh.`;
        if (skip) res += ` Khuyên bạn nên bỏ qua ${skip} nếu chưa từng theo dõi trước đó.`;
        return res;
      }
    },
    {
      re: /This\s+reading\s+order\s+is\s+a\s+(<a[^>]*>Patreon<\/a>)\s+exclusive\.?/i,
      fn: (_, patreon) => `Thứ tự đọc này dành riêng cho người ủng hộ trên ${patreon}.`
    }
  ];

  function translateReadingOrderNote(text) {
    if (!text) return text;
    const t = text.trim();
    const cleanKey = t.replace(/<[^>]+>/g, '').replace(/&nbsp;|\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

    if (EXACT_READING_NOTES[cleanKey]) {
      const trans = EXACT_READING_NOTES[cleanKey];
      if (/^<strong\b[^>]*>.*<\/strong>$/i.test(t)) {
        return `<strong>${trans}</strong>`;
      }
      return trans;
    }

    for (const rule of READING_NOTE_RULES) {
      const m = cleanKey.match(rule.re) || t.match(rule.re);
      if (m) {
        return rule.fn(...m);
      }
    }

    return text;
  }

  function applyVietnameseReadingOrderNotes() {
    // 1. Quét các thẻ span màu xanh dương (Comments & Notes)
    const blueSpans = document.querySelectorAll(
      'span[style*="0000ff"], span[style*="0066aa"], span[style*="color: blue"], span[style*="color:blue"]'
    );
    blueSpans.forEach(span => {
      if (span.textContent.includes('Blue is for') || span.textContent.includes('Ghi chú & Chú thích')) return;

      const strong = span.querySelector('strong');
      if (strong) {
        const trStrong = translateReadingOrderNote(strong.textContent);
        if (trStrong !== strong.textContent) {
          strong.textContent = trStrong.replace(/<[^>]+>/g, '');
        }
      }

      const originalHtml = span.innerHTML;
      const trHtml = translateReadingOrderNote(originalHtml);
      if (trHtml !== originalHtml) {
        span.innerHTML = trHtml;
      } else {
        const originalText = span.textContent;
        const trText = translateReadingOrderNote(originalText);
        if (trText !== originalText) {
          span.textContent = trText;
        }
      }
    });

    // 2. Quét các đoạn <p> chứa ghi chú dạng text trần trong #cs-content
    document.querySelectorAll('#cs-content .x-text p, .entry-content .x-text p').forEach(p => {
      const pText = p.textContent.replace(/&nbsp;|\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
      if (EXACT_READING_NOTES[pText]) {
        p.innerHTML = `<span style="color: #0000ff;">${EXACT_READING_NOTES[pText]}</span>`;
      }
    });
  }

  function applyVietnameseSynopsis() {
    const path = window.location.pathname.toLowerCase();
    const match = path.match(/([a-z0-9-]+-reading-order)/);
    if (!match) return;
    const slug = match[1];

    function doReplace(data) {
      if (!data || !data[slug]) return;

      const candidates = document.querySelectorAll('.entry-content p, #cs-content p');
      let overviewP = null;
      for (let p of candidates) {
        const text = p.textContent.trim();
        if (text.includes('Year Published') || text.includes('Năm phát hành') || text.includes('Featured Characters') || text.includes('Nhân vật xuất hiện') || text.includes('Black entries') || text.includes('Chữ đen') || text.includes('Ongoing Series')) continue;
        if (text.length > 50 && !/#\d+/.test(text)) {
          overviewP = p;
          break;
        }
      }

      if (!overviewP) return;

      const originalEn = overviewP.getAttribute('data-original-en') || overviewP.innerHTML;
      overviewP.setAttribute('data-original-en', originalEn);
      const viSynopsis = data[slug];

      overviewP.innerHTML = viSynopsis;
    }

    if (synopsisData) {
      doReplace(synopsisData);
    } else {
      fetch('/assets/translations/synopsis.json')
        .then(res => res.json())
        .then(data => {
          synopsisData = data;
          doReplace(synopsisData);
        })
        .catch(() => {});
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Khởi động Addon sau khi tất cả các hàm và biến đã được khởi tạo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAddon);
  } else {
    initAddon();
  }
})();
