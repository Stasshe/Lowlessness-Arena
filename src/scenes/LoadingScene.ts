import Phaser from 'phaser';
//import { GameConfig } from '../config/GameConfig';

export class LoadingScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingAssets: boolean = false;
  
  constructor() {
    super('LoadingScene');
  }
  
  preload() {
    // ローディング表示を作成
    this.createLoadingUI();
    
    // 基本的なアセットは即座にロードする
    this.loadBasicAssets();
    
    // プログレスバーのイベントを設定
    this.setupProgressBar();
    
    // メインアセットをロード
    this.loadMainAssets();
  }
  
  private createLoadingUI() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // 背景
    this.cameras.main.setBackgroundColor('#222034');
    
    // プログレスボックス（背景）
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
    
    // プログレスバー
    this.progressBar = this.add.graphics();
    
    // ローディングテキスト
    this.loadingText = this.add.text(
      width / 2, 
      height / 2 - 50, 
      'ロード中...', 
      {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // バージョン表示
    this.add.text(
      width - 10, 
      height - 10, 
      'v0.1.0', 
      {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#999999'
      }
    ).setOrigin(1);
  }
  
  private setupProgressBar() {
    // ロード進捗イベント
    this.load.on('progress', (value: number) => {
      // プログレスバーを更新
      this.updateProgressBar(value);
      
      // ロード進捗テキストを更新
      const percent = Math.floor(value * 100);
      this.loadingText.setText(`ロード中... ${percent}%`);
    });
    
    // ロード完了イベント
    this.load.on('complete', () => {
      this.loadingText.setText('ロード完了!');
      this.time.delayedCall(500, () => {
        this.startGame();
      });
    });
  }
  
  // プログレスバーの更新
  private updateProgressBar(value: number) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.progressBar.clear();
    this.progressBar.fillStyle(0x9966ff, 1);
    this.progressBar.fillRect(
      width / 2 - 150, 
      height / 2 - 15, 
      300 * value, 
      30
    );
  }
  
  // 基本アセット（最低限必要なもの）
  private loadBasicAssets() {
    // デフォルト画像（エラー時の代替用）
    this.load.image('default', 'assets/default.png');
  }
  
  // メインアセット
  private loadMainAssets() {
    this.loadingAssets = true;
    
    // UI素材
    this.load.image('logo', 'assets/ui/logo.png');
    this.load.image('button', 'assets/ui/button.png');
    this.load.image('menu_bg', 'assets/ui/menu_bg.png');
    
    // キャラクターとオブジェクト
    this.load.image('player', 'assets/characters/player.png');
    
    // マップタイル
    this.load.image('grass', 'assets/tiles/grass.png');
    this.load.image('wall', 'assets/tiles/wall.png');
    this.load.image('bush', 'assets/tiles/bush.png');
    this.load.image('boundary', 'assets/tiles/boundary.png');
    this.load.image('spawn', 'assets/tiles/spawn.png');
    
    // 武器と弾丸
    this.load.image('bullet', 'assets/weapons/bullet.png');
    
    // サウンド
    this.load.audio('menu_bgm', 'assets/sounds/menu_bgm.mp3');
    this.load.audio('game_bgm', 'assets/sounds/game_bgm.mp3');
    this.load.audio('button_click', 'assets/sounds/button_click.mp3');
    this.load.audio('button_hover', 'assets/sounds/button_click.mp3');
    this.load.audio('shoot', 'assets/sounds/shoot.mp3');
    this.load.audio('hit', 'assets/sounds/hit.mp3');
    this.load.audio('explosion', 'assets/sounds/explosion.mp3');
    this.load.audio('skill_activate', 'assets/sounds/skill_activate.mp3');
    this.load.audio('ultimate_activate', 'assets/sounds/ultimate_activate.mp3');
    this.load.audio('player_damage', 'assets/sounds/player_damage.mp3');
    this.load.audio('player_death', 'assets/sounds/player_damage.mp3');
    this.load.audio('victory', 'assets/sounds/game_bgm.mp3');
  }
  
  // ゲーム開始
  private startGame() {
    if (this.loadingAssets) {
      // ロード完了したので次のシーンへ
      this.scene.start('MainMenuScene');
    }
  }
}
