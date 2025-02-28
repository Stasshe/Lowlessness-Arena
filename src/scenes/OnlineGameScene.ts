import Phaser from 'phaser';
import { GameConfig, GameMode } from '../config/GameConfig';
import { Player } from '../objects/Player';
import { VirtualJoystick } from '../utils/VirtualJoystick';
import { Map } from '../objects/Map';
import { UI } from '../ui/UI';
import { CharacterFactory, CharacterType } from '../characters/CharacterFactory';
import { SoundManager } from '../utils/SoundManager';
import { FirebaseManager } from '../firebase/FirebaseManager';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { Bullet } from '../objects/Bullet';

export class OnlineGameScene extends Phaser.Scene {
  private player!: Player;
  private opponent?: Player;
  private opponentId: string = '';
  private map!: Map;
  private joystick?: VirtualJoystick;
  private ui!: UI;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private isMobile: boolean = false;
  private soundManager!: SoundManager;
  private characterFactory!: CharacterFactory;
  private firebaseManager!: FirebaseManager;
  private syncInterval: number = 100; // ミリ秒
  private lastSyncTime: number = 0;
  private gameStarted: boolean = false;
  private gameOver: boolean = false;
  private playerReady: boolean = false;
  private opponentReady: boolean = false;
  private matchCountdown: number = 5;
  private countdownTimer?: Phaser.Time.TimerEvent;
  private countdownText?: Phaser.GameObjects.Text;
  private playerStateUnsubscribe?: () => void;
  private playerActionsUnsubscribe?: () => void;
  
  constructor() {
    super('OnlineGameScene');
  }
  
  init(data: any) {
    this.gameStarted = false;
    this.gameOver = false;
    this.playerReady = false;
    this.opponentReady = false;
    this.firebaseManager = data.firebaseManager;
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
    
    // プレイヤーアセット
    this.load.image('player', 'assets/characters/player.png');
    this.load.image('bullet', 'assets/weapons/bullet.png');
    
    // デフォルトアセット
    this.load.image('default', 'assets/default.png');
  }

  create() {
    GameConfig.currentMode = GameMode.ONLINE;
    
    // モバイルデバイス判定
    this.isMobile = !this.sys.game.device.os.desktop;
    
    // サウンドマネージャーの初期化
    this.soundManager = new SoundManager(this);
    
    // キャラクターファクトリーの初期化
    this.characterFactory = new CharacterFactory(this);
    
    // マップの作成
    this.map = new Map(this);
    
    // キーボード入力の設定
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // モバイルの場合はバーチャルジョイスティックを作成
    if (this.isMobile) {
      this.joystick = new VirtualJoystick(this);
    }
    
    // プレイヤーの作成
    const spawnPoint = this.map.getSpawnPoint();
    this.player = this.characterFactory.createCharacter(CharacterType.DEFAULT, spawnPoint.x, spawnPoint.y);
    
    // カメラの設定
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(1);
    
    // UI の作成
    this.ui = new UI(this, this.player);
    
    // 衝突判定の設定
    this.setupCollisions();
    
    // 攻撃の設定（クリックかタップで攻撃）
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gameStarted && !this.gameOver && !this.joystick?.isBeingUsed(pointer)) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.player.attack(worldPoint.x, worldPoint.y);
        
        // 攻撃情報をFirebaseに送信
        this.firebaseManager.sendPlayerAction('attack', worldPoint.x, worldPoint.y);
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
    .on('pointerdown', async () => {
      await this.firebaseManager.leaveGame();
      this.scene.start('MainMenuScene');
    });
    
    // 対戦相手の参加を監視
    this.firebaseManager.subscribeToPlayerUpdates(
      this.handlePlayerJoined.bind(this),
      this.handlePlayerLeft.bind(this)
    );
    
    // ゲーム状態の更新を監視
    this.firebaseManager.subscribeToGameUpdates(this.handleGameUpdate.bind(this));
    
    // プレイヤーの準備完了
    this.firebaseManager.setPlayerReady(true);
    this.playerReady = true;
    
