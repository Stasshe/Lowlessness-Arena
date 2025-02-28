# アセットディレクトリ

このディレクトリは各種ゲームアセットを格納します。高品質なアセットを使用することでゲーム体験が向上します。

## プレースホルダー画像の作成方法

以下のコマンドで簡単なプレースホルダー画像を作成できます：

```bash
# placeholder/default.png を作成
mkdir -p src/assets/placeholder
convert -size 32x32 xc:#FFFFFF src/assets/placeholder/default.png

# 他の必要なディレクトリを作成
mkdir -p src/assets/{characters,sounds,tiles,ui,weapons}
```

ImageMagickがインストールされていない場合は、単純な白い画像を用意して配置してください。
または、開発環境でBase64エンコードされた画像をデコードして保存することも可能です。

## 必要なディレクトリ構造

```
src/assets/
├── characters/ - キャラクター画像
├── placeholder/ - プレースホルダー画像
├── sounds/ - 効果音とBGM
├── tiles/ - マップタイル
├── ui/ - UIコンポーネント
└── weapons/ - 武器関連画像
```

## プレースホルダーアセット

デフォルトでは以下のプレースホルダーアセットが必要です：

- `default.png` - 32x32の白い四角形
- `logo.png` - メニュー用のロゴ画像

## 音声ファイル

最低限必要な音声ファイル：

- `menu_bgm.mp3` - メニュー画面のBGM
- `game_bgm.mp3` - ゲーム中のBGM
- `button_click.mp3` - ボタンクリック音
- `shoot.mp3` - 発射音
- `hit.mp3` - ヒット音

これらのファイルがない場合、コンソールにエラーが表示されますが、ゲームはプレイ可能です。

## 必須アセット

### タイル
- `grass.png` - 基本の草地タイル（64x64推奨）
- `wall.png` - マップ内部の壁タイル（64x64推奨）
- `boundary.png` - マップの外枠の壁（64x64推奨）
- `bush.png` - 茂みタイル、半透明表示（64x64推奨）
- `spawn.png` - リスポーン地点マーカー（64x64推奨）

### キャラクター
- `player.png` - プレイヤーのデフォルトスプライト（32x32または64x64推奨）

### 武器
- `bullet.png` - 発射される弾のスプライト（8x8または16x16推奨）

### UI
- `button.png` - UI用ボタン画像
- `healthbar.png` - 体力バー
- `joystick.png` - ジョイスティックのスティック部分
- `joystick-base.png` - ジョイスティックのベース部分

## 高品質アセットの入手方法

より高品質なアセットを使用する場合は、以下の方法でアセットを入手できます：

1. ゲーム開発向けアセットサイト
   - itch.io (https://itch.io/game-assets)
   - GameDev Market (https://www.gamedevmarket.net/)
   - Open Game Art (https://opengameart.org/)

2. 画像生成AI
   - Stable Diffusion
   - DALL-E
   - Midjourney

3. 自作
   - Photoshop、GIMP、Aseprite などでピクセルアートを作成

## マップ構成

マップは以下の文字で設定されています：

- `g` - 草
- `w` - 壁
- `a` - 外枠の壁
- `b` - 茂み
- `r` - リスポーン地点

```
例：
aaaaaaaaaaaaaaaaa
agggggwwwgggggwga
agbbbgwgwgggggwga
agrggggwwgggggwga
agggggggggggggwga
agggwwwggggggggga
agggwbwgggggrggga
agggwwwggggggggga
aaaaaaaaaaaaaaaaa
```

## 推奨画質

- タイル画像: 64x64ピクセル
- キャラクター: 64x64ピクセル
- 弾: 16x16ピクセル
- UI要素: 適切なサイズ、最低でも2倍のサイズを用意してスケールダウンする

高品質なアセットを使用する場合は、原点（ピボット）の位置に注意してください。
基本的に中心点（0.5, 0.5）が原点となるように作成することをお勧めします。
