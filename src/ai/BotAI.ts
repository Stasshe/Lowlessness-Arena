import Phaser from 'phaser';
import { Player } from '../objects/Player';

export enum BotDifficulty {
  EASY,
  MEDIUM,
  HARD
}

export class BotAI {
  private scene: Phaser.Scene;
  private bot: Player;
  private target: Player;
  private difficulty: BotDifficulty;
  
  private moveTimer: Phaser.Time.TimerEvent;
  private attackTimer: Phaser.Time.TimerEvent;
  private thinkTimer: Phaser.Time.TimerEvent;
  
  private state: 'idle' | 'move' | 'attack' | 'retreat' = 'idle';
  private moveDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
  
  constructor(scene: Phaser.Scene, bot: Player, target: Player, difficulty: BotDifficulty = BotDifficulty.MEDIUM) {
    this.scene = scene;
    this.bot = bot;
    this.target = target;
    this.difficulty = difficulty;
    
    // タイマー設定
    this.moveTimer = scene.time.addEvent({
      delay: this.getMoveDelay(),
      callback: this.updateMoveDirection,
      callbackScope: this,
      loop: true
    });
    
    this.attackTimer = scene.time.addEvent({
      delay: this.getAttackDelay(),
      callback: this.performAttack,
      callbackScope: this,
      loop: true
    });
    
    this.thinkTimer = scene.time.addEvent({
      delay: 500, // 500ミリ秒ごとに思考更新
      callback: this.think,
      callbackScope: this,
      loop: true
    });
  }
  
  update(): void {
    // 現在の状態に応じて行動
    switch (this.state) {
      case 'idle':
        // 待機状態では移動しない
        this.bot.move(0, 0);
        break;
        
      case 'move':
        // 移動方向に動く
        this.bot.move(this.moveDirection.x, this.moveDirection.y);
        break;
        
      case 'attack':
        // 攻撃状態ではターゲットに向かって移動
        this.approachTarget();
        break;
        
      case 'retreat':
        // 撤退状態ではターゲットから離れる
        this.retreatFromTarget();
        break;
    }
  }
  
  private think(): void {
    // ターゲットとの距離を計算
    const distance = Phaser.Math.Distance.Between(
      this.bot.x, this.bot.y,
      this.target.x, this.target.y
    );
    
    // 体力に応じた行動決定
    const healthPercent = this.bot.getHealth() / this.bot.getMaxHealth();
    
    if (distance < 200) {
      // 近すぎる場合
      if (healthPercent < 0.3) {
        // 体力が少ない場合は撤退
        this.state = 'retreat';
      } else {
        // そうでなければ攻撃
        this.state = 'attack';
      }
    } else if (distance < 500) {
      // 適切な距離の場合は攻撃
      this.state = 'attack';
    } else {
      // 遠すぎる場合は接近
      this.state = 'move';
    }
    
    // スキルとアルティメットの使用判断
    if (Math.random() < 0.1) { // 10%の確率でスキル使用を判断
      this.bot.useSkill();
    }
    
    if (Math.random() < 0.05) { // 5%の確率でアルティメット使用を判断
      this.bot.useUltimate();
    }
  }
  
  private updateMoveDirection(): void {
    // ランダムな方向に移動（-1から1の値）
    this.moveDirection.x = Math.random() * 2 - 1;
    this.moveDirection.y = Math.random() * 2 - 1;
    
    // ベクトルの正規化
    if (this.moveDirection.length() > 0) {
      this.moveDirection.normalize();
    }
  }
  
  private approachTarget(): void {
    // ターゲットの方向に移動
    const directionX = this.target.x - this.bot.x;
    const directionY = this.target.y - this.bot.y;
    
    // ベクトルの大きさを計算
    const length = Math.sqrt(directionX * directionX + directionY * directionY);
    
    // 正規化
    if (length > 0) {
      this.bot.move(directionX / length, directionY / length);
    }
  }
  
  private retreatFromTarget(): void {
    // ターゲットの逆方向に移動
    const directionX = this.bot.x - this.target.x;
    const directionY = this.bot.y - this.target.y;
    
    // ベクトルの大きさを計算
    const length = Math.sqrt(directionX * directionX + directionY * directionY);
    
    // 正規化
    if (length > 0) {
      this.bot.move(directionX / length, directionY / length);
    }
  }
  
  private performAttack(): void {
    if (this.state === 'attack') {
      try {
        // ターゲットの方向に攻撃
        this.bot.attack(this.target.x, this.target.y);
      } catch (e) {
        console.warn('ボット攻撃エラー:', e);
      }
    }
  }
  
  private getMoveDelay(): number {
    // 難易度に応じて移動方向を変更する頻度を変える
    switch (this.difficulty) {
      case BotDifficulty.EASY:
        return 2000; // 2秒ごと
      case BotDifficulty.HARD:
        return 500; // 0.5秒ごと
      default:
        return 1000; // 1秒ごと
    }
  }
  
  private getAttackDelay(): number {
    // 難易度に応じて攻撃頻度を変える
    switch (this.difficulty) {
      case BotDifficulty.EASY:
        return 1500; // 1.5秒ごと
      case BotDifficulty.HARD:
        return 500; // 0.5秒ごと
      default:
        return 1000; // 1秒ごと
    }
  }
  
  // リソース解放
  destroy(): void {
    this.moveTimer.destroy();
    this.attackTimer.destroy();
    this.thinkTimer.destroy();
  }
}