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
  const displayName = (body.display_name || '').trim() || username;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ tên đăng nhập và mật khẩu' });
  }

  const newUser = {
    id: Date.now(),
    username: username,
    display_name: displayName,
    role: 'user'
  };

  return res.status(200).json({
    success: true,
    message: 'Đăng ký tài khoản thành công! Chào mừng bạn đến với Reading Orders.',
    token: 'user-token-' + Date.now(),
    user: newUser,
    admin: null
  });
};
