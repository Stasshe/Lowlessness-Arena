import Phaser from 'phaser';
import { Player } from '../objects/Player';

export class UI {
  private scene: Phaser.Scene;
  private player: Player;
  
  // UI要素を初期化
  private healthBar: Phaser.GameObjects.Graphics;
  private skillButton: Phaser.GameObjects.Image;
  private skillProgress: Phaser.GameObjects.Graphics;
  private ultimateButton: Phaser.GameObjects.Image;
  private ultimateProgress: Phaser.GameObjects.Graphics;
  
  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    
    // UIの要素を初期化
    this.healthBar = scene.add.graphics().setScrollFactor(0).setDepth(101);
    this.skillProgress = scene.add.graphics().setScrollFactor(0).setDepth(101);
    this.ultimateProgress = scene.add.graphics().setScrollFactor(0).setDepth(101);
    
    // ボタンは後でcreateXXXメソッドで初期化されるので、ダミーオブジェクトを入れておく
    this.skillButton = scene.add.image(0, 0, 'button').setVisible(false);
    this.ultimateButton = scene.add.image(0, 0, 'button').setVisible(false);
    
    // UIの初期化
    this.createHealthBar();
    this.createSkillButton();
    this.createUltimateButton();
  }
  
  private createHealthBar(): void {
    // 体力バーの背景
    this.scene.add.rectangle(
      this.scene.cameras.main.width / 2,
      30,
      300,
      20,
      0x000000,
      0.5
    ).setScrollFactor(0).setDepth(100);
    
    // 体力バー
    this.healthBar = this.scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(101);
    
    // 体力テキスト
    this.scene.add.text(
      this.scene.cameras.main.width / 2,
      30,
      'HP',
      { fontSize: '14px', color: '#ffffff' }
    ).setScrollFactor(0).setOrigin(0.5).setDepth(102);
  }
  
  private createSkillButton(): void {
    // スキルボタンの位置（右下）
    const x = this.scene.cameras.main.width - 100;
    const y = this.scene.cameras.main.height - 100;
    
    // スキル進捗
    this.skillProgress = this.scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(101);
    
    // スキルボタン
    this.skillButton = this.scene.add.image(x, y, 'button')
      .setScrollFactor(0)
      .setDepth(102)
      .setDisplaySize(60, 60)
      .setInteractive()
      .on('pointerdown', () => {
        this.player.useSkill();
      });
    
    // スキルアイコン
    this.scene.add.text(x, y, 'スキル', { 
      fontSize: '12px', 
      color: '#ffffff'
    }).setScrollFactor(0).setOrigin(0.5).setDepth(103);
  }
  
  private createUltimateButton(): void {
    // アルティメットボタンの位置（右下）
    const x = this.scene.cameras.main.width - 180;
    const y = this.scene.cameras.main.height - 100;
    
    // アルティメット進捗
    this.ultimateProgress = this.scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(101);
    
    // アルティメットボタン
    this.ultimateButton = this.scene.add.image(x, y, 'button')
      .setScrollFactor(0)
      .setDepth(102)
      .setDisplaySize(60, 60)
      .setTint(0xff0000)
      .setInteractive()
      .on('pointerdown', () => {
        this.player.useUltimate();
      });
    
    // アルティメットアイコン
    this.scene.add.text(x, y, '覚醒', { 
      fontSize: '12px', 
      color: '#ffffff'
    }).setScrollFactor(0).setOrigin(0.5).setDepth(103);
  }
  
  update(): void {
    this.updateHealthBar();
    this.updateSkillButton();
    this.updateUltimateButton();
  }
  
  private updateHealthBar(): void {
    const health = this.player.getHealth();
    const maxHealth = this.player.getMaxHealth();
    const width = 300 * (health / maxHealth);
    
    this.healthBar.clear();
    this.healthBar.fillStyle(0x00ff00, 1);
    this.healthBar.fillRect(
      this.scene.cameras.main.width / 2 - 150,
      20,
      width,
      20
    );
  }
  
  private updateSkillButton(): void {
    const charge = this.player.getSkillCharge();
    const maxCharge = 100;  // プレイヤーから取得するように修正予定
    
    // 進捗を円形で表示
    this.skillProgress.clear();
    this.skillProgress.fillStyle(0x0000ff, 0.7);
    this.skillProgress.slice(
      this.scene.cameras.main.width - 100,
      this.scene.cameras.main.height - 100,
      35,
      0,
      Phaser.Math.DegToRad(360 * (charge / maxCharge)),
      true
    );
    this.skillProgress.fillPath();
  }
  
  private updateUltimateButton(): void {
    const charge = this.player.getUltimateCharge();
    const maxCharge = 100;  // プレイヤーから取得するように修正予定
    
    // 進捗を円形で表示
    this.ultimateProgress.clear();
    this.ultimateProgress.fillStyle(0xff0000, 0.7);
    this.ultimateProgress.slice(
      this.scene.cameras.main.width - 180,
      this.scene.cameras.main.height - 100,
      35,
      0,
      Phaser.Math.DegToRad(360 * (charge / maxCharge)),
      true
    );
    this.ultimateProgress.fillPath();
  }
}
