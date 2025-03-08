import Phaser from 'phaser';
import { TeamType, AimType, GameConfig } from '../config';
import { Character } from './Character';

export interface ProjectileConfig {
  speed: number;
  damage: number;
  range: number;
  lifespan: number;
  aimType: AimType;
  piercing: boolean;
  aoe: boolean;
  aoeRadius?: number;
  knockback?: number;
  spreadAngle?: number;
}

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  protected config: ProjectileConfig;
  protected team: TeamType;
  protected owner: Character;
  protected startPosition: { x: number, y: number };
  protected hasHit: boolean = false;
  protected hitEnemies: Set<Character> = new Set();
  
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    owner: Character,
    config: ProjectileConfig,
    team: TeamType
  ) {
    super(scene, x, y, texture);
    this.config = config;
    this.team = team;
    this.owner = owner;
    this.startPosition = { x, y };
    
    // 物理設定
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setOrigin(0.5, 0.5);
    this.setScale(0.8);
    
    // 衝突サイズの調整
    if (this.body) {
      this.body.setSize(this.width * 0.7, this.height * 0.7);
    }
    
    // 寿命設定
    scene.time.delayedCall(config.lifespan, this.destroy, [], this);
  }
  
  // 発射
  fire(directionX: number, directionY: number): void {
    // 向きに合わせて回転
    const angle = Math.atan2(directionY, directionX);
    this.setRotation(angle);
    
    // 速度設定
    const velocityX = Math.cos(angle) * this.config.speed;
    const velocityY = Math.sin(angle) * this.config.speed;
    this.setVelocity(velocityX, velocityY);
    
    // 放物線の場合は重力を設定
    if (this.config.aimType === AimType.PARABOLIC && this.body) {
      // ArcadeBodyのみがgravityYを持っているため型チェック
      if (this.body instanceof Phaser.Physics.Arcade.Body) {
        this.body.setGravityY(300);
      }
    }
  }
  
  // 弾の挙動を更新
  update(time: number, delta: number): void {
    // 発射位置からの距離をチェック
    const distance = Phaser.Math.Distance.Between(
      this.startPosition.x,
      this.startPosition.y,
      this.x,
      this.y
    );
    
    // 射程範囲を超えた場合
    if (distance > this.config.range) {
      this.hitTarget();
    }
    
    // 放物線の場合は地面に当たったら爆発
    if (this.config.aimType === AimType.PARABOLIC) {
      // マップの境界チェック（簡易的に下端との判定）
      if (this.y >= GameConfig.MAP_HEIGHT * GameConfig.BLOCK_SIZE - 10) {
        this.hitTarget();
      }
    }
  }
  
  // 対象にヒットしたときの処理
  hitTarget(target?: Character): void {
    if (this.hasHit) return;
    
    if (this.config.aoe) {
      // 範囲攻撃の場合
      this.explode();
    } else if (target) {
      // 単体攻撃の場合
      this.dealDamage(target);
      
      // ノックバックがある場合
      if (this.config.knockback && this.config.knockback > 0) {
        this.applyKnockback(target);
      }
      
      // 貫通しない場合は弾を消す
      if (!this.config.piercing) {
        this.hasHit = true;
        this.destroy();
      } else {
        // 貫通する場合は対象を記録
        this.hitEnemies.add(target);
      }
    } else {
      // 何にもヒットせずに範囲に達した場合
      if (this.config.aimType === AimType.PARABOLIC && this.config.aoe) {
        // 放物線の爆発物は地面に当たると爆発
        this.explode();
      } else {
        this.destroy();
      }
    }
  }
  
  // 範囲爆発処理
  protected explode(): void {
    if (this.hasHit) return;
    
    this.hasHit = true;
    
    // 爆発エフェクト
    const explosion = this.scene.add.sprite(this.x, this.y, 'explosion');
    explosion.setScale(this.config.aoeRadius ? this.config.aoeRadius / 32 : 2);
    explosion.play('explosion');
    
    // 爆発サウンド
    this.scene.sound.play('explosion', { volume: 0.5 });
    
    // 範囲内の敵にダメージ
    const radius = this.config.aoeRadius || 100;
    const targets = this.scene.physics.overlapCirc(this.x, this.y, radius);
    
    for (const target of targets) {
      if (target.gameObject instanceof Character && target.gameObject.team !== this.team) {
        this.dealDamage(target.gameObject);
        
        // ノックバックがある場合
        if (this.config.knockback && this.config.knockback > 0) {
          this.applyKnockback(target.gameObject);
        }
      }
    }
    
    // アニメーション完了後に削除
    this.scene.time.delayedCall(500, () => {
      explosion.destroy();
      this.destroy();
    });
  }
  
  // ダメージ適用
  protected dealDamage(target: Character): void {
    // すでにヒットした敵には適用しない（貫通弾の場合）
    if (this.hitEnemies.has(target)) return;
    
    target.takeDamage(this.config.damage);
  }
  
  // ノックバック適用
  protected applyKnockback(target: Character): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    const knockbackX = Math.cos(angle) * this.config.knockback!;
    const knockbackY = Math.sin(angle) * this.config.knockback!;
    
    if (target.body) {
      target.body.velocity.x += knockbackX;
      target.body.velocity.y += knockbackY;
    }
  }
}
