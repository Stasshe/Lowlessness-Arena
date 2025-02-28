import Phaser from 'phaser';
import { GameConfig, GameMode } from '../config/GameConfig';
import { SoundManager } from '../utils/SoundManager';

export class MainMenuScene extends Phaser.Scene {
  private soundManager!: SoundManager;

  constructor() {
    super('MainMenuScene');
  }

  preload() {
    // ロゴとボタンの画像をロード
    this.load.image('logo', 'assets/ui/logo.png');
    this.load.image('button_bg', 'assets/ui/button_bg.png');
    this.load.image('menu_bg', 'assets/ui/menu_bg.png');
    
    // フォールバック用のデフォルト画像
    this.load.image('logo_placeholder', 'assets/placeholder/logo.png');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // サウンドマネージャー初期化
    this.soundManager = new SoundManager(this);
    
    // BGM再生
    this.time.delayedCall(100, () => {
      try {
        this.soundManager.playMusic('menu_bgm');
      } catch (e) {
        console.warn('BGM再生エラー:', e);
      }
    });
    
    // 背景を追加
    try {
      this.add.image(width / 2, height / 2, 'menu_bg')
        .setDisplaySize(width, height);
    } catch (e) {
      // 背景がロードできない場合は単色の背景を設定
      this.cameras.main.setBackgroundColor('#222034');
    }

    // タイトルロゴ
    try {
      const logo = this.add.image(width / 2, height * 0.3, 'logo')
        .setDisplaySize(500, 200);
      
      // ロゴにアニメーション効果を追加
      this.tweens.add({
        targets: logo,
        y: height * 0.3 - 10,
        duration: 2000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    } catch (e) {
      // ロゴがロードできない場合はテキストで表示
      const titleText = this.add.text(width / 2, height * 0.3, 'Lowlessness Arena', {
        fontSize: '64px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6
      }).setOrigin(0.5);
    }

    // メニューボタンを表示
    this.createMenuButton(
      width / 2, 
      height * 0.5, 
      'トレーニングモード', 
      0x9b59b6,
      () => {
        GameConfig.currentMode = GameMode.TRAINING;
        this.scene.start('TrainingScene'); // トレーニングシーンに直接遷移
      }
    );

    this.createMenuButton(
      width / 2, 
      height * 0.6, 
      'オンライン対戦', 
      0x3498db,
      () => {
        GameConfig.currentMode = GameMode.ONLINE;
        this.scene.start('LobbyScene');
      }
    );
    
    this.createMenuButton(
      width / 2, 
      height * 0.7, 
      '設定', 
      0x95a5a6,
      () => {
        // 設定機能は未実装
        this.showMessage('設定機能は開発中です');
      },
      true // 無効化状態
    );
    
    // バージョン情報
    this.add.text(width - 10, height - 10, 'v0.1.0', {
      fontSize: '16px',
      color: '#cccccc'
    }).setOrigin(1, 1);
  }
  
  private createMenuButton(x: number, y: number, label: string, color: number, callback: () => void, disabled: boolean = false): void {
    const buttonWidth = 300;
    const buttonHeight = 60;
    
    // ボタンの背景
    const button = this.add.graphics();
    if (!disabled) {
      button.fillStyle(color, 1);
    } else {
      button.fillStyle(0x666666, 0.7); // 無効時は灰色
    }
    button.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 16);
    button.lineStyle(3, 0xffffff, 0.8);
    button.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 16);
    
    // テキスト
    const text = this.add.text(0, 0, label, { 
      fontSize: '28px', 
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // コンテナにまとめる
    const container = this.add.container(x, y, [button, text]);
    
    if (!disabled) {
      // 有効時のみクリックイベント
      container.setInteractive(
        new Phaser.Geom.Rectangle(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight),
        Phaser.Geom.Rectangle.Contains
      );
      
      // マウスオーバー効果
      container.on('pointerover', () => {
        button.clear();
        button.fillStyle(0xffffff, 0.2);
        button.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 16);
        button.fillStyle(color, 1);
        button.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2 + 4, buttonWidth, buttonHeight - 4, 16);
        button.lineStyle(3, 0xffffff, 0.8);
        button.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 16);
        
        text.setY(-2);
        this.soundManager.playSfx('button_hover');
      });
      
      container.on('pointerout', () => {
        button.clear();
        button.fillStyle(color, 1);
        button.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 16);
        button.lineStyle(3, 0xffffff, 0.8);
        button.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 16);
        
        text.setY(0);
      });
      
      container.on('pointerdown', () => {
        this.soundManager.playSfx('button_click');
        
        // クリック時のアニメーション
        this.tweens.add({
          targets: container,
          scale: { from: 0.95, to: 1 },
          duration: 100,
          ease: 'Power1',
          onComplete: callback
        });
      });
    }
    
    // アニメーション効果（登場時）
    container.setAlpha(0);
    container.setScale(0.8);
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 300,
      delay: (y - 200) * 1.5, // 位置によって遅延を変える
      ease: 'Back.easeOut'
    });
  }
  
  private showMessage(message: string): void {
    // 簡易メッセージ表示
    const messageText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 100,
      message, 
      { 
        fontSize: '24px', 
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 }
      }
    )
    .setOrigin(0.5)
    .setAlpha(0)
    .setDepth(100);
    
    // メッセージのアニメーション
    this.tweens.add({
      targets: messageText,
      alpha: 1,
      y: this.cameras.main.height / 2 - 150,
      duration: 300,
      ease: 'Power2',
      yoyo: true,
      hold: 1500,
      onComplete: () => {
        messageText.destroy();
      }
    });
    
    this.soundManager.playSfx('notification');
  }
}
