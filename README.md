# VAIZO AI実践コミュニティ LP

最新の「先進カンファレンス案 / PROBLEMをSUPPORTと同じ明るいトンマナへ調整」をWeb実装した、レスポンシブな静的LPです。

## 起動

Node.js 22以上を使用します。実行時の外部ライブラリ・外部フォント・CDNは不要です。

```sh
npm ci
npm run dev
```

http://127.0.0.1:4173 を開きます。

```sh
npm run build
npm run preview
```

配布対象は `dist/` です。ルートとサブディレクトリのどちらにも配置できる相対パス構成です。
**デプロイは実施していません。** 同梱サーバーはローカル確認用で、公開サーバーではありません。

## 実装内容

- 編集可能なHTMLテキスト、価格、FAQ、青いCTA
- PROBLEMとSUPPORT共通の淡いブルー背景・白いカード
- 高品質な画像素材による青い光の波・背景・業務イメージ
- スマホメニュー、キーボード操作可能なFAQ、準備中ダイアログ
- 外部URL未設定時の安全なフォールバック
- 320〜1440px幅の横はみ出し検査、画像遅延読み込み
- 動きを減らす設定への対応
- 初期状態は検索エンジン向け `noindex, nofollow`
- 依存関係は開発用のみ。ブラウザ実行時は標準HTML/CSS/JavaScript

## CTA・運営情報の設定

`site-config.js` の `ctaUrl` に案内窓口のHTTPS URLを設定してください。
ボタンには誘導先サービスの名称を表示しません。遷移は新しいタブで開きます。

```js
export const siteConfig = {
  ctaUrl: "https://your-actual-destination.example/",
  companyUrl: "https://vaizo.jp/",
  privacyUrl: "",
  termsUrl: "",
  commerceUrl: "",
  releaseReady: false,
};
```

上のexample URLは説明用です。実際のURLに置き換えてください。
URL未設定の間は「ご案内の受付準備中です」と表示し、フォーム送信や会員登録を受け付けません。
HTTPS以外・認証情報入りURLは拒否します。秘密鍵やトークンを設定に書かないでください。

ビルド時には環境変数 `VAIZO_CTA_URL` で上書きもできます。
`.env.example` は項目の説明用で、`.env` の自動読込は行いません。環境変数をシェル/ホスティング環境に設定するか、site-config.jsを編集してください。

## 公開前チェック（未確定項目）

- [ ] CTAの本番URL
- [ ] 月額9,800円の税込・税別、入会・解約・支払条件
- [ ] 回答期限・毎週の相談デー・月1回の会など提供条件の最終承認
- [ ] プライバシーポリシー・利用規約・特定商取引法表記の実URL
- [ ] 正式ロゴ（現状はデザイン案の仮ワードマーク）への差し替え
- [ ] 運営者情報とプロフィールの確認
- [ ] ページ内の「公開前に確定」注記の確定文言への変更
- [ ] 必要に応じて canonical / og:url / og:image を本番ドメインに設定

確認が終わったら `releaseReady: true` に変更し、`npm run check:release` でビルドします。
必要なURL・承認フラグが欠ける場合はビルドを拒否します。公開用ビルドに成功するとrobotsをindexへ変更します。
通常の `npm run build` もreleaseReady=trueの場合は同じチェックを通します。
このチェックは法的な適合性や文面の確定を代行するものではありません。

## 編集箇所

| 内容                                 | ファイル                 |
| ------------------------------------ | ------------------------ |
| コピー、価格、FAQ、セクション構成    | index.html               |
| 配色、余白、文字サイズ、レスポンシブ | styles.css               |
| CTA・規約等のリンク                  | site-config.js           |
| メニュー・FAQ周辺・CTAの挙動         | main.js                  |
| 高画質の画像素材                     | assets/*.webp            |
| 画像の生成記録                       | docs/asset-provenance.md |

フォントはOS標準の日本語明朝・ゴシックを優先するため、OS間で字形・改行にわずかな差が出ます。
画像案の1枚貼り付けではなく、Webで読める・操作できる形に再構築しています。

## 検証

```sh
npm test
npm run build
npx playwright install chromium
npx playwright test
```

インストール済みGoogle Chromeを使う場合は `PLAYWRIGHT_CHANNEL=chrome` を指定します。
PowerShellでは `$env:PLAYWRIGHT_CHANNEL='chrome'` を設定してから実行します。
テストは外部CTA先を実際に開かず、設定されたURLだけを検査します。
CIはビルド・単体テスト・ブラウザテストのみで、デプロイは行いません。

## 素材

背景・業務イメージはこのLP用に生成したラスタ画像です。WebPは元画像と同じ解像度で圧縮しています。
SVGは小さな汎用ファビコンのみで、複雑なビジュアルの代替には使用していません。
顧客の実データや第三者企業のロゴ・人物写真は含みません。
