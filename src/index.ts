import Phaser from 'phaser';
import { MainMenuScene } from './scenes/MainMenuScene';
import { TrainingScene } from './scenes/TrainingScene';
import { OnlineGameScene } from './scenes/OnlineGameScene';
import { LobbyScene } from './scenes/LobbyScene';
import { GameConfig } from './config/GameConfig';

// 型定義の拡張を確実に読み込む
import './types/phaser-extended';

// fsとpathをブラウザ環境で使わないようにする
let fs: any = undefined;
let path: any = undefined;

// ブラウザ環境での読み込みエラーを回避
if (typeof window === 'undefined') {
  try {
    fs = require('fs');
    path = require('path');
  } catch (e) {
    console.warn('fs/pathモジュールをロードできませんでした');
  }
}

window.addEventListener('load', () => {
  // アセットディレクトリの説明
  console.log('Lowlessness Arena を起動します');
  console.log('アセット準備のヒント:');
  console.log('必要なディレクトリ構造: /workspaces/Lowlessness-arena/src/assets/');
  
  // Nodeの機能は開発環境でのみ使用
  if (typeof process !== 'undefined' && fs && path) {
    try {
      const assetsPath = path.join(__dirname, 'assets');
      if (!fs.existsSync(assetsPath)) {
        console.warn('警告: assetsディレクトリが見つかりません');
      }
    } catch (error) {
      // エラーを抑制
    }
  }
  
  // Phaserゲーム設定
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GameConfig.WIDTH,
    height: GameConfig.HEIGHT,
    parent: 'game-container',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: GameConfig.DEBUG
      } as Phaser.Types.Physics.Arcade.ArcadeWorldConfig
    },
    scene: [MainMenuScene, TrainingScene, LobbyScene, OnlineGameScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
      activePointers: 2,
      keyboard: true
    }
  };

  new Phaser.Game(config);
});
