/**
 * ゲームの設定値を管理する静的クラス
 */
export enum GameMode {
  TRAINING = 'training',
  ONLINE = 'online'
}

export interface GameOptions {
  debug: boolean;
  mobileControls: boolean;
  soundEnabled: boolean;
  fullscreen: boolean;
  pixelArt: boolean;
  showFPS: boolean;
  highQuality: boolean;
}

export class GameConfig {
  // ゲームの定数
  static readonly GAME_WIDTH: number = 800;
  static readonly GAME_HEIGHT: number = 600;
  static readonly TILE_SIZE: number = 32;
  static readonly CHARACTER_RADIUS: number = 16;
  static readonly CHARACTER_SPEED: number = 200;
  static readonly SKILL_COOLDOWN: number = 5000; // 5秒
  static readonly ULTIMATE_COOLDOWN: number = 30000; // 30秒
  static readonly RESPAWN_TIME: number = 3000; // 3秒
  static readonly MAX_PLAYERS_PER_GAME: number = 10;
  
  // デバッグモード
  static readonly DEBUG: boolean = false;
  
  // アセット品質設定
  static readonly HIGH_QUALITY: boolean = true;

  // 現在のゲームモード
  static currentMode: GameMode = GameMode.TRAINING;
  
  // ゲームオプション
  static options: GameOptions = {
    debug: false,
    mobileControls: true,
    soundEnabled: true,
    fullscreen: false,
    pixelArt: true,
    showFPS: false,
    highQuality: true
  };
  
  // オプションの保存と読み込み
  static saveOptions(): void {
    try {
      localStorage.setItem('gameOptions', JSON.stringify(this.options));
    } catch (e) {
      console.error('ゲーム設定の保存に失敗しました:', e);
    }
  }
  
  static loadOptions(): void {
    try {
      const savedOptions = localStorage.getItem('gameOptions');
      if (savedOptions) {
        this.options = { ...this.options, ...JSON.parse(savedOptions) };
      }
    } catch (e) {
      console.error('ゲーム設定の読み込みに失敗しました:', e);
    }
  }
  
  // モバイルデバイスかどうかの判定
  static isMobileDevice(): boolean {
    if (typeof navigator !== 'undefined') {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    return false;
  }
  
  // デバッグモードの切り替え
  static toggleDebug(): void {
    this.options.debug = !this.options.debug;
    this.saveOptions();
  }
  
  // サウンドの切り替え
  static toggleSound(): void {
    this.options.soundEnabled = !this.options.soundEnabled;
    this.saveOptions();
  }
  
  // フルスクリーンモードの切り替え
  static toggleFullscreen(game: Phaser.Game): void {
    if (this.options.fullscreen) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.error('フルスクリーンの終了に失敗しました:', err);
        });
      }
    } else {
      const canvas = game.canvas;
      if (canvas.requestFullscreen) {
        canvas.requestFullscreen().catch(err => {
          console.error('フルスクリーン化に失敗しました:', err);
        });
      }
    }
    
    this.options.fullscreen = !this.options.fullscreen;
    this.saveOptions();
  }
  
  // 画質設定の切り替え
  static toggleQuality(): void {
    this.options.highQuality = !this.options.highQuality;
    this.saveOptions();
  }
  
  // FPS表示の切り替え
  static toggleFPS(): void {
    this.options.showFPS = !this.options.showFPS;
    this.saveOptions();
  }
  
  // 初期設定にリセット
  static resetToDefaults(): void {
    this.options = {
      debug: false,
      mobileControls: true,
      soundEnabled: true,
      fullscreen: false,
      pixelArt: true,
      showFPS: false,
      highQuality: true
    };
    this.saveOptions();
  }
}

// 初回読み込み時に保存された設定を読み込む
if (typeof window !== 'undefined') {
  GameConfig.loadOptions();
}
