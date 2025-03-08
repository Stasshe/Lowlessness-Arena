import Phaser from 'phaser';
import { GameConfig } from '../../config/GameConfig';

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super('LoadingScene');
  }
  
  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 4, height / 2 - 30, width / 2, 50);
    
    const loadingText = this.add.text(
      width / 2,
      height / 2 - 50,
      'Loading...',
      { fontSize: '24px', color: '#ffffff' }
    ).setOrigin(0.5);
    
    const percentText = this.add.text(
      width / 2,
      height / 2 - 5,
      '0%',
      { fontSize: '18px', color: '#ffffff' }
    ).setOrigin(0.5);
    
    const assetText = this.add.text(
      width / 2,
      height / 2 + 50,
      '',
      { fontSize: '14px', color: '#ffffff' }
    ).setOrigin(0.5);
    
    // Loading events
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x9a67ea, 1);
      progressBar.fillRect(width / 4 + 10, height / 2 - 20, (width / 2 - 20) * value, 30);
      percentText.setText(`${Math.floor(value * 100)}%`);
    });
    
    this.load.on('fileprogress', (file: any) => {
      assetText.setText(`Loading: ${file.key}`);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
      
      this.scene.start('HomeScene');
    });
    
    // Load assets
    this.loadAssets();
  }
  
  private loadAssets(): void {
    // Load images
    // プレースホルダー画像
    this.load.image('player', 'assets/images/player_placeholder.png');
    this.load.image('enemy', 'assets/images/enemy_placeholder.png');
    this.load.image('bullet', 'assets/images/bullet.png');
    
    // マップタイル
    this.load.image('grass', 'assets/images/tiles/grass.png');
    this.load.image('wall', 'assets/images/tiles/wall.png');
    this.load.image('floor', 'assets/images/tiles/floor.png');
    
    // UI要素
    this.load.image('joystick_base', 'assets/images/ui/joystick_base.png');
    this.load.image('joystick_thumb', 'assets/images/ui/joystick_thumb.png');
    this.load.image('button_na', 'assets/images/ui/button_na.png');
    this.load.image('button_sk', 'assets/images/ui/button_sk.png');
    this.load.image('button_ult', 'assets/images/ui/button_ult.png');
    
    // キャラクター
    this.load.image('huges', 'assets/images/characters/huges.png');
    this.load.image('gawain', 'assets/images/characters/gawain.png');
    this.load.image('lancelot', 'assets/images/characters/lancelot.png');
    this.load.image('beatrice', 'assets/images/characters/beatrice.png');
    this.load.image('marguerite', 'assets/images/characters/marguerite.png');
    
    // エフェクト
    this.load.image('explosion', 'assets/images/effects/explosion.png');
    this.load.image('shield', 'assets/images/effects/shield.png');
    
    // 音声
    this.load.audio('shoot', 'assets/audio/shoot.mp3');
    this.load.audio('explosion', 'assets/audio/explosion.mp3');
    this.load.audio('hit', 'assets/audio/hit.mp3');
    this.load.audio('bgm', 'assets/audio/bgm.mp3');
    
    // スプライトシート
    // this.load.spritesheet('explosion_sheet', 'assets/images/effects/explosion_sheet.png', { frameWidth: 64, frameHeight: 64 });
  }
  
  create(): void {
    // ローディング完了後、ホーム画面へ
    // イベントハンドラですでに処理されているので、ここは空でOK
  }
}
