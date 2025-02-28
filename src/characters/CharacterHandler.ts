import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { BaseCharacter } from './BaseCharacter';
import { Knight } from './individual/Knight';
import { Tanker } from './individual/Tanker';
import { Archer } from './individual/Archer';
import { Sniper } from './individual/Sniper';
import { Bomber } from './individual/Bomber'; // パスを修正
import { CharacterType } from './CharacterFactory';

/**
 * プレイヤーキャラクターに応じた処理を委譲するハンドラクラス
 */
export class CharacterHandler {
  private scene: Phaser.Scene;
  private player: Player;
  private character: BaseCharacter | null = null;
  
  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.initializeCharacter();
  }
  
  /**
   * プレイヤーのキャラクタータイプに基づいて適切なキャラクタークラスを初期化
   */
  private initializeCharacter(): void {
    const characterType = this.player.getCharacterType();
    
    switch (characterType) {
      case CharacterType.KNIGHT:
        this.character = new Knight(this.scene, this.player);
        break;
      case CharacterType.TANKER:
        this.character = new Tanker(this.scene, this.player);
        break;
      case CharacterType.ARCHER:
        this.character = new Archer(this.scene, this.player);
        break;
      case CharacterType.SNIPER:
        this.character = new Sniper(this.scene, this.player);
        break;
      case CharacterType.BOMBER:
        this.character = new Bomber(this.scene, this.player);
        break;
      default:
        // デフォルトはナイト
        this.character = new Knight(this.scene, this.player);
        break;
    }
    
    // キャラクターの初期ステータスを設定
    this.character.initializeStats();
  }
  
  /**
   * スキルを使用
   * @param targetX ターゲットX座標
   * @param targetY ターゲットY座標
   */
  useSkill(targetX: number, targetY: number): void {
    if (this.character) {
      this.character.useSkill(targetX, targetY);
    }
  }
  
  /**
   * アルティメット能力を使用
   */
  useUltimate(): void {
    if (this.character) {
      this.character.useUltimate();
    }
  }
  
  /**
   * 攻撃処理
   * @param targetX ターゲットX座標
   * @param targetY ターゲットY座標
   * @returns 特殊処理を行った場合はtrue
   */
  useAttack(targetX: number, targetY: number): boolean {
    if (this.character) {
      return this.character.useAttack(targetX, targetY);
    }
    return false;
  }
  
  /**
   * 更新処理
   * @param time 現在の時間
   * @param delta 前フレームからの経過時間
   */
  update(time: number, delta: number): void {
    if (this.character) {
      this.character.update(time, delta);
    }
  }
  
  /**
   * キャラクターインスタンスを取得
   */
  getCharacter(): BaseCharacter | null {
    return this.character;
  }
  
  /**
   * キャラクタータイプ変更時に再初期化
   */
  setCharacterType(type: CharacterType): void {
    this.player.setCharacterType(type);
    this.initializeCharacter();
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
