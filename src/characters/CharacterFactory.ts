import Phaser from 'phaser';
import { Player } from '../objects/Player';

export enum CharacterType {
  DEFAULT = 'default',
  TANK = 'tank',
  SPEEDER = 'speeder',
  SNIPER = 'sniper',
  HEALER = 'healer',
  THROWER = 'thrower'
}

export class CharacterStats {
  health: number = 100;
  speed: number = 200;
  weaponType: string = 'default';
  specialAbility: string = 'none';
  color: number = 0xffffff;
}

export class CharacterFactory {
  private scene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  createCharacter(type: CharacterType, x: number, y: number): Player {
    const stats = this.getCharacterStats(type);
    
    // プレイヤーを作成
    const player = new Player(this.scene, x, y);
    
    // キャラクタータイプ別の設定
    player.setMaxHealth(stats.health);
    player.setSpeed(stats.speed);
    player.setWeapon(stats.weaponType);
    player.setSpecialAbility(stats.specialAbility);
    
    // キャラクター外見の設定
    player.setTint(stats.color);
    
    return player;
  }
  
  private getCharacterStats(type: CharacterType): CharacterStats {
    const stats = new CharacterStats();
    
    switch (type) {
      case CharacterType.TANK:
        stats.health = 200;
        stats.speed = 150;
        stats.weaponType = 'shotgun';
        stats.specialAbility = 'shield';
        stats.color = 0xff0000;
        break;
        
      case CharacterType.SPEEDER:
        stats.health = 80;
        stats.speed = 300;
        stats.weaponType = 'machinegun';
        stats.specialAbility = 'dash';
        stats.color = 0x00ff00;
        break;
        
      case CharacterType.SNIPER:
        stats.health = 70;
        stats.speed = 180;
        stats.weaponType = 'sniper';
        stats.specialAbility = 'scope';
        stats.color = 0x0000ff;
        break;
        
      case CharacterType.HEALER:
        stats.health = 120;
        stats.speed = 200;
        stats.weaponType = 'default';
        stats.specialAbility = 'heal';
        stats.color = 0x00ffff;
        break;
        
      case CharacterType.THROWER:
        stats.health = 100;
        stats.speed = 190;
        stats.weaponType = 'thrower';
        stats.specialAbility = 'minefield';
        stats.color = 0xff00ff;
        break;
        
      default:
        // デフォルトキャラクターの設定はそのまま
        stats.color = 0xffff00;
        break;
    }
    
    return stats;
  }
}
