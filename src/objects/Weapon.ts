import Phaser from 'phaser';
import { Player } from './Player';
import { Bullet } from './Bullet';

type WeaponStats = {
  damage: number;
  range: number;
  speed: number;
  fireRate: number; // 発射間隔（ミリ秒）
  bulletCount: number; // 1回の攻撃で発射される弾の数
  spread: number; // 複数発射時の広がり（ラジアン）
};

export enum WeaponType {
  DEFAULT = 'default',
  SHOTGUN = 'shotgun',
  SNIPER = 'sniper',
  MACHINEGUN = 'machinegun',
  THROWER = 'thrower'
}

export class Weapon {
  private scene: Phaser.Scene;
  private owner: Player;
  private type: WeaponType;
  private stats: WeaponStats;
  private bullets: Phaser.Physics.Arcade.Group;
  private lastFired: number = 0;
  
  constructor(scene: Phaser.Scene, owner: Player, type: string = 'default') {
    this.scene = scene;
    this.owner = owner;
    this.type = type as WeaponType;
    this.stats = this.getWeaponStats(type);
    
    // 弾のグループを作成
    this.bullets = scene.physics.add.group({
      classType: Bullet,
      runChildUpdate: true // 子オブジェクトのupdateメソッドを自動的に呼び出す
    });
  }
  
  private getWeaponStats(type: string): WeaponStats {
    // 武器タイプに応じた性能を返す
    switch (type) {
      case 'shotgun':
        return {
          damage: 15,
          range: 300,
          speed: 500,
          fireRate: 1000, // 1秒に1発
          bulletCount: 5, // 5発同時発射
          spread: Math.PI / 8 // 約22.5度の広がり
        };
        
      case 'machinegun':
        return {
          damage: 5,
          range: 400,
          speed: 600,
          fireRate: 200, // 0.2秒に1発
          bulletCount: 1,
          spread: 0
        };
        
      case 'sniper':
        return {
          damage: 40,
          range: 800,
          speed: 1000,
          fireRate: 1500, // 1.5秒に1発
          bulletCount: 1,
          spread: 0
        };
        
      case 'thrower':
        return {
          damage: 20,
          range: 350,
          speed: 300,
          fireRate: 800, // 0.8秒に1発
          bulletCount: 3, // 3発同時発射
          spread: Math.PI / 12 // 約15度の広がり
        };
        
      default: // デフォルト武器
        return {
          damage: 10,
          range: 400,
          speed: 500,
          fireRate: 500, // 0.5秒に1発
          bulletCount: 1,
          spread: 0
        };
    }
  }
  
  fire(angle: number): void {
    const time = this.scene.time.now;
    
    // 発射間隔をチェック
    if (time < this.lastFired + this.stats.fireRate) {
      return;
    }
    
    this.lastFired = time;
    
    // 発射位置（プレイヤーの位置から少し前方）
    const offsetX = Math.cos(angle) * 20;
    const offsetY = Math.sin(angle) * 20;
    const startX = this.owner.x + offsetX;
    const startY = this.owner.y + offsetY;
    
    // 発射音
    this.scene.sound.play('shoot');
    
    // 複数発射の場合はスプレッド（広がり）を計算
    if (this.stats.bulletCount > 1) {
      // スプレッドの計算（中心から両側に広がるように）
      const totalSpread = this.stats.spread;
      const spreadStep = totalSpread / (this.stats.bulletCount - 1);
      const startAngle = angle - totalSpread / 2;
      
      for (let i = 0; i < this.stats.bulletCount; i++) {
        const bulletAngle = startAngle + spreadStep * i;
        this.fireBullet(startX, startY, bulletAngle);
      }
    } else {
      // 単発発射
      this.fireBullet(startX, startY, angle);
    }
  }
  
  private fireBullet(startX: number, startY: number, angle: number): void {
    // 弾を取得（非アクティブなものを再利用するか、新しく作成）
    const bullet = this.bullets.get(startX, startY) as Bullet;
    if (bullet) {
      bullet.fire(
        startX, 
        startY, 
        angle, 
        this.stats.speed, 
        this.stats.damage, 
        this.stats.range
      );
    }
  }
  
  getBullets(): Phaser.Physics.Arcade.Group {
    return this.bullets;
  }
}
