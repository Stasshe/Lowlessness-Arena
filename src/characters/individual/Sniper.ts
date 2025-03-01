import Phaser from 'phaser';
import { Player, SkillType } from '../../objects/Player';
import { BaseCharacter } from './../BaseCharacter';
import { WeaponType } from '../../utils/WeaponTypes';

/**
 * スカウト（スナイパー）のキャラクタークラス
 */
export class Sniper extends BaseCharacter {
  private isScopeActive: boolean = false;
  
  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player);
  }
  
  getName(): string {
    return 'スカウト';
  }
  
  getSkillName(): string {
    return 'プレシジョンスコープ';
  }
  
  getUltimateName(): string {
    return 'ピアシングショット';
  }
  
  getSkillDescription(): string {
    return '一定時間、照準精度が上がり、射程距離が伸びる';
  }
  
  getUltimateDescription(): string {
    return 'マップを横断する強力な一撃';
  }
  
  getWeaponType(): WeaponType {
    return WeaponType.SNIPER;
  }
  
  getSkillType(): SkillType {
    return SkillType.SCOPE;
  }
  
  initializeStats(): void {
    this.player.setMaxHealth(80);
    this.player.setSpeed(190);
    this.player.setWeapon(this.getWeaponType());
    this.player.setSpecialAbility(this.getSkillType());
    this.player.setTint(0x0000ff);
  }
  
  useSkill(_targetX: number, _targetY: number): void {
    // すでにスコープモード中なら効果を延長するだけ
    if (this.isScopeActive) {
      // スコープ効果時間を延長
      this.scene.time.removeAllEvents();
    }
    
    // プレシジョンスコープ: 射程と精度が向上
    this.isScopeActive = true;
    
    // 武器の射程を50%増加
    const weapon = this.player.getWeapon();
    if (weapon) {
      weapon.setRangeMultiplier(1.5);
    }
    
    // スコープのビジュアル効果
    const scopeEffect = this.scene.add.container(this.player.x, this.player.y);
    
    // 集中線エフェクト
    const lines = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const x1 = Math.cos(angle) * 30;
      const y1 = Math.sin(angle) * 30;
      const x2 = Math.cos(angle) * 50;
      const y2 = Math.sin(angle) * 50;
      
      const line = this.scene.add.line(0, 0, x1, y1, x2, y2, 0x0000ff, 0.6);
      lines.push(line);
      scopeEffect.add(line);
    }
    
    // 照準のクロスヘア
    const crosshair = this.scene.add.container(0, 0);
    crosshair.add(this.scene.add.circle(0, 0, 20, 0, 0.5).setStrokeStyle(1, 0x0000ff, 0.7));
    crosshair.add(this.scene.add.circle(0, 0, 5, 0, 0.5).setStrokeStyle(1, 0x0000ff, 0.7));
    crosshair.add(this.scene.add.line(-20, 0, 0, 0, 15, 0, 0x0000ff, 0.7));
    crosshair.add(this.scene.add.line(5, 0, 0, 0, 15, 0, 0x0000ff, 0.7));
    crosshair.add(this.scene.add.line(0, -20, 0, 0, 0, 15, 0x0000ff, 0.7));
    crosshair.add(this.scene.add.line(0, 5, 0, 0, 0, 15, 0x0000ff, 0.7));
    
    scopeEffect.add(crosshair);
    
    // プレイヤーに追従
    this.scene.time.addEvent({
      delay: 30,
      callback: () => {
        if (scopeEffect && this.player) {
          scopeEffect.setPosition(this.player.x, this.player.y);
        }
      },
      repeat: -1
    });
    
    // 効果時間（5秒）
    this.scene.time.delayedCall(5000, () => {
      // スコープモード終了
      this.isScopeActive = false;
      
      // 射程を元に戻す
      if (weapon) {
        weapon.resetRangeMultiplier();
      }
      
      // エフェクト削除
      if (scopeEffect) {
        // スコープエフェクトをフェードアウト
        this.scene.tweens.add({
          targets: scopeEffect,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            scopeEffect.destroy();
          }
        });
      }
    });
    
    // 効果音
    try {
      this.scene.sound.play('scope_activate');
    } catch (e) {}
  }
  
  useUltimate(): void {
    // ピアシングショット: マップを横断する強力な一撃
    const angle = this.player.rotation;
    const range = 2000; // 非常に長い射程
    
    // 照準線（準備）
    const aimLine = this.scene.add.line(
      0, 0,
      this.player.x, this.player.y,
      this.player.x + Math.cos(angle) * range,
      this.player.y + Math.sin(angle) * range,
      0xff0000, 0.5
    ).setOrigin(0, 0).setLineWidth(1);
    
    // 照準の警告エフェクト
    this.scene.tweens.add({
      targets: aimLine,
      alpha: { from: 0.2, to: 0.8 },
      yoyo: true,
      repeat: 1,
      duration: 300,
      onComplete: () => {
        // 警告後に本命の弾を発射
        this.fireUltimateShot(angle, range);
        aimLine.destroy();
      }
    });
    
    // レーザーサイトの効果音
    try {
      this.scene.sound.play('laser_sight');
    } catch (e) {}
  }
  
  private fireUltimateShot(angle: number, range: number): void {
    // 直線上の終点座標
    const endX = this.player.x + Math.cos(angle) * range;
    const endY = this.player.y + Math.sin(angle) * range;
    
    // ビーム表示
    const beam = this.scene.add.rectangle(
      this.player.x, this.player.y, 
      range, 5, 
      0xff0000, 0.7
    ).setOrigin(0, 0.5).setRotation(angle);
    
    // フラッシュエフェクト
    this.scene.cameras.main.flash(300, 255, 255, 255, true);
    
    // ビームのフェードアウト
    this.scene.tweens.add({
      targets: beam,
      alpha: 0,
      width: range * 1.1,
      height: 2,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        beam.destroy();
      }
    });
    
    // 直線上の敵にダメージ
    const enemies = (this.scene as any).enemyBots;
    if (enemies) {
      enemies.forEach((enemy: any) => {
        if (enemy && enemy.bot) {
          // 直線との距離を計算
          const dist = Phaser.Math.Distance.PointToLine(
            { x: enemy.bot.x, y: enemy.bot.y },
            { x: this.player.x, y: this.player.y },
            { x: endX, y: endY }
          );
          
          // 直線上の敵（許容範囲）にダメージ
          if (dist <= 20) {
            // 壁チェックなし - 貫通攻撃なので
            enemy.bot.takeDamage(150);
            
            // 被弾エフェクト
            this.scene.add.particles(enemy.bot.x, enemy.bot.y, 'default', {
              speed: 100,
              scale: { start: 0.4, end: 0 },
              blendMode: 'ADD',
              tint: 0xff0000,
              lifespan: 300,
              quantity: 10
            });
          }
        }
      });
    }
    
    // 射撃音
    try {
      this.scene.sound.play('sniper_ultimate');
    } catch (e) {}
  }
}
