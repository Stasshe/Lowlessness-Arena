import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { CharacterType } from './CharacterFactory';
import { BaseCharacter } from './BaseCharacter';
import { Archer } from './individual/Archer';
import { Knight } from './individual/Knight';
import { Tanker } from './individual/Tanker';
import { Sniper } from './individual/Sniper';
import { Bomber } from './individual/Bomber';
import { Healer } from './individual/Healer';
import { DefaultCharacter } from './individual/DefaultCharacter';

/**
 * キャラクターとの連携を管理するクラス
 */
export class CharacterHandler {
  private scene: Phaser.Scene;
  private player: Player;
  private character: BaseCharacter | null;
  private characterType: CharacterType;
  
  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.characterType = player.getCharacterType();
    this.character = this.createCharacter(this.characterType);
  }
  
  /**
   * キャラクタータイプに基づいてキャラクターインスタンスを作成
   */
  private createCharacter(type: CharacterType): BaseCharacter {
    switch (type) {
      case CharacterType.KNIGHT:
        return new Knight(this.scene, this.player);
      case CharacterType.TANKER:
        return new Tanker(this.scene, this.player);
      case CharacterType.ARCHER:
        return new Archer(this.scene, this.player);
      case CharacterType.SNIPER:
        return new Sniper(this.scene, this.player);
      case CharacterType.BOMBER:
        return new Bomber(this.scene, this.player);
      case CharacterType.HEALER:
        return new Healer(this.scene, this.player);
      default:
        return new DefaultCharacter(this.scene, this.player);
    }
  }
  
  /**
   * キャラクタータイプを設定
   */
  setCharacterType(type: CharacterType): void {
    if (this.characterType !== type) {
      this.characterType = type;
      
      // 既存のキャラクターがあれば解放
      if (this.character) {
        this.character.destroy();
      }
      
      // 新しいキャラクターを作成
      this.character = this.createCharacter(type);
      
      // プレイヤーのキャラクタータイプを更新
      this.player.setCharacterType(type);
      
      // キャラクターの初期ステータスを設定
      if (this.character) {
        this.character.initializeStats();
      }
    }
  }
  
  /**
   * キャラクターの更新処理
   */
  update(time: number, delta: number): void {
    if (this.character) {
      this.character.update(time, delta);
    }
  }
  
  /**
   * スキルの使用
   */
  useSkill(targetX: number, targetY: number): void {
    if (this.character) {
      this.character.useSkill(targetX, targetY);
    }
  }
  
  /**
   * アルティメットの使用
   */
  useUltimate(): void {
    if (this.character) {
      this.character.useUltimate();
    }
  }
  
  /**
   * 特殊攻撃の使用
   * @returns 特殊攻撃を実行した場合はtrue
   */
  useAttack(targetX: number, targetY: number): boolean {
    if (this.character) {
      return this.character.useAttack(targetX, targetY);
    }
    return false;
  }

  /**
   * 照準表示の更新
   */
  updateAiming(
    targetX: number, 
    targetY: number, 
    joystickDistance?: number
  ): { targetPoint: Phaser.Math.Vector2, trajectoryPoints?: Phaser.Math.Vector2[] } {
    if (this.character) {
      return this.character.updateAiming(targetX, targetY, joystickDistance);
    }
    // キャラクターがない場合はプレイヤーのデフォルト照準を使う
    return this.player.updateAiming(targetX, targetY, joystickDistance);
  }
  
  /**
   * スキル照準表示の更新
   */
  updateSkillAiming(
    targetX: number, 
    targetY: number, 
    joystickDistance?: number
  ): { targetPoint: Phaser.Math.Vector2, area?: Phaser.Geom.Circle | Phaser.Geom.Rectangle } {
    if (this.character) {
      return this.character.updateSkillAiming(targetX, targetY, joystickDistance);
    }
    // キャラクターがない場合はプレイヤーのデフォルトスキル照準を使う
    return this.player.updateSkillAiming(targetX, targetY, joystickDistance);
  }
  
  /**
   * 現在のキャラクターを取得
   */
  getCharacter(): BaseCharacter | null {
    return this.character;
  }
  
  /**
   * 現在のキャラクタータイプを取得
   */
  getCharacterType(): CharacterType {
    return this.characterType;
  }
  
  /**
   * リソース解放
   */
  destroy(): void {
    if (this.character) {
      this.character.destroy();
      this.character = null;
    }
  }
}
