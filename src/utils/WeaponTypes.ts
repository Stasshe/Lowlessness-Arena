/**
 * 武器タイプの列挙
 */
export enum WeaponType {
  DEFAULT = 'DEFAULT',
  SWORD = 'SWORD',
  BOW = 'BOW',
  PISTOL = 'PISTOL',
  MELEE = 'MELEE',
  STAFF = 'STAFF',
  SNIPER = 'SNIPER',
  SHOTGUN = 'SHOTGUN',
  MACHINEGUN = 'MACHINEGUN',
  HAMMER = 'HAMMER',
  THROWER = 'THROWER',
  BOMB = 'BOMB',
  SLING = 'SLING'
}

/**
 * 武器タイプごとのアイコン情報
 */
export const WEAPON_ICONS = {
  [WeaponType.DEFAULT]: 'weapon_default',
  [WeaponType.PISTOL]: 'weapon_pistol',
  [WeaponType.SHOTGUN]: 'weapon_shotgun',
  [WeaponType.MACHINEGUN]: 'weapon_machinegun',
  [WeaponType.SNIPER]: 'weapon_sniper',
  [WeaponType.THROWER]: 'weapon_thrower',
  [WeaponType.BOMB]: 'weapon_bomb',
  [WeaponType.MELEE]: 'weapon_melee',
  [WeaponType.BOW]: 'weapon_bow',
  [WeaponType.SLING]: 'weapon_sling'
};

/**
 * 武器タイプごとの名前
 */
export const WEAPON_NAMES = {
  [WeaponType.DEFAULT]: 'デフォルト武器',
  [WeaponType.PISTOL]: 'ピストル',
  [WeaponType.SHOTGUN]: 'ショットガン',
  [WeaponType.MACHINEGUN]: 'マシンガン',
  [WeaponType.SNIPER]: 'スナイパーライフル',
  [WeaponType.THROWER]: 'グレネードランチャー',
  [WeaponType.BOMB]: '爆弾',
  [WeaponType.MELEE]: '近接武器',
  [WeaponType.BOW]: '弓',
  [WeaponType.SLING]: '投石'
};

/**
 * 武器の定義用インターフェース
 */
export interface WeaponDefinition {
  name: string;
  damage: number;
  speed: number;
  range: number;
  cooldown: number;
  bulletsPerShot: number;
  spread: number;
  special?: string;
}

/**
 * 武器定義を取得する関数
 * @param type 武器タイプ
 * @returns 武器定義
 */
export function getWeaponDefinition(type: WeaponType): WeaponDefinition {
  switch (type) {
    case WeaponType.SWORD:
      return {
        name: '剣',
        damage: 30,
        speed: 0,
        range: 70,
        cooldown: 400,
        bulletsPerShot: 1,
        spread: 0,
        special: 'melee'
      };
      
    case WeaponType.BOW:
      return {
        name: '弓',
        damage: 25,
        speed: 800,
        range: 500,
        cooldown: 600,
        bulletsPerShot: 1,
        spread: 0
      };
      
    case WeaponType.STAFF:
      return {
        name: '杖',
        damage: 15,
        speed: 600,
        range: 400,
        cooldown: 300,
        bulletsPerShot: 1,
        spread: 0,
        special: 'magic'
      };
      
    case WeaponType.SNIPER:
      return {
        name: 'スナイパーライフル',
        damage: 50,
        speed: 1200,
        range: 800,
        cooldown: 1200,
        bulletsPerShot: 1,
        spread: 0,
        special: 'pierce'
      };
      
    case WeaponType.SHOTGUN:
      return {
        name: 'ショットガン',
        damage: 12,
        speed: 700,
        range: 300,
        cooldown: 800,
        bulletsPerShot: 5,
        spread: 0.4
      };
      
    case WeaponType.MACHINEGUN:
      return {
        name: '機関銃',
        damage: 8,
        speed: 900,
        range: 500,
        cooldown: 100,
        bulletsPerShot: 1,
        spread: 0.2
      };
      
    case WeaponType.HAMMER:
      return {
        name: 'ハンマー',
        damage: 40,
        speed: 0,
        range: 80,
        cooldown: 800,
        bulletsPerShot: 1,
        spread: 0,
        special: 'stun'
      };
      
    case WeaponType.THROWER:
      return {
        name: '投擲武器',
        damage: 30,
        speed: 500,
        range: 350,
        cooldown: 700,
        bulletsPerShot: 1,
        spread: 0,
        special: 'arc'
      };
      
    case WeaponType.BOMB:
      return {
        name: '爆弾',
        damage: 50,
        speed: 0,
        range: 200,
        cooldown: 1500,
        bulletsPerShot: 1,
        spread: 0,
        special: 'explosion'
      };
      
    case WeaponType.SLING:
      return {
        name: 'パチンコ',
        damage: 15,
        speed: 400,
        range: 300,
        cooldown: 500,
        bulletsPerShot: 1,
        spread: 0.1,
        special: 'arc'
      };
      
    case WeaponType.DEFAULT:
    default:
      return {
        name: '標準武器',
        damage: 20,
        speed: 600,
        range: 400,
        cooldown: 500,
        bulletsPerShot: 1,
        spread: 0
      };
  }
}
