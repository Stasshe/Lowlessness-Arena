import Phaser from 'phaser';
import { Player, SkillType } from '../../objects/Player';
import { BaseCharacter } from './../BaseCharacter';
import { WeaponType } from '../../utils/WeaponTypes';
import { GameConfig } from '../../config/GameConfig';

/**
 * レオン（近接戦闘型）のキャラクタークラス
 */
export class Knight extends BaseCharacter {
  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player);
  }
  
  getName(): string {
    return 'レオン';
  }
  
  getSkillName(): string {
    return 'チャージダッシュ';
  }
  
  getUltimateName(): string {
    return '剣の旋風';
  }
  
  getSkillDescription(): string {
    return '一定距離を素早く移動し、接触した敵にダメージを与える';
  }
  
  getUltimateDescription(): string {
    return '周囲の敵に大ダメージを与える範囲攻撃';
  }
  
  getWeaponType(): WeaponType {
    return WeaponType.MELEE;
  }
  
  getSkillType(): SkillType {
    return SkillType.DASH;
  }
  
  initializeStats(): void {
    this.player.setMaxHealth(120);
    this.player.setSpeed(180);
    this.player.setWeapon(this.getWeaponType());
    this.player.setSpecialAbility(this.getSkillType());
    this.player.setTint(0xcccccc);
  }
  
  // 近接攻撃の特殊処理を実装
  useAttack(targetX: number, targetY: number): boolean {
    const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    
    // プレイヤーの向きを設定
    this.player.setRotation(angle);
    
    // 剣の攻撃範囲を可視化
    const slashGraphics = this.scene.add.graphics();
    slashGraphics.lineStyle(4, 0xffffff, 0.8);
    slashGraphics.beginPath();
    
    // 扇形の攻撃範囲
    const attackRange = GameConfig.CHARACTER_RADIUS * 2.5;
    const attackAngle = Math.PI / 3; // 60度
    
    // 扇形を描画
    slashGraphics.arc(
      this.player.x, 
      this.player.y, 
      attackRange,
      angle - attackAngle / 2,
      angle + attackAngle / 2
    );
    slashGraphics.lineTo(this.player.x, this.player.y);
    slashGraphics.closePath();
    slashGraphics.strokePath();
    
    // 攻撃エフェクトのアニメーション
    this.scene.tweens.add({
      targets: slashGraphics,
      alpha: { from: 1, to: 0 },
      duration: 300,
      onComplete: () => {
        slashGraphics.destroy();
      }
    });
    
    // 攻撃範囲内の敵にダメージを与える
    const enemies = (this.scene as any).enemyBots;
    if (enemies) {
      enemies.forEach((enemy: any) => {
        if (enemy && enemy.bot) {
          // 敵との角度を計算
          const enemyAngle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            enemy.bot.x, enemy.bot.y
          );
          
          // 攻撃の角度範囲内か確認
          const angleDiff = Phaser.Math.Angle.Wrap(enemyAngle - angle);
          if (Math.abs(angleDiff) <= attackAngle / 2) {
            // 距離も確認
            const distance = Phaser.Math.Distance.Between(
              this.player.x, this.player.y,
              enemy.bot.x, enemy.bot.y
            );
            
            if (distance <= attackRange + GameConfig.CHARACTER_RADIUS) {
              // ダメージを与える
              enemy.bot.takeDamage(30);
            }
          }
        }
      });
    }
    
    // 効果音
    try {
      this.scene.sound.play('sword_swing');
    } catch (e) {}
    
    return true; // 独自攻撃を実装したのでtrueを返す
  }
  
  useSkill(targetX: number, targetY: number): void {
    // チャージダッシュ: 敵を貫通して攻撃する突進
    const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    const dashDistance = 200;
    
    // ダッシュ先の座標
    const dashX = this.player.x + Math.cos(angle) * dashDistance;
    const dashY = this.player.y + Math.sin(angle) * dashDistance;
    
    // 無敵状態に
    this.player.setInvincible(true);
    
    // ダッシュ中のエフェクト
    const trail = this.scene.add.particles(this.player.x, this.player.y, 'default', {
      speed: 0,
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      tint: 0xffffff,
      lifespan: 300,
      quantity: 5
    });
    
    // ダッシュ方向に光る剣のエフェクト
    const slash = this.scene.add.graphics();
    slash.lineStyle(8, 0xffffff, 0.7);
    slash.beginPath();
    slash.moveTo(this.player.x, this.player.y);
    slash.lineTo(dashX, dashY);
    slash.strokePath();
    
    // 剣のエフェクトをアニメーション
    this.scene.tweens.add({
      targets: slash,
      alpha: { from: 0.7, to: 0 },
      duration: 200
    });
    
    // Tweenでダッシュ移動
    this.scene.tweens.add({
      targets: this.player,
      x: dashX,
      y: dashY,
      duration: 200,
      ease: 'Power2',
      onUpdate: () => {
        // エフェクト位置を更新
        trail.setPosition(this.player.x, this.player.y);
        
        // ダッシュ中に敵と接触したらダメージ
        const enemies = (this.scene as any).enemyBots;
        if (enemies) {
          enemies.forEach((enemy: any) => {
            if (enemy && enemy.bot) {
              const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                enemy.bot.x, enemy.bot.y
              );
              
              if (dist <= GameConfig.CHARACTER_RADIUS * 2) {
                enemy.bot.takeDamage(20);
              }
            }
          });
        }
      },
      onComplete: () => {
        // ダッシュ完了
        trail.destroy();
        slash.destroy();
        this.player.setInvincible(false);
      }
    });
    
    // 効果音
    try {
      this.scene.sound.play('dash');
    } catch (e) {}
  }
  
  useUltimate(): void {
    // 剣の旋風: 周囲360度の強力な斬撃
    const blastRadius = 150;
    
    // 回転エフェクト - 1段階目
    const slash1 = this.scene.add.circle(this.player.x, this.player.y, blastRadius * 0.5, 0xffffff, 0.5)
      .setStrokeStyle(8, 0xffffff, 1);
    
    // 回転アニメーション
    this.scene.tweens.add({
      targets: slash1,
      rotation: Math.PI * 2,
      duration: 800,
      ease: 'Sine.easeInOut'
    });
    
    // 2段階目の遅延エフェクト
    this.scene.time.delayedCall(300, () => {
      const slash2 = this.scene.add.circle(this.player.x, this.player.y, blastRadius * 0.8, 0xcccccc, 0.3)
        .setStrokeStyle(5, 0xcccccc, 0.8);
      
      this.scene.tweens.add({
        targets: slash2,
        rotation: Math.PI * 2,
        duration: 800,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          slash2.destroy();
        }
      });
    });
    
    // 最終段階のエフェクト
    this.scene.time.delayedCall(600, () => {
      const slashFinal = this.scene.add.circle(this.player.x, this.player.y, blastRadius, 0xffffff, 0)
        .setStrokeStyle(3, 0xffffff, 0.6);
      
      // 回転パーティクル
      const particles = this.scene.add.particles(this.player.x, this.player.y, 'default', {
        speed: 200,
        scale: { start: 0.4, end: 0 },
        blendMode: 'ADD',
        tint: 0xffffff,
        lifespan: 700,
        quantity: 30,
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, blastRadius * 0.9),
          quantity: 30
        }
      });
      
      // 周囲の敵にダメージ
      const enemies = (this.scene as any).enemyBots;
      if (enemies) {
        enemies.forEach((enemy: any) => {
          if (enemy && enemy.bot) {
            const dist = Phaser.Math.Distance.Between(
              this.player.x, this.player.y,
              enemy.bot.x, enemy.bot.y
            );
            
            if (dist <= blastRadius + GameConfig.CHARACTER_RADIUS) {
              // 距離に応じたダメージ減衰なし - 範囲内は同じダメージ
              const damage = 120;
              enemy.bot.takeDamage(damage);
            }
          }
        });
      }
      
      // エフェクト削除
      this.scene.time.delayedCall(700, () => {
        slashFinal.destroy();
        particles.destroy();
        slash1.destroy();
      });
    });
    
    // 効果音
    try {
      this.scene.sound.play('sword_ultimate');
    } catch (e) {}
  }
}
