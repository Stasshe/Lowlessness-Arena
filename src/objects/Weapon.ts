import Phaser from 'phaser';
import { Player } from './Player';
import { Bullet } from './Bullet';

export enum WeaponType {
  DEFAULT = 'default',
  SHOTGUN = 'shotgun',
  MACHINEGUN = 'machinegun',
  SNIPER = 'sniper',
  THROWER = 'thrower'
}

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
    switch (this.type) {
      case WeaponType.SHOTGUN:
        this.cooldown = 1000;
        this.bulletSpeed = 500;
        this.bulletDamage = 15;
        this.bulletRange = 250;
        this.bulletsPerShot = 5;
        this.spread = 0.3; // ラジアン
        break;
      
      case WeaponType.MACHINEGUN:
        this.cooldown = 150;
        this.bulletSpeed = 700;
        this.bulletDamage = 10;
        this.bulletRange = 350;
        this.bulletsPerShot = 1;
        this.spread = 0.1;
        break;
      
      case WeaponType.SNIPER:
        this.cooldown = 1500;
        this.bulletSpeed = 1000;
        this.bulletDamage = 50;
        this.bulletRange = 800;
        this.bulletsPerShot = 1;
        this.spread = 0.01;
        break;
      
      case WeaponType.THROWER:
        this.cooldown = 1200;
        this.bulletSpeed = 400;
        this.bulletDamage = 30;
        this.bulletRange = 300;
        this.bulletsPerShot = 1;
        this.spread = 0.05;
        break;
      
      default: // DEFAULT
        this.cooldown = 500;
        this.bulletSpeed = 600;
        this.bulletDamage = 20;
        this.bulletRange = 400;
        this.bulletsPerShot = 1;
        this.spread = 0.03;
        break;
    }
  }
  
  /**
   * 発射処理
   */
  fire(angle: number): void {
    const time = this.scene.time.now;
    
    // クールダウンチェック
    if (time < this.lastFired + this.cooldown) {
      return;
    }
    
    // クールダウンを更新
    this.lastFired = time;
    
    // 弾を発射
    for (let i = 0; i < this.bulletsPerShot; i++) {
      // 弾のばらつき角度を計算
      let bulletAngle = angle;
      if (this.spread > 0 && this.bulletsPerShot > 1) {
        // 複数弾の場合、扇状に広がるように
        const spreadAngle = this.spread * (i - (this.bulletsPerShot - 1) / 2) / (this.bulletsPerShot - 1);
        bulletAngle += spreadAngle;
      } else if (this.spread > 0) {
        // 単発弾の場合、ランダムなブレを加える
        bulletAngle += (Math.random() - 0.5) * this.spread;
      }
      
      // 弾を取得（または作成）
      const bullet = this.bullets.get(this.owner.x, this.owner.y) as Bullet;
      
      if (bullet) {
        // ショットガンかグレネードランチャーの場合は特殊な設定
        if (this.type === WeaponType.THROWER) {
          bullet.setBulletType('explosive');
        } else if (this.type === WeaponType.SNIPER) {
          bullet.setBulletType('sniper');
        }
        
        // 弾を発射
        bullet.fire(
          this.owner.x, 
          this.owner.y, 
          bulletAngle, 
          this.bulletSpeed, 
          this.bulletDamage, 
          this.bulletRange * this.rangeMultiplier
        );
      }
    }
    
    // 発射音を再生
    try {
      this.scene.sound.play('shoot');
    } catch (e) {
      console.warn('発射音の再生に失敗:', e);
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
