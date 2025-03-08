import Phaser from 'phaser';
import { GameConfig } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(GameConfig.SCENES.BOOT);
  }
  
  init() {
    console.log("===== BootScene 初期化開始 =====");
    // 背景色を設定
    this.cameras.main.setBackgroundColor('#2d2d2d');
  }

  preload(): void {
    console.log("BootScene preload 開始");
    
    // Phaserステータスのダンプ
    console.log("テクスチャー状態:", this.textures.list ? "利用可能" : "未定義");
    console.log("キャッシュ状態:", this.cache ? "利用可能" : "未定義");
    
    try {
      // 最小限のロード画面用アセットの読み込み
      this.load.image('logo', 'assets/images/logo.png');
      this.load.image('loading-bar', 'assets/images/loading-bar.png');
      
      // エラーハンドラを追加
      this.load.on('loaderror', (fileObj: any) => {
        console.error("アセットロードエラー:", fileObj.key, fileObj.src);
      });
      
      // ロード完了ハンドラ
      this.load.on('complete', () => {
        console.log("BootScene プリロード完了");
      });
      
      // フォントの指定が原因かもしれないのでデフォルトフォントを使用
      this.add.text(
        this.cameras.main.width / 2, 
        this.cameras.main.height / 2, 
        'ロード中...', 
        { color: '#ffffff', fontSize: '24px' }
      ).setOrigin(0.5);
      
      console.log("BootScene preload 完了");
    } catch (e) {
      console.error("BootScene preload でエラーが発生しました:", e);
    }
  }

  create(): void {
    console.log("===== BootScene create 開始 =====");

    // デバッグ情報
    if (GameConfig.DEBUG) {
      console.log('Boot scene デバッグ情報');
    }

    // アセットの読み込み状態をチェック
    this.checkAssets();

    // PreloadSceneに移動
    try {
      console.log("PreloadScene を開始します...");
      this.scene.start(GameConfig.SCENES.PRELOAD);
      console.log("PreloadScene 開始リクエスト完了");
    } catch (e) {
      console.error("PreloadScene 開始エラー:", e);
    }
  }
  
  // アセットの読み込み状態をチェック
  private checkAssets(): void {
    try {
      // ロードしたアセットをテスト
      const hasLogo = this.textures.exists('logo');
      const hasLoadingBar = this.textures.exists('loading-bar');
      console.log("アセット読み込み確認:", {
        logo: hasLogo ? "OK" : "失敗",
        loadingBar: hasLoadingBar ? "OK" : "失敗"
      });
      
      // テキスト表示でアセット読み込み状況をテスト
      this.add.text(
        10, 10, 
        'Boot scene ready', 
        { fontSize: '16px', color: '#ffffff' }
      );
      
      console.log("Boot scene アセットテスト成功");
    } catch (e) {
      console.error("アセット読み込み確認でエラーが発生しました:", e);
    }
  }
}
