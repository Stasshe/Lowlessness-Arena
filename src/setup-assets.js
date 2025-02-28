const fs = require('fs');
const path = require('path');

// アセットディレクトリの構造
const assetDirectories = [
  'src/assets',
  'src/assets/characters',
  'src/assets/placeholder',
  'src/assets/sounds',
  'src/assets/tiles',
  'src/assets/ui',
  'src/assets/weapons'
];

console.log('アセットディレクトリをセットアップ中...');

// ディレクトリを作成
assetDirectories.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`ディレクトリを作成: ${dir}`);
    fs.mkdirSync(dirPath, { recursive: true });
  } else {
    console.log(`ディレクトリはすでに存在します: ${dir}`);
  }
});

// プレースホルダー画像の作成（32x32の白い画像）
const placeholderPath = path.join(__dirname, '..', 'src/assets/placeholder/default.png');

// 既存のファイルを上書きしないためのチェック
if (!fs.existsSync(placeholderPath)) {
  console.log('プレースホルダー画像を作成中...');
  
  // 簡易的な白い1px PNGのBase64エンコード
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgAQMAAABJtOi3AAAABlBMVEX///8AAABVwtN+AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAEklEQVQImWNgGAWjYBSMglEAAAQkAAEprTqiAAAAAElFTkSuQmCC';
  
  // Base64デコード
  const imageBuffer = Buffer.from(pngBase64, 'base64');
  fs.writeFileSync(placeholderPath, imageBuffer);
  
  console.log('プレースホルダー画像を作成しました');
} else {
  console.log('プレースホルダー画像はすでに存在します');
}

// 基本的な空のMP3ファイル（ヘッダーのみ）のBase64エンコード
// これは再生可能な最小のMP3ファイルです
const mp3Base64 = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAeAAAbIAAODg4ODg4ODhQUFBQUFBQUGhoaGhoaGhogICAgICAgICYmJiYmJiYmLCwsLCwsLCwyMjIyMjIyMjg4ODg4ODg4Pj4+Pj4+Pj5ERERERERERkpKSkpKSkpKUFBQUFBQUFBWVlZWVlZWVlxcXFxcXFxcYmJiYmJiYmJoaGhoaGhoaG5ubm5ubm5udHR0dHR0dHR6eno=';

// 最小限のサンプルサウンドファイル
const soundsDir = path.join(__dirname, '..', 'src/assets/sounds');
const soundFiles = [
  'menu_bgm.mp3', 
  'game_bgm.mp3', 
  'victory_bgm.mp3',
  'button_click.mp3', 
  'shoot.mp3', 
  'hit.mp3', 
  'explosion.mp3',
  'skill_activate.mp3',
  'ultimate_activate.mp3',
  'player_damage.mp3',
  'player_death.mp3',
  'countdown.mp3'
];

if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// ダミーサウンドファイルを作成
soundFiles.forEach(filename => {
  const filePath = path.join(soundsDir, filename);
  if (!fs.existsSync(filePath)) {
    try {
      // 再生可能な最小のMP3ファイル
      const soundBuffer = Buffer.from(mp3Base64, 'base64');
      fs.writeFileSync(filePath, soundBuffer);
      console.log(`サウンドファイルを作成: ${filename}`);
    } catch (e) {
      console.error(`サウンドファイル作成エラー: ${filename} -`, e);
      // 1バイトのダミーファイルでフォールバック
      fs.writeFileSync(filePath, Buffer.from([0]));
    }
  }
});

// ロゴ画像のコピー
const logoPath = path.join(__dirname, '..', 'src/assets/placeholder/logo.png');
if (!fs.existsSync(logoPath) && fs.existsSync(placeholderPath)) {
  console.log('ロゴプレースホルダー画像をコピー中...');
  fs.copyFileSync(placeholderPath, logoPath);
  console.log('ロゴプレースホルダー画像をコピーしました');
}

// マップタイル画像
const tilesDir = path.join(__dirname, '..', 'src/assets/tiles');
const tileFiles = ['grass.png', 'wall.png', 'bush.png', 'spawn.png'];

if (!fs.existsSync(tilesDir)) {
  fs.mkdirSync(tilesDir, { recursive: true });
}

// プレースホルダータイル画像を作成
tileFiles.forEach(filename => {
  const filePath = path.join(tilesDir, filename);
  if (!fs.existsSync(filePath) && fs.existsSync(placeholderPath)) {
    fs.copyFileSync(placeholderPath, filePath);
    console.log(`タイル画像をコピー: ${filename}`);
  }
});

// UI画像
const uiDir = path.join(__dirname, '..', 'src/assets/ui');
const uiFiles = ['button.png', 'healthbar.png', 'joystick.png', 'joystick-base.png'];

if (!fs.existsSync(uiDir)) {
  fs.mkdirSync(uiDir, { recursive: true });
}

// プレースホルダーUI画像を作成
uiFiles.forEach(filename => {
  const filePath = path.join(uiDir, filename);
  if (!fs.existsSync(filePath) && fs.existsSync(placeholderPath)) {
    fs.copyFileSync(placeholderPath, filePath);
    console.log(`UI画像をコピー: ${filename}`);
  }
});

// キャラクター画像
const charsDir = path.join(__dirname, '..', 'src/assets/characters');
if (!fs.existsSync(charsDir)) {
  fs.mkdirSync(charsDir, { recursive: true });
}

// player.png画像をコピー
const playerImagePath = path.join(charsDir, 'player.png');
if (!fs.existsSync(playerImagePath) && fs.existsSync(placeholderPath)) {
  fs.copyFileSync(placeholderPath, playerImagePath);
  console.log('プレイヤー画像をコピーしました');
}

// 武器画像
const weaponsDir = path.join(__dirname, '..', 'src/assets/weapons');
if (!fs.existsSync(weaponsDir)) {
  fs.mkdirSync(weaponsDir, { recursive: true });
}

// bullet.png画像をコピー
const bulletImagePath = path.join(weaponsDir, 'bullet.png');
if (!fs.existsSync(bulletImagePath) && fs.existsSync(placeholderPath)) {
  fs.copyFileSync(placeholderPath, bulletImagePath);
  console.log('弾画像をコピーしました');
}

console.log('アセットのセットアップが完了しました！');
