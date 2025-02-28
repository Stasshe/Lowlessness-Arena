import Phaser from 'phaser';
import { GameConfig, GameMode } from '../config/GameConfig';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  preload() {
    // ロゴとボタンの画像をロードする予定（今はプレースホルダーとして色付きの長方形を使用）
    this.load.image('logo_placeholder', 'assets/placeholder/logo.png');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // タイトルテキスト
    const titleText = this.add.text(width / 2, height * 0.3, 'Lowlessness Arena', {
      fontSize: '64px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // トレーニングモードボタン
    const trainingButton = this.add.rectangle(width / 2, height * 0.5, 300, 50, 0x9b59b6)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        GameConfig.currentMode = GameMode.TRAINING;
        this.scene.start('TrainingScene');
      });

    const trainingText = this.add.text(width / 2, height * 0.5, 'トレーニングモード', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // オンライン対戦ボタン
    const onlineButton = this.add.rectangle(width / 2, height * 0.6, 300, 50, 0x3498db)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        GameConfig.currentMode = GameMode.ONLINE;
        this.scene.start('LobbyScene');
      });

    const onlineText = this.add.text(width / 2, height * 0.6, 'オンライン対戦', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // 設定ボタン（将来の拡張用）
    const settingsButton = this.add.rectangle(width / 2, height * 0.7, 300, 50, 0x95a5a6, 0.7)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        alert('設定機能は開発中です。');
      });

    const settingsText = this.add.text(width / 2, height * 0.7, '設定 (開発中)', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // バージョン情報
    this.add.text(width - 10, height - 10, 'v0.1.0', {
      fontSize: '16px',
      color: '#cccccc'
    }).setOrigin(1, 1);
  }
}
