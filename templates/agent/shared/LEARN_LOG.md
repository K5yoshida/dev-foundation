# LEARN_LOG

> `ship-and-learn` プロンプト実行時に追記する。
> 「作った結果どうだったか？」の学習履歴。

---

<!-- 実行後に以下のフォーマットで追記 -->
<!--
## YYYY-MM-DD

### 対象: {機能名 or specs/{number}-{name}}
### リリース日: YYYY-MM-DD
### 判定: HIT / MISS / UNKNOWN
### 仮説: {元の Business Impact Hypothesis}
### 現実: {実測データ}
### 学習: {1〜3行}
### 原因層: {WHO / WHAT / HOW}
### 次アクション: {具体的なタスク}
### 優先順位の変更: {あれば記載}
-->

## 2026-03-04

### 対象: specs/005-onboarding-wizard

### リリース日: 2026-03-04

### 判定: UNKNOWN

### 仮説: 初回登録後に `industry -> cv-pattern -> tag -> verify` を迷わず完走できる導線を用意すれば、導入完了率とタグ確認成功率が上がり、`/landing-pages/templates` への遷移率が改善する。

### 現実: ローカルでは [e2e/12-signup-publish-flow.spec.ts] により `signup -> onboarding -> landing-pages/templates -> LP公開 -> バナー公開 -> analytics` の通し導線は完了確認できている。一方で、本番/実利用の完走率、タグ確認成功率、テンプレート遷移率はまだ計測・集計しておらず、Business Impact は判定できない。

### 学習: 実装としての導線整合は改善され、ローカル検証可能な状態にはなった。だが、spec で定義した PROOF 指標を回収する計測面が未整備のため、価値仮説の答え合わせまでは到達していない。次に進む前に、完走率・成功率・遷移率の計測を先に固定する必要がある。

### 原因層: HOW

### 次アクション: `/onboarding/industry` 開始、`cv-pattern` 確定、タグコピー、`verify_success / verify_failed / verify_skipped`、`/landing-pages/templates` 遷移のイベントを明示的に送る。ダッシュボードまたは管理画面で、導入完了率・タグ確認成功率・テンプレート遷移率を日次で見られる最小レポートを追加する。課金完了後の `/onboarding/industry` リダイレクト条件も仕様と実装で揃える。

### 優先順位の変更: Wave 1 の中で「導入前後比較」に加え、「オンボーディング計測の明示化」を直近優先に引き上げる。新しい導線追加より先に、既存導線の計測欠損を埋める。
