import Phaser from 'phaser';
import { MapManager } from '../map/MapManager';
import { Player } from '../entities/Player';
import { InputController } from '../input/InputController';
import { Character } from '../characters/Character';
import { CharacterFactory } from '../characters/CharacterFactory';

export abstract class BaseGameScene extends Phaser.Scene {
  protected mapManager!: MapManager;
  protected player!: Player;
  protected enemies: Player[] = [];
  protected inputController!: InputController;
  protected character!: Character;
  protected characterFactory: CharacterFactory;
  
  constructor(sceneKey: string) {
    super(sceneKey);
    this.characterFactory = new CharacterFactory();
  }
  
  init(data: any): void {
    const characterId = data.character || 'Huges';
    this.character = this.characterFactory.createCharacter(characterId);
  }
  
  create(): void {
    // Create the map
    this.mapManager = new MapManager(this);
    this.mapManager.createMap('japan');
    
    // Setup camera
    this.cameras.main.setBounds(0, 0, this.mapManager.getMapWidthInPixels(), this.mapManager.getMapHeightInPixels());
    
    // Setup player
    this.createPlayer();
    
    // Setup input controller
    this.inputController = new InputController(this);
    
    // Setup UI elements
    this.createUI();
    
    // Setup debug mode if enabled
    if (this.physics.world.drawDebug) {
      this.createDebugInfo();
    }
  }
  
  update(time: number, delta: number): void {
    // Update player
    this.player?.update(delta);
    
    // Update enemies
    this.enemies.forEach(enemy => enemy.update(delta));
    
    // Update input controller
    this.inputController.update();
  }
  
  protected abstract createPlayer(): void;
  
  protected abstract createUI(): void;
  
  private createDebugInfo(): void {
    const debugPanel = document.getElementById('debug-panel');
    if (debugPanel) {
      debugPanel.classList.add('show');
    }
    
    this.events.on(Phaser.Scenes.Events.UPDATE, () => {
      if (debugPanel) {
        const info = [
          `FPS: ${Math.round(this.game.loop.actualFps)}`,
          `Player Position: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
          `Enemies: ${this.enemies.length}`,
          `Character: ${this.character.getName()}`,
          `HP: ${this.player.getHealth()}/${this.character.getMaxHealth()}`
        ].join('<br>');
        
        debugPanel.innerHTML = info;
      }
    });
  }
  
  public getPlayer(): Player {
    return this.player;
  }
  
  public getMapManager(): MapManager {
    return this.mapManager;
  }
}
