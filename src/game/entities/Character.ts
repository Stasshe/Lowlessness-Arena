import Phaser from 'phaser';
import { AttackType, TeamType, GameConfig } from '../config';

export interface CharacterStats {
  hp: number;
  maxHp: number;
  speed: number;
  damage: Record<AttackType, number>;
  attackRange: Record<AttackType, number>;
  cooldown: Record<AttackType, number>;
}

export interface CharacterConfig {
  name: string;
  type: string;
  maxHp: number;
  speed: number;
  normalAttackDamage: number;
  skillDamage: number;
  ultimateDamage: number;
  normalAttackRange: number;
  skillRange: number;
  ultimateRange: number;
  normalAttackCooldown: number;
  skillCooldown: number;
  ultimateCooldown: number;
}

export class Character extends Phaser.Physics.Arcade.Sprite {
  protected scene: Phaser.Scene;
  public stats: CharacterStats; // UIからアクセスできるようにpublicに
  
  public team: TeamType; // 同じチームかどうか判定に必要
  protected type: string;
  protected name: string;
  
  protected lastAttackTime: Record<AttackType, number> = {
    [AttackType.NORMAL]: 0,
    [AttackType.SKILL]: 0,
    [AttackType.ULTIMATE]: 0
  };
  
  protected cooldownReady: Record<AttackType, boolean> = {
    [AttackType.NORMAL]: true,
    [AttackType.SKILL]: true,
    [AttackType.ULTIMATE]: false  // アルティメットは最初は使えない
  };
  
  protected healthBar!: Phaser.GameObjects.Graphics;
  protected nameText!: Phaser.GameObjects.Text;
  
  public ultimateCharge: number = 0; // UIからアクセス可能に
  public ultimateChargeMax: number = 100; // UIからアクセス可能に
  protected isUltimateReady: boolean = false;
  
