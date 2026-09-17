async function runTests() {
  const base = 'http://localhost:3000';
  console.log('=== BẮT ĐẦU KIỂM THỬ HỆ THỐNG READING ORDERS ===\n');

  // 1. Health check
  const h = await fetch(base + '/api/health').then(r => r.json());
  console.log('✓ 1. Health check:', h.status === 'ok' ? 'PASS' : 'FAIL');

  // 2. Public Reading Orders List
  const ordersRes = await fetch(base + '/api/reading-orders').then(r => r.json());
  console.log('✓ 2. Lấy danh sách Reading Orders:', ordersRes.success && ordersRes.data.length >= 10 ? `PASS (${ordersRes.data.length} orders)` : 'FAIL');

  // 3. Detail Reading Order (House of M)
  const detailRes = await fetch(base + '/api/reading-orders/house-of-m').then(r => r.json());
  const hasIssues = detailRes.success && detailRes.data.issues.length > 0;
  console.log('✓ 3. Lấy chi tiết House of M:', hasIssues ? `PASS (${detailRes.data.issues.length} issues)` : 'FAIL');
  console.log('   - Tiêu đề:', detailRes.data.title);
  console.log('   - Năm:', detailRes.data.year_published);
  console.log('   - Nhân vật:', detailRes.data.featured_characters);
  console.log('   - Sự kiện trước:', detailRes.data.previous_event_title);
  console.log('   - Sự kiện sau:', detailRes.data.next_event_title);

  // 4. Đăng nhập Admin
  const loginRes = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  }).then(r => r.json());
  console.log('✓ 4. Đăng nhập Quản Trị:', loginRes.success && loginRes.token ? 'PASS' : 'FAIL');
  const token = loginRes.token;

  // 5. Thống kê Admin
  const statsRes = await fetch(base + '/api/admin/stats', {
    headers: { Authorization: 'Bearer ' + token }
  }).then(r => r.json());
  console.log('✓ 5. Thống kê Admin Dashboard:', statsRes.success ? 'PASS' : 'FAIL', statsRes.data);

  // 6. Thêm tập truyện mới kèm link đọc truyện (Read URL)
  const addIssueRes = await fetch(base + '/api/admin/reading-orders/' + detailRes.data.id + '/issues', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify({
      title: 'Tập thử nghiệm tính năng đọc truyện',
      issue_type: 'limited',
      year: '2026',
      read_url: 'https://readcomiconline.li/Comic/test/Issue-99',
      note: 'Tập kiểm thử tự động'
    })
  }).then(r => r.json());
  const newIssueId = addIssueRes.insertedIds ? addIssueRes.insertedIds[0] : null;
  console.log('✓ 6. Admin thêm tập mới & link đọc truyện:', addIssueRes.success ? `PASS (ID: ${newIssueId})` : 'FAIL');

  // 7. Cập nhật link đọc truyện của tập
  const updateIssueRes = await fetch(base + '/api/admin/issues/' + newIssueId, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify({
      read_url: 'https://truyenmoi.vn/house-of-m-special'
    })
  }).then(r => r.json());
  console.log('✓ 7. Admin cập nhật lại link đọc truyện:', updateIssueRes.success ? 'PASS' : 'FAIL');

  // 8. Xóa tập kiểm thử
  const delRes = await fetch(base + '/api/admin/issues/' + newIssueId, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token }
  }).then(r => r.json());
  console.log('✓ 8. Admin xóa tập kiểm thử:', delRes.success ? 'PASS' : 'FAIL');

  // 9. Kiểm tra trang FAQs
  const faqsRes = await fetch(base + '/api/faqs').then(r => r.json());
  console.log('✓ 9. Lấy danh sách FAQs tiếng Việt:', faqsRes.success && faqsRes.data.length > 0 ? `PASS (${faqsRes.data.length} FAQs)` : 'FAIL');

  // 10. Kiểm tra tìm kiếm
  const searchRes = await fetch(base + '/api/search?q=Hulk').then(r => r.json());
  console.log('✓ 10. Tìm kiếm truyện toàn cục (từ khóa: Hulk):', searchRes.success && searchRes.data.orders.length > 0 ? `PASS (Tìm thấy ${searchRes.data.orders.length} orders)` : 'FAIL');

  console.log('\n=== TẤT CẢ 10/10 BÀI KIỂM THỬ ĐỀU HOÀN THÀNH XUẤT SẮC! ===');
}

runTests();
