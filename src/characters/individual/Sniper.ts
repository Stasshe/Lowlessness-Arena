import Phaser from 'phaser';
import { Player, SkillType } from '../../objects/Player';
import { BaseCharacter } from '../BaseCharacter';
import { WeaponType } from '../../utils/WeaponTypes';
import { GameConfig } from '../../config/GameConfig';

/**
 * スナイパーキャラクター実装
 */
export class Sniper extends BaseCharacter {
  private isInScopeMode: boolean = false;
  private scopeEffect: Phaser.GameObjects.Container | null = null;
  
  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player);
  }
  
  getName(): string {
    return 'ジークフリート';
  }
  
  getSkillName(): string {
    return 'プレシジョンスコープ';
  }
  
  getUltimateName(): string {
    return 'スーパースナイプ';
  }
  
  getSkillDescription(): string {
    return 'スコープをのぞき射程と精度が上昇';
  }
  
  getUltimateDescription(): string {
    return '貫通する強力なスナイプショットを放つ';
  }
  
  getWeaponType(): WeaponType {
    return WeaponType.SNIPER;
  }
  
  getSkillType(): SkillType {
    return SkillType.SCOPE;
  }
  
  initializeStats(): void {
    this.player.setMaxHealth(80); // スナイパーは耐久低め
    this.player.setSpeed(200);    // 移動は速い
    this.player.setWeapon(this.getWeaponType());
    this.player.setSpecialAbility(this.getSkillType());
    this.player.setTint(0x3399ff); // 青っぽい色合い
  }
  
  /**
   * 照準表示をカスタマイズ
   */
  updateAiming(
    targetX: number, 
    targetY: number, 
    joystickDistance?: number
  ): { targetPoint: Phaser.Math.Vector2, trajectoryPoints?: Phaser.Math.Vector2[] } {
    // スコープモード中は特殊照準を表示
    if (this.isInScopeMode) {
      return this.showScopeModeAiming(targetX, targetY);
    }
    
    // 通常時はデフォルトのスナイパー照準
    return this.player.updateAiming(targetX, targetY, joystickDistance);
  }
  
  /**
   * スコープモード中の特殊照準表示
   */
  private showScopeModeAiming(
    targetX: number, 
    targetY: number
  ): { targetPoint: Phaser.Math.Vector2 } {
    const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    const weaponAiming = this.player.getWeaponAiming();
    
    // 照準のスタイルを一時的に変更
    weaponAiming.updateConfig({
      lineColor: 0x3399ff,
      lineAlpha: 0.9,
      fillColor: 0xff0000,
      fillAlpha: 0.7,
      lineWidth: 1,
      maxDistance: 800 // スコープモードでは射程を大幅に伸ばす
    });
    
    // スナイパー照準を表示するが、スコープモード用のスタイルとパラメータ
    const result = weaponAiming.showAiming(
      this.player.x,
      this.player.y,
      angle,
      0,
      WeaponType.SNIPER
    );
    
    // 照準のスタイルを元に戻す（次回のために）
    weaponAiming.updateConfig({
      lineColor: 0xffffff,
      lineAlpha: 0.7,
      fillColor: 0xff0000,
      fillAlpha: 0.5,
      lineWidth: 2,
      maxDistance: 500
    });
    
    return result;
  }
  
  /**
   * スキル（スコープモード）
   */
  useSkill(targetX: number, targetY: number): void {
    // スコープモードをトグル
    this.isInScopeMode = !this.isInScopeMode;
    
    if (this.isInScopeMode) {
      // スコープモード開始
      this.enableScopeMode();
    } else {
      // スコープモード終了
      this.disableScopeMode();
    }
  }
  
  /**
   * スコープモードを有効にする
   */
  private enableScopeMode(): void {
    // 武器の射程と精度を向上
    this.player.getWeapon().setRangeMultiplier(2.0);
    
    // 移動速度を遅くする（安定して狙うため）
    const originalSpeed = this.player.getSpeed();
    this.player.setSpeed(originalSpeed * 0.5);
    
    // スコープエフェクト
    const scopeCircle = this.scene.add.circle(0, 0, 40, 0x000000, 0);
    scopeCircle.setStrokeStyle(2, 0x3399ff, 0.8);
    
    // クロスヘア
    const crosshair = this.scene.add.graphics();
    crosshair.lineStyle(1, 0x3399ff, 0.8);
    crosshair.lineBetween(-20, 0, 20, 0);
    crosshair.lineBetween(0, -20, 0, 20);
    
    // 照準円
    const aimCircle = this.scene.add.circle(0, 0, 5, 0x000000, 0);
    aimCircle.setStrokeStyle(1, 0xff0000, 1);
    
    this.scopeEffect = this.scene.add.container(this.player.x, this.player.y, [
      scopeCircle, crosshair, aimCircle
    ]);
    
    // 効果音
    try {
      this.scene.sound.play('scope_on');
    } catch (e) {}
  }
  
  /**
   * スコープモードを無効にする
   */
  private disableScopeMode(): void {
    // 武器の射程と精度を元に戻す
    this.player.getWeapon().resetRangeMultiplier();
    
    // 移動速度を元に戻す
    this.player.setSpeed(200);
    
    // スコープエフェクトを削除
    if (this.scopeEffect) {
      this.scopeEffect.destroy();
      this.scopeEffect = null;
    }
    
    // 効果音
    try {
      this.scene.sound.play('scope_off');
    } catch (e) {}
  }
  
  /**
   * アルティメット（スーパースナイプ）
   */
  useUltimate(): void {
    const angle = this.player.rotation;
    const range = 1000; // 超長距離
    
    // エフェクト用レーザー線
    const laser = this.scene.add.graphics();
    laser.lineStyle(3, 0xff0000, 0.8);
    
    // レーザーの始点と終点
    const startX = this.player.x;
    const startY = this.player.y;
    const endX = startX + Math.cos(angle) * range;
    const endY = startY + Math.sin(angle) * range;
    
    laser.lineBetween(startX, startY, endX, endY);
    
    // 強力な貫通弾を発射（敵を貫通してヒット）
    const enemies = (this.scene as any).enemyBots;
    if (enemies) {
      enemies.forEach((enemy: any) => {
        if (enemy && enemy.bot) {
          // 敵との角度を計算
          const dx = enemy.bot.x - this.player.x;
          const dy = enemy.bot.y - this.player.y;
          const enemyAngle = Math.atan2(dy, dx);
          
          // 角度の差が小さく、かつ距離が射程内ならヒット
          const angleDifference = Math.abs(
            Phaser.Math.Angle.ShortestBetween(
              Phaser.Math.RadToDeg(angle),
              Phaser.Math.RadToDeg(enemyAngle)
            )
          );
          
          const distance = Phaser.Math.Distance.Between(
            this.player.x, this.player.y, enemy.bot.x, enemy.bot.y
          );
          
          if (angleDifference < 5 && distance <= range) {
            // 大ダメージを与える
            enemy.bot.takeDamage(150);
            
            // ヒットエフェクト
            this.scene.add.circle(enemy.bot.x, enemy.bot.y, 20, 0xff0000, 0.7)
              .setStrokeStyle(2, 0xffffff, 1);
          }
        }
      });
    }
    
    // レーザーを一定時間後に消す
    this.scene.time.delayedCall(400, () => {
      laser.destroy();
    });
    
    // 効果音
    try {
      this.scene.sound.play('super_snipe');
    } catch (e) {}
  }
  
  /**
   * 更新処理（スコープエフェクトの位置更新など）
   */
  update(time: number, delta: number): void {
    // スコープエフェクトの位置を更新
    if (this.isInScopeMode && this.scopeEffect) {
      this.scopeEffect.setPosition(this.player.x, this.player.y);
    }
  }
  
  /**
   * リソース解放
   */
  destroy(): void {
    if (this.isInScopeMode) {
      this.disableScopeMode();
    }
    
    if (this.scopeEffect) {
      this.scopeEffect.destroy();
      this.scopeEffect = null;
    }
  }
}
