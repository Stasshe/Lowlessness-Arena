import Phaser from 'phaser';
import { GameConfig } from '../../config/GameConfig';
import { mapData } from './MapData';

export type MapTile = {
  type: string;
  sprite: Phaser.GameObjects.Sprite | null;
  x: number;
  y: number;
  passable: boolean;
  destructible: boolean;
};

export class MapManager {
  private scene: Phaser.Scene;
  private tileMap: MapTile[][];
  private tileSize: number;
  private mapWidth: number = 0;
  private mapHeight: number = 0;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.tileMap = [];
    this.tileSize = GameConfig.MAP.BLOCK_SIZE;
  }
  
  public createMap(mapName: string): void {
    // マップデータの取得
    const mapDefinition = mapData[mapName];
    
    if (!mapDefinition) {
      console.error(`Map '${mapName}' not found!`);
      return;
    }
    
    // マップのサイズを取得
    this.mapHeight = mapDefinition.data.length;
    this.mapWidth = mapDefinition.data[0].length;
    
    // 2次元配列を初期化
    this.tileMap = Array(this.mapHeight).fill(null).map(() => 
      Array(this.mapWidth).fill(null)
    );
    
    // マップデータからタイルを作成
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tileChar = mapDefinition.data[y][x];
        const tileType = this.getTileTypeFromChar(tileChar);
        const worldX = x * this.tileSize + this.tileSize / 2;
        const worldY = y * this.tileSize + this.tileSize / 2;
        
        // タイルを作成
        this.tileMap[y][x] = this.createTile(tileType, worldX, worldY);
      }
    }
    
    // 壁の物理ボディの作成
    this.createWallBodies();
  }
  
  private getTileTypeFromChar(char: string): string {
    switch (char) {
      case 'g':
        return 'grass';
      case 'w':
        return 'wall';
      case '_':
      default:
        return 'floor';
    }
  }
  
  private createTile(tileType: string, x: number, y: number): MapTile {
    let sprite = null;
    let passable = true;
    let destructible = false;
    
    // タイルタイプに応じてスプライトを作成
    switch (tileType) {
      case 'grass':
        sprite = this.scene.add.sprite(x, y, 'grass');
        passable = true;
        break;
      case 'wall':
        sprite = this.scene.add.sprite(x, y, 'wall');
        passable = false;
        destructible = true;
        break;
      case 'floor':
      default:
        sprite = this.scene.add.sprite(x, y, 'floor');
        passable = true;
        break;
    }
    
    if (sprite) {
      sprite.setDisplaySize(this.tileSize, this.tileSize);
    }
    
    return {
      type: tileType,
      sprite,
      x,
      y,
      passable,
      destructible
    };
  }
  
  private createWallBodies(): void {
    // 物理ボディのグループを作成
    const wallsGroup = this.scene.physics.add.staticGroup();
    
    // 壁のタイルに物理ボディを追加
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tile = this.tileMap[y][x];
        if (tile.type === 'wall' && tile.sprite) {
          wallsGroup.add(tile.sprite);
        }
      }
    }
    
    // 物理ボディを更新
    wallsGroup.refresh();
  }
  
  public getMapWidthInPixels(): number {
    return this.mapWidth * this.tileSize;
  }
  
  public getMapHeightInPixels(): number {
    return this.mapHeight * this.tileSize;
  }
  
  public getMapWidth(): number {
    return this.mapWidth;
  }
  
  public getMapHeight(): number {
    return this.mapHeight;
  }
  
  public getMapCenter(): { x: number, y: number } {
    return {
      x: this.getMapWidthInPixels() / 2,
      y: this.getMapHeightInPixels() / 2
    };
  }
  
  public getPlayerSpawnPoint(): { x: number, y: number } {
    // 左下の角付近をプレイヤーのスポーン地点とする
    return {
      x: this.tileSize * 2,
      y: this.getMapHeightInPixels() - this.tileSize * 2
    };
  }
  
  public getEnemySpawnPoint(): { x: number, y: number } {
    // 右上の角付近を敵のスポーン地点とする
    return {
      x: this.getMapWidthInPixels() - this.tileSize * 2,
      y: this.tileSize * 2
    };
  }
  
  public isTilePassable(x: number, y: number): boolean {
    // ワールド座標をタイルインデックスに変換
    const tileX = Math.floor(x / this.tileSize);
    const tileY = Math.floor(y / this.tileSize);
    
    // マップ範囲外の場合は通行不可
    if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) {
      return false;
    }
    
    // タイルの通行可否を返す
    return this.tileMap[tileY][tileX].passable;
  }
  
  public getTileAt(x: number, y: number): MapTile | null {
    // ワールド座標をタイルインデックスに変換
    const tileX = Math.floor(x / this.tileSize);
    const tileY = Math.floor(y / this.tileSize);
    
    // マップ範囲外の場合はnull
    if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) {
      return null;
    }
    
    return this.tileMap[tileY][tileX];
  }
  
  public destroyTile(x: number, y: number): boolean {
    const tile = this.getTileAt(x, y);
    if (tile && tile.destructible && tile.sprite) {
      // タイルが破壊可能な場合、床タイルに変更
      tile.type = 'floor';
      tile.passable = true;
      tile.destructible = false;
      
      // スプライトを更新
      tile.sprite.setTexture('floor');
      
      return true;
    }
    return false;
  }
  
  public createTileAt(x: number, y: number, tileType: string): MapTile | null {
    // ワールド座標をタイルインデックスに変換
    const tileX = Math.floor(x / this.tileSize);
    const tileY = Math.floor(y / this.tileSize);
    
    // マップ範囲外の場合はnull
    if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) {
      return null;
    }
    
    // 既存のタイルを削除
    const existingTile = this.tileMap[tileY][tileX];
    if (existingTile && existingTile.sprite) {
      existingTile.sprite.destroy();
    }
    
    // 新しいタイルを作成
    const worldX = tileX * this.tileSize + this.tileSize / 2;
    const worldY = tileY * this.tileSize + this.tileSize / 2;
    const newTile = this.createTile(tileType, worldX, worldY);
    
    // タイルマップを更新
    this.tileMap[tileY][tileX] = newTile;
    
    // 壁の場合は物理ボディを追加
    if (tileType === 'wall' && newTile.sprite) {
      this.scene.physics.add.existing(newTile.sprite, true);
    }
    
    return newTile;
  }
}
