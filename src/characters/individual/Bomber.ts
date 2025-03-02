import Phaser from 'phaser';
import { Player, SkillType } from '../../objects/Player';
import { BaseCharacter } from './../BaseCharacter';
import { WeaponType } from '../../utils/WeaponTypes';
// 使用しない変数のインポートを削除
import { ProjectileCalculator } from '../../utils/ProjectileCalculator';

/**
 * マルグリット（爆弾魔）のキャラクタークラス
 */
export class Bomber extends BaseCharacter {
  private projectileCalculator: ProjectileCalculator;
  private lastThrowTime: number = 0;
  private throwCooldown: number = 500;
  
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
    this.player.setSpeed(180);
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
    const joyDistanceToUse = joystickDistance || Math.min(distance, 100);
    
    // 照準表示用のクラスを取得
    const aiming = this.player.getWeaponAiming();
    
    // 爆弾投げの軌道を計算して表示
    const normalizedDistance = Math.min(joyDistanceToUse / 100, 1);
    const throwPower = 300 + normalizedDistance * 300;
    
    // クリアして新たに描画
    aiming.clear();
    
    // 放物線の軌道点を計算
    const trajectoryPoints = this.projectileCalculator.calculateParabolicTrajectory(
      this.player.x,
      this.player.y,
      angle,
      throwPower,
      600,
      15,
      2
    );
    
    if (trajectoryPoints.length > 1) {
      // 安全に drawDottedLine を呼び出す
      if (typeof aiming.drawDottedLine === 'function') {
        aiming.drawDottedLine(trajectoryPoints, 0xff6600, 0.8, 4);
      } else {
        // フォールバック：通常の線で描画
        this.drawTrajectory(aiming, trajectoryPoints);
      }
      
      // 着弾予測点
      const landingPoint = trajectoryPoints[trajectoryPoints.length - 1];
      
      // 安全に drawCircle を呼び出す
      if (typeof aiming.drawCircle === 'function') {
        aiming.drawCircle(landingPoint.x, landingPoint.y, 30, 0xff6600, 0.3);
      } else {
        // フォールバック：標準機能で円を描画
        aiming.getGraphics().lineStyle(2, 0xff6600, 0.3);
        aiming.getGraphics().strokeCircle(landingPoint.x, landingPoint.y, 30);
      }
      
      return {
        targetPoint: landingPoint,
        trajectoryPoints: trajectoryPoints
      };
    }
    
