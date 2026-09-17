/**
 * READING ORDERS VIỆT NAM - CLIENT ADDON SCRIPT
 * Tự động kích hoạt các tính năng nâng cao trên nền tảng bản mirror gốc
 */

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
      ['createSearchModal', createSearchModal],
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
    return localStorage.getItem('ro_lang') || 'vi';
  }

  function setLang(lang) {
    localStorage.setItem('ro_lang', lang);
    window.location.reload();
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

    const curLang = getCurrentLang();
    const topBar = document.createElement('div');
    topBar.id = 'ro-top-bar';
    topBar.innerHTML = `
      <div class="ro-bar-left">
        <a href="/" class="ro-btn" style="background:#e42525;border-color:#e42525;font-weight:bold;">
          📚 Reading Orders VN
        </a>
        <div class="ro-search-trigger" id="ro-open-search" title="Tìm kiếm sự kiện hoặc nhân vật">
          🔍 <span class="ro-search-text">Tìm kiếm sự kiện, nhân vật... <span class="ro-search-kbd">Ctrl + K</span></span>
        </div>
        <button id="ro-open-dashboard" class="ro-btn" style="background:#1e3a8a;border-color:#3b82f6;font-weight:600;" title="Xem tất cả các bộ truyện bạn đang theo dõi">
          📊 <span class="ro-dashboard-text">Tiến độ của tôi</span> (<span id="ro-global-count">0</span>)
        </button>
      </div>
      <div class="ro-bar-right">
        <span id="ro-global-tracker-summary" style="font-size:12px;color:#fbbf24;font-weight:600;"></span>
        <button id="ro-lang-btn" class="ro-btn" style="background:#334155;border-color:#475569;font-size:12px;font-weight:600;" title="Chuyển đổi ngôn ngữ Tiếng Việt / English">
          ${curLang === 'vi' ? '🇻🇳 <span class="ro-lang-text">Tiếng Việt</span>' : '🇬🇧 <span class="ro-lang-text">English</span>'}
        </button>
        <a href="/marvel/events/" class="ro-btn">Marvel</a>
        <a href="/dc/events/" class="ro-btn">DC Comics</a>
        <a href="/other/" class="ro-btn">Truyện Khác</a>
        <div id="ro-auth-section"></div>
      </div>
    `;

    document.body.prepend(topBar);

    document.getElementById('ro-open-search')?.addEventListener('click', openSearchModal);
    document.getElementById('ro-open-dashboard')?.addEventListener('click', openDashboardModal);
    document.getElementById('ro-lang-btn')?.addEventListener('click', () => {
      setLang(getCurrentLang() === 'vi' ? 'en' : 'vi');
    });

    // Lắng nghe sự kiện đăng xuất toàn cục trên document
    document.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest ? e.target.closest('#ro-logout-btn') : null;
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        setCurrentUser(null, null);
        window.location.reload();
      }
    });
  }

  function updateUserBar() {
    const authSection = document.getElementById('ro-auth-section');
    if (!authSection) return;

    const user = getCurrentUser();
    if (user) {
      const isAdmin = user.role === 'admin';
      authSection.innerHTML = `
        <span class="ro-user-badge ${isAdmin ? 'is-admin' : ''}">
          ${isAdmin ? '👑 Quản Trị Viên' : '👤'} ${escapeHtml(user.display_name || user.username)}
        </span>
        <button id="ro-logout-btn" class="ro-btn" style="background:#444;font-size:11px;cursor:pointer;" title="Đăng xuất khỏi tài khoản">Đăng xuất</button>
      `;

      const logoutBtn = document.getElementById('ro-logout-btn');
      logoutBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentUser(null, null);
        window.location.reload();
      });
    } else {
      authSection.innerHTML = `
        <button id="ro-login-btn" class="ro-btn" style="background:#2563eb;border-color:#2563eb;font-weight:bold;">
          🔑 Đăng nhập
        </button>
      `;

      document.getElementById('ro-login-btn')?.addEventListener('click', () => {
        openAuthModal('login');
      });
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
            <span>📊 Tiến Độ Đọc Truyện Toàn Bộ Các Bộ</span>
          </div>
          <button id="ro-dashboard-close" class="ro-btn" style="background:none;border:none;font-size:20px;color:#888;cursor:pointer;">✕</button>
        </div>

        <div class="ro-dashboard-body" id="ro-dashboard-content">
          <!-- Nội dung render động qua renderDashboardContent() -->
        </div>

        <div class="ro-search-footer" style="padding:12px 20px;">
          <span style="color:#777;font-size:12px;">💡 Bấm vào tên bộ truyện để chuyển ngay đến trang tiếp tục đọc</span>
          <button id="ro-clear-all-progress" class="ro-btn" style="background:#dc2626;border-color:#dc2626;font-size:11px;">
            🗑️ Đặt lại tất cả
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

  function updateGlobalBadgeCount() {
    const badge = document.getElementById('ro-global-count');
    if (!badge) return;

    try {
      const list = JSON.parse(localStorage.getItem('ro_global_reading_list') || '{}');
      const keys = Object.keys(list);
      badge.textContent = keys.length;
    } catch {
      badge.textContent = '0';
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

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

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
        msgBox.textContent = 'Không thể kết nối đến máy chủ: ' + err.message;
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
     5. HỆ THỐNG TÌM KIẾM TOÀN TRANG (GLOBAL INSTANT SEARCH)
     ========================================================= */
  function loadSearchData() {
    if (isSearchLoaded) return Promise.resolve(searchData);
    return fetch('/search_index.json')
      .then(res => res.json())
      .then(data => {
        searchData = data;
        isSearchLoaded = true;
        return searchData;
      })
      .catch(err => {
        console.warn('[Reading Orders] Lỗi tải search index:', err);
        return [];
      });
  }

  function createSearchModal() {
    if (document.getElementById('ro-search-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'ro-search-modal';
    modal.className = 'ro-modal-backdrop';
    modal.innerHTML = `
      <div class="ro-search-box">
        <div class="ro-search-header">
          <span style="font-size:18px;">🔍</span>
          <input type="text" id="ro-search-input" class="ro-search-input" placeholder="Tìm kiếm trong hơn 600+ reading orders (Marvel, DC, Invincible...)..." autocomplete="off" />
          <button id="ro-search-close" class="ro-btn">Đóng (ESC)</button>
        </div>
        <div id="ro-search-results" class="ro-search-results">
          <div style="padding: 24px; text-align: center; color: #888;">
            Đang tải dữ liệu tìm kiếm...
          </div>
        </div>
        <div class="ro-search-footer">
          <span>Gõ từ khóa để tìm kiếm tức thì</span>
          <span id="ro-search-counter">600+ mục</span>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeSearchModal();
    });

    document.getElementById('ro-search-close')?.addEventListener('click', closeSearchModal);

    const searchInput = document.getElementById('ro-search-input');
    searchInput?.addEventListener('input', () => {
      renderSearchResults(searchInput.value.trim());
    });
  }

  function openSearchModal() {
    const modal = document.getElementById('ro-search-modal');
    if (!modal) return;
    modal.classList.add('is-open');

    loadSearchData().then(() => {
      const input = document.getElementById('ro-search-input');
      if (input) {
        input.focus();
        input.select();
        renderSearchResults(input.value.trim());
      }
    });
  }

  function closeSearchModal() {
    const modal = document.getElementById('ro-search-modal');
    if (modal) modal.classList.remove('is-open');
  }

  function renderSearchResults(keyword) {
    const resultsContainer = document.getElementById('ro-search-results');
    const counter = document.getElementById('ro-search-counter');
    if (!resultsContainer) return;

    const lower = keyword.toLowerCase();
    let matches = [];

    if (!lower) {
      matches = searchData.filter(item => 
        ['House of M', 'Secret Wars (2015)', 'Civil War', 'Flashpoint', 'Crisis on Infinite Earths', 'The Boys', 'Invincible'].some(name => item.title.includes(name))
      );
      if (matches.length === 0) matches = searchData.slice(0, 15);
    } else {
      matches = searchData.filter(item => 
        item.title.toLowerCase().includes(lower) || 
        item.slug.toLowerCase().includes(lower) ||
        (item.universe && item.universe.toLowerCase().includes(lower))
      ).slice(0, 30);
    }

    if (counter) counter.textContent = `${matches.length} kết quả`;

    if (matches.length === 0) {
      resultsContainer.innerHTML = `
        <div style="padding: 30px; text-align: center; color: #888;">
          Không tìm thấy reading order nào khớp với "<strong>${escapeHtml(keyword)}</strong>".
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = matches.map(item => {
      let badgeClass = 'badge-other';
      if (item.universe && item.universe.includes('Marvel')) badgeClass = 'badge-marvel';
      else if (item.universe && item.universe.includes('DC')) badgeClass = 'badge-dc';

      return `
        <a href="${item.url}" class="ro-search-item">
          <div>
            <div class="ro-search-item-title">${escapeHtml(item.title)}</div>
            <div style="font-size:12px;color:#888;margin-top:2px;">${escapeHtml(item.category || '')} ${item.year ? '• Năm ' + item.year : ''}</div>
          </div>
          <span class="ro-search-item-badge ${badgeClass}">${escapeHtml(item.universe || 'Truyện')}</span>
        </a>
      `;
    }).join('');
  }

  /* =========================================================
     6. BỘ THEO DÕI TIẾN ĐỘ ĐỌC & LINK ĐỌC TRUYỆN (UNIVERSAL TRACKER)
     ========================================================= */

  function isIssueLine(str) {
    if (!str) return false;
    const clean = str.replace(/<[^>]+>/g, '').trim();
    if (!clean || clean.length < 3) return false;

    // Loại trừ các mô tả / chú thích / metadata
    const excludes = [
      'year published', 'featured characters', 'previous event', 'next event',
      'ongoing series', 'limited series', 'one-shots', 'comments',
      'black entries', 'green entries', 'red entries', 'blue is for',
      'publisher:', 'publication date:', 'genre:', 'creator:', 'writer:'
    ];
    const cleanLower = clean.toLowerCase();
    for (const ex of excludes) {
      if (cleanLower.includes(ex)) return false;
    }

    // Các mẫu định danh tập truyện tranh
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

    return issuePatterns.some(pat => pat.test(clean));
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

  function setupIssueTracker() {
    const currentUser = getCurrentUser();
    const isLoggedIn = Boolean(currentUser);
    const isAdmin = currentUser && currentUser.role === 'admin';

    const cleanPath = window.location.pathname
      .replace(/\/index\.html$/i, '')
      .replace(/\/+$/, '') || '/';
    const pageKey = 'ro_progress_' + cleanPath.replace(/\//g, '_');

    // Tìm container chứa danh sách tập truyện
    // Ưu tiên panel tab đầu tiên (Single Issues), nếu không có tabs thì tìm trong cs-content hoặc entry-content
    const targetPanel = document.querySelector('.x-tabs-panel.x-active') || document.querySelector('.x-tabs-panel:first-of-type');
    const mainContainer = targetPanel || document.querySelector('#cs-content') || document.querySelector('.entry-content');
    if (!mainContainer) return;

    // Đọc trạng thái đã lưu từ localStorage
    let savedProgress = {};
    try {
      savedProgress = JSON.parse(localStorage.getItem(pageKey) || '{}');
    } catch {
      savedProgress = {};
    }

    // Đọc các link đọc truyện đã lưu
    let savedReadLinks = {};
    try {
      savedReadLinks = JSON.parse(localStorage.getItem('ro_custom_read_links') || '{}');
    } catch {
      savedReadLinks = {};
    }

    // Kiểm tra xem trang này đã được biến đổi trước đó chưa
    const existingItems = mainContainer.querySelectorAll('.ro-issue-item');
    if (existingItems.length > 0) {
      // Đã có phần tử, chỉ cần gán lại logic trạng thái đăng nhập & sự kiện
      attachTrackerEvents(mainContainer, pageKey, cleanPath, savedProgress, savedReadLinks, isLoggedIn, isAdmin);
      return;
    }

    // Tìm tất cả các thẻ <p> trong container chứa tập truyện
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

    if (totalIssuesDetected < 3) return; // Không phải trang reading order có danh sách tập

    // Biến đổi các dòng thành item tương tác
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
          const textOnly = trimmed.replace(/<[^>]+>/g, '').trim();
          const customUrl = savedReadLinks[textOnly] || '';
          issueGlobalIndex++;

          return `
            <div class="ro-issue-item ${isChecked ? 'is-read' : ''}" data-issue-id="${issueId}" data-issue-title="${escapeHtml(textOnly)}">
              <label class="ro-issue-left">
                <input type="checkbox" class="ro-issue-checkbox" ${isChecked ? 'checked' : ''} />
                <span class="ro-issue-label">${trimmed}</span>
              </label>
              <div class="ro-issue-actions">
                <a href="${customUrl || getSearchReadingUrl(textOnly)}" target="_blank" rel="noopener noreferrer" class="ro-read-link-btn" title="Đọc online tập này">
                  📖 Đọc
                </a>
                ${isAdmin ? `
                  <button class="ro-admin-setup-btn" data-issue-title="${escapeHtml(textOnly)}" title="Cấu hình link đọc cho tập này">
                    ⚙️ Setup link
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }
        return trimmed;
      });

      p.innerHTML = transformed.filter(l => l !== '').join('');
    });

    // Chèn banner Admin nếu là Quản trị viên
    document.querySelector('.ro-admin-banner')?.remove();
    if (isAdmin) {
      const adminBanner = document.createElement('div');
      adminBanner.className = 'ro-admin-banner';
      adminBanner.innerHTML = `
        <span>👑 <strong>Chế độ Quản Trị Viên:</strong> Bạn có thể bấm <code>⚙️ Setup link</code> cạnh bất kỳ tập nào để gán link đọc truyện.</span>
        <button id="ro-admin-export-btn" class="ro-btn" style="background:#b45309;font-size:11px;">Quản lý chung</button>
      `;
      if (targetPanel) {
        targetPanel.insertBefore(adminBanner, targetPanel.firstChild);
      } else if (firstTransformedP) {
        firstTransformedP.parentNode.insertBefore(adminBanner, firstTransformedP);
      }
    }

    // Chèn thẻ theo dõi tiến độ (Tracker Card)
    document.querySelector('.ro-tracker-card')?.remove();
    const trackerCard = document.createElement('div');
    trackerCard.className = 'ro-tracker-card';

    if (isLoggedIn) {
      trackerCard.innerHTML = `
        <div class="ro-tracker-header">
          <div class="ro-tracker-title">
            <span>📊 Tiến Độ Đọc Của Bạn</span>
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
            <span>📊 Tiến Độ Đọc Của Bạn</span>
            <span style="font-size:12px;color:#888;font-weight:normal;">(${issueGlobalIndex} tập)</span>
          </div>
          <div class="ro-tracker-actions">
            <button id="ro-tracker-login-btn" class="ro-btn" style="background:#2563eb;border-color:#2563eb;font-weight:bold;">
              🔑 Đăng nhập để lưu tiến độ
            </button>
          </div>
        </div>
        <div style="font-size:13px;color:#555;background:#f9f9f9;padding:8px 12px;border-radius:6px;border:1px dashed #ccc;margin-top:6px;">
          🔒 Vui lòng đăng nhập tài khoản độc giả để tích chọn các tập truyện đã đọc và đồng bộ tiến độ toàn bộ trang web.
        </div>
      `;
    }

    if (targetPanel) {
      targetPanel.insertBefore(trackerCard, targetPanel.firstChild);
    } else if (firstTransformedP) {
      firstTransformedP.parentNode.insertBefore(trackerCard, firstTransformedP);
    }

    document.getElementById('ro-tracker-login-btn')?.addEventListener('click', () => {
      openAuthModal('login');
    });

    attachTrackerEvents(mainContainer, pageKey, cleanPath, savedProgress, savedReadLinks, isLoggedIn, isAdmin);
  }

  function attachTrackerEvents(container, pageKey, cleanPath, savedProgress, savedReadLinks, isLoggedIn, isAdmin) {
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

    // Xử lý sự kiện bấm nút "Setup link" của Admin
    if (isAdmin) {
      container.querySelectorAll('.ro-admin-setup-btn').forEach(btn => {
        btn.onclick = () => {
          const issueTitle = btn.getAttribute('data-issue-title');
          const currentUrl = savedReadLinks[issueTitle] || '';
          const newUrl = prompt(`[Quản trị] Nhập đường dẫn link đọc truyện cho tập:\n"${issueTitle}"`, currentUrl);

          if (newUrl !== null) {
            const cleanUrl = newUrl.trim();
            if (cleanUrl) {
              savedReadLinks[issueTitle] = cleanUrl;
            } else {
              delete savedReadLinks[issueTitle];
            }
            localStorage.setItem('ro_custom_read_links', JSON.stringify(savedReadLinks));
            
            const readBtn = btn.closest('.ro-issue-item').querySelector('.ro-read-link-btn');
            if (readBtn) {
              readBtn.href = cleanUrl || getSearchReadingUrl(issueTitle);
            }
            alert('Đã cập nhật link đọc thành công!');
          }
        };
      });
    }

    updateStats();
  }

  function getSearchReadingUrl(issueTitle) {
    const clean = issueTitle.replace(/\([^)]+\)/g, '').trim();
    return `https://www.google.com/search?q=${encodeURIComponent('read ' + clean + ' comic online')}`;
  }

  /* =========================================================
     7. PHÍM TẮT & VIỆT HÓA GIAO DIỆN
     ========================================================= */
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey && e.key.toLowerCase() === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        openSearchModal();
      } else if (e.key === 'Escape') {
        closeSearchModal();
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
    if (getCurrentLang() !== 'vi') return;

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
  }

  function applyVietnameseSynopsis() {
    if (getCurrentLang() !== 'vi') return;

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

      overviewP.innerHTML = `
        <div style="background:rgba(228,37,37,0.04);border-left:3px solid #e42525;padding:8px 12px;border-radius:4px;margin-bottom:8px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <span style="font-weight:700;font-size:11px;color:#e42525;text-transform:uppercase;letter-spacing:0.5px;">
              🇻🇳 Tóm Tắt Cốt Truyện Tiếng Việt
            </span>
            <button id="ro-toggle-synopsis-lang" style="background:none;border:none;color:#666;font-size:11px;cursor:pointer;text-decoration:underline;">
              Xem nguyên bản English
            </button>
          </div>
          <div id="ro-synopsis-text" style="color:#222;line-height:1.6;text-align:justify;">
            ${viSynopsis}
          </div>
        </div>
      `;

      let isShowingVi = true;
      document.getElementById('ro-toggle-synopsis-lang')?.addEventListener('click', (e) => {
        e.preventDefault();
        const textContainer = document.getElementById('ro-synopsis-text');
        const btn = document.getElementById('ro-toggle-synopsis-lang');
        if (!textContainer || !btn) return;

        if (isShowingVi) {
          textContainer.innerHTML = originalEn;
          btn.textContent = 'Xem tóm tắt Tiếng Việt';
          isShowingVi = false;
        } else {
          textContainer.innerHTML = viSynopsis;
          btn.textContent = 'Xem nguyên bản English';
          isShowingVi = true;
        }
      });
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
