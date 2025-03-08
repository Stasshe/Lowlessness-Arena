import Phaser from 'phaser';

export class HomeScene extends Phaser.Scene {
  constructor() {
    super('HomeScene');
  }
  
  create(): void {
    // Title
    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.height * 0.2,
      'Lowlessness Arena',
      { fontSize: '64px', color: '#ffffff', fontStyle: 'bold' }
    ).setOrigin(0.5);
    
    // Training mode button
    const trainingButton = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 50,
      'Training Mode',
      { fontSize: '32px', color: '#ffffff', backgroundColor: '#222222', padding: { x: 20, y: 10 } }
    )
    .setOrigin(0.5)
    .setInteractive();
    
    trainingButton.on('pointerdown', () => {
      this.scene.start('CharacterSelectionScene', { mode: 'training' });
    });
    
    // Online mode button
    const onlineButton = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 50,
      'Online Mode',
      { fontSize: '32px', color: '#ffffff', backgroundColor: '#222222', padding: { x: 20, y: 10 } }
    )
    .setOrigin(0.5)
    .setInteractive();
    
    onlineButton.on('pointerdown', () => {
      this.scene.start('CharacterSelectionScene', { mode: 'online' });
    });
    
    // Version text
    this.add.text(
      this.cameras.main.width - 20,
      this.cameras.main.height - 20,
      'v1.0.0',
      { fontSize: '16px', color: '#999999' }
    ).setOrigin(1);
    
    // Debug tip
    this.add.text(
      20,
      this.cameras.main.height - 20,
      'Tip: Press Ctrl+D to toggle debug mode',
      { fontSize: '14px', color: '#666666' }
    ).setOrigin(0, 1);
  }
}
