import { GameScene } from './GameScene';
import { GameConfig, TeamType } from '../config';
import { Projectile } from '../entities/Projectile';

export class TrainingGameScene extends GameScene {
  // トレーニングモード固有のプロパティ
  private aiUpdateTimer: number = 0;
  private aiUpdateInterval: number = 1000; // AI更新間隔（ミリ秒）
  private targetDummies: string[] = ['gawain', 'lancel', 'beatrice', 'marguerite'];
  
  // FPSカウンターの追加
  private fpsText: Phaser.GameObjects.Text | null = null;
  private lastFpsUpdate: number = 0;
  private fpsUpdateInterval: number = 500; // 500ミリ秒ごとに更新
  
  constructor() {
    super(GameConfig.SCENES.TRAINING_GAME);
  }
  
  create(): void {
    console.log("===== TrainingGameScene create 開始 =====");
    
    try {
      console.log("カメラ設定と背景色を設定");
      // 背景色を明示的に設定（マップが表示されない場合の対策）
      this.cameras.main.setBackgroundColor('#2d2d2d');
      
      console.log("親クラスのcreateメソッドを呼び出し");
      // 親クラスのcreateメソッド呼び出し
      try {
        super.create();
      } catch (e) {
        console.error("GameScene.create() でエラーが発生しました:", e);
        throw e; // 再スロー
      }
      
      console.log("トレーニングモードの初期設定");
      // トレーニングモードの準備
      this.setupTrainingMode();
      
      // FPSカウンター（デバッグ用）
      if (GameConfig.DEBUG) {
        this.fpsText = this.add.text(10, 10, 'FPS: 0', { 
          fontSize: '16px', 
          color: '#00ff00',
          fontFamily: 'Arial'
        });
        this.fpsText.setScrollFactor(0);
        this.fpsText.setDepth(1000);
      }
      
      console.log("TrainingGameScene create 成功");
      
      // デバイスとブラウザ情報をロギング
      console.log("デバイス情報:", {
        desktop: this.sys.game.device.os.desktop,
        mobile: this.sys.game.device.os.android || this.sys.game.device.os.iOS,
        browser: this.sys.game.device.browser ? '利用可能' : '未定義',
        webGL: this.sys.game.device.features.webGL ? "サポート" : "未サポート"
      });
      
    } catch (e) {
      console.error("TrainingGameScene createでエラー:", e);
      this.handleCreateError(e);
    }
  }
  
  private handleCreateError(error: any): void {
    console.error("=== 詳細エラーレポート ===");
    console.error("エラータイプ:", typeof error);
    console.error("エラーメッセージ:", error.message);
    console.error("エラースタック:", error.stack);
    
    // シーン状態の検査
    console.log("シーン状態:", {
      key: this.scene.key,
      active: this.scene.isActive(),
      visible: this.scene.isVisible(),
      running: this.scene.isActive() && !this.scene.isPaused(),
      cameras: this.cameras?.main ? "利用可能" : "未初期化"
    });
    
    // エラー通知表示
    try {
      this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        'ゲームロードエラー\n\nコンソールログを確認してください',
        {
          fontSize: '24px',
          color: '#ffffff',
          align: 'center'
        }
      ).setOrigin(0.5);
    } catch (e) {
      console.error("エラー表示にも失敗:", e);
    }
  }
  
  update(time: number, delta: number): void {
    // FPS表示の更新（デバッグモードのみ）
    if (GameConfig.DEBUG && this.fpsText && time - this.lastFpsUpdate > this.fpsUpdateInterval) {
      const fps = Math.round(1000 / delta);
      this.fpsText.setText(`FPS: ${fps}`);
      this.lastFpsUpdate = time;
    }
    
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
      console.log("プレイヤーキャラクター生成開始");
      this.spawnPlayer(selectedCharacter);
      console.log("プレイヤー生成成功");
      
      // 一定距離ごとにダミーキャラを配置
      console.log("AI敵キャラクター生成開始");
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
