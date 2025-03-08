import Phaser from 'phaser';
import { GameConfig, BlockType, TeamType } from '../config';
import { Player } from '../entities/Player';
import { Map } from '../entities/Map';
import { JapanMap } from '../maps/JapanMap';
import { VirtualJoystick } from '../utils/VirtualJoystick';
import { CharacterFactory } from '../characters/CharacterFactory';

export class GameScene extends Phaser.Scene {
  // マップ
  protected map!: Map;
  
  // プレイヤー
  protected player!: Player;
  
  // 敵プレイヤー (AI または他のプレイヤー)
  protected enemies: Player[] = [];
  
  // バーチャルジョイスティック (モバイル用)
  protected moveJoystick?: VirtualJoystick;
  protected skillJoystick?: VirtualJoystick;
  protected ultJoystick?: VirtualJoystick;
  
  // キーボード入力
  protected cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  protected keyA!: Phaser.Input.Keyboard.Key;
  protected keyS!: Phaser.Input.Keyboard.Key;
  protected keyD!: Phaser.Input.Keyboard.Key;
  
  // キャラクターファクトリー
  protected characterFactory!: CharacterFactory;
  
  constructor(key: string) {
    super(key);
  }
  
  create(): void {
    // 物理エンジンの設定
    this.physics.world.setBounds(
      0, 0,
      GameConfig.MAP_WIDTH * GameConfig.BLOCK_SIZE,
      GameConfig.MAP_HEIGHT * GameConfig.BLOCK_SIZE
    );
    
    // キャラクターファクトリーの初期化
    this.characterFactory = new CharacterFactory(this);
    
    // マップの作成 (デフォルトで日本マップを使用)
    this.createMap(new JapanMap());
    
    // 入力の設定
    this.setupInput();
    
    // カメラの設定
    this.setupCamera();
    
    // UIシーンとの通信のためにプレイヤーデータを共有
    this.data.set('player', this.player);
    
    // UI シーンとの通信
    this.events.emit('scene-ready');
  }
  
  update(time: number, delta: number): void {
    // プレイヤーの更新
    if (this.player) {
      this.player.update(time, delta);
      this.handlePlayerInput();
    }
    
    // 敵の更新
    this.enemies.forEach(enemy => {
      if (enemy.active) {
        enemy.update(time, delta);
      }
    });
  }
  
  // マップの作成
  protected createMap(mapData: any): void {
    this.map = new Map(this, mapData);
    this.map.create();
  }
  
  // プレイヤーのスポーン
  protected spawnPlayer(characterType: string, teamType: TeamType = TeamType.BLUE): void {
    const spawnPoint = this.map.getSpawnPoint(teamType);
    this.player = this.characterFactory.createCharacter(
      characterType,
      spawnPoint.x,
      spawnPoint.y,
      teamType
    );
    
    // プレイヤーとブロックの衝突を設定
    this.physics.add.collider(this.player, this.map.getWallLayer());
  }
  
  // 敵のスポーン (AI または他のプレイヤー)
  protected spawnEnemy(characterType: string, x: number, y: number, teamType: TeamType = TeamType.RED): Player {
    const enemy = this.characterFactory.createCharacter(
      characterType,
      x,
      y,
      teamType
    );
    
    // 敵とブロックの衝突を設定
    this.physics.add.collider(enemy, this.map.getWallLayer());
    
    // 敵とプレイヤーの衝突を設定 - 型をArcadeColliderTypeに合わせる
    if (this.player) {
      this.physics.add.collider(
        enemy as Phaser.Types.Physics.Arcade.ArcadeColliderType,
        this.player as Phaser.Types.Physics.Arcade.ArcadeColliderType
      );
    }
    
    // 敵リストに追加
    this.enemies.push(enemy);
    
    return enemy;
  }
  
