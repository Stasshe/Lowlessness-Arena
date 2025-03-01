import Phaser from 'phaser';
import { BaseCharacter } from '../BaseCharacter';
import { Player, SkillType } from '../../objects/Player';
import { WeaponType } from '../../utils/WeaponTypes';
import { GameConfig } from '../../config/GameConfig';

/**
 * ガーディアン（タンカー）のキャラクタークラス
 */
export class Tanker extends BaseCharacter {
  private shieldActive: boolean = false;
  private meleeAttackCooldown: boolean = false;
  
  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player);
  }
  
  getName(): string {
    return 'ガーディアン';
  }
  
  getSkillName(): string {
    return 'バリアシールド';
  }
  
  getUltimateName(): string {
    return '鉄壁の守り';
  }
  
  getSkillDescription(): string {
    return '一定時間、受けるダメージを軽減する';
  }
  
  getUltimateDescription(): string {
    return '無敵状態になり、周囲の敵にノックバック効果を与える';
  }
  
  getWeaponType(): WeaponType {
    return WeaponType.SHOTGUN;
  }
  
  getSkillType(): SkillType {
    return SkillType.SHIELD;
  }
  
  initializeStats(): void {
    this.player.setMaxHealth(150);
    this.player.setSpeed(160);
    this.player.setWeapon(this.getWeaponType());
    this.player.setSpecialAbility(this.getSkillType());
    this.player.setTint(0xff0000);
  }
  
  // 近接攻撃の特殊処理
  useAttack(targetX: number, targetY: number): boolean {
    if (this.meleeAttackCooldown) return true;
    
    const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    const attackRange = 80;
    const damage = 25;
    
    // 攻撃エフェクト
    const attackArc = this.scene.add.graphics();
    attackArc.fillStyle(0xff0000, 0.5);
    attackArc.beginPath();
    attackArc.arc(
      this.player.x, this.player.y, 
      attackRange, 
      angle - Math.PI / 6, 
      angle + Math.PI / 6,
      false
    );
    attackArc.lineTo(this.player.x, this.player.y);
    attackArc.closePath();
    attackArc.fillPath();
    
    // 効果音
    try {
      this.scene.sound.play('melee_attack');
    } catch (e) {}
    
    // 一定時間後にエフェクトを消す
    this.scene.time.delayedCall(200, () => {
      attackArc.destroy();
    });
    
    // 攻撃範囲内の敵を検知
    const enemies = (this.scene as any).enemyBots;
    if (enemies) {
      enemies.forEach((enemy: any) => {
        if (enemy && enemy.bot) {
          const distance = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            enemy.bot.x, enemy.bot.y
          );
          
          if (distance <= attackRange) {
            // 敵の方向と攻撃方向の角度差を計算
            const enemyAngle = Math.atan2(
              enemy.bot.y - this.player.y,
              enemy.bot.x - this.player.x
            );
            const angleDiff = Phaser.Math.Angle.Wrap(enemyAngle - angle);
            
            // 攻撃範囲内（扇形の角度内）
            if (Math.abs(angleDiff) <= Math.PI / 6) {
              // ダメージを与える
              enemy.bot.takeDamage(damage);
              
              // ノックバック効果
              const knockbackForce = 200;
              enemy.bot.setVelocity(
                Math.cos(enemyAngle) * knockbackForce,
                Math.sin(enemyAngle) * knockbackForce
              );
            }
          }
        }
      });
    }
    
    // クールダウン
    this.meleeAttackCooldown = true;
    this.scene.time.delayedCall(500, () => {
      this.meleeAttackCooldown = false;
    });
    
    return true; // 通常の攻撃処理をスキップ
  }
  
  useSkill(_targetX: number, _targetY: number): void {
    // バリアシールド: ダメージ軽減効果
    
    // シールドエフェクト
    const shield = this.scene.add.circle(this.player.x, this.player.y, 45, 0x00aaff, 0.3)
      .setStrokeStyle(3, 0x00ffff, 1);
    
    // パルス効果
    this.scene.tweens.add({
      targets: shield,
      scale: { from: 0, to: 1 },
      alpha: { from: 0.8, to: 0.3 },
      duration: 500,
      ease: 'Back.easeOut'
    });
    
    // シールドの輝きエフェクト
    const highlight = this.scene.add.circle(this.player.x, this.player.y, 50, 0x00ffff, 0)
      .setStrokeStyle(1, 0x00ffff, 0.5);
    
    // 輝きを点滅
    this.scene.tweens.add({
      targets: highlight,
      alpha: { from: 0.8, to: 0 },
      scale: { from: 0.8, to: 1.2 },
      duration: 1000,
      repeat: 2
    });
    
    // プレイヤーに追従
    this.scene.time.addEvent({
      delay: 30,
      callback: () => {
        if (shield && this.player) {
          shield.setPosition(this.player.x, this.player.y);
          highlight.setPosition(this.player.x, this.player.y);
        }
      },
      repeat: 100
    });
    
    // 効果持続時間（3秒）
    this.scene.time.delayedCall(3000, () => {
      // シールドを消す
      this.scene.tweens.add({
        targets: [shield, highlight],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          shield.destroy();
          highlight.destroy();
        }
      });
    });
    
    // 効果音
    try {
      this.scene.sound.play('shield_activate');
    } catch (e) {}
  }
  
  update(_time: number, _delta: number): void {
    // シールドがアクティブな間はダメージを軽減
    if (this.shieldActive) {
      // Playerクラスの内部実装との連携は別途必要
    }
  }
  
  useUltimate(): void {
    // 鉄壁の守り: 一時的に無敵化＋スタンバリア
    
    // 無敵状態に
    this.player.setInvincible(true);
    
    // 無敵エフェクト
    this.player.setTint(0xffff00);
    
    // バリア効果
    const barrier = this.scene.add.circle(this.player.x, this.player.y, 70, 0xffff00, 0.3)
      .setStrokeStyle(5, 0xffff00, 1);
    
    // パルスエフェクト
    this.scene.tweens.add({
      targets: barrier,
      scale: { from: 0.5, to: 1 },
      alpha: { from: 0.8, to: 0.3 },
      duration: 500,
      ease: 'Sine.easeOut'
    });
    
    // バリアを点滅
    this.scene.tweens.add({
      targets: barrier,
      alpha: { from: 0.3, to: 0.6 },
      yoyo: true,
      repeat: 5,
      duration: 600
    });
    
    // カメラシェイク
    this.scene.cameras.main.shake(300, 0.02);
    
    // 光の粒子
    const particles = this.scene.add.particles(this.player.x, this.player.y, 'default', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.2, end: 0 },
      blendMode: 'ADD',
      tint: 0xffff00,
      lifespan: 800,
      quantity: 20
    });
    
    // バリアにプレイヤーを追従
    this.scene.time.addEvent({
      delay: 30,
      callback: () => {
        if (barrier && this.player) {
          barrier.setPosition(this.player.x, this.player.y);
          particles.setPosition(this.player.x, this.player.y);
          
          // 周囲の敵をノックバック
          const enemies = (this.scene as any).enemyBots;
          if (enemies) {
            enemies.forEach((enemy: any) => {
              if (enemy && enemy.bot) {
                // 範囲内の敵を検出
                const distance = Phaser.Math.Distance.Between(
                  this.player.x, this.player.y,
                  enemy.bot.x, enemy.bot.y
                );
                
                if (distance <= 150) {
                  // ノックバック方向を計算
                  const angle = Phaser.Math.Angle.Between(
                    this.player.x, this.player.y,
                    enemy.bot.x, enemy.bot.y
                  );
                  
                  // 距離に応じてノックバックの強さを調整
                  const knockbackForce = 300 * (1 - distance / 150);
                  
                  // ノックバック適用
                  enemy.bot.setVelocity(
                    Math.cos(angle) * knockbackForce,
                    Math.sin(angle) * knockbackForce
                  );
                  
                  // スタン効果（実装に応じて調整）
                  if (enemy.bot.stun) {
                    enemy.bot.stun(1000); // 1秒間スタン
                  }
                  
                  // ダメージも与える
                  enemy.bot.takeDamage(15);
                }
              }
            });
          }
        }
      },
      repeat: 20 // 一定時間続ける
    });
    
    // 効果音
    try {
      this.scene.sound.play('ultimate_shield');
    } catch (e) {}
    
    // 5秒後に効果終了
    this.scene.time.delayedCall(5000, () => {
      // 無敵解除
      this.player.setInvincible(false);
      
      // 色を元に戻す
      this.player.clearTint();
      
      // バリアを消す
      this.scene.tweens.add({
        targets: [barrier, particles],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          barrier.destroy();
          particles.destroy();
        }
      });
    });
  }
}
