import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { Weapon } from './Weapon';
import { WeaponType } from '../utils/WeaponTypes';
import { CharacterType } from '../characters/CharacterFactory'; // CharacterTypeをインポート
import { WeaponAiming } from '../utils/WeaponAiming';
import { ProjectileCalculator } from '../utils/ProjectileCalculator';
import { Bullet, BulletType } from './Bullet';  // Bullet と BulletType をインポート

// スキルタイプの列挙
export enum SkillType {
  NONE = 'none',
  SHIELD = 'shield',
  DASH = 'dash',
  SCOPE = 'scope',
  HEAL = 'heal',
  BOMB = 'bomb',
  MINEFIELD = 'minefield',
  GATLING = 'gatling',
  DASH_SHIELD = 'dash_shield',
  TRIPLE_ARROW = 'triple_arrow',
  PIERCE_SHOT = 'pierce_shot'
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
  private _shieldEndTime: number = 0;  // プレフィックスを変更して未使用警告を回避
  private shieldReduction: number = 0.3; // 30%ダメージ軽減
  private _isAlive: boolean = true; // isAliveプロパティを追加
  private characterType: CharacterType = CharacterType.DEFAULT; // キャラクタータイプを保持するプロパティを追加
  private skillEffect: Phaser.GameObjects.Container | null = null;
  private healthBar: Phaser.GameObjects.Graphics;
  private weaponAiming: WeaponAiming;
  private projectileCalculator: ProjectileCalculator;
  private shieldDuration: number = 3000; // シールド持続時間（ミリ秒）
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    
    // シーンに追加して物理演算を有効化
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // 物理ボディの設定
    this.setCircle(GameConfig.CHARACTER_RADIUS);
    this.setCollideWorldBounds(true);
    
    // 軌道計算オブジェクトを初期化
    this.projectileCalculator = new ProjectileCalculator();
    
    // 照準表示オブジェクトを初期化
    this.weaponAiming = new WeaponAiming(scene, this.projectileCalculator);
    
    // 武器の初期化
    this.weapon = new Weapon(scene, this, WeaponType.DEFAULT);
    
