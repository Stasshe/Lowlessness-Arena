import Phaser from 'phaser';
import { Player, SkillType } from '../objects/Player';
import { WeaponType } from '../utils/WeaponTypes';
import { CharacterData } from '../utils/CharacterData';

export enum CharacterType {
  DEFAULT = 'DEFAULT',
  KNIGHT = 'KNIGHT',
  TANKER = 'TANKER',
  ARCHER = 'ARCHER',
  SNIPER = 'SNIPER',
  BOMBER = 'BOMBER',
  HEALER = 'HEALER'
}

export class CharacterFactory {
  private scene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  createCharacter(type: CharacterType, x: number, y: number): Player {
    const player = new Player(this.scene, x, y);
    
    // キャラクタータイプを設定
    player.setCharacterType(type);
    
    try {
      // CharacterData からキャラクター情報を取得して設定
      const characterData = CharacterData.getCharacterData(type);
      player.setMaxHealth(characterData.health);
      player.setSpeed(characterData.speed);
      player.setWeapon(characterData.weapon as WeaponType);
      player.setSpecialAbility(characterData.skill as SkillType);

      // キャラクターの色に合わせてティントを設定
      player.setTint(parseInt(characterData.color));
    } catch (error) {
      console.error(`キャラクター作成エラー: ${error}`);
      
      // エラーが発生した場合はデフォルト値を設定
      player.setMaxHealth(100);
      player.setSpeed(220);
      player.setWeapon(WeaponType.DEFAULT);
      player.setSpecialAbility(SkillType.NONE);
    }
    
    return player;
  }
}
