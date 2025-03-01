import Phaser from 'phaser';

/**
 * 弾の種類を表す型
 */
export type BulletType = 'normal' | 'explosive' | 'sniper' | 'parabolic';

/**
 * 武器の弾を表すクラス
 */
export class Bullet extends Phaser.Physics.Arcade.Sprite {
  // protected変数に変更
  protected bulletType: BulletType = 'normal';
  protected bulletSpeed: number = 0;
  protected bulletDamage: number = 0;
  protected maxDistance: number = 0;
  protected initialX: number = 0;
  protected initialY: number = 0;
  
  private lifespan: number = 2000; // 弾の寿命（ミリ秒）
  private damage: number = 20;     // 基本ダメージ
  private spawnTime: number = 0;   // 生成時刻
  private isArcProjectile: boolean = false; // 弧を描く投射物かどうか
  private arcHeight: number = 0;   // 弧の高さ
  private startX: number = 0;      // 開始位置X
  private startY: number = 0;      // 開始位置Y
  private targetX: number = 0;     // 目標位置X
  private targetY: number = 0;     // 目標位置Y
  private _owner: any;             // 所有者（プレイヤーまたは敵）
  private isExplosive: boolean = false; // 爆発する弾かどうか
  private explosionRadius: number = 0;  // 爆発半径
  private penetration: boolean = false; // 貫通するかどうか

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bullet'); 
    
