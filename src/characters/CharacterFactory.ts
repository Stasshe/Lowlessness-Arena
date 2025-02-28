import Phaser from 'phaser';
import { Player, SkillType } from '../objects/Player';
import { WeaponType } from '../objects/Weapon';
import { GameConfig } from '../config/GameConfig';

/**
 * キャラクタータイプの列挙型
 */
export enum CharacterType {
  DEFAULT = 'default',
  TANK = 'tank',
  SPEEDER = 'speeder',
  SNIPER = 'sniper',
  HEALER = 'healer',
  THROWER = 'thrower'
}

/**
 * キャラクターの生成を担当するファクトリークラス
 */
export class CharacterFactory {
  private scene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  /**
   * 指定されたキャラクタータイプのプレイヤーを生成する
   */
  createCharacter(type: CharacterType, x: number, y: number): Player {
    // 基本プレイヤーの作成
    const player = new Player(this.scene, x, y);
    
    // キャラクタータイプに応じた設定
    switch (type) {
      case CharacterType.TANK:
        this.setupTankCharacter(player);
        break;
        
      case CharacterType.SPEEDER:
        this.setupSpeederCharacter(player);
        break;
        
      case CharacterType.SNIPER:
        this.setupSniperCharacter(player);
        break;
        
      case CharacterType.HEALER:
        this.setupHealerCharacter(player);
        break;
        
      case CharacterType.THROWER:
        this.setupThrowerCharacter(player);
        break;
        
      default:
        this.setupDefaultCharacter(player);
        break;
    }
    
    // 色合いの調整
    this.applyCharacterTint(player, type);
    
    return player;
  }
  
  /**
   * デフォルトキャラクターの設定
   */
  private setupDefaultCharacter(player: Player): void {
    // バランスのとれたステータス
    player.setMaxHealth(100);
    player.setSpeed(GameConfig.CHARACTER_SPEED);
    player.setWeapon(WeaponType.DEFAULT);
    player.setSpecialAbility(SkillType.SHIELD);
  }
  
  /**
   * タンクキャラクターの設定
   */
  private setupTankCharacter(player: Player): void {
    // HP高め、移動速度遅め、近距離攻撃
    player.setMaxHealth(150);
    player.setSpeed(GameConfig.CHARACTER_SPEED * 0.8);
    player.setWeapon(WeaponType.SHOTGUN);
    player.setSpecialAbility(SkillType.SHIELD);
  }
  
  /**
   * スピーダーキャラクターの設定
   */
  private setupSpeederCharacter(player: Player): void {
    // HP低め、移動速度速め、連射力重視
    player.setMaxHealth(80);
    player.setSpeed(GameConfig.CHARACTER_SPEED * 1.3);
    player.setWeapon(WeaponType.MACHINEGUN);
    player.setSpecialAbility(SkillType.DASH);
  }
  
  /**
   * スナイパーキャラクターの設定
   */
  private setupSniperCharacter(player: Player): void {
    // 通常HP、通常移動速度、長距離高威力攻撃
    player.setMaxHealth(100);
    player.setSpeed(GameConfig.CHARACTER_SPEED);
    player.setWeapon(WeaponType.SNIPER);
    player.setSpecialAbility(SkillType.SCOPE);
  }
  
  /**
   * ヒーラーキャラクターの設定
   */
  private setupHealerCharacter(player: Player): void {
    // 低HP、通常移動速度、回復能力
    player.setMaxHealth(90);
    player.setSpeed(GameConfig.CHARACTER_SPEED);
    player.setWeapon(WeaponType.DEFAULT);
    player.setSpecialAbility(SkillType.HEAL);
  }
  
  /**
   * 爆弾魔キャラクターの設定
   */
  private setupThrowerCharacter(player: Player): void {
    // 通常HP、やや遅い移動速度、爆発系武器
    player.setMaxHealth(110);
    player.setSpeed(GameConfig.CHARACTER_SPEED * 0.9);
    player.setWeapon(WeaponType.THROWER);
    player.setSpecialAbility(SkillType.BOMB);
  }
  
  /**
   * キャラクタータイプに応じた色合いを適用
   */
  private applyCharacterTint(player: Player, type: CharacterType): void {
    switch (type) {
      case CharacterType.TANK:
        player.setTint(0xff0000); // 赤系
        break;
      case CharacterType.SPEEDER:
        player.setTint(0x00ff00); // 緑系
        break;
      case CharacterType.SNIPER:
        player.setTint(0x0000ff); // 青系
        break;
      case CharacterType.HEALER:
        player.setTint(0x00ffff); // 水色系
        break;
      case CharacterType.THROWER:
        player.setTint(0xff00ff); // 紫系
        break;
      default:
        // デフォルトは無着色
        break;
    }
  }
}
