import Phaser from 'phaser';
import { BaseCharacter } from '../BaseCharacter';
import { Player, SkillType } from '../../objects/Player';
import { WeaponType } from '../../utils/WeaponTypes';
import { GameConfig } from '../../config/GameConfig';
import { ProjectileCalculator } from '../../utils/ProjectileCalculator';
import { createSafeTimeline } from '../../utils/TweenUtils';

/**
 * アーチャーのキャラクタークラス
 */
export class Archer extends BaseCharacter {
  private ultimateActive: boolean = false;
  private projectileCalculator: ProjectileCalculator;
  
  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player);
    this.projectileCalculator = new ProjectileCalculator();
  }
  
  getName(): string {
    return 'アーチャー';
  }
  
  getSkillName(): string {
    return '三連矢';
  }
  
  getUltimateName(): string {
    return '矢の雨';
  }
  
  getSkillDescription(): string {
    return '3本の矢を同時に発射する';
  }
  
  getUltimateDescription(): string {
    return '広範囲に複数の矢を降らせる';
  }
  
  getWeaponType(): WeaponType {
    return WeaponType.BOW;
  }
  
  getSkillType(): SkillType {
    return SkillType.TRIPLE_ARROW;
  }
  
  initializeStats(): void {
    this.player.setMaxHealth(90);
    this.player.setSpeed(230);
    this.player.setWeapon(this.getWeaponType());
    this.player.setSpecialAbility(this.getSkillType());
    this.player.setTint(0x00aa00);
  }
  
  useSkill(targetX: number, targetY: number): void {
    // 三連矢スキル
    const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    const spreadAngle = 0.15; // 矢の広がり角度
    
    // 中央の矢
    this.fireArrow(angle, targetX, targetY);
    
    // 左右の矢
    this.fireArrow(angle - spreadAngle, targetX, targetY);
    this.fireArrow(angle + spreadAngle, targetX, targetY);
    
    // 効果音
    try {
      this.scene.sound.play('bow_multi');
    } catch (e) {}
  }
  
  private fireArrow(angle: number, targetX: number, targetY: number): void {
    // 矢を生成（実際の処理はWeapon.tsに任せる）
    const weapon = this.player.getWeapon();
    if (weapon) {
      // 武器のfireメソッドを直接呼び出す
      // 実際のゲーム実装ではここでarrow objectを生成し、物理と衝突判定を処理
      weapon['fire'](angle);
    }
  }
  
  useUltimate(): void {
    // 矢の雨
    const radius = 250; // 効果範囲
    const arrowCount = 20; // 矢の数
    const baseDamage = 15; // 基本ダメージ
    
    // 効果範囲を表示
    const effectCircle = this.scene.add.circle(
      this.player.x, 
      this.player.y, 
      radius, 
      0x00aa00, 
      0.2
    );
    effectCircle.setStrokeStyle(2, 0x00ff00, 0.7);
    
    // 時間差で矢を降らせる
    for (let i = 0; i < arrowCount; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        // ランダムな位置に矢を降らせる
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;
        const x = this.player.x + Math.cos(angle) * distance;
        const y = this.player.y + Math.sin(angle) * distance;
        
        // 矢のビジュアルエフェクト
        const arrowAngle = Math.PI / 2 + (Math.random() - 0.5) * 0.5; // 上から±0.25ラジアン
        const arrowLength = 20;
        const arrow = this.scene.add.sprite(x, y - arrowLength, 'default')
          .setDisplaySize(4, arrowLength)
          .setOrigin(0.5, 0)
          .setRotation(arrowAngle)
          .setTint(0x00ff00);
        
        // 落下アニメーション
        this.scene.tweens.add({
          targets: arrow,
          y: y,
          duration: 200,
          ease: 'Linear',
          onComplete: () => {
            // 着弾効果
            const splash = this.scene.add.circle(x, y, 15, 0x00ff00, 0.5);
            
            // 着弾地点の敵にダメージ
            const enemies = (this.scene as any).enemyBots;
            if (enemies) {
              enemies.forEach((enemy: any) => {
                if (enemy && enemy.bot) {
                  const dist = Phaser.Math.Distance.Between(x, y, enemy.bot.x, enemy.bot.y);
                  if (dist < 20) {
                    enemy.bot.takeDamage(baseDamage);
                  }
                }
              });
            }
            
            // エフェクト削除
            splash.destroy();
            arrow.destroy();
          }
        });
      });
    }
    
    // 効果音
    try {
      this.scene.sound.play('arrow_rain');
    } catch (e) {}
  }
}
