import Phaser from 'phaser';
import { Player, SkillType } from '../../objects/Player';
import { BaseCharacter } from './../BaseCharacter';
import { WeaponType } from '../../utils/WeaponTypes';
import { GameConfig } from '../../config/GameConfig';
import { ProjectileCalculator } from '../../utils/ProjectileCalculator';
import { moveAlongPath } from '../../utils/TweenUtils';

/**
 * マルグリット（爆弾魔）のキャラクタークラス
 */
export class Bomber extends BaseCharacter {
  private projectileCalculator: ProjectileCalculator;
  
  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player);
    // プレイヤーの軌道計算オブジェクトを使用
    this.projectileCalculator = player.getProjectileCalculator();
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
  
  /**
   * 照準表示を更新するカスタム実装
   */
  updateAiming(
    targetX: number, 
    targetY: number, 
    joystickDistance?: number
  ): { targetPoint: Phaser.Math.Vector2, trajectoryPoints?: Phaser.Math.Vector2[] } {
    const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
    const joyDistance = joystickDistance || Math.min(distance, 100);
    
    // 照準表示用のクラスを取得
    const aiming = this.player.getWeaponAiming();
    
    // 爆弾投げの軌道を計算して表示
    const normalizedDistance = Math.min(joyDistance / 100, 1);
    const throwPower = 300 + normalizedDistance * 300; // 300-600の範囲で変化
    
    // クリアして新たに描画
    aiming.clear();
    
    // 爆弾投げの照準を表示（WeaponAiming.tsのTHROWERタイプと同様の実装）
    const result = aiming.showAiming(
      this.player.x, 
      this.player.y, 
      angle, 
      joyDistance,
      WeaponType.THROWER
    );
    
    return result;
  }
  
  /**
   * スキル用照準表示を更新するカスタム実装
   */
  updateSkillAiming(
    targetX: number, 
    targetY: number, 
    joystickDistance?: number
  ): { targetPoint: Phaser.Math.Vector2, area?: Phaser.Geom.Circle } {
    const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    const joyDistance = joystickDistance || 50;
    
    // 照準表示用のクラスを取得
    const aiming = this.player.getWeaponAiming();
    
    // ボムスプレイの照準を表示（WeaponAiming.tsのBOMBスキルタイプを使用）
    const result = aiming.showSkillAiming(
      this.player.x, 
      this.player.y, 
      angle, 
      joyDistance,
      'BOMB'
    );
    
    // 型キャストして互換性を確保
    return {
      targetPoint: result.targetPoint,
      area: result.area as Phaser.Geom.Circle
    };
  }
  
  // 通常攻撃は投石（オーバーライド）
  useAttack(targetX: number, targetY: number): boolean {
    const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
    
    // 投石の放物線パラメータ
    const airTime = 1.0;
    const throwPower = 300 + distance * 0.8;  // power変数名を変更して衝突を避ける
    const stone = this.scene.physics.add.sprite(this.player.x, this.player.y, 'default')
      .setDisplaySize(8, 8)
      .setTint(0xcccccc)
      .setDepth(4);
    
    // 放物線を計算
    const points = this.projectileCalculator.calculateParabolicTrajectory(
      this.player.x, this.player.y, angle, throwPower, 980, 15, airTime
    );
    
    // 点の配列を座標オブジェクトとして扱う
    const path = points.map(p => ({ x: p.x, y: p.y }));
    
    // 軌道に沿って移動
    moveAlongPath(this.scene, stone, path, airTime * 1000, () => {
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
    
    console.log("爆弾スキル使用: 目標=", targetX, targetY);
    /*
    // 二つの方法で爆弾を投げる - 実行時に安定した方を選択可能にする
    const useMethod: 1 | 2 = 2; // 1=物理投射、2=Tween移動
    
    if (useMethod === 1) {
      // 方法1: 物理システムを使う
      // 爆弾オブジェクト作成 - 物理挙動
      const bomb = this.createPhysicalBomb(angle, distance);
      
      // 爆発までの時間を設定
      this.scene.time.delayedCall(1500, () => {
        if (bomb && bomb.active) {
          this.explode(bomb.x, bomb.y, 60, 80);
          bomb.destroy();
        }
      });
      
    } else {
      // 方法2: Tweenを使った移動（より安定するかも）
      
    }*/
    this.throwBombWithTween(angle, distance);
    // 効果音
    try {
      this.scene.sound.play('bomb_throw');
    } catch (e) {}
  }
  
  // 物理エンジンを使った爆弾投擲
  private createPhysicalBomb(angle: number, distance: number): Phaser.GameObjects.Sprite {
    // 爆弾の放物線パラメータ調整
    const throwPower = Math.min(300 + distance * 0.8, 600);
    
    // プレイヤーの前方位置から発射
    const offsetX = this.player.x + Math.cos(angle) * 20;
    const offsetY = this.player.y + Math.sin(angle) * 20;
    
    // 爆弾オブジェクト作成
    const bomb = this.scene.physics.add.sprite(offsetX, offsetY, 'default')
      .setDisplaySize(15, 15)
      .setTint(0xff6600)
      .setDepth(4);
    
    // 物理ボディを有効化してパラメータ設定
    bomb.setActive(true).setVisible(true);
    if (bomb.body) {
      const body = bomb.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(true);
      body.setGravityY(800);  // 重力を強めに
      
      // 初速度設定
      const vx = Math.cos(angle) * throwPower;
      const vy = Math.sin(angle) * throwPower - 400; // 上向きの初速を大きく
      bomb.setVelocity(vx, vy);
      
      // 回転を追加
      bomb.setAngularVelocity(300);
      
      console.log(`爆弾発射 - 速度: vx=${vx}, vy=${vy}, 角度:${angle}, パワー:${throwPower}`);
      
      // 壁との衝突を設定
      const walls = (this.scene as any).gameManager?.getMap()?.getWalls();
      if (walls) {
        this.scene.physics.add.collider(bomb, walls);
      }
    }
    
    // 軌道の予測線をデバッグ表示
    this.showTrajectoryDebug(offsetX, offsetY, angle, throwPower);
    
    return bomb;
  }
  
  // Tweenを使った爆弾投擲（物理エンジンを使わない方法）
  private throwBombWithTween(angle: number, distance: number): void {
    // 投擲パラメータ
    const airTime = 1.5;
    const throwPower = Math.min(300 + distance * 0.8, 600);
    
    // 開始位置（プレイヤーの前方）
    const startX = this.player.x + Math.cos(angle) * 20;
    const startY = this.player.y + Math.sin(angle) * 20;
    
    // 爆弾オブジェクト
    const bomb = this.scene.add.sprite(startX, startY, 'default')
      .setDisplaySize(15, 15)
      .setTint(0xff6600)
      .setDepth(4);
    
    // 回転アニメーション
    this.scene.tweens.add({
      targets: bomb,
      rotation: Phaser.Math.PI2,
      duration: airTime * 1000,
      repeat: -1
    });
    
    // 放物線を計算
    const targetDistance = Math.min(distance, throwPower);
    const targetX = startX + Math.cos(angle) * targetDistance;
    const targetY = startY + Math.sin(angle) * targetDistance;
    
    // 中間点の高さ（放物線の頂点）
    const arcHeight = 150 + targetDistance * 0.2;
    
    // 放物線の軌道を設定
    const path = { t: 0, vec: new Phaser.Math.Vector2() };
    
    this.scene.tweens.add({
      targets: path,
      t: 1,
      ease: 'Linear',
      duration: airTime * 1000,
      onUpdate: () => {
        // 現在の位置を線形補間
        const x = startX + (targetX - startX) * path.t;
        // 放物線の高さを計算
        const y = startY + (targetY - startY) * path.t - 
                  Math.sin(path.t * Math.PI) * arcHeight;
        
        // 爆弾の位置を更新
        bomb.setPosition(x, y);
      },
      onComplete: () => {
        // 着弾時に爆発を発生
        this.explode(bomb.x, bomb.y, 60, 80);
        bomb.destroy();
      }
    });
    
    // 軌道の予測線をデバッグ表示（オプショナル）
    if (this.scene.game.config.physics?.arcade?.debug) {
      const graphics = this.scene.add.graphics({ 
        lineStyle: { width: 2, color: 0xff0000, alpha: 0.5 } 
      });
      
      // 放物線を描画
      graphics.beginPath();
      const steps = 20;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = startX + (targetX - startX) * t;
        const y = startY + (targetY - startY) * t - 
                 Math.sin(t * Math.PI) * arcHeight;
        
        if (i === 0) {
          graphics.moveTo(x, y);
        } else {
          graphics.lineTo(x, y);
        }
      }
      graphics.strokePath();
      
      // 短時間で消す
      this.scene.time.delayedCall(airTime * 1000, () => {
        graphics.destroy();
      });
    }
  }
  
  // 弾道の予測線を表示（デバッグ用）
  private showTrajectoryDebug(startX: number, startY: number, angle: number, power: number): void {
    if (!this.scene.game.config.physics.arcade?.debug) return;
    
    const points = this.projectileCalculator.calculateParabolicTrajectory(
      startX, startY, angle, power, 600, 20, 2
    );
    
    const graphics = this.scene.add.graphics({ lineStyle: { width: 2, color: 0xff0000, alpha: 0.5 } });
    graphics.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    
    graphics.strokePath();
    
    // 短時間で消す
    this.scene.time.delayedCall(2000, () => {
      graphics.destroy();
    });
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
