import { GameScene } from './GameScene';
import { GameConfig, TeamType } from '../config';
import { Player } from '../entities/Player';

export class OnlineGameScene extends GameScene {
  // オンラインモード固有のプロパティ
  private gameId: string = '';
  private playerId: string = '';
  
  constructor() {
    super(GameConfig.SCENES.ONLINE_GAME);
  }
  
  create(): void {
    // 親クラスのcreateメソッド呼び出し
    super.create();
    
    // オンラインマッチの準備 - Firestoreの実装は別途追加
    this.setupOnlineMatch();
  }
  
  update(time: number, delta: number): void {
    // 親クラスのupdateメソッド呼び出し
    super.update(time, delta);
    
    // オンライン固有の更新処理
    this.updateOnlineState();
  }
  
  // オンラインマッチの設定
  private setupOnlineMatch(): void {
    // ローディングメッセージ
    const loadingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'オンラインマッチ準備中...\nまだ実装されていません',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff',
        align: 'center'
      }
    );
    loadingText.setOrigin(0.5, 0.5);
    loadingText.setScrollFactor(0);
    
    // とりあえずテスト用にプレイヤーを生成
    this.spawnPlayer('hugues');
    
    // 敵をスポーン
    const centerX = (GameConfig.MAP_WIDTH * GameConfig.BLOCK_SIZE) / 2;
    const centerY = (GameConfig.MAP_HEIGHT * GameConfig.BLOCK_SIZE) / 2;
    this.spawnEnemy('lancel', centerX + 200, centerY, TeamType.RED);
  }
  
  // オンライン状態の更新
  private updateOnlineState(): void {
    // ここにFirestoreとの同期コードが入る
  }
}
