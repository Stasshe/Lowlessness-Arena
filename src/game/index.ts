import Phaser from 'phaser';
import { GameConfig, GameMode } from './config';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { TrainingGameScene } from './scenes/TrainingGameScene';
import { OnlineGameScene } from './scenes/OnlineGameScene';
import { UIScene } from './scenes/UIScene';

// Window型にgameプロパティを追加
declare global {
  interface Window {
    game?: Phaser.Game;
  }
}

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
  console.log("===== ゲーム初期化開始 =====");

  // URLパラメータやローカルストレージからモードを取得
  const gameMode = localStorage.getItem('gameMode') || 'training';
  console.log(`ゲームモード: ${gameMode}`);
  
  const selectedCharacter = localStorage.getItem('selectedCharacter');
  console.log(`選択されたキャラクター: ${selectedCharacter || 'なし (デフォルト: hugues)'}`);

  // 最初に開始するシーン
  const startScene = [
    BootScene,
    PreloadScene,
    gameMode === 'training' ? TrainingGameScene : OnlineGameScene,
    UIScene
  ];
  console.log("開始シーン:", startScene.map(s => s.name));

  try {
    console.log("ゲーム設定を構成中...");
    
    // ゲームの設定
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: GameConfig.DEFAULT_WIDTH,
      height: GameConfig.DEFAULT_HEIGHT,
      parent: 'game-container',
      backgroundColor: '#2d2d2d',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: process.env.NODE_ENV === 'development',
          fps: 60,
          timeScale: 1,
          fixedStep: true,
          overlapBias: 8,
          tileBias: 16
        }
      },
      scene: startScene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      render: {
        pixelArt: true,
        antialias: false,
        antialiasGL: false,
        roundPixels: true
      },
      banner: false,
      dom: {
        createContainer: false
      },
      // デバッグ情報を追加
      callbacks: {
        postBoot: (game) => {
          console.log("Phaser ゲームブート完了");
        }
      }
    };

    console.log("Phaser.Game インスタンスを作成中...");
    
    // ゲームインスタンスの作成
    const game = new Phaser.Game(config);
    window.game = game;

    // リサイズイベントの登録
    window.addEventListener('resize', handleResize);
    handleResize();
    
    console.log("===== ゲーム初期化完了 =====");
  } catch (err) {
    console.error("ゲーム初期化中にエラーが発生しました:", err);
  }
};
