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

// オブジェクトプールの追加
export class ProjectilePool {
  private scene: Phaser.Scene;
  private pool: Phaser.GameObjects.Group;
  private texture: string;
  private owner: Character;
  private config: ProjectileConfig;
  private team: TeamType;
  
  constructor(scene: Phaser.Scene, texture: string, owner: Character, config: ProjectileConfig, team: TeamType) {
    this.scene = scene;
    this.texture = texture;
    this.owner = owner;
    this.config = config;
    this.team = team;
    
    // オブジェクトプールを作成
    this.pool = this.scene.add.group({
      classType: Projectile,
      active: false,
      visible: false,
      key: texture,
      maxSize: 20, // 最大プール数
      runChildUpdate: true // 子要素のupdateメソッドを自動実行
    });
  }
  
  // プールから弾を取得して発射
  fire(x: number, y: number, directionX: number, directionY: number): Projectile | null {
    let projectile = this.pool.getFirstDead(false) as Projectile;
    
    if (!projectile) {
      // プールが枯渇した場合は新しく作成するか、nullを返す
      if (this.pool.getLength() < 20) {
        projectile = new Projectile(
          this.scene, 
          x, 
          y, 
          this.texture, 
          this.owner,
          this.config,
          this.team
        );
        this.pool.add(projectile);
      } else {
        return null;
      }
    }
    
    // 弾を再設定して発射
    projectile.reset(x, y);
    projectile.fire(directionX, directionY);
    
    return projectile;
  }
}

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  protected config: ProjectileConfig;
  protected team: TeamType;
  protected owner: Character;
  protected startPosition: { x: number, y: number };
  protected hasHit: boolean = false;
  protected hitEnemies: Set<Character> = new Set();
  protected travelDistance: number = 0; // 移動距離の追跡
  protected prevX: number = 0;
  protected prevY: number = 0;
  
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
  
  // オブジェクトリセット用のメソッド追加
  reset(x: number, y: number): void {
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(x, y);
    this.hasHit = false;
    this.hitEnemies.clear();
    this.travelDistance = 0;
    this.prevX = x;
    this.prevY = y;
    this.startPosition = { x, y };
    
    // 物理ボディのリセット
    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).reset(x, y);
    }
  }
  
  // 弾の挙動を更新
  update(time: number, delta: number): void {
    // パフォーマンス最適化: 非アクティブな弾はスキップ
    if (!this.active) return;
    
    // 移動距離の計算（毎フレーム累積）
    const dx = this.x - this.prevX;
    const dy = this.y - this.prevY;
    const moveDist = Math.sqrt(dx * dx + dy * dy);
    this.travelDistance += moveDist;
    this.prevX = this.x;
    this.prevY = this.y;
    
    // 射程範囲を超えた場合
    if (this.travelDistance > this.config.range) {
      this.hitTarget();
      return;
    }
    
    // 画面外に出た場合
    const padding = 100;
    if (
      this.x < -padding ||
      this.x > this.scene.cameras.main.width + padding ||
      this.y < -padding ||
      this.y > this.scene.cameras.main.height + padding
    ) {
      this.deactivate();
      return;
    }
    
    // 放物線の場合は地面に当たったら爆発
    if (this.config.aimType === AimType.PARABOLIC) {
      // マップの境界チェック（簡易的に下端との判定）
      if (this.y >= GameConfig.MAP_HEIGHT * GameConfig.BLOCK_SIZE - 10) {
        this.hitTarget();
      }
    }
  }
  
  // 非表示と非アクティブ化（オブジェクトプール再利用のため）
  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).stop();
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
        this.deactivate();
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
        this.deactivate();
      }
    }
  }
  
  // destroy をオーバーライドして、非アクティブ化に変更
  destroy(fromScene?: boolean): void {
    if (fromScene) {
      super.destroy(fromScene);
    } else {
      this.deactivate();
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
