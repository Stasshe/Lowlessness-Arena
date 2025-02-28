import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { Player } from '../objects/Player';
import { VirtualJoystick } from '../utils/VirtualJoystick';
import { Map } from '../objects/Map';
import { UI } from '../ui/UI';
import { CharacterFactory, CharacterType } from '../characters/CharacterFactory';
import { SoundManager } from '../utils/SoundManager';
import { FirebaseManager } from '../firebase/FirebaseManager';
import { GameEffects } from '../utils/GameEffects';

export class OnlineGameScene extends Phaser.Scene {
  private player!: Player;
  // JavaScriptのMapはジェネリック型なので正確に型指定する
  private otherPlayers: Map<string, Player> = new Map<string, Player>();
  private playerSubscriptions: Map<string, () => void> = new Map<string, () => void>();
  private map!: Map;
  private joystick?: VirtualJoystick;
  private ui!: UI;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private isMobile: boolean = false;
  private soundManager!: SoundManager;
  private characterFactory!: CharacterFactory;
  private moveJoystick?: VirtualJoystick;
  private skillJoystick?: VirtualJoystick;
  private gameEffects!: GameEffects;
  private firebaseManager!: FirebaseManager;
  private isGameStarted: boolean = false;
  private isGameOver: boolean = false;
  private lastUpdateTimestamp: number = 0;
  private positionUpdateInterval: number = 100; // 0.1秒ごとに位置を送信
  private playerCharacterType: CharacterType = CharacterType.DEFAULT;
  
  constructor() {
    super('OnlineGameScene');
  }
  
  init(data: any) {
    // シーン初期化時にFirebaseManagerを受け取る
    if (data && data.firebaseManager) {
      this.firebaseManager = data.firebaseManager;
    } else {
      // 直接アクセスされた場合はロビーシーンに戻す
      this.scene.start('LobbyScene');
      return;
    }
    
    // シーンをリセット
    this.otherPlayers = new Map();
    this.playerSubscriptions = new Map();
    this.isGameStarted = false;
    this.isGameOver = false;
    
    // モバイルデバイス判定
    this.isMobile = !this.sys.game.device.os.desktop;
  }
  
  preload() {
    // 必要なアセットをロード
    this.load.image('online_player', 'assets/characters/player.png');
    // ...その他必要なアセット
  }
  
  create() {
    // サウンドマネージャーの初期化
    this.soundManager = new SoundManager(this);
    
    // ゲームエフェクトの初期化
    this.gameEffects = new GameEffects(this);
    
    // キャラクターファクトリーの初期化
    this.characterFactory = new CharacterFactory(this);
    
    // 接続中表示
    const connectingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'プレイヤーの参加を待っています...',
      { fontSize: '24px', color: '#ffffff' }
    ).setOrigin(0.5).setScrollFactor(0);
    
    // マップを作成
    this.map = new Map(this);
    
    // キーボード入力を設定
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // モバイルの場合はジョイスティックを作成
    if (this.isMobile) {
      this.moveJoystick = new VirtualJoystick(this, false);
      this.skillJoystick = new VirtualJoystick(this, true);
    }
    
    // ゲーム状態の監視
    this.firebaseManager.subscribeToGameUpdates((gameData) => {
      // ゲームの状態をチェック
      if (gameData.status === 'playing' && !this.isGameStarted) {
        // ゲーム開始
        this.startGame();
        connectingText.destroy();
      } else if (gameData.status === 'finished' && !this.isGameOver) {
        // ゲーム終了
        this.endGame();
      }
    });
    
    // プレイヤーの参加・退出を監視
    this.firebaseManager.subscribeToPlayerUpdates(
      (playerId) => this.onPlayerJoined(playerId),
      (playerId) => this.onPlayerLeft(playerId)
    );
    
    // 自分のプレイヤーを初期化
    this.initializePlayer();
    
