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
  
  // キャラクター設定
  static readonly CHARACTER_SPEED: number = 200;
  static readonly CHARACTER_RADIUS: number = 20;
  
  // タイルサイズ
  static readonly TILE_SIZE: number = 64;
  
  // 現在のゲームモード
  static currentMode: GameMode = GameMode.TRAINING;
}
