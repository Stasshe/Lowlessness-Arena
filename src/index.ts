import Phaser from 'phaser';
import { GameConfig } from './config/GameConfig';
import { LoadingScene } from './scenes/LoadingScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { TrainingScene } from './scenes/TrainingScene';
import { LobbyScene } from './scenes/LobbyScene';
import { OnlineGameScene } from './scenes/OnlineGameScene';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { GameManager } from './game/GameManager';
import { UIManager } from './ui/UIManager';

// Windowインターフェースを拡張してunlockAudio関数を追加
declare global {
  interface Window {
    unlockAudio?: () => void;
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}

// Phaserの設定
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GameConfig.GAME_WIDTH,
  height: GameConfig.GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#222034',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: GameConfig.options.debug
    }
  },
  render: {
    pixelArt: true,
    antialias: false,
    antialiasGL: false
  },
  scene: [
    LoadingScene,
    MainMenuScene,
    TrainingScene,
    LobbyScene,
    OnlineGameScene
  ]
};

// Initialize Firebase (You'll need to add your own firebase config)
const firebaseConfig = {
  // TODO: Replace with your Firebase config
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ゲームの初期化
window.addEventListener('load', () => {
  // アセットのセットアップを実行
  setupAssets();
  
  // ゲームインスタンスを作成
  const game = new Phaser.Game(config);
  
  // モバイルデバイスの場合、フルスクリーンボタンを表示
  if (GameConfig.isMobileDevice()) {
    createFullscreenButton(game);
  }
  
  // サウンドの初期化 - モバイルブラウザ対応
  const unlockAudio = () => {
    // window.unlockAudioが存在する場合のみ呼び出す
    if (typeof window.unlockAudio === 'function') {
      window.unlockAudio();
    }
    
    // WebAudioContextを使用
    const WebAudioContext = window.AudioContext || window.webkitAudioContext;
    if (WebAudioContext) {
      try {
        const audioContext = new WebAudioContext();
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
      } catch (e) {
        console.warn('AudioContext初期化エラー:', e);
      }
    }
  };
  
  // クリックやタップでサウンドをアンロック
  document.addEventListener('click', unlockAudio, false);
  document.addEventListener('touchstart', unlockAudio, false);
});

// アセットセットアップ関数
async function setupAssets() {
  try {
    // Node.js環境の場合はセットアップスクリプトを実行
    if (typeof window === 'undefined' && typeof require !== 'undefined') {
      // サーバーサイド実行時のみ実行
      // このコードはブラウザでは実行されない
    }
  } catch (e) {
    console.warn('アセットセットアップをスキップしました:', e);
  }
}

// フルスクリーンボタンの作成
function createFullscreenButton(game: Phaser.Game) {
  const button = document.createElement('button');
  button.textContent = '📺';
  button.style.position = 'absolute';
  button.style.bottom = '10px';
  button.style.right = '10px';
  button.style.zIndex = '1000';
  button.style.fontSize = '24px';
  button.style.padding = '8px 12px';
  button.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  
  button.addEventListener('click', () => {
    if (game.scale.isFullscreen) {
      game.scale.stopFullscreen();
    } else {
      game.scale.startFullscreen();
    }
  });
  
  const container = document.getElementById('game-container');
  if (container) {
    container.appendChild(button);
  }
}

// エラーハンドリング
window.addEventListener('error', (e) => {
  console.error('ゲームエラー:', e.error);
});

// Initialize the game and UI
document.addEventListener('DOMContentLoaded', () => {
  const gameManager = new GameManager(db);
  const uiManager = new UIManager(gameManager);

  // Debug mode toggle
  window.addEventListener('keydown', (e) => {
    if (e.key === 'd' && e.ctrlKey) {
      const debugPanel = document.getElementById('debug-panel');
      if (debugPanel) {
        debugPanel.classList.toggle('show');
        gameManager.toggleDebug();
      }
    }
  });
});