    // カウントダウンテキストを作成（初期は非表示）
    this.countdownText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      '', 
      { fontSize: '64px', color: '#ffffff' }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1000)
    .setVisible(false);
    
    // BGM再生
    this.soundManager.playMusic('game_bgm');
  }
  
  private handlePlayerJoined(playerId: string): void {
    console.log('Player joined:', playerId);
    this.opponentId = playerId;
    
    // 対戦相手のプレイヤーを作成
    const spawnPoint = { x: 1500, y: 500 }; // マップの反対側にスポーン
    this.opponent = this.characterFactory.createCharacter(CharacterType.TANK, spawnPoint.x, spawnPoint.y);
    
    // 対戦相手の動きを監視するリスナーを設定
    this.subscribeToOpponentMovements();
    
    // 対戦相手の準備完了を待つ
    this.showWaitingMessage();
  }
  
  private handlePlayerLeft(playerId: string): void {
    console.log('Player left:', playerId);
    
    if (playerId === this.opponentId) {
      this.showMessage('対戦相手が退出しました');
      
      // 5秒後にメニューに戻る
      this.time.delayedCall(5000, async () => {
        await this.firebaseManager.leaveGame();
        this.scene.start('MainMenuScene');
      });
    }
  }
  
  private handleGameUpdate(gameData: any): void {
    console.log('Game updated:', gameData);
    
    // ゲームの状態によって処理を変える
    if (gameData.status === 'playing' && !this.gameStarted) {
      this.startMatch();
    } else if (gameData.status === 'finished') {
      this.endMatch(gameData.winnerId === this.firebaseManager.getUserId());
    }
  }
  
  private showWaitingMessage(): void {
    const waitingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      '対戦相手の準備を待っています...', 
      { fontSize: '24px', color: '#ffffff' }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(100);
    
    // 対戦相手が準備完了したらメッセージを消す
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        if (this.opponentReady || this.gameStarted) {
          waitingText.destroy();
        }
      }
    });
  }
  
  private startMatch(): void {
    // カウントダウン開始
    this.countdownText?.setVisible(true);
    this.matchCountdown = 3;
    this.updateCountdownText();
    
    this.soundManager.playSfx('countdown');
    
    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      repeat: this.matchCountdown - 1,
      callback: () => {
        this.matchCountdown--;
        this.updateCountdownText();
        this.soundManager.playSfx('countdown');
        
        if (this.matchCountdown <= 0) {
          this.gameStarted = true;
          this.countdownText?.setVisible(false);
          this.soundManager.playSfx('skill_activate'); // 試合開始音
        }
      }
    });
  }
  
  private updateCountdownText(): void {
    if (this.countdownText) {
      this.countdownText.setText(this.matchCountdown > 0 ? this.matchCountdown.toString() : 'START!');
      
      // テキストを一時的に大きくしてからもとに戻す演出
      this.countdownText.setScale(1.5);
      this.tweens.add({
        targets: this.countdownText,
        scale: 1,
        duration: 500,
        ease: 'Bounce.Out'
      });
    }
  }
  
  private endMatch(isWinner: boolean): void {
    this.gameOver = true;
    
    // 勝敗メッセージを表示
    const resultText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      isWinner ? 'YOU WIN!' : 'YOU LOSE', 
      { fontSize: '64px', color: isWinner ? '#ffff00' : '#ff0000' }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1000);
    
    // 演出効果
    this.tweens.add({
      targets: resultText,
      scale: { from: 0.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 1000,
      ease: 'Bounce.Out'
    });
    
    // 効果音を鳴らす
    this.soundManager.playSfx(isWinner ? 'victory_bgm' : 'player_death');
    
    // 5秒後にメニューに戻る
    this.time.delayedCall(5000, async () => {
      await this.firebaseManager.leaveGame();
      this.scene.start('MainMenuScene');
    });
  }
  
  private showMessage(message: string): void {
    const messageText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 3,
      message, 
      { fontSize: '24px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 20, y: 10 } }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1000);
    
    // 3秒後にメッセージを消す
    this.time.delayedCall(3000, () => {
      messageText.destroy();
    });
  }
  
  private setupCollisions(): void {
    // プレイヤーと壁の衝突
    this.physics.add.collider(this.player, this.map.getWalls());
    
    // 弾と壁の衝突
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
    
    // 相手がいる場合は相手との衝突も設定
    if (this.opponent) {
      // 相手プレイヤーと壁の衝突
      this.physics.add.collider(this.opponent, this.map.getWalls());
      
      // プレイヤーの弾と対戦相手の衝突
      this.physics.add.overlap(
        this.player.getWeapon().getBullets(),
        this.opponent,
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
              
              // 相手のHPがゼロになったらゲーム終了
              if (enemyPlayer.getHealth() <= 0 && !this.gameOver) {
                this.firebaseManager.updateGameState('finished');
              }
            }
          } catch (e) {
            console.warn('対戦相手ダメージ処理エラー:', e);
          }
        },
        undefined,
        this
      );
      
      // 対戦相手の弾とプレイヤーの衝突
      if (this.opponent.getWeapon()) {
        this.physics.add.overlap(
          this.opponent.getWeapon().getBullets(),
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
                
                // 自分のHPがゼロになったらゲーム終了
                if (this.player.getHealth() <= 0 && !this.gameOver) {
                  this.firebaseManager.updateGameState('finished');
                }
              }
            } catch (e) {
              console.warn('プレイヤーダメージ処理エラー:', e);
            }
          },
          undefined,
          this
        );
      }
    }
  }

  update(time: number, delta: number) {
    // ゲームが始まっていない場合は更新しない
    if (!this.gameStarted || this.gameOver) return;
    
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
    
    // プレイヤーと茂みの判定
    if (this.map.isInBush(this.player)) {
      this.player.enterBush();
    } else {
      this.player.exitBush();
    }
    
    // 対戦相手と茂みの判定
    if (this.opponent && this.map.isInBush(this.opponent)) {
      this.opponent.enterBush();
    } else if (this.opponent) {
      this.opponent.exitBush();
    }
    
    // UI更新
    this.ui.update();
    
    // 一定間隔でプレイヤー位置を同期
    if (time > this.lastSyncTime + this.syncInterval) {
      this.lastSyncTime = time;
      this.syncPlayerPosition();
    }
  }
  
  private syncPlayerPosition(): void {
    if (this.gameStarted && !this.gameOver) {
      // 自分の位置をFirebaseに送信
      this.firebaseManager.updatePlayerPosition(
        this.player.x,
        this.player.y,
        this.player.rotation
      );
    }
  }
  
  // シーン開始時に対戦相手の動きを監視するリスナーを設定
  private subscribeToOpponentMovements(): void {
    if (!this.firebaseManager.getGameId() || !this.opponent || !this.opponentId) return;
    
    const gameId = this.firebaseManager.getGameId() as string;
    
    // 対戦相手の位置情報を監視
    this.playerStateUnsubscribe = this.firebaseManager.subscribeToPlayerState(
      this.opponentId,
      (data) => {
        if (this.opponent && data.position) {
          // 対戦相手の位置を更新
          this.opponent.x = data.position.x;
          this.opponent.y = data.position.y;
          this.opponent.rotation = data.rotation;
        }
      }
    );
    
    // 対戦相手のアクションを監視
    this.playerActionsUnsubscribe = this.firebaseManager.subscribeToPlayerActions(
      this.opponentId,
      (action) => {
        if (!this.opponent) return;
        
        // アクションタイプに応じた処理
        switch (action.action) {
          case 'attack':
            // 対戦相手が攻撃したらその方向に向かって攻撃モーションを再生
            if (action.target) {
              this.opponent.attack(action.target.x, action.target.y);
              this.soundManager.playSfx('shoot');
            }
            break;
            
          case 'skill':
            // スキル使用
            this.opponent.useSkill();
            this.soundManager.playSfx('skill_activate');
            break;
            
          case 'ultimate':
            // アルティメット使用
            this.opponent.useUltimate();
            this.soundManager.playSfx('ultimate_activate');
            break;
        }
      }
    );
  }
  
  shutdown(): void {
    // シーン終了時に購読を解除
    if (this.playerStateUnsubscribe) {
      this.playerStateUnsubscribe();
    }
    
    if (this.playerActionsUnsubscribe) {
      this.playerActionsUnsubscribe();
    }
    
    // Firebaseの購読も解除
    this.firebaseManager.unsubscribeListeners();
  }
}