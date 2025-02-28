import Phaser from 'phaser';
import { BaseCharacter } from '../BaseCharacter';
import { Player, SkillType } from '../../objects/Player';
import { WeaponType } from '../../utils/WeaponTypes';
import { GameConfig } from '../../config/GameConfig';

/**
 * ユーグ（騎士）のキャラクタークラス
 */
export class Knight extends BaseCharacter {
  private gatlingCooldown: boolean = false;
  
  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player);
  }
  
  getName(): string {
    return 'ユーグ';
  }
  
  getSkillName(): string {
    return 'バレット・ストーム';
  }
  
  getUltimateName(): string {
    return 'フォートレス・ウォール';
  }
  
  getSkillDescription(): string {
    return 'ガトリング乱射 - 範囲攻撃、リーチ短め';
  }
  
  getUltimateDescription(): string {
    return 'バリケード：周囲に壁を生成';
  }
  
  getWeaponType(): WeaponType {
    return WeaponType.PISTOL;
  }
  
  getSkillType(): SkillType {
    return SkillType.GATLING;
  }
  
  initializeStats(): void {
    this.player.setMaxHealth(100);
    this.player.setSpeed(100);
    this.player.setWeapon(this.getWeaponType());
    this.player.setSpecialAbility(this.getSkillType());
    this.player.setTint(0xffffff);
  }
  
  useSkill(targetX: number, targetY: number): void {
    if (this.gatlingCooldown) return;
    
    const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    const bulletCount = 15;
    const spreadAngle = Math.PI / 12; // 15度
    const delay = 50; // 弾の間隔（ミリ秒）
    const damage = 5;
    
    // ガトリングのエフェクト
    this.scene.add.particles(this.player.x, this.player.y, 'default', {
      speed: { min: 20, max: 50 },
      scale: { start: 0.3, end: 0 },
      blendMode: 'ADD',
      tint: 0xffff00,
      lifespan: 300,
      quantity: 5
    });
    
    // 複数の弾を発射
    for (let i = 0; i < bulletCount; i++) {
      this.scene.time.delayedCall(i * delay, () => {
        // 乱射のためランダムな角度のずれを加える
        const randomSpread = (Math.random() - 0.5) * spreadAngle;
        const bulletAngle = angle + randomSpread;
        
        const bullet = this.scene.physics.add.image(
          this.player.x, this.player.y, 'default'
        ).setDisplaySize(5, 5)
         .setTint(0xffff00)
         .setDepth(3);
        
        // 弾の速度
        const speed = 300;
        bullet.setVelocity(
          Math.cos(bulletAngle) * speed,
          Math.sin(bulletAngle) * speed
        );
        
        // 弾の寿命
        this.scene.time.delayedCall(500, () => {
          bullet.destroy();
        });
        
        // 敵との衝突判定
        const enemies = (this.scene as any).enemyBots;
        if (enemies) {
          enemies.forEach((enemy: any) => {
            if (enemy && enemy.bot) {
              this.scene.physics.add.overlap(
                bullet, 
                enemy.bot, 
                () => {
                  enemy.bot.takeDamage(damage);
                  bullet.destroy();
                }
              );
            }
          });
        }
      });
    }
    
    // 効果音
    try {
      this.scene.sound.play('gatling');
    } catch (e) {}
    
    // 使用後のクールダウン
    this.gatlingCooldown = true;
    this.scene.time.delayedCall(GameConfig.SKILL_COOLDOWN, () => {
      this.gatlingCooldown = false;
    });
  }
  
  useUltimate(): void {
    // フォートレス・ウォール: 周囲に壁を生成する
    const wallCount = 4;
    const radius = 80;
    const walls: Array<Phaser.GameObjects.Rectangle> = [];
    const duration = 10000; // 10秒間持続
    
    for (let i = 0; i < wallCount; i++) {
      const angle = (Math.PI * 2 / wallCount) * i;
      const x = this.player.x + Math.cos(angle) * radius;
      const y = this.player.y + Math.sin(angle) * radius;
      
      const wall = this.scene.add.rectangle(x, y, 30, 30, 0xaaaaaa)
        .setStrokeStyle(2, 0xffffff)
        .setDepth(2);
      walls.push(wall);
      
      // 物理ボディを追加
      this.scene.physics.add.existing(wall, true);
      const body = (wall.body as Phaser.Physics.Arcade.Body);
      body.setImmovable(true);
    }
    
    // 効果音
    try {
      this.scene.sound.play('wall_create');
    } catch (e) {}
    
    // アルティメット終了時に壁を削除
    this.scene.time.delayedCall(duration, () => {
      walls.forEach(wall => wall.destroy());
    });
  }
}
