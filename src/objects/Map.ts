import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

/**
 * マップの種類
 */
export enum MapType {
  DEFAULT = 'default',
  FOREST = 'forest',
  DESERT = 'desert',
  SNOW = 'snow'
}

/**
 * ゲームマップを管理するクラス
 */
export class Map {
  private scene: Phaser.Scene;
  private type: MapType;
  private width: number;
  private height: number;
  private tileSize: number;
  private walls: Phaser.Physics.Arcade.StaticGroup;
  private bushes: Phaser.Physics.Arcade.StaticGroup;
  private spawnPoints: Phaser.Math.Vector2[] = [];
  private isGenerated: boolean = false;
  
  constructor(scene: Phaser.Scene, type: MapType = MapType.DEFAULT, width: number = 50, height: number = 50) {
    this.scene = scene;
    this.type = type;
    this.width = width;
    this.height = height;
    this.tileSize = GameConfig.TILE_SIZE;
    
    // 物理エンジングループの作成
    this.walls = this.scene.physics.add.staticGroup();
    this.bushes = this.scene.physics.add.staticGroup();
    
    // マップ生成
    this.generateMap();
  }
  
  /**
   * マップの生成
   */
  private generateMap(): void {
    // マップの種類に応じて異なる生成ロジックを実行
    switch (this.type) {
      case MapType.FOREST:
        this.generateForestMap();
        break;
      case MapType.DESERT:
        this.generateDesertMap();
        break;
      case MapType.SNOW:
        this.generateSnowMap();
        break;
      default:
        this.generateDefaultMap();
        break;
    }
    
    this.isGenerated = true;
  }
  
  /**
   * デフォルトマップの生成
   */
  private generateDefaultMap(): void {
    // 背景（草原）を敷き詰める
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tileX = x * this.tileSize;
        const tileY = y * this.tileSize;
        
        // 端は壁にする
        if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
          this.createWall(tileX, tileY);
          continue;
        }
        
        this.scene.add.image(tileX, tileY, 'grass').setOrigin(0, 0);
        
        // ランダムに壁や茂みを配置
        const rand = Math.random();
        
        if (rand < 0.05) {
          // 5%の確率で壁
          this.createWall(tileX, tileY);
        } else if (rand < 0.1) {
          // 5%の確率で茂み
          this.createBush(tileX, tileY);
        } else if (rand < 0.12 && this.spawnPoints.length < 10) {
          // 2%の確率でスポーンポイント（最大10箇所）
          this.spawnPoints.push(new Phaser.Math.Vector2(tileX + this.tileSize / 2, tileY + this.tileSize / 2));
          
          // スポーンポイントを視覚的に表示（開発用）
          if (GameConfig.DEBUG) {
            this.scene.add.circle(tileX + this.tileSize / 2, tileY + this.tileSize / 2, 8, 0x00ff00, 0.5);
          }
        }
      }
    }
    
    // スポーンポイントが少なすぎる場合は追加
    if (this.spawnPoints.length < 4) {
      // 最低4つのスポーンポイントを確保
      const centerX = Math.floor(this.width / 2) * this.tileSize;
      const centerY = Math.floor(this.height / 2) * this.tileSize;
      const offset = 5 * this.tileSize;
      
      this.spawnPoints.push(
        new Phaser.Math.Vector2(centerX - offset, centerY - offset),
        new Phaser.Math.Vector2(centerX + offset, centerY - offset),
        new Phaser.Math.Vector2(centerX - offset, centerY + offset),
        new Phaser.Math.Vector2(centerX + offset, centerY + offset)
      );
      
      // スポーンポイントを視覚的に表示（開発用）
      if (GameConfig.DEBUG) {
        this.spawnPoints.forEach(point => {
          this.scene.add.circle(point.x, point.y, 8, 0x00ff00, 0.5);
        });
      }
    }
    
    // マップの広さに応じてワールド境界を設定
    this.scene.physics.world.setBounds(
      0, 0,
      this.width * this.tileSize,
      this.height * this.tileSize
    );
    
    // カメラの境界を設定
    this.scene.cameras.main.setBounds(
      0, 0,
      this.width * this.tileSize,
      this.height * this.tileSize
    );
  }
  
  /**
   * 森マップの生成（特殊なロジック）
   */
  private generateForestMap(): void {
    // TODO: 森マップ用の特殊ロジック
    // とりあえず、デフォルトマップを生成
    this.generateDefaultMap();
  }
  
  /**
   * 砂漠マップの生成（特殊なロジック）
   */
  private generateDesertMap(): void {
    // TODO: 砂漠マップ用の特殊ロジック
    // とりあえず、デフォルトマップを生成
    this.generateDefaultMap();
  }
  
  /**
   * 雪マップの生成（特殊なロジック）
   */
  private generateSnowMap(): void {
    // TODO: 雪マップ用の特殊ロジック
    // とりあえず、デフォルトマップを生成
    this.generateDefaultMap();
  }
  
  /**
   * 壁を作成
   */
  private createWall(x: number, y: number): void {
    this.walls.create(x, y, 'wall')
      .setOrigin(0, 0)
      .refreshBody();
  }
  
  /**
   * 茂みを作成
   */
  private createBush(x: number, y: number): void {
    // 茂みの背景に草を敷く
    this.scene.add.image(x, y, 'grass').setOrigin(0, 0);
    
    // 茂み自体
    this.bushes.create(x, y, 'bush')
      .setOrigin(0, 0)
      .refreshBody();
  }
  
  /**
   * プレイヤーが茂みの中にいるかチェック
   */
  isInBush(player: Phaser.GameObjects.GameObject): boolean {
    return this.scene.physics.overlap(player, this.bushes);
  }
  
  /**
   * ランダムなスポーンポイントを取得
   */
  getSpawnPoint(): Phaser.Math.Vector2 {
    if (this.spawnPoints.length === 0) {
      // スポーンポイントがない場合は中央を返す
      return new Phaser.Math.Vector2(
        this.width * this.tileSize / 2,
        this.height * this.tileSize / 2
      );
    }
    
    // ランダムなスポーンポイントを返す
    const index = Math.floor(Math.random() * this.spawnPoints.length);
    return this.spawnPoints[index].clone();
  }
  
  /**
   * 壁のグループを取得
   */
  getWalls(): Phaser.Physics.Arcade.StaticGroup {
    return this.walls;
  }
  
  /**
   * 茂みのグループを取得
   */
  getBushes(): Phaser.Physics.Arcade.StaticGroup {
    return this.bushes;
  }
  
  /**
   * マップの幅を取得
   */
  getWidth(): number {
    return this.width * this.tileSize;
  }
  
  /**
   * マップの高さを取得
   */
  getHeight(): number {
    return this.height * this.tileSize;
  }
  
  /**
   * マップの生成が完了しているか
   */
  isMapGenerated(): boolean {
    return this.isGenerated;
  }
  
  /**
   * リソースの解放
   */
  destroy(): void {
    // 物理グループのクリーンアップ
    this.walls.clear(true, true);
    this.bushes.clear(true, true);
    this.spawnPoints = [];
    this.isGenerated = false;
  }
}
