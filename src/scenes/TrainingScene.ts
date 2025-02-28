import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { Player } from '../objects/Player';
import { VirtualJoystick } from '../utils/VirtualJoystick';
import { Map } from '../objects/Map';
import { UI } from '../ui/UI';
import { BotAI, BotDifficulty } from '../ai/BotAI';
import { CharacterFactory, CharacterType } from '../characters/CharacterFactory';
import { SoundManager } from '../utils/SoundManager';
import { Bullet } from '../objects/Bullet';

export class TrainingScene extends Phaser.Scene {
  private player!: Player;
  private enemyBots: { bot: Player, ai: BotAI }[] = [];
  private map!: Map;
  private joystick?: VirtualJoystick;
  private ui!: UI;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private isMobile: boolean = false;
  private soundManager!: SoundManager;
  private characterFactory!: CharacterFactory;
  
  constructor() {
    super('TrainingScene');
  }

  preload() {
    // アセットのロード
    this.loadAssets();
  }

  private loadAssets(): void {
    // マップ関連アセット
    this.load.image('grass', 'assets/tiles/grass.png');
    this.load.image('wall', 'assets/tiles/wall.png');
    this.load.image('bush', 'assets/tiles/bush.png');
    this.load.image('spawn', 'assets/tiles/spawn.png');
    
    // UIアセット
    this.load.image('button', 'assets/ui/button.png');
    this.load.image('healthbar', 'assets/ui/healthbar.png');
    this.load.image('joystick', 'assets/ui/joystick.png');
    this.load.image('joystick-base', 'assets/ui/joystick-base.png');
    
    // 仮のプレイヤーアセット
    this.load.image('player', 'assets/characters/player.png');
    this.load.image('bullet', 'assets/weapons/bullet.png');
    
    // デフォルトアセットを指定（実際のアセットが未ロードの場合のフォールバック）
    this.load.image('default', 'assets/default.png');
  }

