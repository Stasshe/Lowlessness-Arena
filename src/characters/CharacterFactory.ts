import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { GameConfig } from '../config/GameConfig';
import { SkillType } from '../objects/Player';

export enum CharacterType {
  DEFAULT = 'default',
  TANK = 'tank',
  SPEEDER = 'speeder',
  SNIPER = 'sniper',
  HEALER = 'healer',
  THROWER = 'thrower'
}

export class CharacterFactory {
  private scene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  createCharacter(type: CharacterType, x: number, y: number): Player {
    // 基本のプレイヤーを作成
    const player = new Player(this.scene, x, y);
    
    // タイプに応じてプレイヤーをカスタマイズ
    switch (type) {
      case CharacterType.TANK:
        this.setupTank(player);
        break;
      case CharacterType.SPEEDER:
        this.setupSpeeder(player);
        break;
      case CharacterType.SNIPER:
        this.setupSniper(player);
        break;
      case CharacterType.HEALER:
        this.setupHealer(player);
        break;
      case CharacterType.THROWER:
        this.setupThrower(player);
        break;
      default:
        this.setupDefault(player);
        break;
    }
    
    return player;
  }
  
  private setupDefault(player: Player): void {
    // デフォルトのキャラクター：バランスの良いステータス
    player.setMaxHealth(100);
    player.setWeapon('default');
    player.setSpecialAbility(SkillType.SHIELD);
    
    // 見た目の設定
    player.setTint(0xFFFFFF); // 白色
  }
  
  private setupTank(player: Player): void {
    // タンク：体力が高いが遅い
    player.setMaxHealth(150);
    player.setSpeed(GameConfig.CHARACTER_SPEED * 0.8);
    player.setWeapon('shotgun');
    player.setSpecialAbility(SkillType.SHIELD);
    
    // 見た目の設定
    player.setTint(0xFF0000); // 赤色
    player.setScale(1.2);
  }
  
  private setupSpeeder(player: Player): void {
    // スピーダー：速いが体力が低い
    player.setMaxHealth(80);
    player.setSpeed(GameConfig.CHARACTER_SPEED * 1.3);
    player.setWeapon('machinegun');
    player.setSpecialAbility(SkillType.DASH);
    
    // 見た目の設定
    player.setTint(0x00FF00); // 緑色
    player.setScale(0.9);
  }
  
  private setupSniper(player: Player): void {
    // スナイパー：攻撃力高いが発射速度遅い
    player.setMaxHealth(90);
    player.setSpeed(GameConfig.CHARACTER_SPEED * 0.9);
    player.setWeapon('sniper');
    player.setSpecialAbility(SkillType.SCOPE);
    
    // 見た目の設定
    player.setTint(0x0000FF); // 青色
  }
  
  private setupHealer(player: Player): void {
    // ヒーラー：味方を回復するが攻撃力低め
    player.setMaxHealth(110);
    player.setSpeed(GameConfig.CHARACTER_SPEED * 1.1);
    player.setWeapon('default');
    player.setSpecialAbility(SkillType.HEAL);
    
    // 見た目の設定
    player.setTint(0xFFFF00); // 黄色
  }
  
  private setupThrower(player: Player): void {
    // 投擲兵：爆発する弾を投げる
    player.setMaxHealth(100);
    player.setSpeed(GameConfig.CHARACTER_SPEED);
    player.setWeapon('thrower');
    player.setSpecialAbility(SkillType.MINEFIELD);
    
    // 見た目の設定
    player.setTint(0xFF00FF); // 紫色
  }
}
