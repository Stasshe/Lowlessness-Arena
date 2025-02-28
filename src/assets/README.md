# アセットディレクトリ

このディレクトリは各種ゲームアセットを格納します。

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
