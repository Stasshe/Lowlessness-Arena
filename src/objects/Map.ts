import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { Player } from './Player';

export class Map {
  private scene: Phaser.Scene;
  private tileSize: number = GameConfig.TILE_SIZE;
  private mapWidth: number = 30; // タイル単位
  private mapHeight: number = 30; // タイル単位
  private walls: Phaser.Physics.Arcade.StaticGroup;
  private bushes: Phaser.Physics.Arcade.StaticGroup;
  private spawnPoint: { x: number, y: number } = { x: 400, y: 400 };
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.walls = scene.physics.add.staticGroup();
    this.bushes = scene.physics.add.staticGroup();
    
    this.createMap();
  }
  
  private createMap(): void {
    // マップの背景（芝生）
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        const posX = x * this.tileSize + this.tileSize / 2;
        const posY = y * this.tileSize + this.tileSize / 2;
        
        // 画面外でもレンダリングされるようにするための範囲チェック
        if (
          posX >= -this.tileSize && posX <= this.scene.cameras.main.width + this.tileSize &&
          posY >= -this.tileSize && posY <= this.scene.cameras.main.height + this.tileSize
        ) {
          this.scene.add.image(posX, posY, 'grass');
        }
      }
    }
    
    // 壁を配置（マップの外周）
    for (let x = 0; x < this.mapWidth; x++) {
      // 上下の壁
      this.createWall(x * this.tileSize + this.tileSize / 2, this.tileSize / 2);
      this.createWall(x * this.tileSize + this.tileSize / 2, this.mapHeight * this.tileSize - this.tileSize / 2);
    }
    
    for (let y = 0; y < this.mapHeight; y++) {
      // 左右の壁
      this.createWall(this.tileSize / 2, y * this.tileSize + this.tileSize / 2);
      this.createWall(this.mapWidth * this.tileSize - this.tileSize / 2, y * this.tileSize + this.tileSize / 2);
    }
    
    // マップ中央に障害物を配置
    this.createObstacles();
    
    // 茂みを配置
    this.createBushes();
  }
  
  private createWall(x: number, y: number): void {
    const wall = this.walls.create(x, y, 'wall');
    wall.setImmovable(true);
    wall.body.setSize(this.tileSize, this.tileSize);
  }
  
  private createBush(x: number, y: number): void {
    const bush = this.bushes.create(x, y, 'bush');
    bush.setAlpha(0.7); // 半透明に設定
    bush.setDepth(5); // 描画順序を設定
  }
  
  private createObstacles(): void {
    // マップ中央付近に壁を配置
    const centerX = Math.floor(this.mapWidth / 2);
    const centerY = Math.floor(this.mapHeight / 2);
    
    // 中央のL字型の壁
    for (let i = -2; i <= 2; i++) {
      this.createWall((centerX + i) * this.tileSize + this.tileSize / 2, centerY * this.tileSize + this.tileSize / 2);
      
      if (i >= 0) {
        this.createWall(centerX * this.tileSize + this.tileSize / 2, (centerY + i) * this.tileSize + this.tileSize / 2);
      }
    }
    
    // その他の障害物（例）
    this.createWall((centerX - 5) * this.tileSize + this.tileSize / 2, (centerY - 5) * this.tileSize + this.tileSize / 2);
    this.createWall((centerX - 5) * this.tileSize + this.tileSize / 2, (centerY - 4) * this.tileSize + this.tileSize / 2);
    this.createWall((centerX - 4) * this.tileSize + this.tileSize / 2, (centerY - 5) * this.tileSize + this.tileSize / 2);
    
    this.createWall((centerX + 5) * this.tileSize + this.tileSize / 2, (centerY + 5) * this.tileSize + this.tileSize / 2);
    this.createWall((centerX + 5) * this.tileSize + this.tileSize / 2, (centerY + 4) * this.tileSize + this.tileSize / 2);
    this.createWall((centerX + 4) * this.tileSize + this.tileSize / 2, (centerY + 5) * this.tileSize + this.tileSize / 2);
    
    // スポーンポイントを設定
    this.spawnPoint = {
      x: (centerX - 7) * this.tileSize,
      y: (centerY - 7) * this.tileSize
    };
  }
  
  private createBushes(): void {
    const centerX = Math.floor(this.mapWidth / 2);
    const centerY = Math.floor(this.mapHeight / 2);
    
    // マップの各所に茂みを配置
    this.createBush((centerX - 3) * this.tileSize + this.tileSize / 2, (centerY - 3) * this.tileSize + this.tileSize / 2);
    this.createBush((centerX - 4) * this.tileSize + this.tileSize / 2, (centerY - 3) * this.tileSize + this.tileSize / 2);
    this.createBush((centerX - 3) * this.tileSize + this.tileSize / 2, (centerY - 4) * this.tileSize + this.tileSize / 2);
    
    this.createBush((centerX + 3) * this.tileSize + this.tileSize / 2, (centerY + 3) * this.tileSize + this.tileSize / 2);
    this.createBush((centerX + 4) * this.tileSize + this.tileSize / 2, (centerY + 3) * this.tileSize + this.tileSize / 2);
    this.createBush((centerX + 3) * this.tileSize + this.tileSize / 2, (centerY + 4) * this.tileSize + this.tileSize / 2);
    
    // 大きめの茂み
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        this.createBush((centerX + i) * this.tileSize + this.tileSize / 2, (centerY + j - 6) * this.tileSize + this.tileSize / 2);
        this.createBush((centerX + i - 6) * this.tileSize + this.tileSize / 2, (centerY + j) * this.tileSize + this.tileSize / 2);
      }
    }
  }
  
  getWalls(): Phaser.Physics.Arcade.StaticGroup {
    return this.walls;
  }
  
  getBushes(): Phaser.Physics.Arcade.StaticGroup {
    return this.bushes;
  }
  
  getSpawnPoint(): { x: number, y: number } {
    return this.spawnPoint;
  }
  
  isInBush(player: Player): boolean {
    // プレイヤーが茂みの中にいるかチェック
    let inBush = false;
    
    this.bushes.getChildren().forEach((bush: Phaser.GameObjects.GameObject) => {
      const bushSprite = bush as Phaser.Physics.Arcade.Sprite;
      const distance = Phaser.Math.Distance.Between(player.x, player.y, bushSprite.x, bushSprite.y);
      
      if (distance < this.tileSize * 0.75) { // 茂みの近くにいる場合
        inBush = true;
      }
    });
    
    return inBush;
  }
}
