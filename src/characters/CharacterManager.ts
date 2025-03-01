import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { CharacterType } from './CharacterFactory';
import { CharacterHandler } from './CharacterHandler';
import { CharacterData } from '../utils/CharacterData';
import { PlayerState } from '../objects/Player';

/**
 * キャラクター関連の機能を統合管理するマネージャークラス
 */
export class CharacterManager {
  private scene: Phaser.Scene;
  private player: Player;
  private characterHandler: CharacterHandler;
  
  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.characterHandler = new CharacterHandler(scene, player);
  }
  
  /**
   * キャラクターの更新処理
   * @param time 現在の時間
   * @param delta 前フレームからの経過時間
   */
  update(time: number, delta: number): void {
    this.characterHandler.update(time, delta);
  }
  
  /**
   * スキルを使用する
   * @param targetX ターゲットX座標
   * @param targetY ターゲットY座標
   */
  useSkill(targetX: number, targetY: number): void {
    this.characterHandler.useSkill(targetX, targetY);
  }
  
  /**
   * アルティメット能力を使用する
   */
  useUltimate(): void {
    this.characterHandler.useUltimate();
  }
  
  /**
   * キャラクター固有の攻撃処理を試みる
   * @param targetX ターゲットX座標
   * @param targetY ターゲットY座標
   * @returns 特殊な攻撃処理を行った場合はtrue
   */
  trySpecialAttack(targetX: number, targetY: number): boolean {
    return this.characterHandler.useAttack(targetX, targetY);
  }
  
  /**
   * キャラクタータイプを変更
   * @param type 新しいキャラクタータイプ
   */
  changeCharacterType(type: CharacterType): void {
    this.characterHandler.setCharacterType(type);
  }
  
  /**
   * 現在のキャラクターの詳細情報を取得
   */
  getCharacterInfo(): string {
    const character = this.characterHandler.getCharacter();
    if (!character) return "キャラクター情報が見つかりません";
    
    return `【${character.getName()}】
武器: ${character.getWeaponType()}
スキル: ${character.getSkillName()} - ${character.getSkillDescription()}
アルティメット: ${character.getUltimateName()} - ${character.getUltimateDescription()}`;
  }
  
  /**
   * 使用可能なキャラクタータイプのリストを取得
   */
  static getAvailableCharacterTypes(): CharacterType[] {
    return Object.values(CharacterType);
  }
  
  /**
   * キャラクターのリストデータを取得
   */
  static getCharacterList(): Array<{ type: CharacterType, name: string, description: string }> {
    return Object.values(CharacterType).map(type => {
      const data = CharacterData.getCharacterData(type);
      return {
        type,
        name: data.name,
        description: data.description
      };
    });
  }
  
  /**
   * リソース解放
   */
  destroy(): void {
    this.characterHandler.destroy();
  }

  /**
   * 武器の照準を更新
   * @param targetX ターゲットX座標
   * @param targetY ターゲットY座標
   * @param joystickDistance ジョイスティックの距離（オプション）
   * @returns 照準ポイント情報
   */
  updateAiming(
    targetX: number, 
    targetY: number, 
    joystickDistance?: number
  ): { targetPoint: Phaser.Math.Vector2, trajectoryPoints?: Phaser.Math.Vector2[] } {
    // プレイヤーの状態を確認
    if (this.player.getState() === PlayerState.DEAD) {
      this.player.clearAiming();
      return { targetPoint: new Phaser.Math.Vector2(this.player.x, this.player.y) };
    }
    
    // キャラクター固有の照準表示があればそれを使用
    const character = this.characterHandler.getCharacter();
    if (character && typeof character.updateAiming === 'function') {
      return character.updateAiming(targetX, targetY, joystickDistance);
    }
    
    // デフォルトの照準表示
    return this.player.updateAiming(targetX, targetY, joystickDistance);
  }
  
  /**
   * スキル用照準を更新
   * @param targetX ターゲットX座標
   * @param targetY ターゲットY座標
   * @param joystickDistance ジョイスティックの距離（オプション）
   * @returns 照準ポイント情報
   */
  updateSkillAiming(
    targetX: number, 
    targetY: number, 
    joystickDistance?: number
  ): { targetPoint: Phaser.Math.Vector2, area?: Phaser.Geom.Circle | Phaser.Geom.Rectangle } {
    // プレイヤーの状態を確認
    if (this.player.getState() === PlayerState.DEAD) {
      this.player.clearAiming();
      return { targetPoint: new Phaser.Math.Vector2(this.player.x, this.player.y) };
    }
    
    // キャラクター固有のスキル照準表示があればそれを使用
    const character = this.characterHandler.getCharacter();
    if (character && typeof character.updateSkillAiming === 'function') {
      return character.updateSkillAiming(targetX, targetY, joystickDistance);
    }
    
    // デフォルトのスキル照準表示
    return this.player.updateSkillAiming(targetX, targetY, joystickDistance);
  }
  
  /**
   * 壁レイヤーを照準表示に設定
   * @param layer 壁レイヤー
   */
  setWallLayer(layer: Phaser.Tilemaps.TilemapLayer): void {
    this.player.setWallLayer(layer);
  }
  
  /**
   * 照準表示をクリア
   */
  clearAiming(): void {
    this.player.clearAiming();
  }
}
