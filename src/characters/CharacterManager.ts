import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { CharacterType } from './CharacterFactory';
import { CharacterHandler } from './CharacterHandler';
import { CharacterData } from '../utils/CharacterData';

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
}
