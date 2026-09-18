module.exports = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const body = req.body || {};
  const username = (body.username || '').trim().toLowerCase();
  const password = body.password || '';

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ tên đăng nhập và mật khẩu' });
  }

  // Admin login check
  if (username === 'admin' && password === 'admin123') {
    const adminUser = {
      id: 1,
      username: 'admin',
      display_name: 'Quản Trị Viên',
      role: 'admin'
    };
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập Quản trị viên thành công',
      token: 'admin-token-' + Date.now(),
      user: adminUser,
      admin: adminUser
    });
  }

  // Regular reader login
  const normalUser = {
    id: 2,
    username: username,
    display_name: username,
    role: 'user'
  };
  return res.status(200).json({
    success: true,
    message: 'Đăng nhập thành công',
    token: 'user-token-' + Date.now(),
    user: normalUser,
    admin: null
  });
};
