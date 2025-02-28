# Lowlessness Arena

ブロスタ風のブラウザゲーム「Lowlessness Arena」のソースコードリポジトリです。

## 機能

- トレーニングモード（AIと対戦）
- オンライン対戦モード（Firebase経由）
- さまざまなキャラクタータイプ
- プラットフォーム対応（PC、iPad）

## 開発環境のセットアップ

### 前提条件

- Node.js (v14以上)
- npm または yarn

### インストール手順

1. リポジトリをクローンする
```bash
git clone https://github.com/yourusername/Lowlessness-arena.git
cd Lowlessness-arena
```

2. 依存パッケージをインストール
```bash
npm install
# または
yarn install
```

3. アセットディレクトリを自動セットアップ
```bash
npm run setup
# または
yarn setup
```

4. Firebaseの設定
Firebase Consoleでプロジェクトを作成し、Webアプリを追加して、`src/firebase/FirebaseManager.ts`の`firebaseConfig`オブジェクトを更新してください。

### 開発サーバーの起動

```bash
npm start
# または
yarn start
```

サーバーが起動したら、ブラウザで http://localhost:9000 にアクセスしてください。

## ビルド

```bash
npm run build
# または
yarn build
```

ビルドされたファイルは`dist`ディレクトリに出力されます。

## プロジェクト構成

- `src/` - ソースコード
  - `ai/` - AIロジック
  - `assets/` - 画像、音声などのアセット
  - `characters/` - キャラクター関連
  - `config/` - ゲーム設定
  - `firebase/` - Firebaseとの連携
  - `objects/` - ゲームオブジェクト
  - `scenes/` - ゲームシーン
  - `ui/` - ユーザーインターフェース
  - `utils/` - ユーティリティ

## ライセンス

このプロジェクトは非公開です。無断での使用、複製、配布は禁止されています。