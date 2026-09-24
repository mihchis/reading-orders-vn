const fs = require('fs');
const path = require('path');

const adminHtmlPath = path.resolve(__dirname, '..', 'admin', 'index.html');
let content = fs.readFileSync(adminHtmlPath, 'utf8');

// 1. Replace the 3 occurrences of showDashboardScreen() + loadDashboardStats() with initDashboardView()
// Occurrence 1: in checkAdminAuth() success
content = content.replace(
  `          showDashboardScreen();\n          loadDashboardStats();`,
  `          initDashboardView();`
);

// Occurrence 2: in checkAdminAuth() offline fallback
content = content.replace(
  `          showDashboardScreen();\n          loadDashboardStats();`,
  `          initDashboardView();`
);

// Occurrence 3: in login form submit success
content = content.replace(
  `          showDashboardScreen();\n          loadDashboardStats();`,
  `          initDashboardView();`
);

// 2. Add VALID_TABS, getActiveTabState(), initDashboardView(), and updated switchTab()
const oldSwitchTab = `    // Điều hướng Tabs
    function switchTab(tabId) {
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.sidebar-nav button').forEach(b => b.classList.remove('active'));

      const activePanel = document.getElementById(\`tab-\${tabId}\`);
      if (activePanel) activePanel.classList.add('active');

      const activeBtn = Array.from(document.querySelectorAll('.sidebar-nav button')).find(b => b.getAttribute('onclick')?.includes(tabId));
      if (activeBtn) activeBtn.classList.add('active');

      const headings = {
        overview: 'Tổng Quan Thống Kê',
        orders: 'Quản Lý 608 Thứ Tự Đọc',
        issues: 'Quản Lý Tập & Link Đọc Online',
        users: 'Độc Giả & Tiến Độ Đọc',
        universes: 'Vũ Trụ & Danh Mục',
        tools: 'Đồng Bộ & Sao Lưu Dữ Liệu'
      };
      document.getElementById('page-heading').textContent = headings[tabId] || 'Quản Trị';

      // Tự đóng sidebar sau khi chọn tab (dành cho mobile)
      if (window.innerWidth <= 900 && document.body.classList.contains('sidebar-open')) {
        document.body.classList.remove('sidebar-open');
      }

      // Nạp dữ liệu tương ứng khi mở tab
      if (tabId === 'overview') loadDashboardStats();
      if (tabId === 'orders') loadOrders(currentOrderPage);
      if (tabId === 'issues') populateOrderDropdownForIssues();
      if (tabId === 'users') loadUsers();
      if (tabId === 'universes') loadUniverses();
    }`;

const newSwitchTab = `    const VALID_TABS = ['overview', 'orders', 'issues', 'users', 'universes', 'tools'];

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

      const activePanel = document.getElementById(\`tab-\${tabId}\`);
      if (activePanel) activePanel.classList.add('active');

      const activeBtn = Array.from(document.querySelectorAll('.sidebar-nav button')).find(b => b.getAttribute('onclick')?.includes(\`'\${tabId}'\`));
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
    });`;

if (content.includes(oldSwitchTab)) {
  content = content.replace(oldSwitchTab, newSwitchTab);
  console.log('Successfully replaced switchTab logic!');
} else {
  console.error('Could not find oldSwitchTab in file!');
}

// 3. Update jumpToIssues to update URL
const oldJumpToIssues = `    function jumpToIssues(orderId) {
      switchTab('issues');
      const select = document.getElementById('select-order-for-issues');
      // Thêm option tạm thời nếu chưa có
      if (!Array.from(select.options).some(o => o.value == orderId)) {
        select.innerHTML += \`<option value="\${orderId}">Bộ đọc ID #\${orderId}</option>\`;
      }
      select.value = orderId;
      loadIssuesForSelectedOrder();
    }`;

const newJumpToIssues = `    function jumpToIssues(orderId) {
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
          select.innerHTML += \`<option value="\${orderId}">Bộ đọc ID #\${orderId}</option>\`;
        }
        select.value = orderId;
      }
      loadIssuesForSelectedOrder();
    }`;

if (content.includes(oldJumpToIssues)) {
  content = content.replace(oldJumpToIssues, newJumpToIssues);
  console.log('Successfully replaced jumpToIssues logic!');
} else {
  console.error('Could not find oldJumpToIssues in file!');
}

fs.writeFileSync(adminHtmlPath, content, 'utf8');
console.log('admin/index.html updated successfully!');
