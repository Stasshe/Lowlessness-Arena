import { CharacterType } from '../characters/CharacterFactory';
import { SkillType } from '../objects/Player';
import { WeaponType } from '../objects/Weapon';
import characterData from '../data/characters.json';

export interface CharacterStats {
  name: string;
  description: string;
  color: string;
  health: number;
  speed: number;
  weapon: WeaponType;
  skill: SkillType;
  skillDescription: string;
  ultimateDescription: string;
}

export class CharacterData {
  // JSONからキャラクターデータを取得
  static getCharacterData(type: CharacterType): CharacterStats {
    const data = characterData[type] as CharacterStats;
    if (!data) {
      throw new Error(`キャラクタータイプ ${type} が見つかりません`);
    }
    return data;
  }

  // キャラクター名を取得
  static getCharacterName(type: CharacterType): string {
    return this.getCharacterData(type).name;
  }

  // キャラクター説明を取得
  static getCharacterDescription(type: CharacterType): string {
    return this.getCharacterData(type).description;
  }

  // キャラクターカラーを取得
  static getCharacterColor(type: CharacterType): number {
    return parseInt(this.getCharacterData(type).color);
  }

  // キャラクターのスキル説明を取得
  static getSkillDescription(type: CharacterType): string {
    return this.getCharacterData(type).skillDescription;
  }

  // キャラクターのアルティメット説明を取得
  static getUltimateDescription(type: CharacterType): string {
    return this.getCharacterData(type).ultimateDescription;
  }

  // キャラクタータイプからスキルタイプを取得
  static getSkillTypeForCharacter(characterType: CharacterType): SkillType {
    return this.getCharacterData(characterType).skill as SkillType;
  }

  // キャラクタータイプから武器タイプを取得
  static getWeaponTypeForCharacter(characterType: CharacterType): WeaponType {
    return this.getCharacterData(characterType).weapon as WeaponType;
  }

  // キャラクターの詳細情報（スキル情報を含む）を取得
  static getCharacterInfo(type: CharacterType): string {
    const data = this.getCharacterData(type);
    return `【${data.name}】
武器: ${this.getWeaponName(data.weapon as WeaponType)}
スキル: ${this.getSkillName(data.skill as SkillType)} - ${data.skillDescription}
アルティメット: ${data.ultimateDescription}`;
  }

  // スキル名を取得
  static getSkillName(skillType: SkillType): string {
    const skillNames: Record<SkillType, string> = {
      [SkillType.NONE]: 'なし',
      [SkillType.SHIELD]: 'シールド',
      [SkillType.DASH]: 'ダッシュ',
      [SkillType.SCOPE]: 'スコープ',
      [SkillType.HEAL]: '回復',
      [SkillType.BOMB]: '爆弾投げ',
      [SkillType.MINEFIELD]: '地雷設置'
    };
    return skillNames[skillType] || 'なし';
  }

  // 武器名を取得
  static getWeaponName(weaponType: WeaponType): string {
    const weaponNames: Record<WeaponType, string> = {
      [WeaponType.DEFAULT]: 'ハンドガン',
      [WeaponType.SHOTGUN]: 'ショットガン',
      [WeaponType.SNIPER]: 'スナイパーライフル',
      [WeaponType.MACHINEGUN]: 'マシンガン',
      [WeaponType.THROWER]: 'グレネードランチャー'
    };
    return weaponNames[weaponType] || 'ハンドガン';
  }
}
