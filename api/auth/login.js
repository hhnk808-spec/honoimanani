const { v4: uuidv4 } = require('uuid');
const database = require('../src/database');
const authService = require('../src/auth');

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username } = req.body;
    const result = await authService.login(username);
    
    // セッションクッキーを設定（30日間有効）
    res.setHeader('Set-Cookie', `session_token=${result.sessionToken}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`);
    
    res.json({ success: true, user: result.user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
