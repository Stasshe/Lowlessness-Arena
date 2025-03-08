import { Character, CharacterConfig } from './Character';
import { TeamType } from '../config';

export class Player extends Character {
  // プレイヤー固有のプロパティがあれば追加
  private isPlayer: boolean;
  
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, config: CharacterConfig, team: TeamType, isPlayer: boolean = true) {
    super(scene, x, y, texture, config, team);
    this.isPlayer = isPlayer;
    
    // プレイヤーの場合はカメラの追従対象に
    if (this.isPlayer) {
      scene.cameras.main.startFollow(this, true, 0.09, 0.09);
    }
  }
  
  // プレイヤーかAIかを取得
  public getIsPlayer(): boolean {
    return this.isPlayer;
  }
}
