const { v4: uuidv4 } = require('uuid');
const database = require('./database');

class AuthService {
  // ユーザーログイン（ユーザー名のみ）
  async login(username) {
    if (!username || username.trim() === '') {
      throw new Error('ユーザー名が必要です');
    }

    const trimmedUsername = username.trim();
    
    try {
      // 既存ユーザーを検索
      let users = await database.query(
        'SELECT * FROM users WHERE username = ?',
        [trimmedUsername]
      );

      let user;
      if (users.length === 0) {
        // 新規ユーザー作成
        const result = await database.run(
          'INSERT INTO users (username, last_login) VALUES (?, ?)',
          [trimmedUsername, new Date().toISOString()]
        );
        user = {
          id: result.lastID,
          username: trimmedUsername,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
      } else {
        // 既存ユーザーのログイン時間更新
        user = users[0];
        await database.run(
          'UPDATE users SET last_login = ? WHERE id = ?',
          [new Date().toISOString(), user.id]
        );
        user.last_login = new Date().toISOString();
      }

      // セッション作成
      const sessionToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30日間有効

      await database.run(
        'INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)',
        [user.id, sessionToken, expiresAt.toISOString()]
      );

      return {
        user: {
          id: user.id,
          username: user.username,
          last_login: user.last_login
        },
        sessionToken
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('ログインに失敗しました');
    }
  }

  // セッション検証
  async validateSession(sessionToken) {
    if (!sessionToken) {
      return null;
    }

    try {
      const sessions = await database.query(
        'SELECT s.*, u.username FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = ? AND s.expires_at > ?',
        [sessionToken, new Date().toISOString()]
      );

      if (sessions.length === 0) {
        return null;
      }

      const session = sessions[0];
      return {
        id: session.user_id,
        username: session.username,
        last_login: session.last_login
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  // ログアウト
  async logout(sessionToken) {
    if (!sessionToken) {
      return false;
    }

    try {
      await database.run(
        'DELETE FROM sessions WHERE session_token = ?',
        [sessionToken]
      );
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  // 期限切れセッションのクリーンアップ
  async cleanupExpiredSessions() {
    try {
      await database.run(
        'DELETE FROM sessions WHERE expires_at <= ?',
        [new Date().toISOString()]
      );
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }
}

module.exports = new AuthService();
