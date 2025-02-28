import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { Weapon } from './Weapon';

export enum PlayerState {
  IDLE = 'idle',
  MOVING = 'moving',
  ATTACKING = 'attacking',
  RELOADING = 'reloading',
  USING_SKILL = 'using_skill',
  DEAD = 'dead'
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  private currentState: PlayerState = PlayerState.IDLE;
  private health: number = 100;
  private maxHealth: number = 100;
  private weapon: Weapon;
  private skillCharge: number = 0;
  private maxSkillCharge: number = 100;
  private ultimateCharge: number = 0;
  private maxUltimateCharge: number = 100;
  private moveSpeed: number = GameConfig.CHARACTER_SPEED;
  private specialAbility: string = 'none';
  private isInBush: boolean = false;
  private isVisible: boolean = true;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    
    // シーンに追加して物理演算を有効化
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // 物理ボディの設定
    this.setCircle(GameConfig.CHARACTER_RADIUS);
    this.setCollideWorldBounds(true);
    
    // 武器の初期化
    this.weapon = new Weapon(scene, this, 'default');
  }
  
  move(directionX: number, directionY: number): void {
    // 死亡状態ではない場合のみ移動可能
    if (this.currentState === PlayerState.DEAD) return;
    
    // 方向ベクトルが0でない場合のみ移動
    if (directionX !== 0 || directionY !== 0) {
      // ベクトルを正規化し、速さを設定
      const length = Math.sqrt(directionX * directionX + directionY * directionY);
      const normalizedX = directionX / length;
      const normalizedY = directionY / length;
      
      this.setVelocity(
        normalizedX * this.moveSpeed,
        normalizedY * this.moveSpeed
      );
      
      // 移動状態に設定
      this.currentState = PlayerState.MOVING;
      
      // キャラクターの向きを移動方向に合わせる
      this.setRotation(Math.atan2(normalizedY, normalizedX));
    } else {
      // 移動していない場合は停止
      this.setVelocity(0, 0);
      
      // 他の状態でない場合はアイドル状態に
      if (this.currentState === PlayerState.MOVING) {
        this.currentState = PlayerState.IDLE;
      }
    }
  }
  
  attack(targetX: number, targetY: number): void {
    // 死亡状態では攻撃不可
    if (this.currentState === PlayerState.DEAD) return;
    
    if (this.currentState !== PlayerState.ATTACKING && this.currentState !== PlayerState.RELOADING) {
      // 攻撃方向の計算
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const angle = Math.atan2(dy, dx);
      
      // 武器の発射
      this.weapon.fire(angle);
      
      // スキルチャージの増加
      this.addSkillCharge(5);
      
      // 茂みにいる場合は一時的に表示
      if (this.isInBush) {
        this.temporarilyReveal();
      }
    }
  }
  
  useSkill(): void {
    // 死亡状態ではスキル使用不可
    if (this.currentState === PlayerState.DEAD) return;
    
    if (this.skillCharge >= this.maxSkillCharge) {
      this.currentState = PlayerState.USING_SKILL;
      this.skillCharge = 0;
      
      // スキル使用のロジック
      this.activateSpecialAbility();
      
      // スキル使用後、少しディレイを設定
      this.scene.time.delayedCall(1000, () => {
        if (this.currentState === PlayerState.USING_SKILL) {
          this.currentState = PlayerState.IDLE;
        }
      });
      
      // スキルを使うとアルティメットゲージが少し増える
      this.addUltimateCharge(10);
      
      // 茂みにいる場合は一時的に表示
      if (this.isInBush) {
        this.temporarilyReveal();
      }
    }
  }
  
  useUltimate(): void {
    // 死亡状態ではアルティメット使用不可
    if (this.currentState === PlayerState.DEAD) return;
    
    if (this.ultimateCharge >= this.maxUltimateCharge) {
      this.currentState = PlayerState.USING_SKILL;
      this.ultimateCharge = 0;
      
      // アルティメットのロジック
      this.activateUltimate();
      
      // 使用後のディレイ
      this.scene.time.delayedCall(2000, () => {
        if (this.currentState === PlayerState.USING_SKILL) {
          this.currentState = PlayerState.IDLE;
        }
      });
      
      // 茂みにいる場合は一時的に表示
      if (this.isInBush) {
        this.temporarilyReveal();
      }
    }
  }
  
  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    
    // パーティクルエフェクト
    this.scene.add.particles(this.x, this.y, 'default', {
      speed: 100,
      scale: { start: 0.2, end: 0 },
      blendMode: 'ADD',
      tint: 0xff0000,
      lifespan: 300,
      quantity: 10
    });
    
    // 体力が0になったら死亡状態に
    if (this.health <= 0) {
      this.die();
    }
    
    // 茂みにいる場合は一時的に表示
    if (this.isInBush) {
      this.temporarilyReveal();
    }
    
    // アルティメットゲージが少し増える
    this.addUltimateCharge(5);
  }
  
  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
    
    // 回復エフェクト
    this.scene.add.particles(this.x, this.y, 'default', {
      speed: 50,
      scale: { start: 0.2, end: 0 },
      blendMode: 'ADD',
      tint: 0x00ff00,
      lifespan: 500,
      quantity: 15
    });
  }
  
  die(): void {
    this.currentState = PlayerState.DEAD;
    this.setVelocity(0, 0);
    this.setTint(0xff0000);
    
    // 死亡エフェクト
    this.scene.add.particles(this.x, this.y, 'default', {
      speed: 200,
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      tint: 0xff0000,
      lifespan: 800,
      quantity: 30
    });
    
    // トレーニングモードではすぐに復活
    this.scene.time.delayedCall(3000, () => {
      this.revive();
    });
  }
  
  revive(): void {
    this.health = this.maxHealth;
    this.currentState = PlayerState.IDLE;
    this.clearTint();
    
    // スポーンポイントに戻す
    const map = (this.scene as any).map; // シーンからマップへの参照を取得
    if (map) {
      const spawnPoint = map.getSpawnPoint();
      this.setPosition(spawnPoint.x, spawnPoint.y);
    }
    
    // 復活エフェクト
    this.scene.add.particles(this.x, this.y, 'default', {
      speed: 100,
      scale: { start: 0, end: 0.5 },
      blendMode: 'ADD',
      tint: 0x00ffff,
      lifespan: 600,
      quantity: 20
    });
  }
  
  enterBush(): void {
    if (!this.isInBush) {
      this.isInBush = true;
      // 茂みに入るとプレイヤーを半透明に
      this.setAlpha(0.5);
    }
  }
  
  exitBush(): void {
    if (this.isInBush) {
      this.isInBush = false;
      // 茂みから出るとプレイヤーを完全に表示
      this.setAlpha(1.0);
    }
  }
  
  temporarilyReveal(): void {
    // 茂みの中でもアクションをすると一時的に見える
    this.setAlpha(0.8);
    this.scene.time.delayedCall(500, () => {
      if (this.isInBush) {
        this.setAlpha(0.5);
      }
    });
  }
  
  private activateSpecialAbility(): void {
    // 特殊能力の種類に応じて異なる効果を発動
    switch (this.specialAbility) {
      case 'shield':
        // シールド効果（一時的に無敵になる）
        this.setTint(0x0088ff);
        // 実際の効果はここに実装
        this.scene.time.delayedCall(1000, () => {
          this.clearTint();
        });
        break;
        
      case 'dash':
        // ダッシュ効果（一時的に速度上昇）
        const oldSpeed = this.moveSpeed;
        this.moveSpeed *= 2;
        this.scene.time.delayedCall(1000, () => {
          this.moveSpeed = oldSpeed;
        });
        break;
        
      case 'heal':
        // 回復効果
        this.heal(30);
        break;
        
      case 'scope':
        // スコープ効果（射程や精度が上がる）
        // 実際の効果はここに実装
        break;
        
      case 'minefield':
        // 地雷設置
        // 実際の効果はここに実装
        break;
    }
  }
  
  private activateUltimate(): void {
    // アルティメット効果（キャラクターによって異なる強力な効果）
    // 現状は単純な攻撃範囲ダメージのエフェクトを表示
    const particles = this.scene.add.particles(this.x, this.y, 'default', {
      speed: 300,
      scale: { start: 0.2, end: 1.0 },
      blendMode: 'ADD',
      tint: 0xff8800,
      lifespan: 1000,
      quantity: 50,
      emitZone: {
        type: 'edge',
        source: new Phaser.Geom.Circle(0, 0, 200),
        quantity: 50
      }
    });
    
    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });
  }
  
  addSkillCharge(amount: number): void {
    this.skillCharge = Math.min(this.maxSkillCharge, this.skillCharge + amount);
  }
  
  addUltimateCharge(amount: number): void {
    this.ultimateCharge = Math.min(this.maxUltimateCharge, this.ultimateCharge + amount);
  }
  
  getHealth(): number {
    return this.health;
  }
  
  getMaxHealth(): number {
    return this.maxHealth;
  }
  
  setMaxHealth(value: number): void {
    this.maxHealth = value;
    this.health = value;
  }
  
  getSkillCharge(): number {
    return this.skillCharge;
  }
  
  getUltimateCharge(): number {
    return this.ultimateCharge;
  }
  
  getState(): PlayerState {
    return this.currentState;
  }
  
  setSpeed(value: number): void {
    this.moveSpeed = value;
  }
  
  setWeapon(type: string): void {
    this.weapon = new Weapon(this.scene, this, type);
  }
  
  setSpecialAbility(ability: string): void {
    this.specialAbility = ability;
  }
  
  getWeapon(): Weapon {
    return this.weapon;
  }
}
