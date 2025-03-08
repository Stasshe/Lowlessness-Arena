// ゲーム全体の設定値
export const GameConfig = {
  // デフォルトの画面サイズ
  DEFAULT_WIDTH: 1620,
  DEFAULT_HEIGHT: 2160,
  
  // マップサイズ (ブロック単位)
  MAP_WIDTH: 18,
  MAP_HEIGHT: 10,
  
  // 1ブロックのピクセルサイズ
  BLOCK_SIZE: 90,
  
  // キャラクターのデフォルト移動速度
  DEFAULT_MOVE_SPEED: 100,
  
  // アニメーション速度 (ms)
  ANIMATION_SPEED: 200,
  
  // プロジェクタイルの速度
  PROJECTILE_SPEED: 500,
  
  // UIのスケーリング
  UI_SCALE: 1,
  
  // デバッグモード
  DEBUG: process.env.NODE_ENV === 'development',

  // シーンのキー
  SCENES: {
    BOOT: 'BootScene',
    PRELOAD: 'PreloadScene',
    MAIN_MENU: 'MainMenuScene',
    TRAINING_GAME: 'TrainingGameScene',
    ONLINE_GAME: 'OnlineGameScene',
    UI: 'UIScene'
  }
};

// ブロックタイプの定義
export enum BlockType {
  FLOOR = '_',
  GRASS = 'g',
  WALL = 'w'
}

// ゲームモード
export enum GameMode {
  TRAINING = 'training',
  ONLINE = 'online'
}

// チームの種類
export enum TeamType {
  BLUE = 'blue',
  RED = 'red',
  NONE = 'none'
}

// 攻撃タイプ
export enum AttackType {
  NORMAL = 'normal',
  SKILL = 'skill',
  ULTIMATE = 'ultimate'
}

// 照準タイプ
export enum AimType {
  DIRECT = 'direct',      // 直線
  PARABOLIC = 'parabolic', // 放物線
  SPREAD = 'spread'       // 扇状
}
