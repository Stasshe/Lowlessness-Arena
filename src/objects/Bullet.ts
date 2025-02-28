import Phaser from 'phaser';

/**
 * 弾丸クラス - 武器から発射される弾のロジックを管理
 */
export class Bullet extends Phaser.Physics.Arcade.Sprite {
  private damage: number = 10;
  private range: number = 400;
  private startX: number = 0;
  private startY: number = 0;
  private isExploding: boolean = false;
  private bulletType: string = 'normal';
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bullet');
    
    // 物理ボディの設定
    scene.physics.add.existing(this);
    this.body.setCircle(4);
    
    // 見た目の設定
    this.setScale(0.5);
    
    // パーティクルエフェクトを追加
    this.createTrail();
  }
  
  /**
   * 弾を発射する
   */
  fire(x: number, y: number, angle: number, speed: number, damage: number, range: number): void {
    this.startX = x;
    this.startY = y;
    this.damage = damage;
    this.range = range;
    
    // 位置を設定
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    
    // 速度ベクトルを設定
    this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle), speed, this.body.velocity);
    this.setRotation(angle);
    
    // 軌跡のパーティクルエフェクトを有効化
    this.createTrail();
  }
  
  /**
   * 弾丸の軌跡エフェクトを作成
   */
  private createTrail(): void {
    // パーティクルエミッターがシーンにあるか確認してからエフェクト作成
    if (this.scene && this.active) {
      this.scene.add.particles(this.x, this.y, 'default', {
        follow: this,
        scale: { start: 0.2, end: 0 },
        alpha: { start: 0.5, end: 0 },
        speed: 0,
        lifespan: 300,
        frequency: 30,
        quantity: 1
      });
    }
  }
  
  /**
   * 弾丸のヒット処理
   */
  onHit(): void {
    if (this.active && !this.isExploding) {
      this.isExploding = true;
      
      // 通常弾はシンプルに消える
      if (this.bulletType === 'normal') {
        this.createHitEffect();
        this.disableAndHide();
      } 
      // 爆発弾は爆発エフェクトを表示
      else if (this.bulletType === 'explosive') {
        this.createExplosionEffect();
      }
    }
  }
  
  /**
   * 弾が当たった時の小さなエフェクト
   */
  private createHitEffect(): void {
    if (this.active && this.scene) {
      // 小さな衝撃波パーティクル
      this.scene.add.particles(this.x, this.y, 'default', {
        speed: { min: 30, max: 80 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 1, end: 0 },
        blendMode: 'ADD',
        lifespan: 300,
        quantity: 6
      });
    }
  }
  
  /**
   * 爆発弾の爆発エフェクト
   */
  private createExplosionEffect(): void {
    if (this.active && this.scene) {
      // 爆発の光球
      const explosion = this.scene.add.circle(this.x, this.y, 40, 0xff6600, 0.7);
      
      // エフェクトのアニメーション
      this.scene.tweens.add({
        targets: explosion,
        scale: 1.5,
        alpha: 0,
        duration: 500,
        onComplete: () => explosion.destroy()
      });
      
      // 爆発パーティクル
      this.scene.add.particles(this.x, this.y, 'default', {
        speed: { min: 50, max: 150 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.8, end: 0 },
        blendMode: 'ADD',
        tint: 0xff6600,
        lifespan: 500,
        quantity: 20
      });
      
      // カメラシェイク
      this.scene.cameras.main.shake(200, 0.005);
      
      // 弾を非表示
      this.disableAndHide();
    }
  }
  
  /**
   * 弾を無効化して非表示にする
   */
  private disableAndHide(): void {
    this.setActive(false);
    this.setVisible(false);
    
    // bodyが存在する場合のみvelocityを設定
    if (this.body) {
      // bodyが存在する場合は速度を0に
      this.setVelocity(0, 0);
    }
    this.isExploding = false;
  }
  
  /**
   * 毎フレームの更新処理
   */
  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    
    // 射程範囲をチェック
    if (this.active) {
      const distance = Phaser.Math.Distance.Between(
        this.startX, this.startY, this.x, this.y);
        
      if (distance > this.range) {
        this.disableAndHide();
      }
    }
  }
  
  /**
   * 弾のダメージ値を取得
   */
  getDamage(): number {
    return this.damage;
  }
  
  /**
   * 弾の種類を設定（normal, explosive など）
   */
  setBulletType(type: string): void {
    this.bulletType = type;
    
    // 種類に応じて見た目を変更
    switch (type) {
      case 'explosive':
        this.setTint(0xff6600);
        break;
      case 'sniper':
        this.setTint(0x0000ff);
        break;
      default:
        this.clearTint();
        break;
    }
  }
}
