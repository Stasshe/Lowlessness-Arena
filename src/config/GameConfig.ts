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
  
  // プレイヤー関連
  static readonly CHARACTER_MAX_HEALTH: number = 100; // 最大HP基本値
  static readonly CHARACTER_HEALTH_REGEN: number = 0.5; // 自動HP回復量（秒）
  static readonly CHARACTER_SHIELD_DURATION: number = 3000; // シールド効果時間（ミリ秒）
  static readonly CHARACTER_SHIELD_REDUCTION: number = 0.5; // シールド効果でのダメージ軽減率
  static readonly CHARACTER_DASH_DISTANCE: number = 200; // ダッシュ距離
  static readonly CHARACTER_DASH_DURATION: number = 200; // ダッシュ所要時間（ミリ秒）
  
  // 武器関連
  static readonly WEAPON_DEFAULT_DAMAGE: number = 20; // 基本ダメージ
  static readonly WEAPON_DEFAULT_SPEED: number = 600; // 基本弾速
  static readonly WEAPON_DEFAULT_RANGE: number = 400; // 基本射程
  static readonly WEAPON_DEFAULT_COOLDOWN: number = 500; // 基本攻撃クールダウン
  static readonly WEAPON_EXPLOSIVE_RADIUS: number = 50; // 爆発範囲基本値
  static readonly WEAPON_MELEE_RANGE: number = 70; // 近接武器範囲
  static readonly WEAPON_ARC_HEIGHT: number = 100; // 弧を描く投射物の最高高度
  
  // AI・敵関連
  static readonly AI_REACTION_TIME: number = 300; // AIの反応時間（ミリ秒）
  static readonly AI_VISION_RANGE: number = 400; // AIの視界範囲
  static readonly AI_ATTACK_RANGE: number = 350; // AIの攻撃範囲
  static readonly AI_PATROL_SPEED: number = 100; // AIの巡回速度
  static readonly AI_CHASE_SPEED: number = 180; // AIの追跡速度
  static readonly AI_WANDER_RADIUS: number = 150; // AIのうろつき半径
  
  // マップ関連
  static readonly MAP_WIDTH: number = 2400; // マップ幅
  static readonly MAP_HEIGHT: number = 2400; // マップ高さ
  static readonly BUSH_HIDE_ALPHA: number = 0.5; // 茂みでの透明度
  static readonly OBJECTIVE_CAPTURE_TIME: number = 5000; // 目標占領所要時間（ミリ秒）
  
  // カメラ設定
  static readonly CAMERA_LERP: number = 0.1; // カメラ追従の滑らかさ（0-1）
  static readonly CAMERA_ZOOM_MIN: number = 0.8; // 最小ズーム
  static readonly CAMERA_ZOOM_MAX: number = 1.5; // 最大ズーム
  static readonly CAMERA_SHAKE_INTENSITY: number = 0.005; // カメラ振動強度
  static readonly CAMERA_SHAKE_DURATION: number = 200; // カメラ振動時間
  
  // UI関連
  static readonly UI_PADDING: number = 10; // UI余白
  static readonly UI_FONT: string = 'Arial'; // デフォルトフォント
  static readonly UI_FONT_SIZE: number = 16; // デフォルトフォントサイズ
  static readonly UI_TEXT_COLOR: string = '#ffffff'; // デフォルトテキスト色
  static readonly UI_HEALTHBAR_WIDTH: number = 50; // HPバーの幅
  static readonly UI_HEALTHBAR_HEIGHT: number = 6; // HPバーの高さ
  static readonly UI_BUTTON_ALPHA: number = 0.7; // UIボタンの透明度
  
  // パーティクル・エフェクト
  static readonly PARTICLE_COUNT_LOW: number = 10; // 低品質時のパーティクル数
  static readonly PARTICLE_COUNT_HIGH: number = 30; // 高品質時のパーティクル数 
  static readonly EFFECT_DURATION: number = 800; // エフェクト持続時間（ミリ秒）
  static readonly TRAIL_FREQUENCY: number = 10; // トレイル生成頻度
  static readonly FLASH_DURATION: number = 100; // 点滅エフェクト持続時間
  
  // ゲーム進行
  static readonly MATCH_TIME: number = 5 * 60 * 1000; // 試合時間（ミリ秒）
  static readonly WARMUP_TIME: number = 10 * 1000; // ウォームアップ時間（ミリ秒）
  static readonly END_GAME_DELAY: number = 5 * 1000; // 試合終了後の待機時間（ミリ秒）
  static readonly SCORE_KILL: number = 100; // キル時のスコア
  static readonly SCORE_ASSIST: number = 50; // アシスト時のスコア
  static readonly SCORE_OBJECTIVE: number = 200; // 目標達成時のスコア
  
  // サウンド設定
  static readonly MASTER_VOLUME: number = 0.7; // マスター音量（0-1）
  static readonly BGM_VOLUME: number = 0.5; // BGM音量（0-1）
  static readonly SFX_VOLUME: number = 0.8; // 効果音音量（0-1）
  static readonly FOOTSTEP_VOLUME: number = 0.3; // 足音音量（0-1）
  
  // デバッグ設定
  static readonly DEBUG: boolean = false;
  static readonly SHOW_FPS: boolean = false; // FPS表示
  static readonly SHOW_HITBOXES: boolean = false; // 当たり判定表示
  static readonly GOD_MODE: boolean = false; // 無敵モード
  static readonly UNLIMITED_AMMO: boolean = false; // 弾無限モード
  
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
