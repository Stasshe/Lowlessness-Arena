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
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bullet'); 
    
    this.setActive(false);
    this.setVisible(false);
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
  getDamage(): number {
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
  update(_time: number, _delta: number): void {
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
  }
  
  /**
   * 弾が何かに当たった時の処理
   */
  onHit(): void {
    // 爆発弾の場合は爆発エフェクト
    if (this.bulletType === 'explosive') {
      this.explode();
    }
    
    // 弾を非アクティブに
    this.setActive(false);
    this.setVisible(false);
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
  }
}
