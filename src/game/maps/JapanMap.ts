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
    console.log("JapanMap のデータを取得中");
    
    // データの有効性をチェック
    if (!this.data || this.data.length === 0) {
      console.warn("マップデータが空のため、デバッグ用のダミーマップを作成します");
      return this.createFallbackMap();
    }
    
    console.log(`マップサイズ: ${this.data[0].length}x${this.data.length}`);
    return this.data;
  }

  // フォールバック（デバッグ）マップの作成
  private createFallbackMap(): BlockType[][] {
    console.log("フォールバックマップを作成中");
    const map: BlockType[][] = [];
    
    // 10x18の単純なマップを作成
    for (let y = 0; y < 10; y++) {
      map[y] = [];
      for (let x = 0; x < 18; x++) {
        // 外周に壁を設置
        if (x === 0 || y === 0 || x === 17 || y === 9) {
          map[y][x] = BlockType.WALL;
        } 
        // いくつかランダムな壁
        else if ((x === 4 || x === 13) && (y === 3 || y === 6)) {
          map[y][x] = BlockType.WALL;
        }
        // 一部草
        else if ((x > 7 && x < 11) && (y > 3 && y < 7)) {
          map[y][x] = BlockType.GRASS;
        }
        // それ以外は床
        else {
          map[y][x] = BlockType.FLOOR;
        }
      }
    }
    
    console.log("フォールバックマップ作成完了");
    return map;
  }

  // スポーンポイントの取得
  public getSpawnPoint(team: TeamType): { x: number, y: number } {
    console.log(`TeamType ${team} のスポーンポイントを取得`);
    if (team === TeamType.BLUE) {
      return this.blueSpawn;
    } else {
      return this.redSpawn;
    }
  }
}
