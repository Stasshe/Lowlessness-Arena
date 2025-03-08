import Phaser from 'phaser';
import { GameConfig, BlockType, TeamType } from '../config';

export class Map {
  private scene: Phaser.Scene;
  private mapData: any;
  private wallLayer!: Phaser.Physics.Arcade.StaticGroup;
  private grassLayer!: Phaser.Physics.Arcade.StaticGroup;
  private floorLayer!: Phaser.Physics.Arcade.StaticGroup;

  constructor(scene: Phaser.Scene, mapData: any) {
    this.scene = scene;
    this.mapData = mapData;
  }

  // マップを作成
  public create(): void {
    const data = this.mapData.getData();
    
    // レイヤーの作成
    this.wallLayer = this.scene.physics.add.staticGroup();
    this.grassLayer = this.scene.physics.add.staticGroup();
    this.floorLayer = this.scene.physics.add.staticGroup();
    
    // マップデータを元にブロックを配置
    for (let y = 0; y < data.length; y++) {
      for (let x = 0; x < data[y].length; x++) {
        const blockType = data[y][x];
        const blockX = x * GameConfig.BLOCK_SIZE + GameConfig.BLOCK_SIZE / 2;
        const blockY = y * GameConfig.BLOCK_SIZE + GameConfig.BLOCK_SIZE / 2;
        
        switch(blockType) {
          case BlockType.WALL:
            this.wallLayer.create(blockX, blockY, 'wall').setScale(GameConfig.BLOCK_SIZE / 64);
            break;
          case BlockType.GRASS:
            this.grassLayer.create(blockX, blockY, 'grass').setScale(GameConfig.BLOCK_SIZE / 64);
            break;
          case BlockType.FLOOR:
            this.floorLayer.create(blockX, blockY, 'floor').setScale(GameConfig.BLOCK_SIZE / 64);
            break;
        }
      }
    }
    
    // 壁の当たり判定を設定
    this.wallLayer.getChildren().forEach((wall: Phaser.GameObjects.GameObject) => {
      const sprite = wall as Phaser.Physics.Arcade.Sprite;
      sprite.setImmovable(true);
      sprite.body.setSize(GameConfig.BLOCK_SIZE * 0.9, GameConfig.BLOCK_SIZE * 0.9);
    });
    
    // 草の上にいるプレイヤーを部分的に隠す処理は別途設定
  }

  // 壁レイヤーの取得
  public getWallLayer(): Phaser.Physics.Arcade.StaticGroup {
    return this.wallLayer;
  }
  
  // 草レイヤーの取得
  public getGrassLayer(): Phaser.Physics.Arcade.StaticGroup {
    return this.grassLayer;
  }
  
  // 床レイヤーの取得
  public getFloorLayer(): Phaser.Physics.Arcade.StaticGroup {
    return this.floorLayer;
  }

  // スポーンポイントの取得
  public getSpawnPoint(team: TeamType): { x: number, y: number } {
    return this.mapData.getSpawnPoint(team);
  }
}