    // ヘルスバーの初期化
    this.healthBar = scene.add.graphics();
    this.updateHealthBar();
  }
  
  update(_time: number): void {
    // ヘルスバーの位置を更新
    this.updateHealthBar();
    
    // アクティブなエフェクトの更新
    if (this.skillEffect) {
      this.skillEffect.setPosition(this.x, this.y);
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
      console.log("スキルクールダウン中:", (currentTime - this.skillLastUsed)/1000, "秒経過 /", this.skillCooldown/1000, "秒中");
      return false;
    }
    
    console.log("スキル使用: タイプ=", this.specialAbility, "ターゲット=", targetX, targetY);
    
    // スキル使用時刻を更新
    this.skillLastUsed = currentTime;
    
    // ターゲット座標がなければプレイヤーの向いている方向を使用
    if (targetX === undefined || targetY === undefined) {
      const angle = this.rotation;
      const distance = 200; // デフォルトの距離
      targetX = this.x + Math.cos(angle) * distance;
      targetY = this.y + Math.sin(angle) * distance;
    }
    
    // キャラクター処理の検索方法を改善
    let characterHandler = (this.scene as any).characterHandler;
    
    // 見つからなければ GameManager 経由で探す
    if (!characterHandler && (this.scene as any).gameManager) {
      const gm = (this.scene as any).gameManager;
      if (gm.getCharacterHandler) {
        characterHandler = gm.getCharacterHandler();
      }
    }
    
    // TrainingScene の場合は別の場所を探す
    if (!characterHandler) {
      // シーンの各プロパティを探索して characterHandler を見つける
      for (const key in this.scene) {
        if ((this.scene as any)[key]?.characterHandler) {
          characterHandler = (this.scene as any)[key].characterHandler;
          break;
        }
      }
    }
    
    // キャラクターハンドラーが見つかったらスキルを使用
    if (characterHandler) {
      try {
        console.log("キャラクターハンドラー経由でスキル使用");
        characterHandler.useSkill(targetX, targetY);
      } catch (error) {
        console.error("キャラクターのスキル処理でエラー:", error);
      }
    } else {
      console.log("キャラクターハンドラーが見つからないため、直接スキル処理");
      
      // Bomber クラスなどのスキル処理を取得して直接実行
      const characterType = this.getCharacterType();
      if (characterType === 'BOMBER' && targetX !== undefined && targetY !== undefined) {
        // シーンから既存の Bomber インスタンスを探す
        const bomber = this.findCharacterInstance('Bomber');
        if (bomber && bomber.useSkill) {
          bomber.useSkill(targetX, targetY);
        } else {
          // 見つからない場合はシンプルな弾を発射する
          this.fireDefaultSkillProjectile(targetX, targetY);
        }
      } else {
        // デフォルトの簡易スキル処理
        this.fireDefaultSkillProjectile(targetX, targetY);
      }
    }
    
    // スキルを使うとアルティメットゲージが少し増える
    this.addUltimateCharge(10);
    
    // 茂みにいる場合は一時的に表示
    if (this.isInBush) {
      this.temporarilyReveal();
    }
    
    return true;
  }
  
  // 簡易的なスキル弾発射（キャラクターハンドラーがない場合のフォールバック）
  private fireDefaultSkillProjectile(targetX: number, targetY: number): void {
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    
    if (this.weapon) {
      // 前方に発射
      const offsetX = this.x + Math.cos(angle) * 30;
      const offsetY = this.y + Math.sin(angle) * 30;
      
      // 特殊弾を発射
      this.weapon.fireSpecial(
        offsetX, 
        offsetY, 
        angle, 
        'explosive',
        600,
        50,
        800,
        false
      );
    }
  }
  
  // シーン内のキャラクターインスタンスを名前で探す
  private findCharacterInstance(className: string): any {
    // シーン内のゲームオブジェクトを探索
    for (const key in this.scene) {
      const obj = (this.scene as any)[key];
      if (obj && obj.constructor && obj.constructor.name === className) {
        return obj;
      }
      
      // 配列内も探索
      if (Array.isArray(obj)) {
        for (const item of obj) {
          if (item && item.constructor && item.constructor.name === className) {
            return item;
          }
        }
      }
      
      // オブジェクト内も再帰的に探索
      if (typeof obj === 'object' && obj !== null) {
        for (const subKey in obj) {
          const subObj = obj[subKey];
          if (subObj && subObj.constructor && subObj.constructor.name === className) {
            return subObj;
          }
        }
      }
    }
    
    return null;
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

  getSpeed(): number {
    return this.moveSpeed;
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

  setInvincible(value: boolean): void {
    this.isInvincible = value;
  }

  /**
   * 照準表示を更新
   * @param targetX ターゲットX座標
   * @param targetY ターゲットY座標
   * @param joystickDistance ジョイスティックの距離（オプション）
   * @returns 照準ポイント情報
   */
  updateAiming(
    targetX: number, 
    targetY: number, 
    joystickDistance?: number
  ): { targetPoint: Phaser.Math.Vector2, trajectoryPoints?: Phaser.Math.Vector2[] } {
    if (this.currentState === PlayerState.DEAD) {
      // 死亡時は照準を表示しない
      this.weaponAiming.clear();
      return { targetPoint: new Phaser.Math.Vector2(this.x, this.y) };
    }
    
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    const joyDistance = joystickDistance || 0;
    
    return this.weaponAiming.showAiming(
      this.x, 
      this.y, 
      angle, 
      joyDistance, 
      this.weapon.getType()
    );
  }
  
  /**
   * スキル用照準表示を更新
   * @param targetX ターゲットX座標
   * @param targetY ターゲットY座標
   * @param joystickDistance ジョイスティックの距離（オプション）
   * @returns 照準ポイント情報
   */
  updateSkillAiming(
    targetX: number, 
    targetY: number, 
    joystickDistance?: number
  ): { targetPoint: Phaser.Math.Vector2, area?: Phaser.Geom.Circle | Phaser.Geom.Rectangle } {
    if (this.currentState === PlayerState.DEAD) {
      // 死亡時は照準を表示しない
      this.weaponAiming.clear();
      return { targetPoint: new Phaser.Math.Vector2(this.x, this.y) };
    }
    
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    const joyDistance = joystickDistance || 0;
    
    return this.weaponAiming.showSkillAiming(
      this.x, 
      this.y, 
      angle, 
      joyDistance, 
      this.specialAbility
    );
  }
  
  /**
   * 壁レイヤーを設定
   * @param layer 壁レイヤー
   */
  setWallLayer(layer: Phaser.Tilemaps.TilemapLayer): void {
    this.weaponAiming.setWallLayer(layer);
  }
  
  /**
   * 照準表示をクリア
   */
  clearAiming(): void {
    this.weaponAiming.clear();
  }
  
  /**
   * 軌道計算ユーティリティを取得
   */
  getProjectileCalculator(): ProjectileCalculator {
    return this.projectileCalculator;
  }

  /**
   * 照準表示オブジェクトを取得
   */
  getWeaponAiming(): WeaponAiming {
    return this.weaponAiming;
  }

  /**
   * 非標準の弾を発射するユーティリティメソッド
   * @param targetX 目標X座標
   * @param targetY 目標Y座標
   * @param options 発射オプション
   */
  fireSpecialProjectile(
    targetX: number, 
    targetY: number, 
    options: {
      bulletType?: BulletType;
      speed?: number;
      damage?: number;
      range?: number;
      scale?: number;
      color?: number;
      gravity?: boolean;
      isParticle?: boolean;
    } = {}
  ): Bullet | null {
    const angle = Math.atan2(targetY - this.y, targetX - this.y);
    
    // デフォルト値の設定
    const opts = {
      bulletType: options.bulletType || 'normal' as BulletType,
      speed: options.speed || 400,
      damage: options.damage || 20,
      range: options.range || 500,
      scale: options.scale || 1,
      color: options.color || 0xffffff,
      gravity: options.gravity || false,
      isParticle: options.isParticle || false
    };
    
    // 弾の発射位置を計算（プレイヤーの前方）
    const offsetDistance = 30;
    const startX = this.x + Math.cos(angle) * offsetDistance;
    const startY = this.y + Math.sin(angle) * offsetDistance;
    
    // 弾またはパーティクル
    const projectile = this.weapon.fireSpecial(
      startX,
      startY,
      angle,
      opts.bulletType,
      opts.speed,
      opts.damage,
      opts.range,
      opts.gravity
    ) as Bullet;
    
    if (!projectile) return null;
    
    // 外観をカスタマイズ
    if (opts.isParticle) {
      projectile.setDisplaySize(8, 8);
      
      // パーティクルエフェクトを追加
      this.scene.add.particles(startX, startY, 'default', {
        follow: projectile,
        scale: { start: 0.3, end: 0 },
        speed: 20,
        lifespan: 300,
        blendMode: 'ADD',
        tint: opts.color
      });
    } else {
      projectile.setScale(opts.scale);
      projectile.setTint(opts.color);
    }
    
    return projectile;
  }
}