    // 戻るボタン
    this.add.text(16, 16, '← 退出', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#aa0000',
      padding: { x: 10, y: 5 }
    })
    .setScrollFactor(0)
    .setDepth(100)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      this.leaveGame();
    });
    
    // BGM再生
    this.soundManager.playMusic('game_bgm');
    
    // もし既にplaying状態の場合（再接続時など）
    this.checkGameStatus();
  }
  
  private async initializePlayer() {
    try {
      // スポーン地点を取得
      const spawnPoint = this.map.getSpawnPoint();
      
      // プレイヤーを作成
      this.player = this.characterFactory.createCharacter(CharacterType.DEFAULT, spawnPoint.x, spawnPoint.y);
      
      // カメラをプレイヤーに追従
      this.cameras.main.startFollow(this.player);
      
      // UIを作成
      this.ui = new UI(this, this.player);
      
      // 最初の位置を送信
      await this.firebaseManager.updatePlayerPosition(spawnPoint.x, spawnPoint.y, 0);
      
      // プレイヤーが2人揃ったらゲーム開始
      const gameDoc = await this.firebaseManager.getDb()
        .doc(`games/${this.firebaseManager.getGameId()}`)
        .get();
      
      if (gameDoc.exists && gameDoc.data()?.playerCount >= 2) {
        await this.firebaseManager.updateGameState('playing');
      }
    } catch (error) {
      console.error('プレイヤー初期化エラー:', error);
    }
  }
  
  private startGame() {
    this.isGameStarted = true;
    
    // カウントダウン表示
    this.gameEffects.showCountdown(() => {
      // カウントダウン後の処理
      this.showMessage('ゲーム開始！', 1500);
    });
    
    // 衝突判定を設定
    this.setupCollisions();
    
    // 攻撃の設定
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // ジョイスティックの操作でなく、UIボタン上でもない場合のみ攻撃
      if ((!this.moveJoystick || !this.moveJoystick.isBeingUsed(pointer)) && 
          (!this.skillJoystick || !this.skillJoystick.isBeingUsed(pointer))) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.player.attack(worldPoint.x, worldPoint.y);
        
        // 攻撃アクションを送信
        this.firebaseManager.sendPlayerAction('attack', worldPoint.x, worldPoint.y);
      }
    });
  }
  
  private endGame() {
    this.isGameOver = true;
    
    // ゲーム終了表示
    this.gameEffects.showVictoryEffect();
    
    // 5秒後にロビーに戻る
    this.time.delayedCall(5000, () => {
      this.leaveGame();
    });
  }
  
  private setupCollisions() {
    // プレイヤーと壁の衝突
    this.physics.add.collider(this.player, this.map.getWalls());
    
    // 他のプレイヤーと壁の衝突
    this.otherPlayers.forEach(otherPlayer => {
      this.physics.add.collider(otherPlayer, this.map.getWalls());
    });
    
    // 弾丸と壁の衝突
    const playerBullets = this.player.getWeapon().getBullets();
    this.physics.add.collider(
      playerBullets,
      this.map.getWalls(),
      (bullet: Phaser.GameObjects.GameObject) => {
        if ((bullet as Phaser.Physics.Arcade.Sprite).active) {
          ((bullet as any) as Bullet).onHit();
        }
      }
    );
    
    // プレイヤーが茂みに入ったかを検知
    this.physics.add.overlap(
      this.player,
      this.map.getBushes(),
      () => {
        this.player.enterBush();
      }
    );
  }
  
  private onPlayerJoined(playerId: string) {
    // 新しいプレイヤーの状態を監視するためのリスナーを設定
    const unsubscribe = this.firebaseManager.subscribeToPlayerState(
      playerId,
      (playerState) => {
        if (!playerState) return;
        
        // まだ作成されていなければ、他プレイヤーのオブジェクトを作成
        if (!this.otherPlayers.has(playerId)) {
          // 初期位置で他プレイヤーを作成
          const otherPlayer = this.characterFactory.createCharacter(
            CharacterType.DEFAULT,
            playerState.position?.x || 100,
            playerState.position?.y || 100
          );
          
          // 他プレイヤーの設定
          otherPlayer.setTint(0x0000ff); // 敵は青色に
          
          this.otherPlayers.set(playerId, otherPlayer);
        }
        
        // 既存のプレイヤーの位置を更新
        const otherPlayer = this.otherPlayers.get(playerId);
        if (otherPlayer && playerState.position) {
          otherPlayer.setPosition(playerState.position.x, playerState.position.y);
          otherPlayer.setRotation(playerState.rotation || 0);
        }
      }
    );
    
    // アクションリスナーを設定
    const actionUnsubscribe = this.firebaseManager.subscribeToPlayerActions(
      playerId,
      (action) => {
        // 他プレイヤーのアクション処理
        const otherPlayer = this.otherPlayers.get(playerId);
        if (!otherPlayer) return;
        
        switch (action.action) {
          case 'attack':
            otherPlayer.attack(action.target.x, action.target.y);
            break;
          case 'skill':
            otherPlayer.useSkill();
            break;
          case 'ultimate':
            otherPlayer.useUltimate();
            break;
        }
      }
    );
    
    // リスナーを記録
    this.playerSubscriptions.set(playerId, () => {
      unsubscribe();
      actionUnsubscribe();
    });
  }
  
  private onPlayerLeft(playerId: string) {
    // リスナーを解除
    const unsubscribe = this.playerSubscriptions.get(playerId);
    if (unsubscribe) {
      unsubscribe();
      this.playerSubscriptions.delete(playerId);
    }
    
    // プレイヤーオブジェクトを削除
    const otherPlayer = this.otherPlayers.get(playerId);
    if (otherPlayer) {
      otherPlayer.destroy();
      this.otherPlayers.delete(playerId);
    }
    
    // プレイヤーが離脱したメッセージを表示
    this.showMessage('対戦相手が退出しました', 2000);
    
    // 自動的に勝利状態にする
    if (this.isGameStarted && !this.isGameOver) {
      this.gameEffects.showVictoryEffect();
      this.soundManager.playMusic('victory_bgm');
      
      // 5秒後にロビーに戻る
      this.time.delayedCall(5000, () => {
        this.leaveGame();
      });
    }
  }
  
  private leaveGame() {
    // ゲームから退出
    this.firebaseManager.leaveGame().then(() => {
      // ロビーシーンに戻る
      this.scene.start('LobbyScene');
    });
    
    // リスナーを全て解除
    this.playerSubscriptions.forEach(unsubscribe => unsubscribe());
    this.playerSubscriptions.clear();
  }
  
  private showMessage(text: string, duration: number = 2000) {
    const message = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 3,
      text,
      {
        fontSize: '28px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(100)
    .setAlpha(0);
    
    // フェードインアニメーション
    this.tweens.add({
      targets: message,
      alpha: 1,
      y: this.cameras.main.height / 3 - 50,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        // フェードアウト
        this.tweens.add({
          targets: message,
          alpha: 0,
          delay: duration,
          duration: 500,
          ease: 'Power2',
          onComplete: () => {
            message.destroy();
          }
        });
      }
    });
  }
  
  update(time: number, delta: number) {
    if (!this.player || this.isGameOver) return;
    
    // プレイヤー移動処理 - タッチスクリーンでは移動ジョイスティックを使用
    if (this.moveJoystick) {
      const moveVector = this.moveJoystick.getVector();
      this.player.move(moveVector.x, moveVector.y);
    } else {
      // デスクトップ: キーボードの入力で移動
      const directionX = Number(this.cursors.right.isDown) - Number(this.cursors.left.isDown);
      const directionY = Number(this.cursors.down.isDown) - Number(this.cursors.up.isDown);
      this.player.move(directionX, directionY);
    }
    
    // スキルジョイスティックでスキル使用
    if (this.skillJoystick) {
      const skillVector = this.skillJoystick.getVector();
      const vectorLength = this.skillJoystick.length();
      
      if (vectorLength > 0) {
        // スキルジョイスティックが操作されている場合
        const targetPos = this.skillJoystick.getTargetWorldPosition();
        if (targetPos) {
          // スキルの方向が設定された状態で操作が終了したらスキル発動
          if (!this.skillJoystick.isBeingUsed(this.input.activePointer) && 
              this.player.canUseSkill()) {
            this.player.useSkill(targetPos.x, targetPos.y);
            this.firebaseManager.sendSkillAction();
            this.soundManager.playSfx('skill_activate');
          }
        }
      }
    }
    
    // キーボード入力でスキル使用
    if (Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey('SPACE')) && 
        this.player.canUseSkill()) {
      // スペースキーでスキル発動（前方向）
      const angle = this.player.rotation;
      const targetX = this.player.x + Math.cos(angle) * 200;
      const targetY = this.player.y + Math.sin(angle) * 200;
      this.player.useSkill(targetX, targetY);
      this.firebaseManager.sendSkillAction();
      this.soundManager.playSfx('skill_activate');
    }
    
    // アルティメットスキル発動（Qキー）
    if (Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey('Q')) && 
        this.player.canUseUltimate()) {
      this.player.useUltimate();
      this.firebaseManager.sendUltimateAction();
      this.soundManager.playSfx('ultimate_activate');
    }
    
    // プレイヤー位置の更新を一定間隔で送信
    if (this.isGameStarted && time > this.lastUpdateTimestamp + this.positionUpdateInterval) {
      this.lastUpdateTimestamp = time;
      this.firebaseManager.updatePlayerPosition(
        this.player.x,
        this.player.y,
        this.player.rotation
      );
    }
    
    // プレイヤーと茂みの判定（各フレームごとにチェック）
    if (this.map.isInBush(this.player)) {
      this.player.enterBush();
    } else {
      this.player.exitBush();
    }
    
    // UI更新
    if (this.ui) {
      this.ui.update();
    }
  }
  
  shutdown() {
    // シーン終了時の後処理
    this.leaveGame();
    this.soundManager.stopAll();
    
    // リソース解放
    if (this.moveJoystick) {
      this.moveJoystick.destroy();
    }
    
    if (this.skillJoystick) {
      this.skillJoystick.destroy();
    }
    
    if (this.ui) {
      this.ui.destroy();
    }
    
    if (this.map) {
      this.map.destroy();
    }
    
    // イベントリスナーを解除
    this.input.off('pointerdown');
  }
  
  destroy() {
    // リソース解放
    this.shutdown();
  }

  // もし既にplaying状態の場合（再接続時など）
  // Firestoreの操作をFirebaseManagerを通じて行う
  private checkGameStatus() {
    const gameId = this.firebaseManager.getGameId();
    if (gameId) {
      this.firebaseManager.getGameStatus(gameId)
        .then((status) => {
          if (status === 'playing') {
            this.startGame();
            // 接続中のテキストを削除（既に存在する場合のみ）
            const connectingText = this.children.getByName('connectingText');
            if (connectingText) {
              connectingText.destroy();
            }
          }
        });
    }
  }
}