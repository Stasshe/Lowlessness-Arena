import Phaser from 'phaser';
import { GameConfig } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(GameConfig.SCENES.BOOT);
  }
  
  init() {
    console.log("BootScene initialized");
    // 背景色を設定
    this.cameras.main.setBackgroundColor('#2d2d2d');
  }

  preload(): void {
    console.log("BootScene preload start");
    
    // 最小限のロード画面用アセットの読み込み
    this.load.image('logo', 'assets/images/logo.png');
    this.load.image('loading-bar', 'assets/images/loading-bar.png');
    
    // フォントの指定が原因かもしれないのでデフォルトフォントを使用
    this.add.text(
      this.cameras.main.width / 2, 
      this.cameras.main.height / 2, 
      'Loading...', 
      { color: '#ffffff', fontSize: '24px' }
    ).setOrigin(0.5);
    
    console.log("BootScene preload complete");
  }

  create(): void {
    console.log("BootScene create");

    // デバッグ情報
    if (GameConfig.DEBUG) {
      console.log('Boot scene started');
    }

    // アセットの読み込み状態をチェック
    this.checkAssets();

    // PreloadSceneに移動
    this.scene.start(GameConfig.SCENES.PRELOAD);
    console.log("BootScene complete, starting PreloadScene");
  }
  
  // アセットの読み込み状態をチェック
  private checkAssets(): void {
    try {
      // テキスト表示でアセット読み込み状況をテスト
      this.add.text(
        10, 10, 
        'Boot scene ready', 
        { fontSize: '16px', color: '#ffffff' }
      );
      
      console.log("Boot scene assets test successful");
    } catch (e) {
      console.error("アセット読み込みエラー:", e);
    }
  }
}
