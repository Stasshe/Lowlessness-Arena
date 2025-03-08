import { GameScene } from './GameScene';
import { GameConfig, TeamType } from '../config';
import { Projectile } from '../entities/Projectile';

export class TrainingGameScene extends GameScene {
  // トレーニングモード固有のプロパティ
  private aiUpdateTimer: number = 0;
  private aiUpdateInterval: number = 1000; // AI更新間隔（ミリ秒）
  private targetDummies: string[] = ['gawain', 'lancel', 'beatrice', 'marguerite'];
  
  constructor() {
    super(GameConfig.SCENES.TRAINING_GAME);
  }
  
  create(): void {
    console.log("TrainingGameScene create start");
    
    try {
      // 背景色を明示的に設定（マップが表示されない場合の対策）
      this.cameras.main.setBackgroundColor('#2d2d2d');
      
      // 親クラスのcreateメソッド呼び出し
      super.create();
      
      // トレーニングモードの準備
      this.setupTrainingMode();
      
      console.log("TrainingGameScene create complete");
    } catch (e) {
      console.error("TrainingGameScene createでエラー:", e);
      // 最低限の背景テキスト表示でエラーを通知
      this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        'Error loading training mode.\nCheck console for details.',
        {
          fontSize: '24px',
          color: '#ffffff',
          align: 'center'
        }
      ).setOrigin(0.5);
    }
  }
  
  update(time: number, delta: number): void {
    // 親クラスのupdateメソッド呼び出し
    super.update(time, delta);
    
    // AI制御の更新
    this.updateAI(time, delta);
    
    // プロジェクタイルの更新
    this.updateProjectiles(time, delta);
  }
  
  // トレーニングモードの設定
  private setupTrainingMode(): void {
    console.log("トレーニングモード設定開始");
    
    // 選択されたキャラクターを取得（なければヒューズをデフォルトに）
    const selectedCharacter = localStorage.getItem('selectedCharacter') || 'hugues';
    console.log(`選択されたキャラクター: ${selectedCharacter}`);
    
    try {
      // プレイヤーを生成
      this.spawnPlayer(selectedCharacter);
      console.log("プレイヤー生成成功");
      
      // 一定距離ごとにダミーキャラを配置
      this.spawnTrainingDummies();
      console.log("ダミーキャラ生成成功");
      
      // ヘルプテキスト表示
      const helpText = this.add.text(
        this.cameras.main.width / 2,
        50,
        'トレーニングモード\nタップ: 通常攻撃 | Sキー/右ジョイスティック: スキル | Dキー/右下ジョイスティック: アルティメット',
        {
          fontFamily: 'Arial',
          fontSize: '16px',
          color: '#ffffff',
          align: 'center'
        }
      );
      helpText.setOrigin(0.5, 0);
      helpText.setScrollFactor(0); // カメラに追従
      
      console.log("トレーニングモード設定完了");
    } catch (e) {
      console.error("トレーニングモード設定中にエラー:", e);
    }
  }
  
  // トレーニング用ダミーキャラの生成
  private spawnTrainingDummies(): void {
    // マップ中央に4体のダミーを配置
    const centerX = (GameConfig.MAP_WIDTH * GameConfig.BLOCK_SIZE) / 2;
    const centerY = (GameConfig.MAP_HEIGHT * GameConfig.BLOCK_SIZE) / 2;
    
    // 4方向にダミーを配置
    const positions = [
      { x: centerX - 200, y: centerY },
      { x: centerX + 200, y: centerY },
      { x: centerX, y: centerY - 200 },
      { x: centerX, y: centerY + 200 }
    ];
    
    // ダミーを生成
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      this.spawnEnemy(this.targetDummies[i % this.targetDummies.length], pos.x, pos.y, TeamType.RED);
    }
  }
  
  // AI制御の更新
  private updateAI(time: number, delta: number): void {
    // AI更新タイマーの更新
    this.aiUpdateTimer += delta;
    
    // 更新間隔に達したらAIの行動を決定
    if (this.aiUpdateTimer >= this.aiUpdateInterval) {
      this.aiUpdateTimer = 0;
      
      // 各敵AIの行動を更新
      this.enemies.forEach(enemy => {
        if (enemy.active && !enemy.isDead) {
          const decision = Math.random();
          
          if (decision < 0.2) {
            // ランダムな方向に移動
            const moveX = (Math.random() * 2 - 1);
            const moveY = (Math.random() * 2 - 1);
            enemy.move(moveX, moveY);
          } else if (decision < 0.3 && this.player) {
            // プレイヤーに向かって通常攻撃
            enemy.performNormalAttack(this.player.x, this.player.y);
          } else if (decision < 0.32 && this.player) {
            // プレイヤーに向かってスキル
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            enemy.performSkill(angle, 1.0);
          } else if (decision < 0.33 && this.player) {
            // プレイヤーに向かってアルティメット
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            enemy.performUltimate(angle, 1.0);
          } else {
            // 何もしない
            enemy.move(0, 0);
          }
        }
      });
    }
  }
  
  // プロジェクタイルの更新
  private updateProjectiles(time: number, delta: number): void {
    // シーン内のすべてのプロジェクタイルを更新
    this.children.getAll().forEach(obj => {
      if (obj instanceof Projectile) {
        obj.update(time, delta);
      }
    });
  }
}
