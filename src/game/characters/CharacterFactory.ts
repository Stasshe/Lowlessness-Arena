import Phaser from 'phaser';
import { TeamType } from '../config';
import { Player } from '../entities/Player';

// キャラクターのインポート
import { Hugues } from './Hugues/hugues_main';
/*
import { Gawain } from './Gawain/gawain_main';
import { Lancel } from './Lancel/lancel_main';
import { Beatrice } from './Beatrice/beatrice_main';
import { Marguerite } from './Marguerite/marguerite_main';
*/
export class CharacterFactory {
  private scene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  // キャラクターを作成
  public createCharacter(type: string, x: number, y: number, team: TeamType, isPlayer: boolean = true): Player {
    switch (type.toLowerCase()) {
      case 'hugues':
        return new Hugues(this.scene, x, y, team, isPlayer);
      /*
      case 'gawain':
        return new Gawain(this.scene, x, y, team, isPlayer);
      case 'lancel':
        return new Lancel(this.scene, x, y, team, isPlayer);
      case 'beatrice':
        return new Beatrice(this.scene, x, y, team, isPlayer);
      case 'marguerite':
        return new Marguerite(this.scene, x, y, team, isPlayer);
        */
      default:
        // デフォルトはヒューズ
        return new Hugues(this.scene, x, y, team, isPlayer);
    }
  }
}
