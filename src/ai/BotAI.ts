import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { GameConfig } from '../config/GameConfig';

/**
 * ボットの難易度レベル
 */
export enum BotDifficulty {
  EASY = 0,
  NORMAL = 1,
  HARD = 2,
  INSANE = 3
}

/**
 * ボットAIクラス - ボットの行動を制御する
 */
export class BotAI {
  private scene: Phaser.Scene;
  private bot: Player;
  private target: Player;
  private difficulty: BotDifficulty;
  private isEnabled: boolean = true;
  private state: string = 'idle';
  private lastStateChange: number = 0;
  private stateChangeInterval: number = 2000;
  private lastAttackTime: number = 0;
  private attackCooldown: number = 1000;
  private lastSkillTime: number = 0;
  private skillCooldown: number = 5000;
  private wanderPoint: Phaser.Math.Vector2 | null = null;
  
  constructor(scene: Phaser.Scene, bot: Player, target: Player, difficulty: BotDifficulty = BotDifficulty.NORMAL) {
    this.scene = scene;
    this.bot = bot;
    this.target = target;
    this.difficulty = difficulty;
    
    // 難易度に応じて各種パラメータを調整
    this.configureByDifficulty();
  }
  
  /**
   * 難易度に応じたAIの設定
   */
  private configureByDifficulty(): void {
    switch (this.difficulty) {
      case BotDifficulty.EASY:
        // EASY: 反応が遅く、スキルをあまり使わない
        this.stateChangeInterval = 2500;
        this.attackCooldown = 1500;
        this.skillCooldown = 10000;
        break;
        
      case BotDifficulty.NORMAL:
        // NORMAL: バランスの取れた能力
        this.stateChangeInterval = 2000;
        this.attackCooldown = 1000;
        this.skillCooldown = 7000;
        break;
        
      case BotDifficulty.HARD:
        // HARD: 反応が速く、スキルを積極的に使う
        this.stateChangeInterval = 1500;
        this.attackCooldown = 700;
        this.skillCooldown = 5000;
        break;
        
      case BotDifficulty.INSANE:
        // INSANE: 超反応、常にスキルを使おうとする
        this.stateChangeInterval = 1000;
        this.attackCooldown = 500;
        this.skillCooldown = 3000;
        break;
    }
  }
  
  /**
   * AIのアップデート処理（毎フレーム呼ばれる）
   */
  update(): void {
    if (!this.isEnabled || !this.bot || !this.target) return;
    
    const currentTime = this.scene.time.now;
    
    // 状態の更新
    if (currentTime - this.lastStateChange > this.stateChangeInterval) {
      this.updateState();
      this.lastStateChange = currentTime;
    }
    
    // 状態に応じた行動
    switch (this.state) {
      case 'chase':
        this.chaseTarget();
        break;
      
      case 'attack':
        this.attackTarget();
        break;
        
      case 'retreat':
        this.retreat();
        break;
        
      case 'wander':
        this.wander();
        break;
        
      case 'useSkill':
        this.useSkill();
        break;
        
      case 'idle':
      default:
        // 何もしない
        this.bot.move(0, 0);
        break;
    }
  }
  
  /**
   * AIの状態を更新
   */
  private updateState(): void {
    // プレイヤーとの距離を計算
    const distance = Phaser.Math.Distance.Between(
      this.bot.x, this.bot.y,
      this.target.x, this.target.y
    );
    
    // 一定確率でスキルを使う（難易度に応じて確率が上がる）
    const useSkillChance = 0.05 * (this.difficulty + 1);
    
    if (Math.random() < useSkillChance && this.bot.canUseSkill()) {
      this.state = 'useSkill';
      return;
    }
    
    // HP残量に応じて行動変化
    const healthRatio = this.bot.getHealth() / this.bot.getMaxHealth();
    
    if (healthRatio < 0.3) {
      // 残り体力が30%未満なら逃げる確率が高い
      if (Math.random() < 0.7) {
        this.state = 'retreat';
        return;
      }
    }
    
    // 距離に応じた行動選択
    if (distance < 100) {
      // 近距離: 攻撃か逃走
      this.state = Math.random() < 0.7 ? 'attack' : 'retreat';
    } else if (distance < 300) {
      // 中距離: 追いかけるか攻撃
      this.state = Math.random() < 0.6 ? 'chase' : 'attack';
    } else {
      // 遠距離: 徘徊か追跡
      this.state = Math.random() < 0.4 ? 'wander' : 'chase';
    }
  }
  
  /**
   * ターゲットを追いかける
   */
  private chaseTarget(): void {
    const dx = this.target.x - this.bot.x;
    const dy = this.target.y - this.bot.y;
    
    // 方向ベクトルの正規化
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0) {
      this.bot.move(dx / distance, dy / distance);
    }
    