    this.setActive(false);
    this.setVisible(false);
    this.spawnTime = scene.time.now;
  }
  
  /**
   * 弾を発射する
   */
  fire(x: number, y: number, angle: number, speed: number, damage: number, maxDistance: number): void {
    this.setActive(true);
    this.setVisible(true);
    
    // 放物線弾の場合は別の設定
    if (this.bulletType === 'parabolic') { // bulletTypeに修正
      this.fireParabolic(x, y, angle, speed, damage, maxDistance);
      return;
    }
    
    // 位置と回転を設定
    this.setPosition(x, y);
    this.setRotation(angle);
    
    // 初期位置を記録（飛距離計算用）
    this.initialX = x;
    this.initialY = y;
    
    // 弾の外観設定
    if (this.bulletType === 'normal') { // bulletTypeに修正
      this.setScale(0.5, 0.3);
    } else if (this.bulletType === 'explosive') { // bulletTypeに修正
      this.setScale(0.8);
      this.setTint(0xff6600);
    } else if (this.bulletType === 'sniper') { // bulletTypeに修正
      this.setScale(0.7, 0.2);
      this.setTint(0xff0000);
    }
    
    // 物理パラメータを設定
    this.bulletSpeed = speed;
    this.bulletDamage = damage;
    this.maxDistance = maxDistance;
    
    // 速度ベクトルを設定
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    this.setVelocity(vx, vy);
  }
  
  /**
   * 放物線を描く弾の発射
   */
  private fireParabolic(x: number, y: number, angle: number, speed: number, damage: number, maxDistance: number): void {
    // 基本設定
    this.setPosition(x, y);
    this.setRotation(angle);
    this.initialX = x;
    this.initialY = y;
    
    // パラメータの設定
    this.bulletSpeed = speed;
    this.bulletDamage = damage;
    this.maxDistance = maxDistance;
    
    // 放物線の弾の外観
    this.setScale(0.4);
    this.setTint(0x88ff88);
    
    // 速度ベクトルを設定
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    this.setVelocity(vx, vy);
    
    // 重力の影響を受ける
    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).setGravityY(300);
    }
  }
  
  /**
   * 弾の種類を設定
   */
  setBulletType(type: BulletType): void {
    this.bulletType = type;
  }
  
  /**
   * 弾のダメージ値を取得
   */
  getBulletDamage(): number {
    return this.bulletDamage;
  }
  /**
   * 弾の種類を取得
   */
  getBulletType(): BulletType {
    return this.bulletType;
  }
  
  /**
   * 更新処理
   */
  update(time: number, delta: number): void {
    // 飛距離が最大値を超えたら破棄
    const distanceTraveled = Phaser.Math.Distance.Between(
      this.initialX, this.initialY, this.x, this.y
    );
    
    if (distanceTraveled >= this.maxDistance) {
      // 爆発弾の場合は爆発エフェクト
      if (this.bulletType === 'explosive') {
        this.explode();
      }
      
      this.setActive(false);
      this.setVisible(false);
    }

    // 寿命が過ぎたら非アクティブに
    if (time > this.spawnTime + this.lifespan) {
      this.deactivate();
      return;
    }

    // 弧を描く投射物の場合は位置を計算
    if (this.isArcProjectile) {
      const progress = (time - this.spawnTime) / this.lifespan;
      
      if (progress >= 1) {
        this.deactivate();
        return;
      }
      
      // 線形補間で位置を計算
      const x = this.startX + (this.targetX - this.startX) * progress;
      const y = this.startY + (this.targetY - this.startY) * progress;
      
      // 放物線の高さは sin(π*progress) で計算
      const heightOffset = Math.sin(Math.PI * progress) * this.arcHeight;
      
      this.setPosition(x, y - heightOffset);
      
      // 角度も計算（次のフレームの位置から方向を算出）
      const nextProgress = Math.min(1, progress + 0.01);
      const nextX = this.startX + (this.targetX - this.startX) * nextProgress;
      const nextY = this.startY + (this.targetY - this.startY) * nextProgress;
      const nextHeightOffset = Math.sin(Math.PI * nextProgress) * this.arcHeight;
      
      const angle = Phaser.Math.Angle.Between(
        x, y - heightOffset,
        nextX, nextY - nextHeightOffset
      );
      
      this.setRotation(angle);
    }
  }
  
  /**
   * 弾が何かに当たった時の処理
   */
  onHit(target: any): void {
    // 爆発弾の場合は爆発エフェクト
    if (this.bulletType === 'explosive') {
      this.explode();
    }
    
    // 弾を非アクティブに
    this.setActive(false);
    this.setVisible(false);

    // 貫通でなければ非アクティブに
    if (!this.penetration) {
      this.deactivate();
    }
    
    // 爆発する弾なら爆発処理
    if (this.isExplosive) {
      this.explode();
    }
  }
  
  /**
   * 爆発弾の爆発処理
   */
  private explode(): void {
    // 爆発エフェクト
    const particles = this.scene.add.particles(this.x, this.y, 'default', {
      speed: 100,
      scale: { start: 0.4, end: 0 },
      blendMode: 'ADD',
      tint: 0xff7700,
      lifespan: 500,
      quantity: 20
    });
    
    // エフェクトを時間経過で消す
    this.scene.time.delayedCall(500, () => {
      particles.destroy();
    });
    
    // 爆発音
    try {
      this.scene.sound.play('small_explosion');
    } catch (e) {}

    // 爆発エフェクト
    const explosion = this.scene.add.circle(this.x, this.y, this.explosionRadius, 0xff6600, 0.5)
      .setStrokeStyle(4, 0xff8800, 1);
    
    
    // 爆発範囲内の敵にダメージを与える処理
    // （実際のダメージ適用は呼び出し側で処理）
    
    // エフェクトを一定時間後に消す
    this.scene.time.delayedCall(800, () => {
      explosion.destroy();
      particles.destroy();
    });
    
    // 爆発音
    try {
      this.scene.sound.play('explosion');
    } catch (e) {}
    
    // 弾は消滅
    this.deactivate();
  }

  /**
   * 初期設定
   * @param x 初期X座標
   * @param y 初期Y座標
   * @param angle 発射角度（ラジアン）
   * @param speed 速度
   * @param damage ダメージ量
   * @param range 射程距離
   * @param owner 所有者
   */
  init(x: number, y: number, angle: number, speed: number, damage: number, range: number, owner: any): void {
    this.setActive(true);
    this.setVisible(true);
    this.enableBody(true, x, y, true, true);
    
    this.spawnTime = this.scene.time.now;
    this.damage = damage;
    this._owner = owner;
    this.lifespan = (range / speed) * 1000; // 射程/速度で寿命を計算
    
    // 速度とサイズの設定
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.setRotation(angle);
    this.setSize(8, 8);
    this.setDisplaySize(8, 8);
    
    // 発光エフェクト
    this.setTint(0xffff99);
  }
  
  /**
   * 弧を描く投射物として初期化
   */
  initArc(x: number, y: number, targetX: number, targetY: number, height: number, duration: number, damage: number, owner: any): void {
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(x, y);
    
    this.isArcProjectile = true;
    this.startX = x;
    this.startY = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.arcHeight = height;
    this.damage = damage;
    this._owner = owner;
    this.lifespan = duration;
    this.spawnTime = this.scene.time.now;
    
    // 弧を描くオブジェクトの場合は物理ボディを無効化
    this.disableBody(true, false);
  }
  
  /**
   * 爆発設定
   * @param isExplosive 爆発するかどうか
   * @param radius 爆発半径
   */
  setExplosive(isExplosive: boolean, radius: number = 50): void {
    this.isExplosive = isExplosive;
    this.explosionRadius = radius;
  }
  
  /**
   * 貫通設定
   * @param penetrate 貫通するかどうか
   */
  setPenetration(penetrate: boolean): void {
    this.penetration = penetrate;
  }

  /**
   * 弾を非アクティブ化
   */
  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.disableBody(true, true);
  }
  
  /**
   * ダメージ量を取得
   */
  getDamage(): number {
    return this.damage;
  }
  
  /**
   * 所有者を取得
   */
  get owner(): any {
    return this._owner;
  }
  
  /**
   * 爆発情報を取得
   */
  getExplosiveInfo(): { isExplosive: boolean, radius: number } {
    return {
      isExplosive: this.isExplosive,
      radius: this.explosionRadius
    };
  }
  
  /**
   * 貫通情報を取得
   */
  isPenetrating(): boolean {
    return this.penetration;
  }
}
