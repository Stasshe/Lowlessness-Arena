import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { Weapon, WeaponType } from './Weapon';
import { CharacterType } from '../characters/CharacterFactory'; // CharacterTypeをインポート

// スキルタイプの列挙
export enum SkillType {
  NONE = 'none',
  SHIELD = 'shield',
  DASH = 'dash',
  SCOPE = 'scope',
  HEAL = 'heal',
  BOMB = 'bomb',
  MINEFIELD = 'minefield'
}

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
  private specialAbility: SkillType = SkillType.NONE;
  public isInBush: boolean = false;
  private isInvincible: boolean = false;
  private isDashing: boolean = false;
  private isShielded: boolean = false;
  private shieldEndTime: number = 0;
  private shieldReduction: number = 0.3; // 30%ダメージ軽減
  private _isAlive: boolean = true; // isAliveプロパティを追加
  private characterType: CharacterType = CharacterType.DEFAULT; // キャラクタータイプを保持するプロパティを追加
  private skillEffect: Phaser.GameObjects.Container | null = null;
  private healthBar: Phaser.GameObjects.Graphics;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    
    // シーンに追加して物理演算を有効化
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // 物理ボディの設定
    this.setCircle(GameConfig.CHARACTER_RADIUS);
    this.setCollideWorldBounds(true);
    
    // 武器の初期化
    this.weapon = new Weapon(scene, this, WeaponType.DEFAULT);
    
    // ヘルスバーの初期化
    this.healthBar = scene.add.graphics();
    this.updateHealthBar();
  }
  
  update(time: number): void {
    // ヘルスバーの位置を更新
    this.updateHealthBar();
    
    // アクティブなエフェクトの更新
    if (this.skillEffect) {
      this.skillEffect.setPosition(this.x, this.y);
    }

    // シールド効果の終了をチェック
    if (this.isShielded && time > this.shieldEndTime) {
      this.removeShield();
    }
    
    // ダッシュ状態の更新
    if (this.isDashing && this.body instanceof Phaser.Physics.Arcade.Body) {
      // ダッシュ中は摩擦を低減
      this.body.setDamping(true);
      this.body.setDrag(0.8, 0.8);
    } else if (this.body instanceof Phaser.Physics.Arcade.Body) {
      this.body.setDamping(true);
      this.body.setDrag(0.9, 0.9);
    }
  }
  
  private updateHealthBar(): void {
    this.healthBar.clear();
    
    // ヘルスバーは常にプレイヤーの上部に表示
    const barX = this.x - 25;
    const barY = this.y - 40;
    const width = 50;
    const height = 6;
    const borderWidth = 2;
    
    // 背景（黒）
    this.healthBar.fillStyle(0x000000, 0.8);
    this.healthBar.fillRect(barX - borderWidth, barY - borderWidth, width + borderWidth * 2, height + borderWidth * 2);
    
    // HPの割合に応じて色を変更
    const ratio = this.health / this.maxHealth;
    let color = 0xff0000; // 赤
    
    if (ratio > 0.7) {
      color = 0x00ff00; // 緑
    } else if (ratio > 0.3) {
      color = 0xffff00; // 黄
    }
    
    // 内側（HP）
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(barX, barY, width * ratio, height);
  }
  
  move(directionX: number, directionY: number): void {
    // 死亡状態ではない場合のみ移動可能
    if (this.currentState === PlayerState.DEAD) return;
    
    // 物理ボディがnullでないことを確認
    if (!this.body) {
      console.warn('物理ボディが初期化されていません。再初期化します。');
      this.scene.physics.world.enable(this);
      return;
    }
    
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
  
  useSkill(targetX?: number, targetY?: number): boolean {
    // 死亡状態ではスキル使用不可
    if (this.currentState === PlayerState.DEAD) return false;
    
    const currentTime = this.scene.time.now;
    
    // クールダウンチェック
    if (currentTime - this.skillLastUsed < this.skillCooldown) {
      return false;
    }
    
    // スキル使用時刻を更新
    this.skillLastUsed = currentTime;
    
    // ターゲット座標がなければプレイヤーの向いている方向を使用
    if (targetX === undefined || targetY === undefined) {
      const angle = this.rotation;
      const distance = 200; // デフォルトの距離
      targetX = this.x + Math.cos(angle) * distance;
      targetY = this.y + Math.sin(angle) * distance;
    }
    
    // スキルの効果を発動
    this.activateSpecialAbility(targetX, targetY);
    
    // スキルを使うとアルティメットゲージが少し増える
    this.addUltimateCharge(10);
    
    // 茂みにいる場合は一時的に表示
    if (this.isInBush) {
      this.temporarilyReveal();
    }
    
    return true;
  }
  
  useUltimate(): boolean {
    // 死亡状態ではアルティメット使用不可
    if (this.currentState === PlayerState.DEAD) return false;
    
    const currentTime = this.scene.time.now;
    
    // クールダウンチェック
    if (currentTime - this.ultimateLastUsed < this.ultimateCooldown) {
      return false;
    }
    
    this.ultimateLastUsed = currentTime;
    this.currentState = PlayerState.USING_SKILL;
    
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
    
    return true;
  }
  
  takeDamage(amount: number): void {
    if (!this._isAlive || this.isInvincible) return;
    
    // シールド効果がある場合はダメージ軽減
    if (this.isShielded) {
      amount *= (1 - this.shieldReduction);
    }
    
    // HPを減らす
    this.health -= amount;
    
    // 被弾した場合、茂みの中にいても姿が見える
    this.setAlpha(1.0);
    
    // 被弾したプレイヤーを一時的に点滅させる
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 2
    });
    
    // 被弾エフェクトを表示
    this.scene.events.emit('hit', this.x, this.y, amount);
    
    // 被弾効果音
    try {
      this.scene.sound.play('player_hit');
    } catch (e) {}
    
    // HPが0以下になったら死亡
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
    
    // アルティメットゲージを増加（被弾でもゲージは溜まる）
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
    
    // ヘルスバーを更新
    this.updateHealthBar();
  }
  
  die(): void {
    if (!this._isAlive) return;
    
    this._isAlive = false;
    this.currentState = PlayerState.DEAD;
    
    // 死亡エフェクト
    this.scene.events.emit('death', this.x, this.y);
    
    // 物理ボディを無効化
    if (this.body) {
      this.body.enable = false;
    }
    
    // 透明にする
    this.setAlpha(0.5);
    
    // 死亡効果音
    try {
      this.scene.sound.play('player_death');
    } catch (e) {}
    
    // 3秒後に復活
    this.scene.time.delayedCall(3000, () => {
      this.respawn();
    });
  }
  
  respawn(): void {
    // 復活処理
    this.health = this.maxHealth;
    this._isAlive = true;
    this.currentState = PlayerState.IDLE;
    this.isInvincible = true;
    
    // 物理ボディを再度有効化
    if (this.body) {
      this.body.enable = true;
    }
    
    // 通常表示に戻す
    this.setAlpha(1.0);
    
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
    
    // ヘルスバーを更新
    this.updateHealthBar();
    
    // 一定時間後に無敵を解除
    this.scene.time.delayedCall(1500, () => {
      this.isInvincible = false;
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
  
  private activateSpecialAbility(targetX: number, targetY: number): void {
    // 使用中状態に設定
    this.currentState = PlayerState.USING_SKILL;
    
    // 特殊能力の種類に応じて異なる効果を発動
    switch (this.specialAbility) {
      case SkillType.SHIELD:
        // シールド効果（一時的にダメージ軽減）
        this.createShieldEffect();
        break;
        
      case SkillType.DASH:
        // ダッシュ効果（指定方向に素早く移動）
        this.performDash(targetX, targetY);
        break;
        
      case SkillType.HEAL:
        // 回復効果
        this.heal(30);
        break;
        
      case SkillType.SCOPE:
        // スコープ効果（射程や精度が上がる）
        this.activateScopeMode();
        break;
        
      case SkillType.BOMB:
        // 爆弾投げ
        this.throwBomb(targetX, targetY);
        break;
        
      case SkillType.MINEFIELD:
        // 地雷設置
        this.placeMine();
        break;
    }
    
    // 短い遅延後にアイドル状態に戻す（必要に応じてスキル内でオーバーライド可能）
    this.scene.time.delayedCall(500, () => {
      if (this.currentState === PlayerState.USING_SKILL) {
        this.currentState = PlayerState.IDLE;
      }
    });
  }
  
  private createShieldEffect(): void {
    this.isShielded = true;
    this.shieldEndTime = this.scene.time.now + 3000; // 3秒間持続
    
    // シールドエフェクト
    this.scene.events.emit('skill', SkillType.SHIELD, this.x, this.y);
    
    // シールド効果音
    try {
      this.scene.sound.play('shield_activate');
    } catch (e) {}
  }
  
  private removeShield(): void {
    this.isShielded = false;
  }
  
  private performDash(targetX: number, targetY: number): void {
    // ダッシュの方向ベクトルを計算
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 方向を正規化
    const nx = dx / distance;
    const ny = dy / distance;
    
    // ダッシュの最大距離を200に制限
    const dashDistance = Math.min(distance, 200);
    
    // ダッシュ先の座標を計算
    const dashX = this.x + nx * dashDistance;
    const dashY = this.y + ny * dashDistance;
    
    // ダッシュ中の軌跡エフェクト
    const trail = this.scene.add.particles(this.x, this.y, 'default', {
      speed: 0,
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 300,
      quantity: 1,
      frequency: 10
    });
    
    // Tweenでダッシュ移動
    this.scene.tweens.add({
      targets: this,
      x: dashX,
      y: dashY,
      duration: 200,
      ease: 'Power2',
      onUpdate: () => {
        // 移動中の軌跡の位置を更新
        trail.setPosition(this.x, this.y);
      },
      onComplete: () => {
        // 移動完了時
        trail.destroy();
        this.currentState = PlayerState.IDLE;
      }
    });
    
    // 効果音
    try {
      this.scene.sound.play('dash');
    } catch (e) {}
  }
  
  private activateScopeMode(): void {
    // スコープモードを有効化（武器の精度と射程を向上）
    this.weapon.setRangeMultiplier(1.5);
    
    // ビジュアルエフェクト
    const scope = this.scene.add.circle(0, 0, GameConfig.CHARACTER_RADIUS * 2, 0x0000ff, 0.2);
    scope.setStrokeStyle(1, 0x0000ff, 0.5);
    
    // コンテナに格納
    this.skillEffect = this.scene.add.container(this.x, this.y, [scope]);
    
    // 効果時間
    this.scene.time.delayedCall(3000, () => {
      // 効果終了
      this.weapon.resetRangeMultiplier();
      
      if (this.skillEffect) {
        this.skillEffect.destroy();
        this.skillEffect = null;
      }
    });
  }
  
  private throwBomb(targetX: number, targetY: number): void {
    // 爆弾を投げる方向ベクトルを計算
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 飛距離を制限（最大300）
    const range = Math.min(distance, 300);
    const angle = Math.atan2(dy, dx);
    const bombX = this.x + Math.cos(angle) * range;
    const bombY = this.y + Math.sin(angle) * range;
    
    // 爆弾オブジェクトを作成
    const bomb = this.scene.physics.add.image(this.x, this.y, 'default')
      .setDisplaySize(16, 16)
      .setTint(0xff6600);
    
    // 投擲アニメーション
    this.scene.tweens.add({
      targets: bomb,
      x: bombX,
      y: bombY,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        // 着弾時に爆発
        this.explode(bombX, bombY, 100, 20);
        bomb.destroy();
      }
    });
    
    // 弧を描くように上に上がるアニメーション
    this.scene.tweens.add({
      targets: bomb,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: 500,
      yoyo: true,
      ease: 'Sine.easeOut'
    });
    
    // 投げる効果音
    try {
      this.scene.sound.play('throw');
    } catch (e) {}
  }
  
  private explode(x: number, y: number, damage: number, radius: number): void {
    // 爆発エフェクト
    this.scene.add.circle(x, y, radius, 0xff6600, 0.5)
      .setStrokeStyle(4, 0xff8800, 1);
    
    const particles = this.scene.add.particles(x, y, 'default', {
      speed: 200,
      scale: { start: 0.4, end: 0 },
      blendMode: 'ADD',
      tint: 0xff7700,
      lifespan: 800,
      quantity: 30
    });
    
    // エフェクトを一定時間後に消す
    this.scene.time.delayedCall(800, () => {
      particles.destroy();
    });
    
    // 爆発範囲内の敵にダメージを与える処理
    // （ここではシンプルに円形の範囲でチェック）
    const enemies = (this.scene as any).enemyBots;
    if (enemies) {
      enemies.forEach((enemy: any) => {
        const bot = enemy.bot;
        if (bot) {
          const distance = Phaser.Math.Distance.Between(x, y, bot.x, bot.y);
          if (distance <= radius) {
            // 距離に応じたダメージ減衰
            const actualDamage = damage * (1 - distance / radius);
            bot.takeDamage(actualDamage);
          }
        }
      });
    }
    
    // 爆発音
    try {
      this.scene.sound.play('explosion');
    } catch (e) {}
  }
  
  private placeMine(): void {
    // プレイヤーの位置に地雷を設置
    const mine = this.scene.physics.add.sprite(this.x, this.y, 'default')
      .setDisplaySize(16, 16)
      .setTint(0xff0000)
      .setAlpha(0.7)
      .setDepth(1); // プレイヤーより下に表示
    
    // 地雷の当たり判定を設定
    if (mine.body) {
      mine.body.setCircle(8);
      mine.body.immovable = true;
    }
    
    // 敵との衝突判定を追加
    const enemies = (this.scene as any).enemyBots;
    if (enemies) {
      enemies.forEach((enemy: any) => {
        if (enemy && enemy.bot) {
          this.scene.physics.add.overlap(
            mine, 
            enemy.bot, 
            () => {
              // 地雷爆発
              this.explode(mine.x, mine.y, 80, 80);
              mine.destroy();
            }
          );
        }
      });
    }
    
    // 設置音
    try {
      this.scene.sound.play('mine_place');
    } catch (e) {}
  }
  
  private activateUltimate(): void {
    // キャラクターに応じた強力な効果
    // 例: 大爆発
    const blastRadius = 300;
    
    // 爆発エフェクト - 1段階目
    this.scene.add.circle(this.x, this.y, blastRadius * 0.3, 0xffff00, 0.8)
      .setStrokeStyle(5, 0xffffff, 1);
    
    // 爆発エフェクト - 2段階目
    this.scene.time.delayedCall(300, () => {
      this.scene.add.circle(this.x, this.y, blastRadius * 0.6, 0xff8800, 0.6)
        .setStrokeStyle(3, 0xffaa00, 0.8);
    });
    
    // 爆発エフェクト - 3段階目（最大）
    this.scene.time.delayedCall(600, () => {
      this.scene.add.circle(this.x, this.y, blastRadius, 0xff5500, 0.4)
        .setStrokeStyle(2, 0xff7700, 0.6);
      
      // パーティクルエフェクト
      const particles = this.scene.add.particles(this.x, this.y, 'default', {
        speed: 300,
        scale: { start: 0.5, end: 0 },
        blendMode: 'ADD',
        tint: 0xff8800,
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
            const distance = Phaser.Math.Distance.Between(this.x, this.y, bot.x, bot.y);
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
      this.scene.sound.play('ultimate_activate');
    } catch (e) {}
  }
  
  // スキル使用時間とクールダウン関連のプロパティ
  private skillLastUsed: number = 0;
  private ultimateLastUsed: number = 0;
  private skillCooldown: number = GameConfig.SKILL_COOLDOWN;
  private ultimateCooldown: number = GameConfig.ULTIMATE_COOLDOWN;
  
  canUseSkill(): boolean {
    return (this.scene.time.now - this.skillLastUsed) >= this.skillCooldown;
  }
  
  canUseUltimate(): boolean {
    return (this.scene.time.now - this.ultimateLastUsed) >= this.ultimateCooldown;
  }
  
  getSkillCooldownPercent(): number {
    const elapsed = this.scene.time.now - this.skillLastUsed;
    return Math.min(1, elapsed / this.skillCooldown);
  }
  
  getUltimateCooldownPercent(): number {
    const elapsed = this.scene.time.now - this.ultimateLastUsed;
    return Math.min(1, elapsed / this.ultimateCooldown);
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
  
  setWeapon(type: WeaponType): void {  // 引数の型を修正
    this.weapon = new Weapon(this.scene, this, type);
  }
  
  setSpecialAbility(ability: SkillType): void {
    this.specialAbility = ability;
  }
  
  getWeapon(): Weapon {
    return this.weapon;
  }
  
  // 物理ボディを確認し、必要なら再初期化するメソッド
  ensurePhysicsBody(): void {
    if (!this.body) {
      this.scene.physics.world.enable(this);
      this.setCircle(GameConfig.CHARACTER_RADIUS);
      this.setCollideWorldBounds(true);
    }
  }

  // スキルタイプを取得するゲッターメソッド
  getSkillType(): SkillType {
    return this.specialAbility;
  }
  
  // 武器タイプを取得するゲッターメソッド
  getWeaponType(): WeaponType {
    return this.weapon.getType();
  }

  // キャラクタータイプを設定するメソッド
  setCharacterType(type: CharacterType): void {
    this.characterType = type;
  }
  
  // キャラクタータイプを取得するメソッド
  getCharacterType(): CharacterType {
    return this.characterType;
  }

  // リソース開放
  destroy(): void {
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    
    if (this.skillEffect) {
      this.skillEffect.destroy();
    }
    
    super.destroy();
  }
}
