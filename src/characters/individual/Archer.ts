import Phaser from 'phaser';
import { BaseCharacter } from '../BaseCharacter';
import { Player, SkillType } from '../../objects/Player';
import { WeaponType } from '../../utils/WeaponTypes';
import { GameConfig } from '../../config/GameConfig';
import { ProjectileCalculator } from '../../utils/ProjectileCalculator';
import { createSafeTimeline } from '../../utils/TweenUtils';

/**
 * ランセル（アーチャー）のキャラクタークラス
 */
export class Archer extends BaseCharacter {
  private ultimateActive: boolean = false;
  private projectileCalculator: ProjectileCalculator;
  
  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player);
    this.projectileCalculator = new ProjectileCalculator();
  }
  
  getName(): string {
    return 'ランセル';
  }
  
  getSkillName(): string {
    return 'トリプル・シャワー';
  }
  
  getUltimateName(): string {
    return 'レイン・オブ・アローズ';
  }
  
  getSkillDescription(): string {
    return '放物線を描く3本の矢を一度に放つ';
  }
  
  getUltimateDescription(): string {
    return '次のスキル使用で10本の矢を放つ';
  }
  
  getWeaponType(): WeaponType {
    return WeaponType.BOW;
  }
  
  getSkillType(): SkillType {
    return SkillType.TRIPLE_ARROW;
  }
  
  initializeStats(): void {
    this.player.setMaxHealth(75);
    this.player.setSpeed(100);
    this.player.setWeapon(this.getWeaponType());
    this.player.setSpecialAbility(this.getSkillType());
    this.player.setTint(0x00ff00);
  }
  
  useSkill(targetX: number, targetY: number): void {
    // トリプル・シャワー: 放物線を描く3本の矢
    const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
    
    // アルティメットが有効なら矢の数を増やす
    const arrowCount = this.ultimateActive ? 10 : 3;
    const arrowSpread = Math.PI / 12; // 15度
    const damage = 15;
    
    for (let i = 0; i < arrowCount; i++) {
      const arrowAngle = angle + (i - Math.floor(arrowCount / 2)) * (arrowSpread / arrowCount);
      
      // 1.5~2.5秒のランダムな滞空時間
      const airTime = 1.5 + Math.random();
      
      // 矢の初期位置
      const arrow = this.scene.physics.add.sprite(this.player.x, this.player.y, 'default')
        .setDisplaySize(10, 3)
        .setTint(0x00ff00)
        .setRotation(arrowAngle)
        .setDepth(4);
      
      // 放物線の軌道パラメータ
      // より遠くに飛ばすために重力とパワーを調整
      const power = 300 + distance * 1.5;
      
      // 放物線を計算してTweenで動かす
      const points = this.projectileCalculator.calculateParabolicTrajectory(
        this.player.x, this.player.y, arrowAngle, power, 980, 20, airTime
      );
      
      // Tweenのタイムライン - TweenUtilsを使用
      const timeline = createSafeTimeline(this.scene, airTime * 1000);
      
      // 各点をタイムライン上で結ぶ
      for (let j = 1; j < points.length; j++) {
        const prevPoint = points[j - 1];
        const point = points[j];
        
        // 2点間の角度を計算（矢の向きを調整）
        const pointAngle = Math.atan2(
          point.y - prevPoint.y, 
          point.x - prevPoint.x
        );
        
        timeline.add({
          targets: arrow,
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
        this.scene.add.particles(arrow.x, arrow.y, 'default', {
          speed: 50,
          scale: { start: 0.2, end: 0 },
          blendMode: 'ADD',
          tint: 0x00ff00,
          lifespan: 300,
          quantity: 10
        });
        
        // 着弾地点の敵にダメージ
        const enemies = (this.scene as any).enemyBots;
        if (enemies) {
          enemies.forEach((enemy: any) => {
            if (enemy && enemy.bot) {
              const dist = Phaser.Math.Distance.Between(arrow.x, arrow.y, enemy.bot.x, enemy.bot.y);
              if (dist < GameConfig.CHARACTER_RADIUS * 1.5) {
                enemy.bot.takeDamage(damage);
              }
            }
          });
        }
        
        arrow.destroy();
      });
      
      // アニメーション開始
      timeline.play();
      
      // 発射ディレイ
      this.scene.time.delayedCall(i * 100, () => {
        // 発射エフェクト
        this.scene.add.particles(this.player.x, this.player.y, 'default', {
          speed: 100,
          scale: { start: 0.2, end: 0 },
          blendMode: 'ADD',
          tint: 0x00ff00,
          lifespan: 200,
          quantity: 5
        });
        
        // 効果音
        try {
          this.scene.sound.play('bow_shot');
        } catch (e) {}
      });
    }
    
    // アルティメット効果があった場合はリセット
    if (this.ultimateActive) {
      this.ultimateActive = false;
    }
  }
  
  useUltimate(): void {
    // レイン・オブ・アローズ: 次のスキル使用での弓の本数が10になる
    this.ultimateActive = true;
    const duration = 5000; // 5秒間有効
    
    // エフェクト
    const effect = this.scene.add.particles(this.player.x, this.player.y, 'default', {
      speed: 50,
      scale: { start: 0.3, end: 0 },
      blendMode: 'ADD',
      tint: 0x00ff00,
      lifespan: 500,
      quantity: 3
    });
    
    // エフェクトをプレイヤーに追従
    this.scene.events.on('update', () => {
      effect.setPosition(this.player.x, this.player.y);
    });
    
    // 効果音
    try {
      this.scene.sound.play('arrow_power');
    } catch (e) {}
    
    // 一定時間後に効果が切れる（矢を撃たなかった場合）
    this.scene.time.delayedCall(duration, () => {
      if (this.ultimateActive) {
        this.ultimateActive = false;
        effect.destroy();
      }
    });
  }
}