  create() {
    // モバイルデバイス判定
    this.isMobile = !this.sys.game.device.os.desktop;
    
    // サウンドマネージャーの初期化
    this.soundManager = new SoundManager(this);
    
    // サウンドが読み込まれるのを少し待つ
    this.time.delayedCall(100, () => {
      // BGM再生
      try {
        this.soundManager.playMusic('game_bgm');
      } catch (e) {
        console.warn('BGM再生エラー:', e);
      }
    });
    
    // キャラクターファクトリーの初期化
    this.characterFactory = new CharacterFactory(this);
    
    // マップの作成
    this.map = new Map(this);
    
    // プレイヤーの作成
    const spawnPoint = this.map.getSpawnPoint();
    this.player = this.characterFactory.createCharacter(CharacterType.DEFAULT, spawnPoint.x, spawnPoint.y);
    
    // 敵ボットの作成（トレーニングモード用）
    this.createEnemyBots();
    
    // カメラの設定
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(1);
    
    // 衝突判定の設定
    this.setupCollisions();
    
    // キーボード入力の設定
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // モバイルの場合はバーチャルジョイスティックを作成
    if (this.isMobile) {
      this.joystick = new VirtualJoystick(this);
    }
    
    // UI の作成
    this.ui = new UI(this, this.player);
    
    // 攻撃の設定（クリックかタップで攻撃）
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.joystick?.isBeingUsed(pointer)) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.player.attack(worldPoint.x, worldPoint.y);
      }
    });
    
    // バックボタン（デバッグ用）
    const backButton = this.add.text(16, 16, 'メニューに戻る', { 
      fontSize: '18px', 
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    })
    .setScrollFactor(0)
    .setDepth(100)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });
  }

  private createEnemyBots(): void {
    // トレーニングモードでは数体のボットを作成
    const botPositions = [
      { x: 500, y: 500 },
      { x: 800, y: 300 },
      { x: 300, y: 800 }
    ];
    
    botPositions.forEach((pos, index) => {
      // 違うタイプのボットを作成
      const botType = Object.values(CharacterType)[(index + 1) % Object.keys(CharacterType).length] as CharacterType;
      const bot = this.characterFactory.createCharacter(botType, pos.x, pos.y);
      
      // 難易度を設定（例: 最初は簡単、順に難しく）
      const difficulty = index as BotDifficulty;
      
      // AIを割り当て
      const ai = new BotAI(this, bot, this.player, difficulty);
      
      // ボットリストに追加
      this.enemyBots.push({ bot, ai });
    });
  }
  
  private setupCollisions(): void {
    // プレイヤーと壁の衝突
    this.physics.add.collider(this.player, this.map.getWalls());
    
    // ボットと壁の衝突
    this.enemyBots.forEach(({ bot }) => {
      this.physics.add.collider(bot, this.map.getWalls());
    });
    
    // プレイヤーの弾と壁の衝突
    this.physics.add.collider(
      this.player.getWeapon().getBullets(),
      this.map.getWalls(),
      // 型キャストを修正
      (bulletObj, wall) => {
        // Arcade Physicsの衝突オブジェクトを正しく扱う
        if (bulletObj instanceof Phaser.Physics.Arcade.Sprite) {
          const bullet = bulletObj as Bullet;
          bullet.onHit();
        }
      },
      undefined,
      this
    );
    
    // プレイヤーの弾と敵ボットの衝突
    this.enemyBots.forEach(({ bot }) => {
      this.physics.add.overlap(
        this.player.getWeapon().getBullets(),
        bot,
        // 型キャストを修正
        (bulletObj, enemy) => {
          try {
            // Arcade Physicsの衝突オブジェクトを正しく扱う
            if (bulletObj instanceof Phaser.Physics.Arcade.Sprite && enemy instanceof Phaser.Physics.Arcade.Sprite) {
              const bullet = bulletObj as Bullet;
              const enemyPlayer = enemy as Player;
              
              // ダメージ計算と適用
              const damage = bullet.getDamage();
              enemyPlayer.takeDamage(damage);
              
              // ヒットエフェクト
              bullet.onHit();
              
              // 効果音
              this.soundManager.playSfx('hit');
            }
          } catch (e) {
            console.warn('ボットダメージ処理エラー:', e);
          }
        },
        undefined,
        this
      );
    });
    
    // 敵ボットの弾とプレイヤーの衝突
    this.enemyBots.forEach(({ bot }) => {
      this.physics.add.overlap(
        bot.getWeapon().getBullets(),
        this.player,
        // 型キャストを修正
        (bulletObj, playerObj) => {
          try {
            // Arcade Physicsの衝突オブジェクトを正しく扱う
            if (bulletObj instanceof Phaser.Physics.Arcade.Sprite && playerObj instanceof Phaser.Physics.Arcade.Sprite) {
              const bullet = bulletObj as Bullet;
              
              // ダメージ計算と適用
              const damage = bullet.getDamage();
              this.player.takeDamage(damage);
              
              // ヒットエフェクト
              bullet.onHit();
              
              // 効果音
              this.soundManager.playSfx('player_damage');
            }
          } catch (e) {
            console.warn('プレイヤーダメージ処理エラー:', e);
          }
        },
        undefined,
        this
      );
    });
  }

  update(time: number, delta: number) {
    // プレイヤー移動処理
    if (this.isMobile && this.joystick) {
      // モバイル: ジョイスティックの入力で移動
      const joyVector = this.joystick.getVector();
      this.player.move(joyVector.x, joyVector.y);
    } else {
      // デスクトップ: キーボードの入力で移動
      const directionX = Number(this.cursors.right.isDown) - Number(this.cursors.left.isDown);
      const directionY = Number(this.cursors.down.isDown) - Number(this.cursors.up.isDown);
      this.player.move(directionX, directionY);
    }
    
    // ボットAIの更新
    this.enemyBots.forEach(({ ai }) => {
      ai.update();
    });
    
    // プレイヤーと茂みの判定
    if (this.map.isInBush(this.player)) {
      this.player.enterBush();
    } else {
      this.player.exitBush();
    }
    
    // UI更新
    this.ui.update();
  }
}
