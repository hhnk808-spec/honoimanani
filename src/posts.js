const database = require('./database');

class PostsService {
  // 投稿作成
  async createPost(userId, content) {
    if (!content || content.trim() === '') {
      throw new Error('投稿内容が必要です');
    }

    if (content.length > 300) {
      throw new Error('投稿は300文字以内で入力してください');
    }

    try {
      const result = await database.run(
        'INSERT INTO posts (user_id, content) VALUES (?, ?)',
        [userId, content.trim()]
      );

      // ユーザー名を取得
      const users = await database.query(
        'SELECT username FROM users WHERE id = ?',
        [userId]
      );

      const username = users.length > 0 ? users[0].username : 'Unknown';

      return {
        id: result.lastID,
        user_id: userId,
        author: username,
        content: content.trim(),
        date: new Date().toLocaleDateString('ja-JP', { 
          month: 'long', 
          day: 'numeric' 
        }),
        time: new Date().toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Create post error:', error);
      throw new Error('投稿の作成に失敗しました');
    }
  }

  // 投稿一覧取得（最新1000件）
  async getPosts(limit = 1000) {
    try {
      const posts = await database.query(`
        SELECT p.*, u.username 
        FROM posts p 
        JOIN users u ON p.user_id = u.id 
        ORDER BY p.created_at DESC 
        LIMIT ?
      `, [limit]);

      return posts.map(post => ({
        id: post.id,
        author: post.username,
        content: post.content,
        date: new Date(post.created_at).toLocaleDateString('ja-JP', { 
          month: 'long', 
          day: 'numeric' 
        }),
        time: new Date(post.created_at).toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        created_at: post.created_at
      }));
    } catch (error) {
      console.error('Get posts error:', error);
      throw new Error('投稿の取得に失敗しました');
    }
  }

  // 最新投稿のタイムスタンプ取得（ポーリング用）
  async getLatestPostTimestamp() {
    try {
      const posts = await database.query(`
        SELECT created_at 
        FROM posts 
        ORDER BY created_at DESC 
        LIMIT 1
      `);

      if (posts.length === 0) {
        return null;
      }

      return posts[0].created_at;
    } catch (error) {
      console.error('Get latest post timestamp error:', error);
      return null;
    }
  }

  // 指定時刻以降の投稿取得（ポーリング用）
  async getPostsSince(timestamp) {
    if (!timestamp) {
      return this.getPosts();
    }

    try {
      const posts = await database.query(`
        SELECT p.*, u.username 
        FROM posts p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.created_at > ?
        ORDER BY p.created_at DESC
      `, [timestamp]);

      return posts.map(post => ({
        id: post.id,
        author: post.username,
        content: post.content,
        date: new Date(post.created_at).toLocaleDateString('ja-JP', { 
          month: 'long', 
          day: 'numeric' 
        }),
        time: new Date(post.created_at).toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        created_at: post.created_at
      }));
    } catch (error) {
      console.error('Get posts since error:', error);
      throw new Error('投稿の取得に失敗しました');
    }
  }
}

module.exports = new PostsService();
