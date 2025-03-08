import Phaser from 'phaser';
import { GameConfig, AttackType } from '../config';
import { Player } from '../entities/Player';

export class UIScene extends Phaser.Scene {
  // UI要素
  private skillButton!: Phaser.GameObjects.Image;
  private ultButton!: Phaser.GameObjects.Image;
  private skillCooldownOverlay!: Phaser.GameObjects.Graphics;
  private ultCooldownOverlay!: Phaser.GameObjects.Graphics;
  private ultChargeText!: Phaser.GameObjects.Text;
  
  // プレイヤーの参照
  private player: Player | null = null;
  
  // アクティブなゲームシーン
  private gameScene: Phaser.Scene | null = null;
  
  constructor() {
    super(GameConfig.SCENES.UI);
  }
  
  create(): void {
    // UIの作成
    this.createUI();
    
    // ゲームシーンからのイベントをリッスン
    this.listenToGameEvents();
  }
  
  update(time: number, delta: number): void {
    // プレイヤー情報が利用可能なら、UIを更新
    if (this.player) {
      this.updateCooldowns();
      this.updateUltimateCharge();
    }
  }
  
  private createUI(): void {
    // スキルボタン
    this.skillButton = this.add.image(
      this.cameras.main.width - 180,
      this.cameras.main.height - 100,
      'skill-button'
    );
    this.skillButton.setScrollFactor(0);
    this.skillButton.setScale(0.8);
    
    // アルティメットボタン
    this.ultButton = this.add.image(
      this.cameras.main.width - 80,
      this.cameras.main.height - 100,
      'ult-button'
    );
    this.ultButton.setScrollFactor(0);
    this.ultButton.setScale(0.8);
    
    // クールダウンオーバーレイの作成
    this.skillCooldownOverlay = this.add.graphics();
    this.skillCooldownOverlay.setScrollFactor(0);
    
    this.ultCooldownOverlay = this.add.graphics();
    this.ultCooldownOverlay.setScrollFactor(0);
    
    // アルティメットチャージのテキスト
    this.ultChargeText = this.add.text(
      this.cameras.main.width - 80,
      this.cameras.main.height - 100,
      '0%',
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff'
      }
    );
    this.ultChargeText.setOrigin(0.5, 0.5);
    this.ultChargeText.setScrollFactor(0);
    
    // デバッグテキスト（開発中のみ）
    if (GameConfig.DEBUG) {
      const debugText = this.add.text(10, 10, 'UI SCENE', {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#00ff00'
      });
      debugText.setScrollFactor(0);
    }
  }
  
  private listenToGameEvents(): void {
    // ゲームシーンが準備できたらUIを更新
    const updateFromGameScene = (scene: Phaser.Scene) => {
      this.gameScene = scene;
      
      // プレイヤー情報の取得
      if (scene.data.has('player')) {
        this.player = scene.data.get('player');
      } else {
        // プレイヤー情報がなければ探す
        const gameScene = scene as any;
        if (gameScene.player) {
          this.player = gameScene.player;
        }
      }
    };
    
    // 各ゲームシーンをリッスン
    this.scene.get(GameConfig.SCENES.TRAINING_GAME).events.on('scene-ready', () => {
      updateFromGameScene(this.scene.get(GameConfig.SCENES.TRAINING_GAME));
    });
    
    this.scene.get(GameConfig.SCENES.ONLINE_GAME).events.on('scene-ready', () => {
      updateFromGameScene(this.scene.get(GameConfig.SCENES.ONLINE_GAME));
    });
  }
  
  private updateCooldowns(): void {
    if (!this.player) return;
    
    // スキルクールダウンの更新
    this.skillCooldownOverlay.clear();
    if (!this.player.getCooldownReady(AttackType.SKILL)) {
      this.skillCooldownOverlay.fillStyle(0x000000, 0.6);
      this.skillCooldownOverlay.fillCircle(
        this.skillButton.x,
        this.skillButton.y,
        this.skillButton.displayWidth / 2
      );
    }
    
    // アルティメットクールダウンの更新
    this.ultCooldownOverlay.clear();
    if (!this.player.getIsUltimateReady()) {
      // チャージ中の表示
      const chargePercentage = this.player.ultimateCharge / this.player.ultimateChargeMax;
      this.ultCooldownOverlay.fillStyle(0x000000, 0.6);
      
      // 円形のマスクを使って残りゲージを表現
      const centerX = this.ultButton.x;
      const centerY = this.ultButton.y;
      const radius = this.ultButton.displayWidth / 2;
      
      // 塗りつぶす角度を計算（上部から時計回り）
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (1 - chargePercentage) * Math.PI * 2;
      
      // 円弧と中心を結ぶパスで塗りつぶし
      this.ultCooldownOverlay.beginPath();
      this.ultCooldownOverlay.moveTo(centerX, centerY);
      this.ultCooldownOverlay.arc(centerX, centerY, radius, startAngle, endAngle, false);
      this.ultCooldownOverlay.closePath();
      this.ultCooldownOverlay.fillPath();
    }
  }
  
  private updateUltimateCharge(): void {
    if (!this.player) return;
    
    // アルティメットチャージの表示
    const chargePercentage = Math.floor((this.player.ultimateCharge / this.player.ultimateChargeMax) * 100);
    this.ultChargeText.setText(`${chargePercentage}%`);
    
    // チャージ完了時はハイライト
    if (this.player.getIsUltimateReady()) {
      this.ultButton.setTint(0xffff00);
      this.ultChargeText.setColor('#ffff00');
    } else {
      this.ultButton.clearTint();
      this.ultChargeText.setColor('#ffffff');
    }
  }
}
