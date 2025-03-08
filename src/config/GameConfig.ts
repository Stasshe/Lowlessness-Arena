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
  // ゲーム画面の基本サイズ
  public static readonly GAME_WIDTH: number = 1620;
  public static readonly GAME_HEIGHT: number = 2160;
  
  // マップの設定
  public static readonly MAP = {
    WIDTH_BLOCKS: 18,
    HEIGHT_BLOCKS: 10,
    BLOCK_SIZE: 90 // ピクセル単位
  };
  
  // キャラクター設定
  public static readonly CHARACTER = {
    SPEED_BASE: 100, // 基本移動速度
    DEFAULT_CHARACTER: 'Huges'
  };
  
  // ゲームオプション
  public static readonly options = {
    debug: false,
    showFps: true,
    soundEnabled: true
  };
  
  // モバイルデバイスの判定
  public static isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  // タブレットデバイスの判定
  public static isTabletDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
  }
  
  // 入力設定
  public static readonly INPUT = {
    JOYSTICK: {
      BASE_SIZE: 100,
      THUMB_SIZE: 50,
      ALPHA: 0.7,
      DEAD_ZONE: 0.1
    }
  };
  
  // UI設定
  public static readonly UI = {
    HEALTH_BAR: {
      WIDTH: 100,
      HEIGHT: 10,
      OFFSET_Y: -50
    },
    BUTTON: {
      SIZE: 80,
      SPACING: 20
    }
  };
  
  // デバッグ設定
  public static toggleDebug(): void {
    GameConfig.options.debug = !GameConfig.options.debug;
    console.log(`Debug mode: ${GameConfig.options.debug ? 'ON' : 'OFF'}`);
  }
}
