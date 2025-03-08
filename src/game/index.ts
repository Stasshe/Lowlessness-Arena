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

// WebGLのサポート状況を確認
function checkWebGLSupport() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    console.warn('WebGLがサポートされていません。Canvasレンダラーにフォールバックします。');
    return false;
  }
  
  console.log('WebGLがサポートされています。WebGLレンダラーを使用します。');
  return true;
}

// ゲームの初期化
window.onload = () => {
  console.log("ゲーム初期化開始");

  // WebGLのサポート状況を確認
  const webGLSupported = checkWebGLSupport();

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

  // ゲームの設定
  const config: Phaser.Types.Core.GameConfig = {
    type: webGLSupported ? Phaser.WEBGL : Phaser.CANVAS, // 明示的にWebGLを使用、サポートされていない場合はCanvas
    width: GameConfig.DEFAULT_WIDTH,
    height: GameConfig.DEFAULT_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#2d2d2d',
    powerPreference: 'high-performance', // WebGLのパフォーマンス設定を追加
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: process.env.NODE_ENV === 'development'
      }
    },
    scene: startScene,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  };

  // ゲームインスタンスの作成
  const game = new Phaser.Game(config);
  window.game = game;

  // 起動後にレンダラーの確認
  console.log(`実際に使用されているレンダラー: ${game.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas'}`);

  // リサイズイベントの登録
  window.addEventListener('resize', handleResize);
  handleResize();
  console.log("ゲーム初期化完了");
};