  // 入力の設定
  protected setupInput(): void {
    // キーボード入力
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    
    // タッチデバイスの場合はバーチャルジョイスティックを作成
    if (this.sys.game.device.input.touch) {
      this.createVirtualJoysticks();
    }
  }
  
  // バーチャルジョイスティックの作成
  protected createVirtualJoysticks(): void {
    // 移動用ジョイスティック
    this.moveJoystick = new VirtualJoystick(this, 100, this.scale.height - 100, 'joystick-left');
    
    // スキル用ジョイスティック
    this.skillJoystick = new VirtualJoystick(this, this.scale.width - 200, this.scale.height - 100, 'joystick-skill');
    
    // アルティメット用ジョイスティック
    this.ultJoystick = new VirtualJoystick(this, this.scale.width - 100, this.scale.height - 100, 'joystick-right');
  }
  
  // カメラの設定
  protected setupCamera(): void {
    if (this.player) {
      this.cameras.main.setBounds(
        0, 0,
        GameConfig.MAP_WIDTH * GameConfig.BLOCK_SIZE,
        GameConfig.MAP_HEIGHT * GameConfig.BLOCK_SIZE
      );
      this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
      this.cameras.main.setZoom(1);
    }
  }
  
  // プレイヤー入力の処理
  protected handlePlayerInput(): void {
    if (!this.player) return;
    
    let moveX = 0;
    let moveY = 0;
    
    // キーボード入力 - nullチェックを追加
    if (this.cursors?.left?.isDown) {
      moveX = -1;
    } else if (this.cursors?.right?.isDown) {
      moveX = 1;
    }
    
    if (this.cursors?.up?.isDown) {
      moveY = -1;
    } else if (this.cursors?.down?.isDown) {
      moveY = 1;
    }
    
    // バーチャルジョイスティック (タッチデバイス)
    if (this.moveJoystick && this.moveJoystick.isActive) {
      const joyX = this.moveJoystick.getX();
      const joyY = this.moveJoystick.getY();
      
      if (Math.abs(joyX) > 0.1) moveX = joyX;
      if (Math.abs(joyY) > 0.1) moveY = joyY;
    }
    
    // プレイヤーの移動
    this.player.move(moveX, moveY);
    
    // 通常攻撃 (タップ)
    if (this.input.activePointer.isDown && !this.moveJoystick?.isPointerDown && 
        !this.skillJoystick?.isPointerDown && !this.ultJoystick?.isPointerDown) {
      const targetX = this.input.activePointer.worldX;
      const targetY = this.input.activePointer.worldY;
      this.player.performNormalAttack(targetX, targetY);
    }
    
    // スキル (右ジョイスティック)
    if (this.skillJoystick && this.skillJoystick.isActive) {
      const angle = this.skillJoystick.getAngle();
      const force = this.skillJoystick.getForce();
      if (force > 0.5) {
        this.player.performSkill(angle, force);
      }
    } else if (this.keyS.isDown) {
      // キーボード入力の場合はマウス位置に向かって発射
      const targetX = this.input.activePointer.worldX;
      const targetY = this.input.activePointer.worldY;
      const angle = Phaser.Math.Angle.Between(
        this.player.x, this.player.y, targetX, targetY
      );
      this.player.performSkill(angle, 1.0);
    }
    
    // アルティメット (ジョイスティック)
    if (this.ultJoystick && this.ultJoystick.isActive) {
      const angle = this.ultJoystick.getAngle();
      const force = this.ultJoystick.getForce();
      if (force > 0.7) { // アルティメットは高い力が必要
        this.player.performUltimate(angle, force);
      }
    } else if (this.keyD.isDown) {
      // キーボード入力の場合はマウス位置に向かって発射
      const targetX = this.input.activePointer.worldX;
      const targetY = this.input.activePointer.worldY;
      const angle = Phaser.Math.Angle.Between(
        this.player.x, this.player.y, targetX, targetY
      );
      this.player.performUltimate(angle, 1.0);
    }
  }
}
