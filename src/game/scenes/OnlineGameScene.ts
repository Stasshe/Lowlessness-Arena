import { BaseGameScene } from './BaseGameScene';
import { Player } from '../entities/Player';
import { Firestore, collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getRandomId } from '../../utils/helpers';

export class OnlineGameScene extends BaseGameScene {
  private gameId: string;
  private playerId: string;
  private firestore: Firestore;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 100; // 100ms = 10 updates per second
  private opponents: Map<string, Player> = new Map();
  
  constructor() {
    super('OnlineGameScene');
    this.gameId = '';
    this.playerId = getRandomId();
  }
  
  init(data: any): void {
    super.init(data);
    this.gameId = data.gameId || 'game_' + getRandomId();
    this.firestore = this.registry.get('firestore');
  }
  
  protected createPlayer(): void {
    // Create player at spawn point
    const spawnPoint = this.mapManager.getPlayerSpawnPoint();
    this.player = new Player(
      this,
      spawnPoint.x,
      spawnPoint.y,
      this.character
    );
    
    // Follow player with camera
    this.cameras.main.startFollow(this.player);
    
    // Set up multiplayer sync
    this.setupMultiplayerSync();
  }
  
  private setupMultiplayerSync(): void {
    // Save player initial position to Firestore
    this.updatePlayerPosition();
    
    // Listen for other players
    const gameRef = collection(this.firestore, 'games', this.gameId, 'players');
    onSnapshot(gameRef, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        const data = change.doc.data();
        const playerId = change.doc.id;
        
        // Skip our own player
        if (playerId === this.playerId) return;
        
        if (change.type === 'added' || change.type === 'modified') {
          this.updateOpponent(playerId, data);
        }
        
        if (change.type === 'removed') {
          this.removeOpponent(playerId);
        }
      });
    });
  }
  
  private updatePlayerPosition(): void {
    if (!this.firestore || !this.player) return;
    
    const playerData = {
      x: this.player.x,
      y: this.player.y,
      character: this.character.getId(),
      health: this.player.getHealth(),
      angle: this.player.angle,
      lastUpdate: Date.now()
    };
    
    setDoc(doc(this.firestore, 'games', this.gameId, 'players', this.playerId), playerData);
  }
  
  private updateOpponent(playerId: string, data: any): void {
    if (this.opponents.has(playerId)) {
      // Update existing opponent
      const opponent = this.opponents.get(playerId)!;
      opponent.setPosition(data.x, data.y);
      opponent.setAngle(data.angle);
      opponent.setHealth(data.health);
    } else {
      // Create new opponent
      const opponentCharacter = this.characterFactory.createCharacter(data.character);
      const opponent = new Player(this, data.x, data.y, opponentCharacter);
      opponent.setAngle(data.angle);
      opponent.setHealth(data.health);
      this.opponents.set(playerId, opponent);
    }
  }
  
  private removeOpponent(playerId: string): void {
    if (this.opponents.has(playerId)) {
      const opponent = this.opponents.get(playerId)!;
      opponent.destroy();
      this.opponents.delete(playerId);
    }
  }
  
  update(time: number, delta: number): void {
    super.update(time, delta);
    
    // Update player position to Firestore periodically
    if (time - this.lastUpdateTime > this.updateInterval) {
      this.updatePlayerPosition();
      this.lastUpdateTime = time;
    }
  }
  
  protected createUI(): void {
    // Add health bars for all players
    this.events.on('update', () => {
      // Player health bar
      this.updateHealthBar(this.player);
      
      // Opponent health bars
      this.opponents.forEach(opponent => {
        this.updateHealthBar(opponent);
      });
    });
    
    // Add game ID text
    this.add.text(
      this.cameras.main.width / 2,
      20,
      `Game ID: ${this.gameId}`,
      { fontSize: '18px', color: '#ffffff' }
    )
    .setOrigin(0.5)
    .setScrollFactor(0);
    
    // Add exit button
    const exitButton = this.add.text(
      50,
      50,
      'Exit',
      { fontSize: '20px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 10, y: 5 } }
    )
    .setOrigin(0)
    .setScrollFactor(0)
    .setInteractive();
    
    exitButton.on('pointerdown', () => {
      // Clean up before exiting
      this.leaveGame();
      this.scene.start('HomeScene');
    });
  }
  
  private updateHealthBar(player: Player): void {
    const healthBarWidth = 100;
    const healthBarHeight = 10;
    
    // Health bar is positioned above the player
    const x = player.x;
    const y = player.y - player.height / 2 - 20;
    
    // Create or update health bar background
    if (!player.data.get('healthBarBg')) {
      const healthBarBg = this.add.rectangle(
        x,
        y,
        healthBarWidth,
        healthBarHeight,
        0x000000,
        0.7
      );
      player.data.set('healthBarBg', healthBarBg);
    } else {
      const healthBarBg = player.data.get('healthBarBg') as Phaser.GameObjects.Rectangle;
      healthBarBg.setPosition(x, y);
    }
    
    // Create or update health bar
    if (!player.data.get('healthBar')) {
      const healthBar = this.add.rectangle(
        x,
        y,
        healthBarWidth,
        healthBarHeight,
        0x00ff00
      );
      player.data.set('healthBar', healthBar);
    } else {
      const healthBar = player.data.get('healthBar') as Phaser.GameObjects.Rectangle;
      const healthPercent = player.getHealth() / player.getCharacter().getMaxHealth();
      healthBar.width = healthBarWidth * healthPercent;
      healthBar.x = x - (healthBarWidth * (1 - healthPercent)) / 2;
      healthBar.y = y;
    }
  }
  
  private leaveGame(): void {
    if (!this.firestore) return;
    
    // Remove player from the game
    const playerRef = doc(this.firestore, 'games', this.gameId, 'players', this.playerId);
    setDoc(playerRef, { left: true }, { merge: true });
  }
}
