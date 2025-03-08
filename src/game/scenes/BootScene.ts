import Phaser from 'phaser';
import { GameConfig } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(GameConfig.SCENES.BOOT);
  }

  preload(): void {
    // 最小限のロード画面用アセットの読み込み
    this.load.image('logo', 'assets/images/logo.png');
    this.load.image('loading-bar', 'assets/images/loading-bar.png');
  }

  create(): void {
    // デバッグ情報
    if (GameConfig.DEBUG) {
      console.log('Boot scene started');
    }

    // PreloadSceneに移動
    this.scene.start(GameConfig.SCENES.PRELOAD);
  }
}
