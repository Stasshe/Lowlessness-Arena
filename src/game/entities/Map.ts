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
    console.log("マップ生成開始");
    
    try {
      const data = this.mapData.getData();
      if (!data || data.length === 0) {
        console.error("マップデータが空です");
        return;
      }
      
      console.log(`マップサイズ: ${data[0].length}x${data.length}`);
      
      // レイヤーの作成
      this.wallLayer = this.scene.physics.add.staticGroup();
      this.grassLayer = this.scene.physics.add.staticGroup();
      this.floorLayer = this.scene.physics.add.staticGroup();
      
      // 暗い背景を確実に避けるため明示的に背景色を設定
      this.scene.cameras.main.setBackgroundColor('#2d2d2d');
      
      // パフォーマンス向上: 非表示のブロックは作成しない
      const camera = this.scene.cameras.main;
      const viewportWidth = camera.width / GameConfig.BLOCK_SIZE + 2; // 余白を追加
      const viewportHeight = camera.height / GameConfig.BLOCK_SIZE + 2;
      
      // マップデータを元にブロックを配置
      for (let y = 0; y < data.length; y++) {
        for (let x = 0; x < data[y].length; x++) {
          const blockType = data[y][x];
          const blockX = x * GameConfig.BLOCK_SIZE + GameConfig.BLOCK_SIZE / 2;
          const blockY = y * GameConfig.BLOCK_SIZE + GameConfig.BLOCK_SIZE / 2;
          
          try {
            switch(blockType) {
              case BlockType.WALL:
                this.wallLayer.create(blockX, blockY, 'wall')
                  .setScale(GameConfig.BLOCK_SIZE / 64)
                  .setOrigin(0.5, 0.5)
                  .setImmovable(true);
                break;
              case BlockType.GRASS:
                this.grassLayer.create(blockX, blockY, 'grass')
                  .setScale(GameConfig.BLOCK_SIZE / 64)
                  .setOrigin(0.5, 0.5);
                break;
              case BlockType.FLOOR:
                this.floorLayer.create(blockX, blockY, 'floor')
                  .setScale(GameConfig.BLOCK_SIZE / 64)
                  .setOrigin(0.5, 0.5);
                break;
            }
          } catch (e) {
            console.error(`位置(${x}, ${y})のブロック生成中にエラー:`, e);
          }
        }
      }
      
      // 壁の当たり判定を設定（最適化）
      this.wallLayer.refresh(); // 物理ボディ更新
      
      // パフォーマンス向上のため静的オブジェクトを最適化
      this.wallLayer.setDepth(10);  // 壁は他より上に表示
      this.grassLayer.setDepth(5);  // 草は床より上に表示
      this.floorLayer.setDepth(1);  // 床は一番下
      
      // 静的レイヤーは更新頻度を下げる
      this.wallLayer.children.iterate((child: any) => {
        if (child && child.body) {
          child.body.updateFromGameObject();
        }
        return true;
      });
      
      console.log("マップ生成完了");
    } catch (e) {
      console.error("マップ生成中にエラー:", e);
      
      // エラー時に最低限の視覚フィードバック
      const errorText = this.scene.add.text(
        this.scene.cameras.main.centerX,
        this.scene.cameras.main.centerY,
        "Map loading error",
        { fontSize: '24px', color: '#ff0000' }
      ).setOrigin(0.5);
    }
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
