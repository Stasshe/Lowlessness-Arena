/**
 * 武器タイプの列挙型
 * すべての武器システム間で共有される
 */
export enum WeaponType {
  DEFAULT = 'DEFAULT',
  PISTOL = 'PISTOL',
  SHOTGUN = 'SHOTGUN',
  MACHINEGUN = 'MACHINEGUN',
  SNIPER = 'SNIPER',
  THROWER = 'THROWER',
  BOMB = 'BOMB',
  MELEE = 'MELEE',
  BOW = 'BOW',
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
 * 武器情報の定義インターフェース
 */
export interface WeaponDefinition {
  type: WeaponType;
  name: string;
  damage: number;
  cooldown: number;
  range: number;
  speed: number;
  bulletsPerShot: number;
  spread: number;
  special?: string;
}

/**
 * 武器タイプごとの基本パラメータ定義
 */
export const WEAPON_DEFINITIONS: Record<WeaponType, WeaponDefinition> = {
  [WeaponType.DEFAULT]: {
    type: WeaponType.DEFAULT,
    name: 'デフォルト武器',
    damage: 20,
    cooldown: 500,
    range: 400,
    speed: 600,
    bulletsPerShot: 1,
    spread: 0.03
  },
  [WeaponType.PISTOL]: {
    type: WeaponType.PISTOL,
    name: 'ピストル',
    damage: 25,
    cooldown: 400,
    range: 350,
    speed: 650,
    bulletsPerShot: 1,
    spread: 0.02
  },
  [WeaponType.SHOTGUN]: {
    type: WeaponType.SHOTGUN,
    name: 'ショットガン',
    damage: 15,
    cooldown: 1000,
    range: 250,
    speed: 500,
    bulletsPerShot: 5,
    spread: 0.3
  },
  [WeaponType.MACHINEGUN]: {
    type: WeaponType.MACHINEGUN,
    name: 'マシンガン',
    damage: 10,
    cooldown: 150,
    range: 350,
    speed: 700,
    bulletsPerShot: 1,
    spread: 0.1
  },
  [WeaponType.SNIPER]: {
    type: WeaponType.SNIPER,
    name: 'スナイパーライフル',
    damage: 50,
    cooldown: 1500,
    range: 800,
    speed: 1000,
    bulletsPerShot: 1,
    spread: 0.01,
    special: '遠距離に強い'
  },
  [WeaponType.THROWER]: {
    type: WeaponType.THROWER,
    name: 'グレネードランチャー',
    damage: 30,
    cooldown: 1200,
    range: 300,
    speed: 400,
    bulletsPerShot: 1,
    spread: 0.05,
    special: '爆発ダメージ'
  },
  [WeaponType.BOMB]: {
    type: WeaponType.BOMB,
    name: '爆弾',
    damage: 40,
    cooldown: 2000,
    range: 200,
    speed: 300,
    bulletsPerShot: 1,
    spread: 0.05,
    special: '広範囲爆発'
  },
  [WeaponType.MELEE]: {
    type: WeaponType.MELEE,
    name: '近接武器',
    damage: 40,
    cooldown: 500,
    range: 100,
    speed: 0,
    bulletsPerShot: 0,
    spread: 0,
    special: '近接攻撃'
  },
  [WeaponType.BOW]: {
    type: WeaponType.BOW,
    name: '弓',
    damage: 35,
    cooldown: 800,
    range: 500,
    speed: 800,
    bulletsPerShot: 1,
    spread: 0.02,
    special: '放物線軌道'
  },
  [WeaponType.SLING]: {
    type: WeaponType.SLING,
    name: '投石',
    damage: 25,
    cooldown: 600,
    range: 350,
    speed: 500,
    bulletsPerShot: 1,
    spread: 0.04,
    special: '放物線軌道'
  }
};

/**
 * 武器タイプの情報を取得する
 * @param type 武器タイプ
 * @returns 武器の定義情報
 */
export function getWeaponDefinition(type: WeaponType): WeaponDefinition {
  return WEAPON_DEFINITIONS[type] || WEAPON_DEFINITIONS[WeaponType.DEFAULT];
}
