import { CharacterType } from '../characters/CharacterFactory';
import { SkillType } from '../objects/Player';
import { WeaponType } from '../utils/WeaponTypes';
import characterData from '../data/characters.json';

export interface CharacterStats {
  name: string;
  description: string;
  color: string;
  health: number;
  speed: number;
  weapon: WeaponType;
  skill: SkillType;
  skillName: string;
  skillDescription: string;
  ultimateName: string;
  ultimateDescription: string;
}

export interface CharacterInfo {
  name: string;
  description: string;
  health: number;
  speed: number;
  weapon: string;
  skill: string;
  color: string;
}

export class CharacterData {
  // JSONからキャラクターデータを取得
  static getCharacterData(type: CharacterType): CharacterStats {
    const data = characterData[type as keyof typeof characterData] as CharacterStats;
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
    const skillNames: Record<string, string> = {
      'none': 'なし',
      'shield': 'シールド',
      'dash': 'ダッシュ',
      'scope': 'スコープ',
      'heal': '回復',
      'bomb': '爆弾投げ',
      'minefield': '地雷設置',
      'gatling': 'ガトリング',
      'dash_shield': 'シールドダッシュ',
      'triple_arrow': 'トリプルアロー',
      'pierce_shot': 'ピアスショット'
    };
    return skillNames[skillType] || 'なし';
  }

  // 武器名を取得
  static getWeaponName(weaponType: WeaponType): string {
    const weaponNames: Record<string, string> = {
      'DEFAULT': 'ハンドガン',
      'PISTOL': 'ピストル',
      'SHOTGUN': 'ショットガン',
      'SNIPER': 'スナイパーライフル',
      'MACHINEGUN': 'マシンガン',
      'THROWER': 'グレネードランチャー',
      'BOW': '弓',
      'SLING': '投石',
      'BOMB': '爆弾',
      'MELEE': '近接武器'
    };
    return weaponNames[weaponType] || 'ハンドガン';
  }
}
