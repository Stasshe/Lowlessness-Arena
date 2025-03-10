import Phaser from 'phaser';
import { GameConfig } from '../config';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(GameConfig.SCENES.MAIN_MENU);
  }
  
  create(): void {
    // タイトル
    const title = this.add.text(
      this.cameras.main.width / 2,
      100,
      'Lowlessness Arena',
      {
        fontFamily: 'Arial',
        fontSize: '48px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // メニューテキスト
    const trainingButton = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 50,
      'トレーニングモード',
      {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    const onlineButton = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 50,
      'オンラインマッチ',
      {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // インタラクティブ設定
    trainingButton.setInteractive({ useHandCursor: true });
    onlineButton.setInteractive({ useHandCursor: true });
    
    // ホバーエフェクト
    trainingButton.on('pointerover', () => {
      trainingButton.setStyle({ color: '#ff0' });
    });
    
    trainingButton.on('pointerout', () => {
      trainingButton.setStyle({ color: '#ffffff' });
    });
    
    onlineButton.on('pointerover', () => {
      onlineButton.setStyle({ color: '#ff0' });
    });
    
    onlineButton.on('pointerout', () => {
      onlineButton.setStyle({ color: '#ffffff' });
    });
    
    // クリックイベント
    trainingButton.on('pointerdown', () => {
      // トレーニングモードはHTMLページ経由で起動するように変更
      window.location.href = 'lobby.html';
    });
    
    onlineButton.on('pointerdown', () => {
      // オンラインマッチもロビーから
      window.location.href = 'lobby.html';
    });
  }
}
