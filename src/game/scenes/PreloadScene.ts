import Phaser from 'phaser';
import { GameConfig } from '../config';

export class PreloadScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  
  constructor() {
    super(GameConfig.SCENES.PRELOAD);
  }
  
  preload(): void {
    console.log("PreloadScene preload start");
    
    // ロード画面の作成
    this.createLoadingBar();
    
    // エラーハンドリング追加
    this.load.on('fileerror', (file: Phaser.Loader.File) => {
      console.error(`ファイル読み込みエラー: ${file.key}, URL: ${file.url}`);
    });
    
    // ロード進行状況の表示
    this.load.on('progress', (value: number) => {
      console.log(`読み込み進行状況: ${Math.floor(value * 100)}%`);
      this.progressBar.clear();
      this.progressBar.fillStyle(0xffffff, 1);
      this.progressBar.fillRect(
        this.cameras.main.width / 4, 
        this.cameras.main.height / 2 - 16, 
        (this.cameras.main.width / 2) * value, 
        32
      );
      this.loadingText.setText(`読み込み中... ${Math.floor(value * 100)}%`);
    });
    
    this.load.on('complete', () => {
      console.log("アセット読み込み完了");
      this.progressBar.destroy();
      this.loadingBar.destroy();
      this.loadingText.destroy();
    });
    
    // アセットの読み込み
    this.loadAssets();
  }
  
  create(): void {
    console.log("PreloadScene create start");
    
    // デバッグ情報
    if (GameConfig.DEBUG) {
      console.log('Preload complete, creating animations');
    }
    
    try {
      // アニメーションの作成
      this.createAnimations();
      console.log("アニメーション作成完了");
      
      // メインメニューへ
      if (localStorage.getItem('gameMode') === 'training') {
        console.log("TrainingGameSceneを開始します");
        this.scene.start(GameConfig.SCENES.TRAINING_GAME);
      } else {
        console.log("MainMenuSceneを開始します");
        this.scene.start(GameConfig.SCENES.MAIN_MENU);
      }
    } catch (e) {
      console.error("PreloadScene createでエラー:", e);
    }
  }
  
  private createLoadingBar(): void {
    // 背景バー
    this.loadingBar = this.add.graphics();
    this.loadingBar.fillStyle(0x222222, 0.8);
    this.loadingBar.fillRect(
      this.cameras.main.width / 4 - 2, 
      this.cameras.main.height / 2 - 18, 
      this.cameras.main.width / 2 + 4, 
      36
    );
    
    // 進行バー
    this.progressBar = this.add.graphics();
    
    // ロードテキスト
    this.loadingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 50,
      '読み込み中...',
      {
        font: '20px Arial',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }
  
  private loadAssets(): void {
    console.log("アセット読み込みを開始");
    
    try {
      // マップタイル
      this.load.image('grass', 'assets/images/tiles/grass.png');
      this.load.image('floor', 'assets/images/tiles/floor.png');
      this.load.image('wall', 'assets/images/tiles/wall.png');
      
      // キャラクター
      this.loadCharacterAssets('hugues');
      this.loadCharacterAssets('gawain');
      this.loadCharacterAssets('lancel');
      this.loadCharacterAssets('beatrice');
      this.loadCharacterAssets('marguerite');
      
      // エフェクト
      this.load.image('bullet', 'assets/images/projectiles/bullet.png');
      this.load.image('arrow', 'assets/images/projectiles/arrow.png');
      this.load.image('bomb', 'assets/images/projectiles/bomb.png');
      this.load.image('explosion', 'assets/images/effects/explosion.png');
      this.load.spritesheet('explosion-anim', 'assets/images/effects/explosion-anim.png', { 
        frameWidth: 64, 
        frameHeight: 64 
      });
      
      // UI要素
      this.load.image('health-bar', 'assets/images/ui/health-bar.png');
      this.load.image('health-bar-bg', 'assets/images/ui/health-bar-bg.png');
      this.load.image('skill-button', 'assets/images/ui/skill-button.png');
      this.load.image('ult-button', 'assets/images/ui/ult-button.png');
      
      // サウンド
      this.load.audio('shot', 'assets/sounds/shot.mp3');
      this.load.audio('hit', 'assets/sounds/hit.mp3');
      this.load.audio('explosion', 'assets/sounds/explosion.mp3');
      
      console.log("アセット読み込みキュー設定完了");
    } catch (e) {
      console.error("アセット読み込み設定中にエラー:", e);
    }
  }
  
  private loadCharacterAssets(name: string): void {
    // キャラクターのスプライトシート
    this.load.spritesheet(
      `${name}-idle`, 
      `assets/images/characters/${name}/${name}-idle.png`,
      { frameWidth: 64, frameHeight: 64 }
    );
    
    this.load.spritesheet(
      `${name}-run`, 
      `assets/images/characters/${name}/${name}-run.png`,
      { frameWidth: 64, frameHeight: 64 }
    );
    
    this.load.spritesheet(
      `${name}-attack`, 
      `assets/images/characters/${name}/${name}-attack.png`,
      { frameWidth: 64, frameHeight: 64 }
    );
    
    this.load.spritesheet(
      `${name}-skill`, 
      `assets/images/characters/${name}/${name}-skill.png`,
      { frameWidth: 64, frameHeight: 64 }
    );
    
    this.load.spritesheet(
      `${name}-ultimate`, 
      `assets/images/characters/${name}/${name}-ultimate.png`,
      { frameWidth: 64, frameHeight: 64 }
    );
    
    // キャラクターのポートレイト
    this.load.image(
      `${name}-portrait`, 
      `assets/images/characters/${name}/${name}-portrait.png`
    );
  }
  
  private createAnimations(): void {
    // キャラクター別アニメーションの作成
    this.createCharacterAnimations('hugues');
    this.createCharacterAnimations('gawain');
    this.createCharacterAnimations('lancel');
    this.createCharacterAnimations('beatrice');
    this.createCharacterAnimations('marguerite');
    
    // エフェクトアニメーション
    this.anims.create({
      key: 'explosion',
      frames: this.anims.generateFrameNumbers('explosion-anim', { start: 0, end: 15 }),
      frameRate: 15,
      repeat: 0
    });
  }
  
  private createCharacterAnimations(name: string): void {
    // アイドル
    this.anims.create({
      key: `${name}-idle`,
      frames: this.anims.generateFrameNumbers(`${name}-idle`, { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    
    // 走る
    this.anims.create({
      key: `${name}-run`,
      frames: this.anims.generateFrameNumbers(`${name}-run`, { start: 0, end: 7 }),
      frameRate: 12,
      repeat: -1
    });
    
    // 攻撃
    this.anims.create({
      key: `${name}-attack`,
      frames: this.anims.generateFrameNumbers(`${name}-attack`, { start: 0, end: 5 }),
      frameRate: 15,
      repeat: 0
    });
    
    // スキル
    this.anims.create({
      key: `${name}-skill`,
      frames: this.anims.generateFrameNumbers(`${name}-skill`, { start: 0, end: 5 }),
      frameRate: 15,
      repeat: 0
    });
    
    // アルティメット
    this.anims.create({
      key: `${name}-ultimate`,
      frames: this.anims.generateFrameNumbers(`${name}-ultimate`, { start: 0, end: 7 }),
      frameRate: 12,
      repeat: 0
    });
  }
}
