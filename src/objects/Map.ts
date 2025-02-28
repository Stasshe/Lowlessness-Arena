import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class Map {
  private scene: Phaser.Scene;
  private walls: Phaser.Physics.Arcade.StaticGroup;
  private bushes: Phaser.Physics.Arcade.StaticGroup;
  private spawnPoints: Phaser.Types.Math.Vector2Like[];
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.walls = scene.physics.add.staticGroup();
    this.bushes = scene.physics.add.staticGroup();
    this.spawnPoints = [];
    
    // マップを生成
    this.createMap();
  }
  
  private createMap(): void {
    const width = 30; // マップの横幅（タイル数）
    const height = 30; // マップの縦幅（タイル数）
    const tileSize = GameConfig.TILE_SIZE;
    
    // 背景のグリッド（草地）を作成
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // マップの端は壁で囲む
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
          this.createWall(x * tileSize, y * tileSize);
        } else {
          // 内側は草地
          this.createGrassTile(x * tileSize, y * tileSize);
          
          // 一定の確率で壁や茂みを配置
          const randomValue = Math.random();
          if (randomValue < 0.05) {
            this.createWall(x * tileSize, y * tileSize);
          } else if (randomValue < 0.1) {
            this.createBush(x * tileSize, y * tileSize);
          }
        }
      }
    }
    
    // スポーンポイントを設定（トレーニングモードでは左下あたり）
    this.spawnPoints.push({ x: tileSize * 3, y: tileSize * (height - 3) });
    
    // マップの中央に大きめの障害物を配置
    this.createCenterObstacle(width, height, tileSize);
  }
  
  private createCenterObstacle(width: number, height: number, tileSize: number): void {
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    
    // 中央に十字型の障害物を配置
    for (let offset = -2; offset <= 2; offset++) {
      // 水平部分
      this.createWall((centerX + offset) * tileSize, centerY * tileSize);
      
      // 垂直部分
      this.createWall(centerX * tileSize, (centerY + offset) * tileSize);
    }
    
    // 十字の端に茂みを配置
    this.createBush((centerX - 3) * tileSize, centerY * tileSize);
    this.createBush((centerX + 3) * tileSize, centerY * tileSize);
    this.createBush(centerX * tileSize, (centerY - 3) * tileSize);
    this.createBush(centerX * tileSize, (centerY + 3) * tileSize);
  }
  
  private createWall(x: number, y: number): void {
    this.walls.create(x + GameConfig.TILE_SIZE / 2, y + GameConfig.TILE_SIZE / 2, 'wall')
      .setSize(GameConfig.TILE_SIZE, GameConfig.TILE_SIZE)
      .setImmovable(true);
  }
  
  private createBush(x: number, y: number): void {
    this.bushes.create(x + GameConfig.TILE_SIZE / 2, y + GameConfig.TILE_SIZE / 2, 'bush')
      .setSize(GameConfig.TILE_SIZE, GameConfig.TILE_SIZE)
      .setDepth(1)  // 茂みは他のオブジェクトより上にレイヤーを設定
      .setAlpha(0.7); // 少し透明にして中が見えるように
  }
  
  private createGrassTile(x: number, y: number): void {
    // 草の背景タイル（衝突判定なし）
    this.scene.add.image(x + GameConfig.TILE_SIZE / 2, y + GameConfig.TILE_SIZE / 2, 'grass')
      .setDepth(0); // 背景は最下層
  }
  
  getSpawnPoint(): Phaser.Types.Math.Vector2Like {
    // 複数のスポーンポイントからランダムに選択
    return this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
  }
  
  getWalls(): Phaser.Physics.Arcade.StaticGroup {
    return this.walls;
  }
  
  getBushes(): Phaser.Physics.Arcade.StaticGroup {
    return this.bushes;
  }
  
  // キャラクターが茂みに入ったかどうかを検出する
  isInBush(object: Phaser.GameObjects.GameObject): boolean {
    let result = false;
    
    this.scene.physics.overlap(object, this.bushes, () => {
      result = true;
    });
    
    return result;
  }
}
