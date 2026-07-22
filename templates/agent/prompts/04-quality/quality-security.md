# セキュリティ監査

> Input: なし（プロジェクト全体を走査）
> Output: 脆弱性リスト + 修正
> 所要時間: 1〜2時間
> 参照: `.claude/01_docs/24_セキュリティ設計書.md`

---

## チェック項目

### 1. 認証・認可

- 全APIルートの認証チェック有無を走査（`app/api/*/route.ts`）
- `app/api/widget/` 以外の公開APIがないか確認
- 権限チェック（ロール別）が適切か（`.claude/01_docs/16_権限とロールマトリクス.md` 参照）

### 2. テナント分離（RLS）

- 全テーブルにRLSポリシーがあるか（`supabase/migrations/` 走査）
- テナントAのデータがテナントBから見えない証明（テストで確認）

### 3. 入力バリデーション

- 全APIルートの入力に Zod スキーマが適用されているか
- フロントエンドのフォームバリデーションがバックエンドと一致しているか

### 4. XSS / SQLi / CSRF

- `innerHTML` 使用箇所のエスケープ確認
- Supabase クエリでのRaw SQL使用箇所の確認
- CSRFトークン / Same-Site Cookie の設定確認

### 5. 機密情報

- `console.log` で個人情報やトークンが出力されていないか
- エラーレスポンスに内部情報（スタックトレース、DB構造）が含まれていないか
- `.env` ファイルがコミットされていないか

### 6. 依存パッケージ

```bash
npm audit --production
```

Critical / High の脆弱性があればすぐ対応。

---

## Supabase セキュリティ深層監査（5フェーズ）

> 2026年4月時点の世界的なインシデント分析に基づく。
> RLS未設定だけで数千インスタンスがcurl 1本でデータダンプ可能な状態が確認されている。
> 参考: DeepStrike調査、Lovable大規模漏洩（13,000ユーザー）、Supabase MCP Lethal Trifecta

### Phase 1: 偵察（攻撃者の視点でスキャン）

#### 1-1. キー露出チェック
以下のパターンをプロジェクト全体からGrepする:
- `SUPABASE_SERVICE_ROLE` が `NEXT_PUBLIC_` / `VITE_` / `EXPO_PUBLIC_` 付きで定義されていないか
- フロントエンドコード（src/, app/, components/, pages/）に service_role キーがハードコードされていないか
- `.env` ファイルがgit管理されていないか（.gitignore確認）
- マイグレーションファイル（supabase/migrations/）にAPIキー・パスワード・テストユーザー情報がハードコードされていないか

#### 1-2. スキーマ露出チェック
- `supabase/migrations/` を全て読み、publicスキーマに存在する全テーブル・View・関数を一覧化
- 内部テーブル（ユーザーが直接触らないテーブル）がpublicスキーマにないか判定
- Materialized Viewがpublicスキーマに存在しないか確認

#### 1-3. 依存パッケージチェック
- `@supabase/supabase-js` と `@supabase/auth-js` のバージョンを確認
- `@supabase/auth-js` が v2.69.1 未満の場合、CVE-2025-48370（パストラバーサル）の影響あり

出力形式:
```markdown
## Phase 1 結果: 偵察
| カテゴリ | 発見事項 | 深刻度 | ファイル:行 |
|----------|----------|--------|-------------|
```

### Phase 2: RLS 完全監査

#### 2-1. RLS有効化チェック
- 全マイグレーションから `CREATE TABLE` を抽出し、各テーブルに `ENABLE ROW LEVEL SECURITY` があるか確認
- RLSが有効化されていないテーブルを全てリストアップ（最優先修正対象）

#### 2-2. RLSポリシー網羅性チェック
RLSが有効な各テーブルについて:
- SELECT / INSERT / UPDATE / DELETE の4操作それぞれにポリシーが存在するか
- `USING (true)` や `WITH CHECK (true)` の全許可ポリシーが存在しないか

#### 2-3. RLSポリシー品質チェック
- `auth.jwt() -> 'user_metadata'` や `raw_user_meta_data` を判定条件に使っていないか（ユーザーが自分で変更可能なため Critical）
- `auth.uid()` またはサーバー管理の `auth.jwt() -> 'role'` のみを使用しているか
- JOINやサブクエリを含む複雑なポリシーにパフォーマンス問題がないか（インデックス確認）

#### 2-4. SECURITY DEFINER チェック
- `SECURITY DEFINER` で定義された関数を全て抽出
- publicスキーマにある場合、anon keyから呼び出し可能でRLSを完全にバイパスする
- 各関数について `SECURITY INVOKER` で代替可能か判定

#### 2-5. View チェック
- publicスキーマのViewを全て抽出
- `security_invoker = true` が未設定のViewはRLSをバイパスする

#### 2-6. GRANT/REVOKE チェック
- `REVOKE ALL ON <テーブル名> FROM anon` が全テーブルに適用されているか
- anon アクセスが許可されているテーブルは、本当に公開が必要なデータか確認
- RLSポリシーの `TO` 句が明示されているか（省略すると `PUBLIC` = anon含む全員に適用）

