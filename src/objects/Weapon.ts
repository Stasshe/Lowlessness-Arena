import Phaser from 'phaser';
import { Player } from './Player';
import { Bullet } from './Bullet';
import { WeaponType, getWeaponDefinition } from '../utils/WeaponTypes';

export class Weapon {
  private scene: Phaser.Scene;
  private owner: Player;
  private type: WeaponType;
  private bullets: Phaser.Physics.Arcade.Group;
  private lastFired: number = 0;
  private cooldown: number = 500; // ミリ秒
  private bulletSpeed: number = 600;
  private bulletDamage: number = 20;
  private bulletRange: number = 400;
  private bulletsPerShot: number = 1;
  private spread: number = 0; // 角度でのブレ
  private rangeMultiplier: number = 1.0;
  private specialProperty: string | undefined;
  
  constructor(scene: Phaser.Scene, owner: Player, type: WeaponType) {
    this.scene = scene;
    this.owner = owner;
    this.type = type;
    
    // 弾のグループを作成
    this.bullets = scene.physics.add.group({
      classType: Bullet,
      runChildUpdate: true, // 子要素のupdateを自動実行
      maxSize: 30 // 最大数
    });
    
    // 武器タイプに応じた設定
    this.configureWeapon();
  }
  
  /**
   * 武器タイプに応じたパラメータを設定
   */
  private configureWeapon(): void {
    // 共通の武器定義から設定を取得
    const definition = getWeaponDefinition(this.type);
    
    this.bulletDamage = definition.damage;
    this.cooldown = definition.cooldown;
    this.bulletRange = definition.range;
    this.bulletSpeed = definition.speed;
    this.bulletsPerShot = definition.bulletsPerShot;
    this.spread = definition.spread;
    this.specialProperty = definition.special;
  }

  /**
   * 発射処理
   */
  fire(_angle: number): void {
    // 実装は省略
    // ...
  }

  /**
   * メレー武器の攻撃処理
   * @param angle 攻撃方向の角度
   */
  private meleeAttack(angle: number): void {
    const time = this.scene.time.now;
    
    // クールダウンチェック
    if (time < this.lastFired + this.cooldown) {
      return;
    }
    
    // クールダウンを更新
    this.lastFired = time;
    
    // ここではエフェクトやサウンドのみ実装
    // 実際のヒット判定とダメージ処理はキャラクタークラスで行う
    try {
      this.scene.sound.play('melee_attack');
    } catch (e) {
      console.warn('攻撃音の再生に失敗:', e);
    }
  }
  
  /**
   * 弾のグループを取得
   */
  getBullets(): Phaser.Physics.Arcade.Group {
    return this.bullets;
  }
  
  /**
   * 射程範囲を取得
   */
  getRange(): number {
    return this.bulletRange * this.rangeMultiplier;
  }
  
  /**
   * 弾のダメージを取得
   */
  getDamage(): number {
    return this.bulletDamage;
  }
  
  /**
   * クールダウン時間を取得
   */
  getCooldown(): number {
    return this.cooldown;
  }
  
  /**
   * 射程倍率を設定（スコープ等のスキル用）
   */
  setRangeMultiplier(multiplier: number): void {
    this.rangeMultiplier = multiplier;
  }
  
  /**
   * 射程倍率をリセット
   */
  resetRangeMultiplier(): void {
    this.rangeMultiplier = 1.0;
  }
  
  /**
   * 武器の種類を取得
   */
  getType(): WeaponType {
    return this.type;
  }
  
  /**
   * リソース解放
   */
  destroy(): void {
    if (this.bullets) {
      this.bullets.clear(true, true);
    }
  }
}
