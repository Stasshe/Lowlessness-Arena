import { BlockType, GameConfig, TeamType } from '../config';


export class JapanMap {
  // マップデータ
  // g: 草, _: 床, w: 壁
  private data: BlockType[][] = [
    [BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.WALL, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.WALL, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS],
    [BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.WALL, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.WALL, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS],
    [BlockType.WALL, BlockType.WALL, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.WALL, BlockType.WALL, BlockType.WALL, BlockType.WALL, BlockType.WALL, BlockType.WALL, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.WALL, BlockType.WALL],
    [BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR],
    [BlockType.FLOOR, BlockType.FLOOR, BlockType.WALL, BlockType.WALL, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.WALL, BlockType.WALL, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.WALL, BlockType.WALL, BlockType.FLOOR, BlockType.FLOOR],
    [BlockType.FLOOR, BlockType.FLOOR, BlockType.WALL, BlockType.WALL, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.WALL, BlockType.WALL, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.WALL, BlockType.WALL, BlockType.FLOOR, BlockType.FLOOR],
    [BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR],
    [BlockType.WALL, BlockType.WALL, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.WALL, BlockType.WALL, BlockType.WALL, BlockType.WALL, BlockType.WALL, BlockType.WALL, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.WALL, BlockType.WALL],
    [BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.WALL, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.WALL, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS],
    [BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.WALL, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.FLOOR, BlockType.WALL, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS, BlockType.GRASS],
  ];

  // スポーンポイントの座標
  private blueSpawn = { x: 2 * GameConfig.BLOCK_SIZE, y: 5 * GameConfig.BLOCK_SIZE };
  private redSpawn = { x: 16 * GameConfig.BLOCK_SIZE, y: 5 * GameConfig.BLOCK_SIZE };

  // マップデータの取得
  public getData(): BlockType[][] {
    return this.data;
  }

  // スポーンポイントの取得
  public getSpawnPoint(team: TeamType): { x: number, y: number } {
    if (team === TeamType.BLUE) {
      return this.blueSpawn;
    } else {
      return this.redSpawn;
    }
  }
}
