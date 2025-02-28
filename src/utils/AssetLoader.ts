import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

/**
 * アセットのロード処理を共通化するクラス
 */
export class AssetLoader {
  /**
   * マップ関連のアセットをロードする
   * @param scene ロードを行うシーン
   */
  static loadMapAssets(scene: Phaser.Scene): void {
    const quality = GameConfig.HIGH_QUALITY ? 'hq/' : '';
    
    // マップ関連アセット
    scene.load.image('grass', `assets/tiles/${quality}grass.png`);
    scene.load.image('wall', `assets/tiles/${quality}wall.png`);
    scene.load.image('boundary', `assets/tiles/${quality}boundary.png`);
    scene.load.image('bush', `assets/tiles/${quality}bush.png`);
    scene.load.image('spawn', `assets/tiles/${quality}spawn.png`);
  }
  
  /**
   * キャラクター関連のアセットをロードする
   * @param scene ロードを行うシーン
   */
  static loadCharacterAssets(scene: Phaser.Scene): void {
    const quality = GameConfig.HIGH_QUALITY ? 'hq/' : '';
    
    // キャラクターアセット
    scene.load.image('player', `assets/characters/${quality}player.png`);
    scene.load.image('tank', `assets/characters/${quality}tank.png`);
    scene.load.image('speeder', `assets/characters/${quality}speeder.png`);
    scene.load.image('sniper', `assets/characters/${quality}sniper.png`);
    scene.load.image('healer', `assets/characters/${quality}healer.png`);
    scene.load.image('thrower', `assets/characters/${quality}thrower.png`);
  }
  
  /**
   * UI関連のアセットをロードする
   * @param scene ロードを行うシーン
   */
  static loadUIAssets(scene: Phaser.Scene): void {
    const quality = GameConfig.HIGH_QUALITY ? 'hq/' : '';
    
    // UIアセット
    scene.load.image('button', `assets/ui/${quality}button.png`);
    scene.load.image('healthbar', `assets/ui/${quality}healthbar.png`);
    scene.load.image('joystick', `assets/ui/${quality}joystick.png`);
    scene.load.image('joystick-base', `assets/ui/${quality}joystick-base.png`);
  }
  
  /**
   * 武器関連のアセットをロードする
   * @param scene ロードを行うシーン
   */
  static loadWeaponAssets(scene: Phaser.Scene): void {
    const quality = GameConfig.HIGH_QUALITY ? 'hq/' : '';
    
    // 武器アセット
    scene.load.image('bullet', `assets/weapons/${quality}bullet.png`);
    scene.load.image('shotgun_bullet', `assets/weapons/${quality}shotgun_bullet.png`);
    scene.load.image('sniper_bullet', `assets/weapons/${quality}sniper_bullet.png`);
  }
  
  /**
   * デフォルトアセットをロードする
   * @param scene ロードを行うシーン
   */
  static loadDefaultAssets(scene: Phaser.Scene): void {
    // デフォルトアセット（プレースホルダー）
    scene.load.image('default', 'assets/placeholder/default.png');
  }
  
  /**
   * すべてのアセットをロードする
   * @param scene ロードを行うシーン
   */
  static loadAllAssets(scene: Phaser.Scene): void {
    this.loadMapAssets(scene);
    this.loadCharacterAssets(scene);
    this.loadUIAssets(scene);
    this.loadWeaponAssets(scene);
    this.loadDefaultAssets(scene);
  }
}