出力形式:
```markdown
## Phase 2 結果: RLS監査
### テーブル別RLS状態
| テーブル名 | RLS有効 | SELECT | INSERT | UPDATE | DELETE | anon REVOKE | 問題 |
|-----------|---------|--------|--------|--------|--------|-------------|------|

### SECURITY DEFINER関数
| 関数名 | スキーマ | INVOKER代替可能 | リスク |

### View
| View名 | security_invoker | 修正必要 |
```

### Phase 3: 認証・Storage・Realtime・Edge Function 監査

#### 3-1. 認証フロー
- Supabase Authの使用箇所を全て特定
- パスワードリセットトークンがRLS未設定テーブルに保存されていないか
- メール確認の強制が実装されているか
- JWT署名方式の確認（HS256 共有秘密鍵 vs RSA非対称鍵）

#### 3-2. Storage Bucket
- `supabase/migrations/` からStorage Bucket定義を抽出
- Public Bucketが存在する場合、機密ファイルが入る可能性がないか確認
- Storageポリシー（アップロード/ダウンロード/削除）が設定されているか
- ファイルサイズ・MIMEタイプの制限が設定されているか

#### 3-3. Realtime
- Realtimeサブスクリプション（`.on('postgres_changes', ...)` 等）の使用箇所を全て特定
- Realtimeを使うテーブルのRLSが有効か確認

#### 3-4. Edge Function
- `supabase/functions/` 内の全Edge Functionを読む
- CORSヘッダーに `*`（ワイルドカード）を使用していないか
- リクエストボディの入力検証（Zod等）が実装されているか
- 環境変数がエラーレスポンスに含まれるリスクがないか
- レート制限の実装有無

### Phase 4: クライアントサイドコード監査

#### 4-1. Supabaseクライアント初期化
- `createClient` / `createBrowserClient` / `createServerClient` の全使用箇所を特定
- service_role key を使用しているクライアントがサーバーサイド（API Route, Server Action, Edge Function）のみで使用されているか
- フロントエンドコンポーネントから service_role クライアントをインポートしていないか

#### 4-2. クエリの安全性
- `.from()` / `.rpc()` の全使用箇所を特定
- ユーザー入力が直接SQLクエリやフィルタに渡されていないか
- `.single()` の戻り値のエラーハンドリングが適切か（内部情報漏洩の防止）

#### 4-3. エラーレスポンス
- Supabaseエラーをそのままユーザーに表示していないか
- 内部テーブル名、カラム名、制約名がエラーメッセージ経由で漏洩しないか

### Phase 5: 修正実施

Phase 1〜4で発見された問題を、以下の優先順で修正:

**優先度1: Critical（即時修正）**
- RLS未設定テーブルへのRLS追加
- Service Role Key のフロントエンド露出の除去
- SECURITY DEFINER関数の移動またはINVOKERへの変更
- user_metadata を使用したRLSポリシーの修正
- CVE対象パッケージのアップデート
- anon REVOKE の欠落

**優先度2: High（当日中に修正）**
- RLSポリシーの抜け（操作別）の追加
- ViewへのSECURITY INVOKER設定
- Storage Bucketポリシーの追加
- CORSワイルドカードの修正
- Edge Functionの入力検証追加

**優先度3: Medium（1週間以内に修正）**
- publicスキーマから内部テーブルの移動
- エラーメッセージの内部情報除去
- Publishable Key / Secret Key への移行検討
- pg_graphqlの無効化（使用していない場合）

修正ルール:
- 各修正はマイグレーションファイルとして作成（直接DB変更しない）
- マイグレーションファイル名: `YYYYMMDDHHMMSS_security_fix_[description].sql`
- 修正前に必ず「現状→問題→修正後の効果」の3点セットで説明
- RLSポリシー追加時は、既存の動作を壊さないよう最小権限の原則に従う

### 最終レポート出力

```markdown
## セキュリティ監査 最終レポート
- 監査日: YYYY-MM-DD
- プロジェクト: [プロジェクト名]

### 発見された問題
| # | 深刻度 | 問題 | 修正状態 |
|---|--------|------|----------|

### 作成したマイグレーション
| ファイル名 | 内容 |

### 残タスク（手動対応が必要なもの）
- [ ] ...
```

---

## 完了条件

- [ ] 全APIルートの認証チェック確認済み
- [ ] 全テーブルのRLSポリシー確認済み（SELECT/INSERT/UPDATE/DELETE 4操作）
- [ ] 全テーブルの anon REVOKE 確認済み
- [ ] SECURITY DEFINER関数の公開スキーマ配置なし
- [ ] View に security_invoker = true 設定済み
- [ ] Service Role Key がフロントエンドに露出していない
- [ ] user_metadata をRLSポリシーで使用していない
- [ ] Storage Bucketポリシー設定済み
- [ ] `npm audit` で Critical/High = 0
- [ ] 機密情報漏洩なし
- [ ] `@supabase/auth-js` v2.69.1以上
