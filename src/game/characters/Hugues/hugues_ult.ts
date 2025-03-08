import Phaser from 'phaser';
import { Character } from '../../entities/Character';
import { GameConfig } from '../../config';

export class HuguesUltimate {
  private scene: Phaser.Scene;
  private owner: Character;
  private wallDuration: number = 10000; // 壁の持続時間 (10秒)
  private wallCount: number = 8; // 生成する壁の数
  private wallRadius: number = 120; // 壁を生成する半径
  
  constructor(scene: Phaser.Scene, owner: Character) {
    this.scene = scene;
    this.owner = owner;
  }
  
  execute(angle: number, force: number): void {
    // 周囲に壁を生成
    const walls = this.scene.physics.add.staticGroup();
    
    // 円形に配置
    for (let i = 0; i < this.wallCount; i++) {
      const wallAngle = (i / this.wallCount) * Math.PI * 2;
      const wallX = this.owner.x + Math.cos(wallAngle) * this.wallRadius;
      const wallY = this.owner.y + Math.sin(wallAngle) * this.wallRadius;
      
      // 壁を生成
      const wall = walls.create(wallX, wallY, 'wall').setScale(GameConfig.BLOCK_SIZE / 64);
      wall.setTint(0x00ffff); // 壁の色を変える
      wall.alpha = 0.8; // 少し透明に
      
      // 壁のサイズ調整
      wall.body.setSize(wall.width * 0.9, wall.height * 0.9);
    }
    
    // 効果音
    this.scene.sound.play('explosion', { volume: 0.3 });
    
    // エフェクト
    const particles = this.scene.add.particles(this.owner.x, this.owner.y, 'explosion', {
      scale: { start: 0.2, end: 0 },
      speed: { min: 50, max: 100 },
      quantity: 20,
      lifespan: 1000,
      blendMode: 'ADD',
      tint: 0x00ffff
    });
    
    // 一定時間後に壁を消す
    this.scene.time.delayedCall(this.wallDuration, () => {
      walls.clear(true, true); // グループと子要素を削除
      
      // 消滅エフェクト
      const fadeOutParticles = this.scene.add.particles(this.owner.x, this.owner.y, 'explosion', {
        scale: { start: 0.1, end: 0 },
        speed: { min: 30, max: 70 },
        quantity: 10,
        lifespan: 800,
        blendMode: 'ADD',
        tint: 0x00ffff
      });
      
      this.scene.time.delayedCall(800, () => {
        fadeOutParticles.destroy();
      });
    });
    
    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });
    
    // キャラクターとの衝突
    this.scene.physics.add.collider(walls, this.scene.children.getAll().filter(obj => 
      obj instanceof Character
    ));
  }
}
