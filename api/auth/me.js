const authService = require('../../src/auth');

module.exports = async (req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionToken = req.cookies?.session_token;
  
  if (!sessionToken) {
    return res.status(401).json({ error: '認証が必要です' });
  }

  const user = await authService.validateSession(sessionToken);
  if (!user) {
    return res.status(401).json({ error: '無効なセッションです' });
  }

  res.json({ user });
};
