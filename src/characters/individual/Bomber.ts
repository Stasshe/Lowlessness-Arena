import Phaser from 'phaser';
import { Player, SkillType } from '../../objects/Player';
import { BaseCharacter } from './../BaseCharacter';
import { WeaponType } from '../../utils/WeaponTypes';
import { GameConfig } from '../../config/GameConfig';
import { ProjectileCalculator } from '../../utils/ProjectileCalculator';
import { createSafeTimeline } from '../../utils/TweenUtils';

/**
 * マルグリット（爆弾魔）のキャラクタークラス
 */
export class Bomber extends BaseCharacter {
  private projectileCalculator: ProjectileCalculator;
  
  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player);
    this.projectileCalculator = new ProjectileCalculator();
  }
  
  getName(): string {
    return 'マルグリット';
  }
  
  getSkillName(): string {
    return 'ボム・スプレイ';
  }
  
  getUltimateName(): string {
    return 'デトネーション・ブレイズ';
  }
  
  getSkillDescription(): string {
    return '爆弾を放物線を描いて投げる';
  }
  
  getUltimateDescription(): string {
    return '中範囲の爆発攻撃';
  }
  
  getWeaponType(): WeaponType {
    return WeaponType.SLING;
  }
  
  getSkillType(): SkillType {
    return SkillType.BOMB;
  }
  
  initializeStats(): void {
    this.player.setMaxHealth(100);
    this.player.setSpeed(90);
    this.player.setWeapon(this.getWeaponType());
    this.player.setSpecialAbility(this.getSkillType());
    this.player.setTint(0xff00ff);
  }
  
  // 通常攻撃は投石（オーバーライド）
  useAttack(targetX: number, targetY: number): boolean {
    const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
    
    // 投石の放物線パラメータ
    const airTime = 1.0;
    const power = 300 + distance * 0.8;
    const stone = this.scene.physics.add.sprite(this.player.x, this.player.y, 'default')
      .setDisplaySize(8, 8)
      .setTint(0xcccccc)
      .setDepth(4);
    
    // 放物線を計算してTweenで動かす
    const points = this.projectileCalculator.calculateParabolicTrajectory(
      this.player.x, this.player.y, angle, power, 980, 15, airTime
    );
    
    // Tweenのタイムライン - TweenUtilsを使用
    const timeline = createSafeTimeline(this.scene, airTime * 1000);
    
    // 各点をタイムライン上で結ぶ
    for (let j = 1; j < points.length; j++) {
      const prevPoint = points[j - 1];
      const point = points[j];
      
      // 2点間の角度を計算（石の向きを調整）
      const pointAngle = Math.atan2(
        point.y - prevPoint.y, 
        point.x - prevPoint.x
      );
      
      timeline.add({
        targets: stone,
        x: point.x,
        y: point.y,
        rotation: pointAngle,
        duration: (airTime / points.length) * 1000,
        ease: 'Linear'
      });
    }
    
    // 着弾時のコールバック
    timeline.setCallback('onComplete', () => {
      // 着弾エフェクト
      this.scene.add.particles(stone.x, stone.y, 'default', {
        speed: 30,
        scale: { start: 0.1, end: 0 },
        blendMode: 'ADD',
        tint: 0xcccccc,
        lifespan: 200,
        quantity: 5
      });
      
      // 着弾地点の敵にダメージ
      const enemies = (this.scene as any).enemyBots;
      if (enemies) {
        enemies.forEach((enemy: any) => {
          if (enemy && enemy.bot) {
            const dist = Phaser.Math.Distance.Between(stone.x, stone.y, enemy.bot.x, enemy.bot.y);
            if (dist < GameConfig.CHARACTER_RADIUS * 1.2) {
              enemy.bot.takeDamage(10);
            }
          }
        });
      }
      
      stone.destroy();
    });
    
    // アニメーション開始
    timeline.play();
    
    // 効果音
    try {
      this.scene.sound.play('sling');
    } catch (e) {}
    
    return true; // 特殊な攻撃を実行したので通常の攻撃は行わない
  }
  
  useSkill(targetX: number, targetY: number): void {
    // ボム・スプレイ: 放物線を描く爆弾投げ
    const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
    
    // 爆弾の放物線パラメータ
    const airTime = 1.5;
    const power = Math.min(300 + distance * 0.8, 500); // 距離に応じた発射力（上限あり）
    const bomb = this.scene.physics.add.sprite(this.player.x, this.player.y, 'default')
      .setDisplaySize(15, 15)
      .setTint(0xff6600)
      .setDepth(4);
    
    // 放物線を計算してTweenで動かす
    const points = this.projectileCalculator.calculateParabolicTrajectory(
      this.player.x, this.player.y, angle, power, 980, 15, airTime
    );
    
    // Tweenのタイムライン - TweenUtilsを使用
    const timeline = createSafeTimeline(this.scene, airTime * 1000);
    
    // 各点をタイムライン上で結ぶ
    for (let j = 1; j < points.length; j++) {
      //const prevPoint = points[j - 1];
      const point = points[j];
      
      timeline.add({
        targets: bomb,
        x: point.x,
        y: point.y,
        duration: (airTime / points.length) * 1000,
        ease: 'Linear'
      });
    }
    
    // 爆弾回転アニメーション
    this.scene.tweens.add({
      targets: bomb,
      rotation: Phaser.Math.PI2,
      duration: airTime * 1000,
      repeat: -1
    });
    
    // 着弾時のコールバック
    timeline.setCallback('onComplete', () => {
      // 爆発
      this.explode(bomb.x, bomb.y, 60, 80);
      bomb.destroy();
    });
    
    // アニメーション開始
    timeline.play();
    
    // 効果音
    try {
      this.scene.sound.play('bomb_throw');
    } catch (e) {}
  }
  
  private explode(x: number, y: number, damage: number, radius: number): void {
    // 爆発エフェクト
    this.scene.add.circle(x, y, radius, 0xff6600, 0.5)
      .setStrokeStyle(4, 0xff8800, 1);
    
    const particles = this.scene.add.particles(x, y, 'default', {
      speed: 200,
      scale: { start: 0.4, end: 0 },
      blendMode: 'ADD',
      tint: 0xff7700,
      lifespan: 800,
      quantity: 30
    });
    
    // エフェクトを一定時間後に消す
    this.scene.time.delayedCall(800, () => {
      particles.destroy();
    });
    
    // 爆発範囲内の敵にダメージを与える処理
    const enemies = (this.scene as any).enemyBots;
    if (enemies) {
      enemies.forEach((enemy: any) => {
        const bot = enemy.bot;
        if (bot) {
          const distance = Phaser.Math.Distance.Between(x, y, bot.x, bot.y);
          if (distance <= radius) {
            // 距離に応じたダメージ減衰
            const actualDamage = damage * (1 - distance / radius);
            bot.takeDamage(actualDamage);
          }
        }
      });
    }
    
    // 爆発音
    try {
      this.scene.sound.play('explosion');
    } catch (e) {}
  }
  
  useUltimate(): void {
    // デトネーション・ブレイズ: 中範囲の爆発攻撃
    const blastRadius = 300;
    
    // 爆発エフェクト - 1段階目
    this.scene.add.circle(this.player.x, this.player.y, blastRadius * 0.3, 0xff6600, 0.8)
      .setStrokeStyle(5, 0xffaa00, 1);
    
    // 爆発エフェクト - 2段階目
    this.scene.time.delayedCall(300, () => {
      this.scene.add.circle(this.player.x, this.player.y, blastRadius * 0.6, 0xff4400, 0.6)
        .setStrokeStyle(3, 0xff8800, 0.8);
    });
    
    // 爆発エフェクト - 3段階目（最大）
    this.scene.time.delayedCall(600, () => {
      this.scene.add.circle(this.player.x, this.player.y, blastRadius, 0xff2200, 0.4)
        .setStrokeStyle(2, 0xff5500, 0.6);
      
      // パーティクルエフェクト
      const particles = this.scene.add.particles(this.player.x, this.player.y, 'default', {
        speed: 300,
        scale: { start: 0.5, end: 0 },
        blendMode: 'ADD',
        tint: 0xff4400,
        lifespan: 1200,
        quantity: 50,
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, blastRadius),
          quantity: 50
        }
      });
      
      // 範囲内の敵にダメージ
      const enemies = (this.scene as any).enemyBots;
      if (enemies) {
        enemies.forEach((enemy: any) => {
          if (enemy && enemy.bot) {
            const bot = enemy.bot;
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, bot.x, bot.y);
            if (distance <= blastRadius) {
              // 距離に応じたダメージ減衰
              const baseDamage = 150; // アルティメットは大ダメージ
              const actualDamage = baseDamage * (1 - distance / blastRadius);
              bot.takeDamage(actualDamage);
            }
          }
        });
      }
      
      // エフェクト削除
      this.scene.time.delayedCall(1200, () => {
        particles.destroy();
      });
    });
    
    // 効果音
    try {
      this.scene.sound.play('massive_explosion');
    } catch (e) {}
  }
}
