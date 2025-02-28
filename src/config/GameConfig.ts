/**
 * ゲームの設定値を管理する静的クラス
 */
export enum GameMode {
  TRAINING = 'training',
  ONLINE = 'online'
}

export class GameConfig {
  // ゲーム画面サイズ
  static readonly WIDTH: number = 800;
  static readonly HEIGHT: number = 600;
  
  // デバッグモード
  static readonly DEBUG: boolean = false;
  
  // キャラクター設定 - 速度を調整（遅くする）
  static readonly CHARACTER_SPEED: number = 150; // 以前は200
  static readonly CHARACTER_RADIUS: number = 20;
  
  // タイルサイズ
  static readonly TILE_SIZE: number = 64;
  
  // スキル設定
  static readonly SKILL_COOLDOWN: number = 5000; // 5秒
  static readonly ULTIMATE_COOLDOWN: number = 15000; // 15秒
  
  // 現在のゲームモード
  static currentMode: GameMode = GameMode.TRAINING;
  
  // アセット品質
  static readonly HIGH_QUALITY: boolean = true;
}