    // 追いかけている間に攻撃できるか確認
    this.tryAttack();
  }
  
  /**
   * ターゲットを攻撃
   */
  private attackTarget(): void {
    const currentTime = this.scene.time.now;
    
    // 攻撃クールダウンを確認
    if (currentTime - this.lastAttackTime > this.attackCooldown) {
      this.bot.attack(this.target.x, this.target.y);
      this.lastAttackTime = currentTime;
    }
    
    // 攻撃中も敵の方向を向く
    const dx = this.target.x - this.bot.x;
    const dy = this.target.y - this.bot.y;
    
    // 少しだけ距離を取る
    this.bot.move(-dx * 0.01, -dy * 0.01);
  }
  
  /**
   * 敵から逃げる
   */
  private retreat(): void {
    const dx = this.target.x - this.bot.x;
    const dy = this.target.y - this.bot.y;
    
    // 逆方向に移動
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0) {
      this.bot.move(-dx / distance, -dy / distance);
    }
  }
  
  /**
   * ランダムに徘徊する
   */
  private wander(): void {
    // 徘徊先がなければ新しく設定
    if (!this.wanderPoint) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 200;
      
      this.wanderPoint = new Phaser.Math.Vector2(
        this.bot.x + Math.cos(angle) * distance,
        this.bot.y + Math.sin(angle) * distance
      );
      
      // マップの境界内に収める
      const bounds = this.scene.physics.world.bounds;
      this.wanderPoint.x = Phaser.Math.Clamp(this.wanderPoint.x, bounds.x + 50, bounds.width - 50);
      this.wanderPoint.y = Phaser.Math.Clamp(this.wanderPoint.y, bounds.y + 50, bounds.height - 50);
      
      // デバッグ表示
      if (GameConfig.DEBUG) {
        const marker = this.scene.add.circle(this.wanderPoint.x, this.wanderPoint.y, 5, 0xff0000);
        this.scene.time.delayedCall(2000, () => marker.destroy());
      }
    }
    
    // 徘徊先へ向かう
    const dx = this.wanderPoint.x - this.bot.x;
    const dy = this.wanderPoint.y - this.bot.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 10) {
      // まだ目的地に着いていない
      this.bot.move(dx / distance, dy / distance);
    } else {
      // 目的地に到着したので新たな目的地を設定
      this.wanderPoint = null;
      
      // 徘徊中でも近くに敵がいたら攻撃
      const targetDistance = Phaser.Math.Distance.Between(
        this.bot.x, this.bot.y,
        this.target.x, this.target.y
      );
      
      if (targetDistance < 200) {
        this.tryAttack();
      }
    }
  }
  
  /**
   * スキルを使用
   */
  private useSkill(): void {
    const currentTime = this.scene.time.now;
    
    // スキルクールダウンを確認
    if (currentTime - this.lastSkillTime > this.skillCooldown && this.bot.canUseSkill()) {
      const targetX = this.target.x;
      const targetY = this.target.y;
      
      this.bot.useSkill(targetX, targetY);
      this.lastSkillTime = currentTime;
      
      // スキル使用後は少し待機
      this.bot.move(0, 0);
      
      // スキル使用後は状態を変更
      this.scene.time.delayedCall(500, () => {
        this.state = 'attack';
      });
    } else {
      // クールダウン中は別の行動をする
      this.state = 'chase';
    }
  }
  
  /**
   * 攻撃を試行する
   */
  private tryAttack(): void {
    const currentTime = this.scene.time.now;
    
    // 攻撃クールダウンを確認
    if (currentTime - this.lastAttackTime > this.attackCooldown) {
      // プレイヤーの方向を向いて攻撃
      this.bot.attack(this.target.x, this.target.y);
      this.lastAttackTime = currentTime;
    }
  }
  
  /**
   * AIを有効にする
   */
  enable(): void {
    this.isEnabled = true;
  }
  
  /**
   * AIを無効にする
   */
  disable(): void {
    this.isEnabled = false;
    // 無効時は停止
    if (this.bot) {
      this.bot.move(0, 0);
    }
  }
  
  /**
   * 現在の状態を取得
   */
  getState(): string {
    return this.state;
  }
  
  /**
   * 難易度を設定
   */
  setDifficulty(difficulty: BotDifficulty): void {
    this.difficulty = difficulty;
    this.configureByDifficulty();
  }
  
  /**
   * 新しいターゲットを設定
   */
  setTarget(target: Player): void {
    this.target = target;
  }
  
  /**
   * リソース解放
   */
  destroy(): void {
    this.isEnabled = false;
    this.bot = null as any;
    this.target = null as any;
    this.wanderPoint = null;
  }
}