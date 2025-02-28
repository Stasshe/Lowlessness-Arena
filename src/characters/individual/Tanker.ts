import Phaser from 'phaser';
import { BaseCharacter } from '../BaseCharacter';
import { Player, SkillType } from '../../objects/Player';
import { WeaponType } from '../../utils/WeaponTypes';
import { GameConfig } from '../../config/GameConfig';



/**
 * ガウェイン（タンカー）のキャラクタークラス
 */
export class Tanker extends BaseCharacter {
  private shieldActive: boolean = false;
  private meleeAttackCooldown: boolean = false;
  
  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player);
  }
  
  getName(): string {
    return 'ガウェイン';
  }
  
  getSkillName(): string {
    return 'チャージ・アサルト';
  }
  
  getUltimateName(): string {
    return 'ヴァンガード・シールド';
  }
  
  getSkillDescription(): string {
    return '前方にダッシュで突っ込む（ダメージ50％減）';
  }
  
  getUltimateDescription(): string {
    return '味方全員に4秒間継続する無敵シールドを配布';
  }
  
  getWeaponType(): WeaponType {
    return WeaponType.MELEE;
  }
  
  getSkillType(): SkillType {
    return SkillType.DASH_SHIELD;
  }
  
  initializeStats(): void {
    this.player.setMaxHealth(150);
    this.player.setSpeed(75);
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
  
  useSkill(targetX: number, targetY: number): void {
    // ダッシュシールド: 前方にダッシュ(ダメージ軽減付き)
    
    // ダッシュの方向ベクトルを計算
    const dx = targetX - this.player.x;
    const dy = targetY - this.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 方向を正規化
    const nx = dx / distance;
    const ny = dy / distance;
    
    // ダッシュの距離を設定(通常ダッシュより長め)
    const dashDistance = Math.min(distance, 300);
    
    // ダッシュ先の座標を計算
    const dashX = this.player.x + nx * dashDistance;
    const dashY = this.player.y + ny * dashDistance;
    
    // シールドエフェクト付きでダッシュ中
    this.shieldActive = true;
    
    const shield = this.scene.add.circle(this.player.x, this.player.y, GameConfig.CHARACTER_RADIUS * 1.5, 0xff0000, 0.3);
    shield.setStrokeStyle(2, 0xffaaaa, 1);
    
    // ダッシュ中の軌跡エフェクト
    const trail = this.scene.add.particles(this.player.x, this.player.y, 'default', {
      speed: 0,
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      tint: 0xff5555,
      lifespan: 300,
      quantity: 2,
      frequency: 10
    });
    
    // Tweenでダッシュ移動
    this.scene.tweens.add({
      targets: this.player,
      x: dashX,
      y: dashY,
      duration: 300,
      ease: 'Power2',
      onUpdate: () => {
        // 移動中の軌跡とシールドの位置を更新
        trail.setPosition(this.player.x, this.player.y);
        shield.setPosition(this.player.x, this.player.y);
        
        // 移動中に敵にぶつかるとダメージを与える
        const enemies = (this.scene as any).enemyBots;
        if (enemies) {
          enemies.forEach((enemy: any) => {
            if (enemy && enemy.bot) {
              const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.bot.x, enemy.bot.y);
              if (dist < GameConfig.CHARACTER_RADIUS * 2) {
                // ぶつかった敵を後方に吹き飛ばす
                const knockbackAngle = Math.atan2(enemy.bot.y - this.player.y, enemy.bot.x - this.player.x);
                const knockbackForce = 300;
                enemy.bot.setVelocity(
                  Math.cos(knockbackAngle) * knockbackForce,
                  Math.sin(knockbackAngle) * knockbackForce
                );
                enemy.bot.takeDamage(20);
              }
            }
          });
        }
      },
      onComplete: () => {
        // 移動完了時
        trail.destroy();
        shield.destroy();
        
        // 1秒後にシールド効果を解除
        this.scene.time.delayedCall(1000, () => {
          this.shieldActive = false;
        });
      }
    });
    
    // 効果音
    try {
      this.scene.sound.play('dash_shield');
    } catch (e) {}
  }
  
  update(_time: number, _delta: number): void {
    // シールドがアクティブな間はダメージを軽減
    if (this.shieldActive) {
      // Playerクラスの内部実装との連携は別途必要
    }
  }
  
  useUltimate(): void {
    // ヴァンガード・シールド: 味方全員に4秒間継続する無敵シールドを配布
    const duration = 4000; // 4秒間
    
    // 自分のシールド
    this.player.setInvincible(true);
    
    // シールドエフェクト
    const shield = this.scene.add.circle(this.player.x, this.player.y, GameConfig.CHARACTER_RADIUS * 2, 0xff4444, 0.3);
    shield.setStrokeStyle(3, 0xffaaaa, 0.7);
    
    // 味方にもシールド付与（プレイヤーが複数人いる場合を想定）
    const allies = this.scene.children.getAll().filter(obj => 
      obj instanceof Player && obj !== this.player
    );
    
    const allyShields: Array<Phaser.GameObjects.GameObject> = [];
    
    allies.forEach(ally => {
      if (ally instanceof Player) {
        ally.setInvincible(true);
        
        const allyShield = this.scene.add.circle(ally.x, ally.y, GameConfig.CHARACTER_RADIUS * 2, 0xff4444, 0.3);
        allyShield.setStrokeStyle(3, 0xffaaaa, 0.7);
        allyShields.push(allyShield);
        
        // シールドの位置を更新
        this.scene.events.on('update', () => {
          allyShield.setPosition(ally.x, ally.y);
        });
      }
    });
    
    // 効果音
    try {
      this.scene.sound.play('shield_ultimate');
    } catch (e) {}
    
    // シールドの位置を更新
    this.scene.events.on('update', () => {
      shield.setPosition(this.player.x, this.player.y);
    });
    
    // アルティメット終了時にシールドを解除
    this.scene.time.delayedCall(duration, () => {
      shield.destroy();
      allyShields.forEach(s => s.destroy());
      this.player.setInvincible(false);
      
      allies.forEach(ally => {
        if (ally instanceof Player) {
          ally.setInvincible(false);
        }
      });
    });
  }
}