    // フォールバック: 標準の照準表示
    return this.player.updateAiming(targetX, targetY, joystickDistance);
  }
  
  // フォールバックとして使用するヘルパーメソッド
  private drawTrajectory(aiming: any, points: Phaser.Math.Vector2[]): void {
    const graphics = aiming.getGraphics();
    graphics.lineStyle(2, 0xff6600, 0.8);
    
    // 連続的な線を描画
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      if (i % 2 === 0) { // 破線風に
        graphics.lineBetween(prev.x, prev.y, curr.x, curr.y);
      }
    }
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
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
    const normalizedDistance = Math.min(distance / 300, 1);
    
    // 照準表示用のクラスを取得
    const aiming = this.player.getWeaponAiming();
    aiming.clear();
    
    // 標準実装: 目標地点に円を描画
    const targetPoint = new Phaser.Math.Vector2(targetX, targetY);
    const explosionRadius = 80;
    
    // 型キャストして互換性を確保
    return {
      targetPoint: targetPoint,
      area: new Phaser.Geom.Circle(targetX, targetY, explosionRadius)
    };
  }
  
  // 通常攻撃も物理弾を使って実装（オーバーライド）
  useAttack(targetX: number, targetY: number): boolean {
    const currentTime = this.scene.time.now;
    
    // クールダウンチェック
    if (currentTime < this.lastThrowTime + this.throwCooldown) {
      return true;
    }
    
    // クールダウン更新
    this.lastThrowTime = currentTime;
    
    const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
    
    // 投石の放物線パラメータ
    const normalizedDistance = Math.min(distance / 300, 1);
    const throwPower = 300 + normalizedDistance * 300;
    
    // プレイヤーの前方から発射
    const offsetX = this.player.x + Math.cos(angle) * 20;
    const offsetY = this.player.y + Math.sin(angle) * 20;
    
    // 武器のfireSpecialメソッドを使用して物理弾を発射
    const stone = this.player.getWeapon().fireSpecial(
      offsetX,
      offsetY,
      angle,
      'normal',
      throwPower,
      15,
      300,
      true
    );
    
    if (stone) {
      // 所有者を明示的に設定
      stone.setOwner(this.player);
      
      // 外観をカスタマイズ
      stone.setDisplaySize(8, 8);
      stone.setTint(0xcccccc);
      
      // 小さな爆発効果を追加
      stone.setExplosive(true, 20);
      
      // 効果音
      try {
        this.scene.sound.play('sling');
      } catch (e) {}
    }
    
    return true;
  }

  useSkill(targetX: number, targetY: number): void {
    // ボム・スプレイ: 放物線を描く爆弾投げ
    const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
    const normalizedDistance = Math.min(distance / 300, 1);
    const throwPower = 400 + normalizedDistance * 400;
    
    console.log("爆弾スキル使用: 目標=", targetX, targetY, "パワー=", throwPower);
    
    // プレイヤーの前方から発射
    const offsetX = this.player.x + Math.cos(angle) * 20;
    const offsetY = this.player.y + Math.sin(angle) * 20;
    
    // ID が設定されていなければ設定
    if (!this.player.getData('id')) {
      this.player.setData('id', `player_${Date.now()}`);
    }
    
    // 武器のfireSpecialメソッドを使用して物理弾を発射
    const bomb = this.player.getWeapon().fireSpecial(
      offsetX,
      offsetY,
      angle,
      'explosive',  // 弾の種類を爆発弾に
      throwPower,   // 速度
      70,           // ダメージ
      1000,         // 射程
      true          // 重力の影響を受ける
    );
    
    if (bomb) {
      // 所有者を明示的に設定（自己衝突を防ぐため）
      bomb.setOwner(this.player);
      
      // 爆弾の外観をカスタマイズ
      bomb.setScale(1.2);
      bomb.setTint(0xff6600);
      
      // 爆発範囲を設定
      bomb.setExplosive(true, 80);
      
      // 回転エフェクト
      this.scene.tweens.add({
        targets: bomb,
        rotation: Math.PI * 4,
        duration: 1200,
        ease: 'Linear'
      });
      
      // トレイルエフェクト
      const trailEmitter = this.scene.add.particles(0, 0, 'default', {
        follow: bomb,
        followOffset: { x: 0, y: 0 },
        lifespan: 300,
        speed: { min: 10, max: 30 },
        scale: { start: 0.2, end: 0 },
        quantity: 1,
        blendMode: 'ADD',
        tint: 0xff8800
      });
      
      // 一定時間後に爆発するようにタイマー設定（通常は衝突時に爆発するが、バックアップとして）
      this.scene.time.delayedCall(2000, () => {
        if (bomb.active) {
          // 爆発エフェクトを強化
          const explosionCircle = this.scene.add.circle(bomb.x, bomb.y, 80, 0xff3300, 0.5)
            .setStrokeStyle(4, 0xff6600, 1)
            .setDepth(5);
          
          // 爆発パーティクル
          const particles = this.scene.add.particles(bomb.x, bomb.y, 'default', {
            speed: { min: 100, max: 300 },
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            tint: [ 0xff6600, 0xff8800, 0xffaa00 ],
            lifespan: 800,
            quantity: 30
          });
          
          // カメラシェイク
          this.scene.cameras.main.shake(200, 0.02);
          
          // 後始末
          this.scene.time.delayedCall(800, () => {
            explosionCircle.destroy();
            particles.destroy();
          });
          
          // エフェクト消去
          trailEmitter.destroy();
          bomb.destroy();
        }
      });
    }
    
    // 効果音
    try {
      this.scene.sound.play('bomb_throw');
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
    
    // カメラシェイク
    this.scene.cameras.main.shake(500, 0.02);
  }
}
