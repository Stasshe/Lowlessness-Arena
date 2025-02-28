import Phaser from 'phaser';
import { BaseCharacter } from '../BaseCharacter';
import { Player, SkillType } from '../../objects/Player';
import { WeaponType } from '../../utils/WeaponTypes';
import { GameConfig } from '../../config/GameConfig';


/**
 * ベアトリス（スナイパー）のキャラクタークラス
 */
export class Sniper extends BaseCharacter {
  private ultimateActive: boolean = false;
  private rapidFireTimer: Phaser.Time.TimerEvent | null = null;
  
  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player);
  }
  
  getName(): string {
    return 'ベアトリス';
  }
  
  getSkillName(): string {
    return 'ピアス・ストライク';
  }
  
  getUltimateName(): string {
    return 'ラピッド・ファイア';
  }
  
  getSkillDescription(): string {
    return '壁を貫通するスナイパー銃';
  }
  
  getUltimateDescription(): string {
    return '5秒間連続射撃';
  }
  
  getWeaponType(): WeaponType {
    return WeaponType.SNIPER;
  }
  
  getSkillType(): SkillType {
    return SkillType.PIERCE_SHOT;
  }
  
  initializeStats(): void {
    this.player.setMaxHealth(80);
    this.player.setSpeed(90);
    this.player.setWeapon(this.getWeaponType());
    this.player.setSpecialAbility(this.getSkillType());
    this.player.setTint(0x0000ff);
  }
  
  useSkill(targetX: number, targetY: number): void {
    // ピアス・ストライク: 壁を貫通するスナイパーショット
    const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    const pierceDistance = 1000; // 貫通射程
    const damage = 30; // 貫通弾のダメージ
    
    // レーザーサイトエフェクト
    const laser = this.scene.add.graphics();
    laser.lineStyle(1, 0xff0000, 0.6);
    laser.lineBetween(
      this.player.x, 
      this.player.y, 
      this.player.x + Math.cos(angle) * pierceDistance,
      this.player.y + Math.sin(angle) * pierceDistance
    );
    
    // 短時間表示後に消す
    this.scene.time.delayedCall(100, () => {
      laser.destroy();
    });
    
    // 貫通弾の作成
    const bullet = this.scene.physics.add.image(
      this.player.x, this.player.y, 'default'
    ).setDisplaySize(10, 4)
     .setTint(0xff0000)
     .setRotation(angle)
     .setDepth(4);
    
    // 弾の速度
    const speed = 1200;
    bullet.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    
    // 貫通弾のトレイルエフェクト
    const trail = this.scene.add.particles(this.player.x, this.player.y, 'default', {
      speed: 0,
      scale: { start: 0.3, end: 0 },
      blendMode: 'ADD',
      tint: 0xff0000,
      lifespan: 300,
      quantity: 4,
      frequency: 5
    });
    
    // 弾の更新処理を追加
    const bulletUpdate = this.scene.time.addEvent({
      delay: 16,
      callback: () => {
        trail.setPosition(bullet.x, bullet.y);
        
        // 敵との衝突判定
        const enemies = (this.scene as any).enemyBots;
        if (enemies) {
          enemies.forEach((enemy: any) => {
            if (enemy && enemy.bot) {
              const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.bot.x, enemy.bot.y);
              if (dist < GameConfig.CHARACTER_RADIUS * 1.2) {
                enemy.bot.takeDamage(damage);
                
                // 貫通するので弾は消さない
                this.scene.add.particles(enemy.bot.x, enemy.bot.y, 'default', {
                  speed: 50,
                  scale: { start: 0.2, end: 0 },
                  blendMode: 'ADD',
                  tint: 0xff0000,
                  lifespan: 200,
                  quantity: 15
                });
              }
            }
          });
        }
      },
      callbackScope: this,
      loop: true
    });
    
    // 弾の寿命
    this.scene.time.delayedCall(1000, () => {
      bullet.destroy();
      trail.destroy();
      bulletUpdate.destroy();
    });
    
    // 効果音
    try {
      this.scene.sound.play('sniper_pierce');
    } catch (e) {}
  }
  
  useUltimate(): void {
    // ラピッド・ファイア: 5秒間連続射撃
    this.ultimateActive = true;
    const duration = 5000; // 5秒間
    
    // 連続射撃のセットアップ
    const shotInterval = 300; // 300ミリ秒ごとに発射
    const maxShots = Math.floor(duration / shotInterval);
    
    // エフェクト
    const rapidFireEffect = this.scene.add.circle(this.player.x, this.player.y, GameConfig.CHARACTER_RADIUS * 1.5, 0xff0000, 0.2);
    rapidFireEffect.setStrokeStyle(1, 0xff3300, 0.6);
    
    // エフェクトをプレイヤーに追従
    const effectUpdate = this.scene.time.addEvent({
      delay: 16,
      callback: () => {
        rapidFireEffect.setPosition(this.player.x, this.player.y);
      },
      callbackScope: this,
      loop: true
    });
    
    // 連続射撃
    let currentShot = 0;
    this.rapidFireTimer = this.scene.time.addEvent({
      delay: shotInterval,
      callback: () => {
        if (currentShot >= maxShots || !this.ultimateActive) {
          this.rapidFireTimer?.destroy();
          this.ultimateActive = false;
          return;
        }
        
        // プレイヤーの向きに発射
        const angle = this.player.rotation;
        const distance = 800;
        const targetX = this.player.x + Math.cos(angle) * distance;
        const targetY = this.player.y + Math.sin(angle) * distance;
        
        // 通常攻撃発射
        this.player.attack(targetX, targetY);
        currentShot++;
      },
      callbackScope: this,
      loop: true
    });
    
    // 効果音
    try {
      this.scene.sound.play('rapid_fire');
    } catch (e) {}
    
    // 一定時間後にエフェクト終了
    this.scene.time.delayedCall(duration, () => {
      this.ultimateActive = false;
      if (this.rapidFireTimer) {
        this.rapidFireTimer.destroy();
        this.rapidFireTimer = null;
      }
      rapidFireEffect.destroy();
      effectUpdate.destroy();
    });
  }
  
  destroy(): void {
    if (this.rapidFireTimer) {
      this.rapidFireTimer.destroy();
    }
  }
}
