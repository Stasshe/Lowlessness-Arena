import Phaser from 'phaser';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  private damage: number = 0;
  private range: number = 0;
  private startX: number = 0;
  private startY: number = 0;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bullet');
  }
  
  fire(x: number, y: number, angle: number, speed: number, damage: number, range: number): void {
    this.damage = damage;
    this.range = range;
    this.startX = x;
    this.startY = y;
    
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(x, y);
    
    // 物理演算を設定
    this.setRotation(angle);
    
    // body が null でないことを確認
    if (this.body) {
      this.scene.physics.velocityFromRotation(angle, speed, this.body.velocity);
    }
    
    // 弾のサイズを設定
    this.setDisplaySize(10, 6);
    
    // 弾のエフェクト
    this.setTint(0xffaa00);
  }
  
  update(time: number, delta: number): void {
    // 射程範囲外に出たら消滅
    const distance = Phaser.Math.Distance.Between(
      this.startX, this.startY,
      this.x, this.y
    );
    
    if (distance > this.range) {
      this.disable();
    }
  }
  
  onHit(): void {
    // ヒットエフェクト
    this.scene.add.circle(this.x, this.y, 5, 0xffaa00, 0.8)
      .setDepth(10)
      .setAlpha(0.8);
    
    // パーティクルエフェクト
    const particles = this.scene.add.particles(this.x, this.y, 'bullet', {
      speed: 50,
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 200,
      quantity: 5
    });
    
    // パーティクルを少し出した後に削除
    this.scene.time.delayedCall(200, () => {
      particles.destroy();
    });
    
    this.disable();
  }
  
  disable(): void {
    this.setActive(false);
    this.setVisible(false);
    // body が null でないことを確認
    if (this.body) {
      this.body.stop();
    }
  }
  
  getDamage(): number {
    return this.damage;
  }
}
