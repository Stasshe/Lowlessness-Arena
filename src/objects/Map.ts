import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { Player } from './Player';

export class Map {
  private scene: Phaser.Scene;
  private tileSize: number = GameConfig.TILE_SIZE;
  private walls: Phaser.Physics.Arcade.StaticGroup;
  private bushes: Phaser.Physics.Arcade.StaticGroup;
  private spawnPoints: { x: number, y: number }[] = [];
  private mapData: string[] = [
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'aggggggggggggggggggggggggggga',
    'agggwwwggggggggrgggggwwwgggga',
    'agggwgggggggggggggggggggwggga',
    'agggwgggbbbgggggggbbbgggwggga',
    'aggggggggggggwwwggggggggbggga',
    'aggggggggggggwgwgggggggggggga',
    'aggbbbggwggggwgwggggwgggbggga',
    'agggggggwggggwgwggggwgggbggga',
    'agggwgggwggggwgwggggwgggbggga',
    'aggbwgggwggggggggggggggggggga',
    'aggbwggggggggggggggggggwwwgga',
    'aggbwggggggggggggggggggwgggga',
    'aggbbggggggggggggggggggwgggga',
    'aggggggggwwwgggggwwwggggbgbga',
    'agggggggggggggggggggggggbgbga',
    'agggwwwgggggggggggggwwwgggbga',
    'agggggggggbbbgggbbbggggggggga',
    'agggggggggbgbgggbgbggwwwwwgga',
    'agggwwwgggbgbgggbgbggwggggwga',
    'agggwgggggbbbgggbbbgggggggwga',
    'agggwggggggggrgggggggwwwggwga',
    'agggggggggggggggggggggggggwga',
    'aggggggwwwwggggggwwwggggggwga',
    'aggbbbggggggggggggggggwwwgwga',
    'agggggggggggwwwgggggggggggwga',
    'agggwwwggggggggggggggggggggga',
    'agggggggggggggggggggggggrgwga',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  ];
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.walls = scene.physics.add.staticGroup();
    this.bushes = scene.physics.add.staticGroup();
    
    this.createMap();
  }
  
  private createMap(): void {
    // マップを文字データからビルド
    for (let y = 0; y < this.mapData.length; y++) {
      const row = this.mapData[y];
      for (let x = 0; x < row.length; x++) {
        const tile = row[x];
        const posX = x * this.tileSize + this.tileSize / 2;
        const posY = y * this.tileSize + this.tileSize / 2;
        
        switch (tile) {
          case 'g': // 草
            this.createGrass(posX, posY);
            break;
          case 'w': // 壁
            this.createWall(posX, posY);
            break;
          case 'a': // 外枠の壁
            this.createBoundary(posX, posY);
            break;
          case 'b': // 茂み
            this.createGrass(posX, posY);
            this.createBush(posX, posY);
            break;
          case 'r': // リスポーン地点
            this.createGrass(posX, posY);
            this.spawnPoints.push({ x: posX, y: posY });
            
            // リスポーン地点を視覚的に表示（デバッグ用、本番では非表示に）
            if (GameConfig.DEBUG) {
              this.scene.add.circle(posX, posY, this.tileSize / 4, 0x00ffff, 0.3);
            }
            break;
        }
      }
    }
  }
  
  private createGrass(x: number, y: number): void {
    // 草のタイルを配置
    this.scene.add.image(x, y, 'grass')
      .setDisplaySize(this.tileSize, this.tileSize);
  }
  
  private createWall(x: number, y: number): void {
    // 壁のタイル
    const wall = this.scene.add.image(x, y, 'wall')
      .setDisplaySize(this.tileSize, this.tileSize);
    
    // 物理ボディを追加
    const wallBody = this.walls.create(x, y, 'wall');
    wallBody.setVisible(false); // 物理ボディは非表示
    wallBody.setDisplaySize(this.tileSize, this.tileSize);
    (wallBody.body as Phaser.Physics.Arcade.StaticBody).setSize(this.tileSize, this.tileSize);
  }
  
  private createBoundary(x: number, y: number): void {
    // 外枠の壁は見た目を変える
    const boundary = this.scene.add.image(x, y, 'boundary')
      .setDisplaySize(this.tileSize, this.tileSize);
    
    // 物理ボディを追加
    const boundaryBody = this.walls.create(x, y, 'boundary');
    boundaryBody.setVisible(false); // 物理ボディは非表示
    boundaryBody.setDisplaySize(this.tileSize, this.tileSize);
    (boundaryBody.body as Phaser.Physics.Arcade.StaticBody).setSize(this.tileSize, this.tileSize);
  }
  
  private createBush(x: number, y: number): void {
    // 茂みのタイル
    const bush = this.bushes.create(x, y, 'bush');
    bush.setAlpha(0.7); // 半透明に設定
    bush.setDepth(5); // プレイヤーの下に表示
    bush.setDisplaySize(this.tileSize, this.tileSize);
  }
  
  getWalls(): Phaser.Physics.Arcade.StaticGroup {
    return this.walls;
  }
  
  getBushes(): Phaser.Physics.Arcade.StaticGroup {
    return this.bushes;
  }
  
  getSpawnPoint(): { x: number, y: number } {
    // ランダムなスポーンポイントを選択
    if (this.spawnPoints.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.spawnPoints.length);
      return this.spawnPoints[randomIndex];
    }
    
    // スポーンポイントがない場合はデフォルト位置
    return { x: 100, y: 100 };
  }
  
  getSpawnPoints(): { x: number, y: number }[] {
    return [...this.spawnPoints]; // コピーを返す
  }
  
  isInBush(player: Player): boolean {
    // プレイヤーが茂みの中にいるかチェック
    let inBush = false;
    
    this.bushes.getChildren().forEach((bush: Phaser.GameObjects.GameObject) => {
      const bushSprite = bush as Phaser.Physics.Arcade.Sprite;
      const distance = Phaser.Math.Distance.Between(player.x, player.y, bushSprite.x, bushSprite.y);
      
      if (distance < this.tileSize * 0.6) { // 茂みの近くにいる場合
        inBush = true;
      }
    });
    
    return inBush;
  }
}
