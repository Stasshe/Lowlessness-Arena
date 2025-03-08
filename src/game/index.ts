import Phaser from 'phaser';
import { GameConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { TrainingGameScene } from './scenes/TrainingGameScene';
import { OnlineGameScene } from './scenes/OnlineGameScene';
import { UIScene } from './scenes/UIScene';

// リサイズハンドラー
function handleResize() {
  const game = window.game;
  if (!game) return;
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // アスペクト比を維持しながらリサイズ
  const aspectRatio = GameConfig.DEFAULT_WIDTH / GameConfig.DEFAULT_HEIGHT;
  let newWidth = width;
  let newHeight = width / aspectRatio;
  
  if (newHeight > height) {
    newHeight = height;
    newWidth = height * aspectRatio;
  }
  
  game.scale.resize(newWidth, newHeight);
  game.scale.refresh();
}

// ゲームの初期化
window.onload = () => {
  // ゲームの設定
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.WEBGL,
    width: GameConfig.DEFAULT_WIDTH,
    height: GameConfig.DEFAULT_HEIGHT,
    parent: 'game-container',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: process.env.NODE_ENV === 'development'
      }
    },
    scene: [
      BootScene,
      PreloadScene,
      MainMenuScene,
      TrainingGameScene,
      OnlineGameScene,
      UIScene
    ],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  };

  // ゲームインスタンスの作成
  const game = new Phaser.Game(config);
  window.game = game;

  // リサイズイベントの登録
  window.addEventListener('resize', handleResize);
  handleResize();
};
