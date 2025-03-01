import Phaser from 'phaser';
import { Player } from './Player';
import { Bullet, BulletType } from './Bullet';  // BulletTypeをインポート
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
  //private specialProperty: string | undefined;
  
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
    //this.specialProperty = definition.special;
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
    
    // 武器タイプがメレーの場合は特殊処理
    if (this.type === WeaponType.MELEE) {
      this.meleeAttack(angle);
      return;
    }
    
    // 通常の発射処理
    const bulletType = this.getBulletTypeFromWeapon();
    
    // 武器タイプに応じた弾数
    const numberOfBullets = this.bulletsPerShot || 1;
    
    // 拡散角度の計算
    const spreadAngle = this.spread || 0;
    
    // 弾の発射位置を調整（プレイヤーの前方に配置）
    const offsetDistance = 30; // プレイヤーの半径より大きい値
    const startX = this.owner.x + Math.cos(angle) * offsetDistance;
    const startY = this.owner.y + Math.sin(angle) * offsetDistance;
    
    for (let i = 0; i < numberOfBullets; i++) {
      // 弾を取得 (弾のプールから再利用または新規作成)
      const bullet = this.bullets.get(startX, startY) as Bullet;
      if (!bullet) continue; // 弾が取得できなかった場合はスキップ
      
      // 弾を有効化して初期化（位置をプレイヤーの前方に設定）
      bullet.enableBody(true, startX, startY, true, true);
      
      // 弾の所有者を設定（衝突判定で使用）
      bullet.setOwner(this.owner);
      
      // 複数弾の場合、角度を調整
      let bulletAngle = angle;
      if (numberOfBullets > 1 && spreadAngle > 0) {
        // 均等に分散
        const angleStep = spreadAngle * 2 / (numberOfBullets - 1);
        bulletAngle = angle - spreadAngle + angleStep * i;
        
        // さらにランダム性を少し加える（ショットガン等のため）
        if (this.type === WeaponType.SHOTGUN) {
          bulletAngle += (Math.random() - 0.5) * 0.1;
        }
      }
      
      // 爆発物や貫通弾などの特殊設定
      if (bulletType === 'explosive') {
        bullet.setExplosive(true, 40);
      } else if (this.type === WeaponType.SNIPER) {
        bullet.setPenetration(true);
      }
      
      // 物理系の弾は重力影響を設定
      const affectedByGravity = this.type === WeaponType.THROWER || this.type === WeaponType.SLING;
      
      // 弾の発射
      bullet.fire(
        startX, 
        startY, 
        bulletAngle, 
        this.bulletSpeed, 
        this.bulletDamage,
        this.bulletRange * this.rangeMultiplier,
        bulletType,
        affectedByGravity
      );
      
      // 発射元プレイヤーとの衝突を無効化
      // エラーになっている部分を修正
      if (bullet.body) {
        // 以下の行を修正
        // this.scene.physics.world.disable([bullet.body]);
        
        // 代わりに、一時的に物理ボディを無効化し、すぐに再有効化する
        bullet.disableBody(true, false);
        bullet.enableBody(true, startX, startY, true, true);
        
        // または、発射元プレイヤーとの衝突を回避するため、
        // Bulletクラスに弾の所有者を設定してBullet側で判定する
        bullet.setOwner(this.owner);
      }
    }
    
    // 発射音を再生
    try {
      let soundKey = 'weapon_fire';
      
      switch (this.type) {
        case WeaponType.SHOTGUN:
          soundKey = 'shotgun_fire';
          break;
        case WeaponType.SNIPER:
          soundKey = 'sniper_fire';
          break;
        case WeaponType.THROWER:
          soundKey = 'thrower_fire';
          break;
        case WeaponType.BOMB:
          soundKey = 'bomb_fire';
          break;
        case WeaponType.MACHINEGUN:
          soundKey = 'machinegun_fire';
          break;
        case WeaponType.SLING:
          soundKey = 'sling_fire';
          break;
      }
      
      this.scene.sound.play(soundKey, { volume: 0.6 });
    } catch (e) {
      console.warn('発射音の再生に失敗:', e);
    }
    
    // 発射エフェクト
    this.createMuzzleFlash(angle);
  }

  /**
   * 武器タイプに応じた弾の種類を取得
   */
  private getBulletTypeFromWeapon(): BulletType {  // 型をBulletTypeに変更
    switch (this.type) {
      case WeaponType.SNIPER:
        return 'sniper';
      case WeaponType.THROWER:
      case WeaponType.BOMB:
        return 'explosive';
      case WeaponType.SHOTGUN:
        return 'normal';
      default:
        return 'normal';
    }
  }
  
  /**
   * 銃口の発光エフェクトを作成
   */
  private createMuzzleFlash(angle: number): void {
    // 発射位置（プレイヤーの少し前方）
    const offsetDistance = 20;
    const x = this.owner.x + Math.cos(angle) * offsetDistance;
    const y = this.owner.y + Math.sin(angle) * offsetDistance;
    
    try {
      // フラッシュの色を武器タイプによって変える
      let color = 0xffff00; // デフォルトは黄色
      
      if (this.type === WeaponType.SNIPER) {
        color = 0xff6600; // スナイパーはオレンジ
      } else if (this.type === WeaponType.SHOTGUN) {
        color = 0xff0000; // ショットガンは赤
      } else if (this.type === WeaponType.THROWER || this.type === WeaponType.BOMB) {
        color = 0xff00ff; // 爆発物は紫
      }
      
      // パーティクルエフェクト
      const particles = this.scene.add.particles(x, y, 'default', {
        speed: { min: 50, max: 150 },
        scale: { start: 0.2, end: 0 },
        lifespan: 200,
        blendMode: 'ADD',
        tint: color
      });
      
      particles.explode(10);
      
      // 短時間で消す
      this.scene.time.delayedCall(200, () => {
        particles.destroy();
      });
    } catch (e) {
      console.warn('マズルフラッシュの作成に失敗:', e);
    }
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
