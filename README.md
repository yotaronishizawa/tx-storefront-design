# StoreApp デザイン検討用モック

StoreApp（店舗用iPadアプリ）のReact画面を、**サーバーなし・ブラウザだけ**で動かすモックです。
OPM・ロボット・スマートシェルフは、アプリのタブ内で動くシミュレーターが代わりに応答します。
実店舗やOPMには一切つながりません。

## 1. 初回だけ

必要なもの：Node.js 24 LTS（22.23以上）と pnpm 10。

```sh
corepack enable          # pnpm が無い場合
pnpm install
```

## 2. 手元で動かす

```sh
pnpm dev
```

表示されたURL（通常 <http://localhost:5173/>）を開きます。

- ログイン：ID は何でも可（例 `demo`）、パスワードも何でも可。
- **操作パネル**：同じブラウザの別タブで `/sim-controls/index.html` を開きます
  （例 <http://localhost:5173/sim-controls/index.html>）。スキャン、棚への追加・取り出し、
  エラー、ロボット停止などをここから送ります。
- **アプリのタブを再読み込みすると、デモの状態（作業・在庫・エラー）は最初に戻ります。** ログインは保たれます。

コードを保存すると画面はすぐ更新されます。主な場所：

| 変えたいもの | 場所 |
| --- | --- |
| ホーム | `app/views/store/home-dashboard/` |
| 在庫棚にいれる（RS） | `app/views/restocking/restocking-board/` |
| 在庫棚からとりだす（MR） | `app/views/shelf/manual-replenishment/` |
| 棚割変更 | `app/views/shelf/layout-editor/` |
| 色・余白・共通部品 | `docs/design-tokens.md`、`app/app.css`、`app/core/` |
| 文言 | `app/locales/app/ja.json`（他言語も同じフォルダ） |
| デモのデータ・シナリオ | `simulator/`（[README](simulator/README.md)） |

## 3. みんなに見せる（公開）

最初に一度だけ、受け取った鍵ファイルを **`firebase-key.json`** という名前でこのフォルダ直下に置きます。
（Gitには入りません。他人に渡さないでください。）

あとは毎回これだけです：

```sh
pnpm ship
```

いまこのフォルダにある内容（コミットしていない変更も含めて）がビルドされ、公開URLに反映されます。
最後に表示される `https://<project>.web.app` がアプリ、`…/sim-controls/index.html` が操作パネルです。
見る人は、公開後にページを再読み込みすると最新版になります。

## 困ったとき

- 操作パネルが「React画面が応答しません」：同じブラウザでアプリのタブを開いておいてください（別ブラウザ・シークレットウィンドウ同士はつながりません）。
- 状態がおかしい：操作パネルの「デモ全体を初期化」か、アプリのタブを再読み込み。
- 見た目の確認：iPad相当（1180×820 など）の画面幅で見てください。
- `pnpm check`：型・ルールのチェック（任意）。

---

**English, short:** `pnpm install`, then `pnpm dev` and open the printed URL; any ID/password signs in.
Open `/sim-controls/index.html` in another tab of the same browser to send scans, lane changes and errors.
Reloading the app resets the demo. To publish, put the deploy key at `firebase-key.json` and run `pnpm ship`.
