import { BaseGameScene } from './BaseGameScene';
import { Player } from '../entities/Player';

export class TrainingGameScene extends BaseGameScene {
  constructor() {
    super('TrainingGameScene');
  }
  
  protected createPlayer(): void {
    // Create player in the middle of the map
    const mapCenter = this.mapManager.getMapCenter();
    this.player = new Player(
      this,
      mapCenter.x,
      mapCenter.y,
      this.character
    );
    
    // Follow player with camera
    this.cameras.main.startFollow(this.player);
  }
  
  protected createUI(): void {
    // Add health bar
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    
    const healthBarBg = this.add.rectangle(
      this.cameras.main.width / 2,
      50,
      healthBarWidth,
      healthBarHeight,
      0x000000,
      0.7
    ).setScrollFactor(0);
    
    const healthBar = this.add.rectangle(
      this.cameras.main.width / 2,
      50,
      healthBarWidth,
      healthBarHeight,
      0x00ff00
    ).setScrollFactor(0);
    
    // Update health bar based on player health
    this.events.on('update', () => {
      const healthPercent = this.player.getHealth() / this.character.getMaxHealth();
      healthBar.width = healthBarWidth * healthPercent;
      healthBar.x = this.cameras.main.width / 2 - (healthBarWidth * (1 - healthPercent)) / 2;
    });
    
    // Add training mode text
    this.add.text(
      this.cameras.main.width / 2,
      20,
      'Training Mode',
      { fontSize: '24px', color: '#ffffff' }
    )
    .setOrigin(0.5)
    .setScrollFactor(0);
    
    // Add back button
    const backButton = this.add.text(
      50,
      50,
      'Back',
      { fontSize: '20px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 10, y: 5 } }
    )
    .setOrigin(0)
    .setScrollFactor(0)
    .setInteractive();
    
    backButton.on('pointerdown', () => {
      this.scene.start('HomeScene');
    });
  }
}