  public isAttacking: boolean = false;
  public isDead: boolean = false;
  protected isInvulnerable: boolean = false;
  
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, config: CharacterConfig, team: TeamType) {
    super(scene, x, y, texture);
    this.scene = scene;
    this.team = team;
    this.type = config.type;
    this.name = config.name;
    
    // キャラクターの基本設定
    this.setOrigin(0.5, 0.5);
    this.setScale(1.5);
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    
    // 物理特性の設定
    if (this.body) {
      this.body.setSize(this.width * 0.6, this.height * 0.6);
      this.body.setOffset(this.width * 0.2, this.height * 0.3);
    }
    
    // キャラクターのステータス初期設定
    this.stats = {
      hp: config.maxHp,
      maxHp: config.maxHp,
      speed: config.speed,
      damage: {
        [AttackType.NORMAL]: config.normalAttackDamage,
        [AttackType.SKILL]: config.skillDamage,
        [AttackType.ULTIMATE]: config.ultimateDamage
      },
      attackRange: {
        [AttackType.NORMAL]: config.normalAttackRange,
        [AttackType.SKILL]: config.skillRange,
        [AttackType.ULTIMATE]: config.ultimateRange
      },
      cooldown: {
        [AttackType.NORMAL]: config.normalAttackCooldown,
        [AttackType.SKILL]: config.skillCooldown,
        [AttackType.ULTIMATE]: config.ultimateCooldown
      }
    };
    
    // 体力バーの作成
    this.createHealthBar();
    
    // 名前テキストの表示
    this.createNameText();
    
    // アニメーション設定
    this.setupAnimations();
  }
  
  // 更新処理（毎フレーム呼ばれる）
  update(time: number, delta: number): void {
    // 死亡状態チェック
    if (this.isDead) return;
    
    // 体力バーの更新
    this.updateHealthBar();
    
    // 名前テキストの更新
    this.updateNameText();
    
    // クールダウンの更新
    this.updateCooldowns(time);
    
    // アルティメットチャージ更新（時間経過でも少しずつチャージ）
    if (!this.isUltimateReady && this.ultimateCharge < this.ultimateChargeMax) {
      this.ultimateCharge += 0.01 * (delta / 16.67); // 約10秒で1%チャージ
      if (this.ultimateCharge >= this.ultimateChargeMax) {
        this.ultimateCharge = this.ultimateChargeMax;
        this.isUltimateReady = true;
        this.cooldownReady[AttackType.ULTIMATE] = true;
        this.onUltimateReady();
      }
    }
  }
  
  // 移動処理
  move(moveX: number, moveY: number): void {
    if (this.isDead || this.isAttacking || !this.body) return;
    
    // 移動方向の正規化
    if (moveX !== 0 || moveY !== 0) {
      const length = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX /= length;
      moveY /= length;
    }
    
    // 速度を設定
    this.setVelocity(
      moveX * this.stats.speed,
      moveY * this.stats.speed
    );
    
    // 向きに応じて画像の反転
    if (moveX < 0) {
      this.setFlipX(true);
    } else if (moveX > 0) {
      this.setFlipX(false);
    }
    
    // アニメーション
    if (moveX !== 0 || moveY !== 0) {
      this.playAnimation('run');
    } else {
      this.playAnimation('idle');
    }
  }
  
  // 通常攻撃の実行
  performNormalAttack(targetX: number, targetY: number): void {
    if (!this.canAttack(AttackType.NORMAL)) return;
    
    // 攻撃実行
    this.startAttackAnimation(AttackType.NORMAL);
    this.executeNormalAttack(targetX, targetY);
    
    // クールダウン設定
    this.setCooldown(AttackType.NORMAL);
    
    // アルティメットチャージ増加
    this.increaseUltimateCharge(5); // 通常攻撃で5%チャージ
  }
  
  // スキルの実行
  performSkill(angle: number, force: number): void {
    if (!this.canAttack(AttackType.SKILL)) return;
    
    // 攻撃実行
    this.startAttackAnimation(AttackType.SKILL);
    this.executeSkill(angle, force);
    
    // クールダウン設定
    this.setCooldown(AttackType.SKILL);
    
    // アルティメットチャージ増加
    this.increaseUltimateCharge(10); // スキルで10%チャージ
  }
  
  // アルティメットの実行
  performUltimate(angle: number, force: number): void {
    if (!this.canAttack(AttackType.ULTIMATE)) return;
    
    // 攻撃実行
    this.startAttackAnimation(AttackType.ULTIMATE);
    this.executeUltimate(angle, force);
    
    // クールダウン設定とチャージリセット
    this.setCooldown(AttackType.ULTIMATE);
    this.ultimateCharge = 0;
    this.isUltimateReady = false;
  }
  
  // ダメージを受ける
  takeDamage(damage: number): void {
    // 無敵状態ならダメージを受けない
    if (this.isInvulnerable || this.isDead) return;
    
    // HP減少
    this.stats.hp -= damage;
    
    // 死亡判定
    if (this.stats.hp <= 0) {
      this.stats.hp = 0;
      this.die();
      return;
    }
    
    // ダメージ表示エフェクト
    this.showDamageEffect(damage);
    
    // ヒットアニメーション
    this.playAnimation('hit');
  }
  
  // 回復する
  heal(amount: number): void {
    if (this.isDead) return;
    
    this.stats.hp = Math.min(this.stats.hp + amount, this.stats.maxHp);
    this.showHealEffect(amount);
  }
  
  // 死亡処理
  die(): void {
    if (this.isDead) return;
    
    this.isDead = true;
    this.setVelocity(0, 0);
    this.playAnimation('die');
    this.setActive(false);
    
    // 1秒後に非表示
    this.scene.time.delayedCall(1000, () => {
      this.setVisible(false);
    });
  }
  
  // 無敵状態の設定
  setInvulnerable(value: boolean): void {
    this.isInvulnerable = value;
  }
  
  // クールダウン状態の取得
  getCooldownReady(attackType: AttackType): boolean {
    return this.cooldownReady[attackType];
  }
  
  // アルティメット準備状態の取得
  getIsUltimateReady(): boolean {
    return this.isUltimateReady;
  }
  
  // 体力バーの作成
  private createHealthBar(): void {
    this.healthBar = this.scene.add.graphics();
    this.updateHealthBar();
  }
  
  // 体力バーの更新
  private updateHealthBar(): void {
    if (!this.healthBar) return;
    
    this.healthBar.clear();
    
    // 背景（黒）
    this.healthBar.fillStyle(0x000000);
    this.healthBar.fillRect(this.x - 30, this.y - 50, 60, 8);
    
    // チームに応じた色
    const healthColor = this.team === TeamType.BLUE ? 0x0000ff : 0xff0000;
    
    // 現在のHP
    this.healthBar.fillStyle(healthColor);
    const healthWidth = Math.max(0, (this.stats.hp / this.stats.maxHp) * 58);
    this.healthBar.fillRect(this.x - 29, this.y - 49, healthWidth, 6);
  }
  
  // 名前テキストの作成
  private createNameText(): void {
    this.nameText = this.scene.add.text(
      this.x, 
      this.y - 60, 
      this.name,
      { 
        fontFamily: 'Arial',
        fontSize: '14px',
        color: this.team === TeamType.BLUE ? '#8888ff' : '#ff8888'
      }
    );
    this.nameText.setOrigin(0.5, 0.5);
  }
  
  // 名前テキストの更新
  private updateNameText(): void {
    if (!this.nameText) return;
    this.nameText.setPosition(this.x, this.y - 60);
  }
  
  // アニメーション設定
  private setupAnimations(): void {
    // アニメーションは既にPreloadSceneで設定されているはず
  }
  
  // アニメーション再生
  protected playAnimation(key: string): void {
    if (!this.anims) return;
    
    const animKey = `${this.type}-${key}`;
    if (!this.anims.isPlaying || this.anims.currentAnim?.key !== animKey) {
      this.play(animKey);
    }
  }
  
  // 攻撃アニメーション開始
  protected startAttackAnimation(attackType: AttackType): void {
    this.isAttacking = true;
    
    let animKey: string;
    switch(attackType) {
      case AttackType.NORMAL:
        animKey = 'attack';
        break;
      case AttackType.SKILL:
        animKey = 'skill';
        break;
      case AttackType.ULTIMATE:
        animKey = 'ultimate';
        break;
      default:
        animKey = 'attack';
    }
    
    this.setVelocity(0, 0);
    this.playAnimation(animKey);
    
    // アニメーション終了でフラグを戻す
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.isAttacking = false;
      this.playAnimation('idle');
    });
  }
  
  // クールダウンの更新
  private updateCooldowns(currentTime: number): void {
    for (const attackType of [AttackType.NORMAL, AttackType.SKILL, AttackType.ULTIMATE]) {
      if (!this.cooldownReady[attackType] && attackType !== AttackType.ULTIMATE) {
        if (currentTime - this.lastAttackTime[attackType] >= this.stats.cooldown[attackType]) {
          this.cooldownReady[attackType] = true;
        }
      }
    }
  }
  
  // クールダウンの設定
  private setCooldown(attackType: AttackType): void {
    this.lastAttackTime[attackType] = this.scene.time.now;
    this.cooldownReady[attackType] = false;
  }
  
  // 攻撃可能かどうかチェック
  private canAttack(attackType: AttackType): boolean {
    return !this.isDead && !this.isAttacking && this.cooldownReady[attackType];
  }
  
  // アルティメットチャージの増加
  private increaseUltimateCharge(amount: number): void {
    if (this.isUltimateReady) return;
    
    this.ultimateCharge = Math.min(this.ultimateCharge + amount, this.ultimateChargeMax);
    
    if (this.ultimateCharge >= this.ultimateChargeMax) {
      this.isUltimateReady = true;
      this.cooldownReady[AttackType.ULTIMATE] = true;
      this.onUltimateReady();
    }
  }
  
  // アルティメットの準備完了時のコールバック
  private onUltimateReady(): void {
    // エフェクトやサウンドを追加
    // 例: キラキラとしたエフェクトを表示
    if (!this.scene) return;
    
    const particles = this.scene.add.particles(this.x, this.y, 'explosion', {
      scale: { start: 0.2, end: 0 },
      speed: { min: 50, max: 100 },
      quantity: 10,
      lifespan: 1000,
      blendMode: 'ADD'
    });
    
    this.scene.time.delayedCall(1000, () => {
      if (particles) particles.destroy();
    });
  }
  
  // ダメージ表示エフェクト
  private showDamageEffect(damage: number): void {
    if (!this.scene) return;
    
    // 数値を表示
    const damageText = this.scene.add.text(
      this.x, 
      this.y - 40, 
      `-${damage}`,
      { 
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#ff0000'
      }
    );
    damageText.setOrigin(0.5, 0.5);
    
    // テキストアニメーション
    this.scene.tweens.add({
      targets: damageText,
      y: this.y - 70,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        damageText.destroy();
      }
    });
  }
  
  // 回復表示エフェクト
  private showHealEffect(amount: number): void {
    if (!this.scene) return;
    
    // 数値を表示
    const healText = this.scene.add.text(
      this.x, 
      this.y - 40, 
      `+${amount}`,
      { 
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#00ff00'
      }
    );
    healText.setOrigin(0.5, 0.5);
    
    // テキストアニメーション
    this.scene.tweens.add({
      targets: healText,
      y: this.y - 70,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        healText.destroy();
      }
    });
  }
  
  // サブクラスでオーバーライドするメソッド
  protected executeNormalAttack(targetX: number, targetY: number): void {
    // キャラクターごとに実装
  }
  
  protected executeSkill(angle: number, force: number): void {
    // キャラクターごとに実装
  }
  
  protected executeUltimate(angle: number, force: number): void {
    // キャラクターごとに実装
  }
  
  // 破棄処理
  destroy(fromScene?: boolean): void {
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    
    if (this.nameText) {
      this.nameText.destroy();
    }
    
    super.destroy(fromScene);
  }
}
