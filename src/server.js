require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const database = require('./database');
const authService = require('./auth');
const postsService = require('./posts');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア設定
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname)));

// データベース接続
database.connect().catch(console.error);

// 定期的なセッションクリーンアップ（1時間ごと）
setInterval(() => {
  authService.cleanupExpiredSessions();
}, 60 * 60 * 1000);

// 認証ミドルウェア
async function authenticateUser(req, res, next) {
  const sessionToken = req.cookies.session_token;
  
  if (!sessionToken) {
    return res.status(401).json({ error: '認証が必要です' });
  }

  const user = await authService.validateSession(sessionToken);
  if (!user) {
    return res.status(401).json({ error: '無効なセッションです' });
  }

  req.user = user;
  next();
}

// 認証API
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username } = req.body;
    const result = await authService.login(username);
    
    // セッションクッキーを設定（30日間有効）
    res.cookie('session_token', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30日
    });

    res.json({ success: true, user: result.user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const sessionToken = req.cookies.session_token;
  
  if (sessionToken) {
    await authService.logout(sessionToken);
  }
  
  res.clearCookie('session_token');
  res.json({ success: true });
});

app.get('/api/auth/me', authenticateUser, (req, res) => {
  res.json({ user: req.user });
});

// 投稿API
app.post('/api/posts', authenticateUser, async (req, res) => {
  try {
    const { content } = req.body;
    const post = await postsService.createPost(req.user.id, content);
    res.json({ success: true, post });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await postsService.getPosts();
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/posts/latest', async (req, res) => {
  try {
    const { since } = req.query;
    const posts = since ? 
      await postsService.getPostsSince(since) : 
      await postsService.getPosts();
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// フロントエンド用のルート
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'fromcanva.html'));
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'サーバーエラーが発生しました' });
});

// 404ハンドリング
app.use((req, res) => {
  res.status(404).json({ error: 'ページが見つかりません' });
});

// サーバー起動
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
