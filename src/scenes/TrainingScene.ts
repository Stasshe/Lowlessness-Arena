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
  private moveJoystick?: VirtualJoystick;
  private skillJoystick?: VirtualJoystick;
  private selectedCharacterType: CharacterType = CharacterType.DEFAULT;
  private characterSelectUI?: Phaser.GameObjects.Container;
  private skillCooldownDisplay?: Phaser.GameObjects.Graphics;
  
  constructor() {
    super('TrainingScene');
  }

  init(data: any) {
    // シーンを初期化し、前回のインスタンスが残っていないことを確認
    this.player = undefined as unknown as Player;
    this.enemyBots = [];
    this.map = undefined as unknown as Map;
    this.ui = undefined as unknown as UI;
    this.characterSelectUI = undefined;
    this.skillCooldownDisplay = undefined;
    
    // シーンの初期化時にデータを受け取れるようにする
    if (data && data.characterType) {
      this.selectedCharacterType = data.characterType;
    }
  }

  preload() {
    // アセットのロード
    this.loadAssets();
  }

  private loadAssets(): void {
    // マップ関連アセット - より高品質なアセットを指定
    this.load.image('grass', 'assets/tiles/grass.png');
    this.load.image('wall', 'assets/tiles/wall.png');
    this.load.image('boundary', 'assets/tiles/boundary.png');
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
    
    // キャラクター選択画面を表示（この時点ではまだゲームは開始しない）
    this.showCharacterSelect();
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
    // 壁が初期化されているか確認
    if (!this.map || !this.map.getWalls()) {
      console.warn('マップまたは壁が初期化されていません');
      return;
    }

    // プレイヤーが初期化されているか確認
    if (!this.player) {
      console.warn('プレイヤーが初期化されていません');
      return;
    }

    // プレイヤーと壁の衝突
    this.physics.add.collider(this.player, this.map.getWalls());
    
    // ボットと壁の衝突
    this.enemyBots.forEach(({ bot }) => {
      if (bot && this.map.getWalls()) {
        this.physics.add.collider(bot, this.map.getWalls());
      }
    });
    
    // 弾のグループが初期化されているか確認
    const playerBullets = this.player.getWeapon()?.getBullets();
    if (!playerBullets) {
      console.warn('プレイヤーの弾グループが初期化されていません');
      return;
    }
    
    // プレイヤーの弾と壁の衝突
    this.physics.add.collider(
      playerBullets,
      this.map.getWalls(),
      (bulletObj, wall) => {
        if (bulletObj instanceof Phaser.Physics.Arcade.Sprite) {
          const bullet = bulletObj as Bullet;
          bullet.onHit();
        }
      },
      undefined,
      this
    );
    
    // 各ボットに対する衝突判定を設定
    this.enemyBots.forEach(({ bot }) => {
      if (bot) {
        // プレイヤーの弾と敵ボットの衝突
        this.physics.add.overlap(
          playerBullets,
          bot,
          (bulletObj, enemy) => {
            try {
              if (bulletObj instanceof Phaser.Physics.Arcade.Sprite && 
                  enemy instanceof Phaser.Physics.Arcade.Sprite) {
                const bullet = bulletObj as Bullet;
                const enemyPlayer = enemy as Player;
                
                const damage = bullet.getDamage();
                enemyPlayer.takeDamage(damage);
                bullet.onHit();
                
                this.soundManager.playSfx('hit');
              }
            } catch (e) {
              console.warn('ボットダメージ処理エラー:', e);
            }
          },
          undefined,
          this
        );
        
        // ボットの弾が初期化されているか確認
        const botBullets = bot.getWeapon()?.getBullets();
        if (botBullets) {
          // 敵ボットの弾とプレイヤーの衝突
          this.physics.add.overlap(
            botBullets,
            this.player,
            (bulletObj, playerObj) => {
              try {
                if (bulletObj instanceof Phaser.Physics.Arcade.Sprite && 
                    playerObj instanceof Phaser.Physics.Arcade.Sprite) {
                  const bullet = bulletObj as Bullet;
                  
                  const damage = bullet.getDamage();
                  this.player.takeDamage(damage);
                  bullet.onHit();
                  
                  this.soundManager.playSfx('player_damage');
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
    });
  }

  private showCharacterSelect(): void {
    // キャラクター選択UIを作成
    this.characterSelectUI = this.add.container(this.cameras.main.width / 2, 200);
    
    // 背景を追加 (暗い半透明のオーバーレイ)
    const bgOverlay = this.add.rectangle(
      0, 0, 
      this.cameras.main.width * 2, 
      this.cameras.main.height * 2,
      0x000000, 0.7
    );
    this.characterSelectUI.add(bgOverlay);
    
    // タイトル
    const title = this.add.text(0, -150, 'トレーニングモード', { 
      fontSize: '42px', 
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.characterSelectUI.add(title);
    
    const subtitle = this.add.text(0, -100, 'キャラクターを選択してください', { 
      fontSize: '26px', 
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    this.characterSelectUI.add(subtitle);
    
    // 使用可能なキャラクター一覧
    const characters = [
      { type: CharacterType.DEFAULT, name: 'デフォルト', color: 0xffffff, description: 'バランスの取れた性能' },
      { type: CharacterType.TANK, name: 'タンク', color: 0xff0000, description: 'HPが高いが移動速度が遅い' },
      { type: CharacterType.SPEEDER, name: 'スピーダー', color: 0x00ff00, description: '素早いが耐久力が低い' },
      { type: CharacterType.SNIPER, name: 'スナイパー', color: 0x0000ff, description: '長距離攻撃が得意' },
      { type: CharacterType.THROWER, name: '爆弾魔', color: 0xff00ff, description: '範囲攻撃が得意' }
    ];
    
    // キャラクターボタンを横に並べる
    const buttonWidth = 120;
    const spacing = 40;
    const startX = -((characters.length - 1) * (buttonWidth + spacing)) / 2;
    
    // 選択されたキャラクターの説明テキスト
    const descriptionText = this.add.text(0, 80, '', { 
      fontSize: '20px', 
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      align: 'center',
      wordWrap: { width: 500 }
    }).setOrigin(0.5);
    this.characterSelectUI.add(descriptionText);
    
    characters.forEach((char, index) => {
      // キャラクターの円形アイコン
      const x = startX + index * (buttonWidth + spacing);
      const bg = this.add.circle(x, 0, 50, char.color, 0.8)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.selectCharacter(char.type))
        .on('pointerover', () => {
          // ホバー時に説明を表示
          descriptionText.setText(char.description);
          descriptionText.setTint(char.color);
        });
      
      const label = this.add.text(x, 60, char.name, {
        fontSize: '20px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      // 選択中のキャラクターを強調表示
      if (char.type === this.selectedCharacterType) {
        const highlight = this.add.circle(x, 0, 55, 0xffff00, 0)
          .setStrokeStyle(4, 0xffff00, 1);
        this.characterSelectUI.add(highlight);
        
        // 選択したキャラクターの説明を表示
        descriptionText.setText(char.description);
        descriptionText.setTint(char.color);
      }
      
      this.characterSelectUI.add([bg, label]);
    });
    
    // スタートボタン
    const startButton = this.add.rectangle(0, 150, 200, 60, 0x00aa00, 0.8)
      .setStrokeStyle(2, 0x00ff00, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        // サウンドを鳴らし、UIを非表示にしてゲームを開始
        this.soundManager.playSfx('button_click');
        // UIをフェードアウト
        this.tweens.add({
          targets: this.characterSelectUI,
          alpha: 0,
          duration: 500,
          ease: 'Power2',
          onComplete: () => {
            this.characterSelectUI.destroy();
            this.characterSelectUI = undefined;
            // ゲームを初期化して開始
            this.initializeGameWorld();
          }
        });
      })
      .on('pointerover', function(this: Phaser.GameObjects.Rectangle) {
        this.fillColor = 0x00cc00; // ホバー時に色を変更
      })
      .on('pointerout', function(this: Phaser.GameObjects.Rectangle) {
        this.fillColor = 0x00aa00; // ホバー解除時に色を戻す
      });
    
    const startText = this.add.text(0, 150, 'ゲーム開始', {
      fontSize: '26px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    // 戻るボタン
    const backButton = this.add.rectangle(0, 220, 200, 40, 0x444444, 0.8)
      .setStrokeStyle(2, 0x666666, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        // メニューに戻る
        this.soundManager.playSfx('button_click');
        this.scene.start('MainMenuScene');
      })
      .on('pointerover', function(this: Phaser.GameObjects.Rectangle) {
        this.fillColor = 0x666666; // ホバー時に色を変更
      })
      .on('pointerout', function(this: Phaser.GameObjects.Rectangle) {
        this.fillColor = 0x444444; // ホバー解除時に色を戻す
      });
    
    const backText = this.add.text(0, 220, 'メニューに戻る', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    this.characterSelectUI.add([startButton, startText, backButton, backText]);
    
    // キャラクター選択UIをカメラに追従
    this.characterSelectUI.setScrollFactor(0).setDepth(1000);
    
    // UIに対するアニメーション（フェードイン）
    this.characterSelectUI.alpha = 0;
    this.tweens.add({
      targets: this.characterSelectUI,
      alpha: 1,
      duration: 500,
      ease: 'Power2'
    });
  }
  
  // キャラクター選択処理
  private selectCharacter(type: CharacterType): void {
    this.selectedCharacterType = type;
    this.soundManager.playSfx('button_click');
    
    // 選択UIを更新するため、いったん削除して再表示
    if (this.characterSelectUI) {
      this.characterSelectUI.destroy();
    }
    this.showCharacterSelect();
  }
  
  // ゲームワールドの初期化
  private initializeGameWorld(): void {
    // 既存のオブジェクトをクリーンアップ
    this.cleanupGame();
    
    // 物理エンジンをリセット
    this.physics.world.resume();
    
    // マップの作成
    this.map = new Map(this);
    
    // プレイヤーの作成（選択したキャラクタータイプを使用）
    const spawnPoint = this.map.getSpawnPoint();
    this.player = this.characterFactory.createCharacter(this.selectedCharacterType, spawnPoint.x, spawnPoint.y);
    
    // 物理ボディが有効であることを確認
    this.player.ensurePhysicsBody();
    
    // カメラの設定
    this.cameras.main.startFollow(this.player);
    
    // ゲーム開始のアナウンス表示
    const startAnnouncement = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'トレーニング開始！',
      {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 6
      }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(100)
    .setAlpha(0);
    
    // アナウンスをフェードイン→フェードアウト
    this.tweens.add({
      targets: startAnnouncement,
      alpha: 1,
      duration: 800,
      ease: 'Power2',
      yoyo: true,
      hold: 1000,
      onComplete: () => {
        startAnnouncement.destroy();
      }
    });
    
    // 少し遅延させてからボットを生成
    this.time.delayedCall(1000, () => {
      // 敵ボットの作成
      this.createEnemyBots();
      
      // 衝突判定の設定（ボット生成後）
      this.setupCollisions();
    });
    
    // キーボード入力の設定
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // モバイルの場合はジョイスティックを作成
    if (this.isMobile) {
      this.moveJoystick = new VirtualJoystick(this, false);
      this.skillJoystick = new VirtualJoystick(this, true);
    }
    
    // UI の作成
    this.ui = new UI(this, this.player);
    
    // スキルクールダウン表示を作成
    this.createSkillCooldownDisplay();
    
    // バックボタン（メニューに戻る）
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
    
    // 攻撃の設定（クリックかタップで攻撃）
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // ジョイスティックの操作でなく、UIボタン上でもない場合のみ攻撃
      if ((!this.moveJoystick || !this.moveJoystick.isBeingUsed(pointer)) && 
          (!this.skillJoystick || !this.skillJoystick.isBeingUsed(pointer))) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.player.attack(worldPoint.x, worldPoint.y);
      }
    });
  }

  // クリーンアップメソッドを強化
  private cleanupGame(): void {
    // 既存のボットを削除
    if (this.enemyBots) {
      this.enemyBots.forEach(({ bot, ai }) => {
        if (ai) ai.destroy();
        if (bot) bot.destroy();
      });
      this.enemyBots = [];
    }
    
    // 既存のUIをクリア
    if (this.ui) {
      this.ui.destroy();
      this.ui = undefined as unknown as UI;
    }
    
    // 既存のジョイスティックをクリア
    if (this.moveJoystick) {
      this.moveJoystick.destroy();
      this.moveJoystick = undefined;
    }
    
    if (this.skillJoystick) {
      this.skillJoystick.destroy();
      this.skillJoystick = undefined;
    }
    
    // 既存のスキルクールダウン表示をクリア
    if (this.skillCooldownDisplay) {
      this.skillCooldownDisplay.clear();
      this.skillCooldownDisplay.destroy();
      this.skillCooldownDisplay = undefined;
    }
    
    // 既存のプレイヤーを削除
    if (this.player) {
      this.player.destroy();
      this.player = undefined as unknown as Player;
    }
    
    // 既存のマップを削除
    if (this.map) {
      this.map.destroy();
      this.map = undefined as unknown as Map;
    }
    
    // 既存のイベントリスナーをクリーンアップ
    this.input.off('pointerdown');
  }

  private createSkillCooldownDisplay(): void {
    // スキルクールダウンを表示するグラフィック要素
    this.skillCooldownDisplay = this.add.graphics()
      .setScrollFactor(0)
      .setDepth(200);
    
    // 更新イベントを設定
    this.time.addEvent({
      delay: 100, // 100ms毎に更新
      callback: this.updateSkillCooldownDisplay,
      callbackScope: this,
      loop: true
    });
  }
  
  private updateSkillCooldownDisplay(): void {
    if (!this.skillCooldownDisplay || !this.player) return;
    
    this.skillCooldownDisplay.clear();
    
    // スキルのクールダウン情報を取得
    const skillCooldown = this.player.getSkillCooldownPercent();
    const ultimateCooldown = this.player.getUltimateCooldownPercent();
    
    // スキルジョイスティックのベース位置
    const baseX = this.skillJoystick?.getBase().x ?? (this.cameras.main.width - 150);
    const baseY = this.skillJoystick?.getBase().y ?? (this.cameras.main.height - 150);
    
    // スキルクールダウンの円を描画（スキルジョイスティックの周り）
    if (skillCooldown < 1) {
      // 円弧を描画（クールダウン中は灰色で表示）
      this.skillCooldownDisplay.lineStyle(8, 0x666666, 0.8);
      this.skillCooldownDisplay.beginPath();
      this.skillCooldownDisplay.arc(
        baseX, baseY, 70, 
        -Math.PI / 2, // 開始角度（上から）
        -Math.PI / 2 + Math.PI * 2 * skillCooldown, // 終了角度
        false
      );
      this.skillCooldownDisplay.strokePath();
    } else {
      // クールダウン完了時は青色で表示
      this.skillCooldownDisplay.lineStyle(8, 0x00ffff, 0.8);
      this.skillCooldownDisplay.beginPath();
      this.skillCooldownDisplay.arc(
        baseX, baseY, 70, 
        -Math.PI / 2, 
        Math.PI * 1.5, 
        false
      );
      this.skillCooldownDisplay.strokePath();
    }
    
    // アルティメットクールダウンの表示（小さいUI要素として表示）
    const ultimateX = this.cameras.main.width - 50;
    const ultimateY = 50;
    
    // 背景の円
    this.skillCooldownDisplay.fillStyle(0x000000, 0.5);
    this.skillCooldownDisplay.fillCircle(ultimateX, ultimateY, 25);
    
    if (ultimateCooldown < 1) {
      // クールダウン中は部分的に表示
      this.skillCooldownDisplay.fillStyle(0xff6600, 0.8);
      this.skillCooldownDisplay.slice(
        ultimateX, ultimateY, 25,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * ultimateCooldown,
        true
      );
      this.skillCooldownDisplay.fillPath();
    } else {
      // クールダウン完了時は完全に表示
      this.skillCooldownDisplay.fillStyle(0xff6600, 0.8);
      this.skillCooldownDisplay.fillCircle(ultimateX, ultimateY, 25);
    }
  }

  update(time: number, delta: number) {
    if (!this.player) {
      return; // プレイヤーがまだ作成されていなければスキップ
    }
    
    // プレイヤーの物理ボディが有効であることを確認
    this.player.ensurePhysicsBody();
    
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
      // 代わりにVirtualJoystickのlengthメソッドを使用するか、
      // もしくはベクトルのx,y成分からベクトルの長さを計算
      const vectorLength = Math.sqrt(skillVector.x * skillVector.x + skillVector.y * skillVector.y);
      
      if (vectorLength > 0) {
        // スキルジョイスティックが操作されている場合
        const targetPos = this.skillJoystick.getTargetWorldPosition();
        if (targetPos) {
          // スキルの方向が設定された状態で操作が終了したらスキル発動
          if (!this.skillJoystick.isBeingUsed(this.input.activePointer) && 
              this.player.canUseSkill()) {
            this.player.useSkill(targetPos.x, targetPos.y);
            this.soundManager.playSfx('skill_activate');
          }
        }
      }
    }
    
    // キーボード入力でスキル使用
    if (this.cursors.space?.isDown && this.player.canUseSkill()) {
      // スペースキーでスキル発動（前方向）
      const angle = this.player.rotation;
      const targetX = this.player.x + Math.cos(angle) * 200;
      const targetY = this.player.y + Math.sin(angle) * 200;
      this.player.useSkill(targetX, targetY);
      this.soundManager.playSfx('skill_activate');
    }
    
    // アルティメットスキル発動（Qキー）
    if (Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey('Q')) && 
        this.player.canUseUltimate()) {
      this.player.useUltimate();
      this.soundManager.playSfx('ultimate_activate');
    }
    
    // ボットAIの更新
    this.enemyBots.forEach(({ ai }) => {
      ai.update();
    });
    
    // プレイヤーと茂みの判定
    if (this.map && this.map.isInBush(this.player)) {
      this.player.enterBush();
    } else {
      this.player.exitBush();
    }
    
    // UI更新
    if (this.ui) {
      this.ui.update();
    }
  }

  // シーンのシャットダウン処理を追加
  shutdown() {
    this.cleanupGame();
    this.physics.world.shutdown();
  }
  
  // シーン終了時の処理を追加
  destroy() {
    this.cleanupGame();
    this.physics.world.destroy();
  }
}
