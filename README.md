# いまなにしてる？ - タイムラインアプリ

シンプルなタイムラインアプリです。ユーザーは現在の状況を投稿し、他のユーザーの投稿をリアルタイムで確認できます。

## 機能

- ユーザー名のみの簡易ログイン（パスワード不要）
- 300文字以内の投稿
- リアルタイム投稿更新（3秒おきのポーリング）
- ログアウト機能
- セッション管理（30日間有効）

## 技術スタック

- **フロントエンド**: HTML, CSS, JavaScript (Vanilla)
- **バックエンド**: Node.js + Express
- **データベース**: SQLite（開発）/ Vercel Postgres（本番）
- **デプロイ**: Vercel

## ローカル開発環境のセットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp env.example .env
```

`.env`ファイルを編集して必要に応じて設定を変更してください。

### 3. データベースのセットアップ

```bash
npm run setup-db
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

サーバーが起動したら、ブラウザで `http://localhost:3000` にアクセスしてください。

## Vercelデプロイ

### 1. Vercelアカウントの準備

[Vercel](https://vercel.com)でアカウントを作成し、GitHubリポジトリと連携します。

### 2. 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定してください：

- `DATABASE_URL`: Vercel Postgresの接続URL
- `NODE_ENV`: `production`
- `SESSION_SECRET`: ランダムな文字列

### 3. デプロイ

GitHubにプッシュすると自動的にデプロイされます。

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

## プロジェクト構造

```
honoimanani/
├── src/
│   ├── fromcanva.html    # フロントエンド
│   ├── server.js         # メインサーバーファイル
│   ├── database.js       # データベース接続
│   ├── auth.js          # 認証サービス
│   ├── posts.js         # 投稿サービス
│   └── setup-database.js # データベースセットアップ
├── package.json
├── vercel.json          # Vercel設定
├── env.example          # 環境変数テンプレート
└── README.md
```

## API エンドポイント

### 認証
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - 現在のユーザー情報取得

### 投稿
- `POST /api/posts` - 投稿作成
- `GET /api/posts` - 投稿一覧取得
- `GET /api/posts/latest` - 最新投稿チェック（ポーリング用）

## 開発時の注意事項

- 開発環境ではSQLiteを使用します
- 本番環境ではVercel Postgresを使用します
- セッションは30日間有効です
- 投稿は最新1000件まで表示されます
- 新しい投稿は3秒おきにチェックされます

## トラブルシューティング

### データベース接続エラー
- 環境変数が正しく設定されているか確認してください
- データベースが正しくセットアップされているか確認してください

### 認証エラー
- ブラウザのクッキーが有効になっているか確認してください
- セッションが期限切れの場合は再ログインしてください

## ライセンス

MIT License
