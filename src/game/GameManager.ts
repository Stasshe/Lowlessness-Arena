import { Firestore } from 'firebase/firestore';
import Phaser from 'phaser';
import { TrainingGameScene } from './scenes/TrainingGameScene';
import { OnlineGameScene } from './scenes/OnlineGameScene';
import { HomeScene } from './scenes/HomeScene';
import { LoadingScene } from './scenes/LoadingScene';
import { CharacterSelectionScene } from './scenes/CharacterSelectionScene';

export enum GameMode {
  TRAINING,
  ONLINE
}

export class GameManager {
  private game: Phaser.Game;
  private firestore: Firestore;
  private debugMode: boolean = false;
  private gameMode: GameMode = GameMode.TRAINING;
  private selectedCharacter: string = 'Huges';
  
  constructor(firestore: Firestore) {
    this.firestore = firestore;
    
    // Calculate the game size based on device
    const gameConfig = this.calculateGameSize();
    
    // Initialize Phaser game
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      width: gameConfig.width,
      height: gameConfig.height,
      parent: 'game-container',
      backgroundColor: '#000000',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: {
          debug: this.debugMode,
          gravity: { y: 0 }
        }
      },
      scene: [LoadingScene, HomeScene, CharacterSelectionScene, TrainingGameScene, OnlineGameScene]
    });
    
    // Register resize event
    window.addEventListener('resize', () => {
      this.updateGameSize();
    });
    
    // Start with the loading scene
    this.game.scene.start('LoadingScene');
  }
  
  private calculateGameSize() {
    // Default size: 1620x2160
    const defaultWidth = 1620;
    const defaultHeight = 2160;
    
    // Get device dimensions
    const { innerWidth, innerHeight } = window;
    
    // Always use landscape mode on tablets and PCs
    const width = Math.max(innerWidth, innerHeight);
    const height = Math.min(innerWidth, innerHeight);
    
    // Calculate aspect ratio
    const ratio = Math.min(width / defaultWidth, height / defaultHeight);
    
    return {
      width: defaultWidth,
      height: defaultHeight,
      ratio
    };
  }
  
  public updateGameSize() {
    const gameConfig = this.calculateGameSize();
    this.game.scale.resize(gameConfig.width, gameConfig.height);
  }
  
  public startGame(mode: GameMode, character: string) {
    this.gameMode = mode;
    this.selectedCharacter = character;
    
    if (mode === GameMode.TRAINING) {
      this.game.scene.start('TrainingGameScene', { character });
    } else {
      this.game.scene.start('OnlineGameScene', { character });
    }
  }
  
  public navigateToHome() {
    this.game.scene.start('HomeScene');
  }
  
  public navigateToCharacterSelection() {
    this.game.scene.start('CharacterSelectionScene');
  }
  
  public getFirestore(): Firestore {
    return this.firestore;
  }
  
  public getSelectedCharacter(): string {
    return this.selectedCharacter;
  }
  
  public getGameMode(): GameMode {
    return this.gameMode;
  }
  
  public toggleDebug() {
    this.debugMode = !this.debugMode;
    
    // Update the debug setting in current scene
    const currentScene = this.game.scene.getScenes(true)[0];
    if (currentScene) {
      currentScene.physics.world.drawDebug = this.debugMode;
      
      // Update debug panel
      const debugPanel = document.getElementById('debug-panel');
      if (debugPanel) {
        debugPanel.innerHTML = `Debug Mode: ${this.debugMode ? 'ON' : 'OFF'}`;
      }
    }
  }
  
  public isDebugMode(): boolean {
    return this.debugMode;
  }
}
