import Phaser from 'phaser';
import { GameManager } from '../managers/GameManager';
import { BotAI, BotDifficulty } from '../ai/BotAI';
import { CharacterType } from '../characters/CharacterFactory';
import { MapType } from '../objects/Map';
import { CharacterData } from '../utils/CharacterData';
import { SkillType } from '../objects/Player';
import { Bullet } from '../objects/Bullet';
import { Player } from '../objects/Player';  // Playerクラスをインポート

export class TrainingScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private enemyBots: { bot: Player, ai: BotAI }[] = [];  // botの型をPlayer型に修正
  private characterSelectUI?: Phaser.GameObjects.Container;
  private selectedCharacterType: CharacterType = CharacterType.DEFAULT;
  private aiEnabled: boolean = true;
  private aiToggleButton?: Phaser.GameObjects.Container;
  private skillAnimationEffects: Phaser.GameObjects.GameObject[] = [];
  
  constructor() {
    super('TrainingScene');
  }

  init(data: any) {
    // シーン初期化
    this.enemyBots = [];
    this.characterSelectUI = undefined;
    
    // データを受け取る
    if (data && data.characterType) {
      this.selectedCharacterType = data.characterType;
    }
  }

  preload() {
    // アセットのロード
    this.loadAssets();
  }

  private loadAssets(): void {
    // 必要なアセットを読み込み
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
    
    // プレイヤーアセット
    this.load.image('player', 'assets/characters/player.png');
    this.load.image('bullet', 'assets/weapons/bullet.png');
    
    // デフォルトアセット
    this.load.image('default', 'assets/default.png');
  }

  create() {
    // GameManagerを初期化
    this.gameManager = new GameManager(this);
    
    // キャラクター選択画面を表示
    this.showCharacterSelect();
  }
  
  // キャラクター選択画面を表示
  private showCharacterSelect(): void {
    // キャラクター選択UIを作成
    this.characterSelectUI = this.add.container(this.cameras.main.width / 2, 200);
    
    if (!this.characterSelectUI) return;  // 安全チェック
    
    // 背景を追加
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
      { type: CharacterType.KNIGHT, name: CharacterData.getCharacterName(CharacterType.KNIGHT), color: CharacterData.getCharacterColor(CharacterType.KNIGHT), description: CharacterData.getCharacterDescription(CharacterType.KNIGHT) },
      { type: CharacterType.TANKER, name: CharacterData.getCharacterName(CharacterType.TANKER), color: CharacterData.getCharacterColor(CharacterType.TANKER), description: CharacterData.getCharacterDescription(CharacterType.TANKER) },
      { type: CharacterType.SNIPER, name: CharacterData.getCharacterName(CharacterType.SNIPER), color: CharacterData.getCharacterColor(CharacterType.SNIPER), description: CharacterData.getCharacterDescription(CharacterType.SNIPER) },
      { type: CharacterType.BOMBER, name: CharacterData.getCharacterName(CharacterType.BOMBER), color: CharacterData.getCharacterColor(CharacterType.BOMBER), description: CharacterData.getCharacterDescription(CharacterType.BOMBER) },
      { type: CharacterType.HEALER, name: CharacterData.getCharacterName(CharacterType.HEALER), color: CharacterData.getCharacterColor(CharacterType.HEALER), description: CharacterData.getCharacterDescription(CharacterType.HEALER) }
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
      const x = startX + index * (buttonWidth + spacing);
      const bgCircle = this.add.circle(x, 0, 50, char.color, 0.8)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.selectCharacter(char.type);
          
          // 既存の選択エフェクトを削除
          if (this.characterSelectUI) {  // 安全チェックを追加
            this.characterSelectUI.list.forEach(obj => {
              if (obj.getData('highlightEffect')) {
                obj.destroy();
              }
            });

            // 新しい選択エフェクト
            const highlightEffect = this.add.circle(x, 0, 55)
              .setStrokeStyle(4, 0xffff00)
              .setData('highlightEffect', true);
            
            this.tweens.add({
              targets: highlightEffect,
              scaleX: { from: 0.8, to: 1.2 },
              scaleY: { from: 0.8, to: 1.2 },
              alpha: { from: 1, to: 0.5 },
              duration: 500,
              yoyo: true,
              repeat: -1
            });

            const particles = this.add.particles(x, 0, 'default', {
              lifespan: 1000,
              speed: { min: 50, max: 100 },
              scale: { start: 0.4, end: 0 },
              tint: char.color,
              blendMode: 'ADD',
              emitting: false
            });
            
            particles.explode(20);
            this.time.delayedCall(1000, () => particles.destroy());

            this.characterSelectUI?.add([highlightEffect]);
          }
        })
        .on('pointerover', () => {
          bgCircle.setScale(1.1);
          descriptionText.setText(char.description);
          descriptionText.setTint(char.color);
        })
        .on('pointerout', () => {
          bgCircle.setScale(1.0);
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
        if ( this.characterSelectUI) this.characterSelectUI.add(highlight);
        
        // 説明表示
        descriptionText.setText(char.description);
        descriptionText.setTint(char.color);
        
        // スキル詳細
        const skillInfo = CharacterData.getCharacterInfo(char.type);
        const skillDetailText = this.add.text(0, 120, skillInfo, { 
          fontSize: '14px',
          color: '#cccccc',
          align: 'center',
          wordWrap: { width: 400 }
        }).setOrigin(0.5);
        
        if (this.characterSelectUI) this.characterSelectUI.add(skillDetailText);
      }
      
      if (this.characterSelectUI) this.characterSelectUI.add([bgCircle, label]);
    });
    
    // スタートボタン
    const startButton = this.add.rectangle(0, 150, 200, 60, 0x00aa00, 0.8)
      .setStrokeStyle(2, 0x00ff00, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        // UIをフェードアウト
        this.tweens.add({
          targets: this.characterSelectUI,
          alpha: 0,
          duration: 500,
          ease: 'Power2',
          onComplete: () => {
            this.characterSelectUI?.destroy();
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
  /*
  private getCharacterSkillInfo(type: CharacterType): string {
    return CharacterData.getCharacterInfo(type);
  }
  */

  // ゲームワールドの初期化
  private initializeGameWorld(): void {
    // 既存のオブジェクトをクリーンアップ
    this.cleanupGame();
    
    // 物理エンジンをリセット
    this.physics.world.resume();
    
    // マップの作成（MapTypeを指定）
    this.gameManager.createMap(MapType.DEFAULT);
    
    // プレイヤーの作成（選択したキャラクタータイプを使用）
    const spawnPoint = this.gameManager.getMap().getSpawnPoint();
    this.gameManager.createPlayer(this.selectedCharacterType, spawnPoint.x, spawnPoint.y);
    
    // カメラの設定
    this.cameras.main.startFollow(this.gameManager.getPlayer());
    
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
    this.gameManager.setupKeyboardInput();
    
    // モバイルの場合はジョイスティックを作成
    if (this.gameManager.isMobile()) {
      this.gameManager.createJoysticks();
    } else {
      // デスクトップの場合はマウスでの照準用に武器照準システムを初期化
      this.gameManager.initializeWeaponAiming();
      this.gameManager.updateWeaponAimingConfig();
    }
    
    // UI の作成
    this.gameManager.createUI();
    
    // スキルクールダウン表示を作成
    this.createSkillCooldownDisplay();
    
    // AIトグルボタンを追加
    this.createAIToggleButton();
    
    // スキル情報表示を追加
    this.createSkillInfoDisplay();
    
    // バックボタン（メニューに戻る）
    this.add.text(16, 16, 'メニューに戻る', { 
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
    
    // 攻撃アクションのセットアップ
    this.setupAttackAction();
    
    // キャラクター情報を表示
    this.displayCharacterInfo();
  }
  
  private selectCharacter(type: CharacterType): void {
    // 現在選択中のキャラクターを更新
    this.selectedCharacterType = type;
    
    // 選択音を再生
    try {
      this.gameManager.playSelectSound();
    } catch (e) {
      console.warn('選択音の再生に失敗:', e);
    }
  }

  // AIのオン/オフを切り替えるボタンを作成
  private createAIToggleButton(): void {
    const buttonX = this.cameras.main.width - 100;
    const buttonY = 100;
    
    // ボタンの背景
    const buttonBg = this.add.rectangle(0, 0, 80, 40, 0x222222, 0.8)
      .setStrokeStyle(2, 0x444444);
    
    // AIのステータスに応じたラベル
    const labelText = this.aiEnabled ? 'AI: ON' : 'AI: OFF';
    const labelColor = this.aiEnabled ? '#00ff00' : '#ff0000';
    
    const label = this.add.text(0, 0, labelText, {
      fontSize: '16px',
      color: labelColor,
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // ボタンコンテナ作成
    this.aiToggleButton = this.add.container(buttonX, buttonY, [buttonBg, label])
      .setDepth(100)
      .setScrollFactor(0)
      .setInteractive(new Phaser.Geom.Rectangle(-40, -20, 80, 40), Phaser.Geom.Rectangle.Contains)
      .on('pointerdown', () => {
        this.toggleAI();
        
        // ラベルを更新
        const newLabelText = this.aiEnabled ? 'AI: ON' : 'AI: OFF';
        const newLabelColor = this.aiEnabled ? '#00ff00' : '#ff0000';
        label.setText(newLabelText);
        label.setColor(newLabelColor);
        
        // クリック効果音
        this.gameManager.playButtonClickSound();
      });
    
    // ホバーエフェクト
    this.aiToggleButton
      .on('pointerover', () => {
        buttonBg.setFillStyle(0x444444, 0.8);
      })
      .on('pointerout', () => {
        buttonBg.setFillStyle(0x222222, 0.8);
      });
  }
  
  // AIのオン/オフを切り替え
  private toggleAI(): void {
    this.aiEnabled = !this.aiEnabled;
    
    // ボットのAI制御を更新
    this.enemyBots.forEach(({ bot, ai }) => {
      if (this.aiEnabled) {
        ai.enable();
      } else {
        ai.disable();
        // AIオフの場合はボットを停止
        bot.setVelocity(0, 0);
      }
    });
  }
  
  // キャラクターとスキルの情報表示
  private createSkillInfoDisplay(): void {
    // キャラクター名とスキル名を表示
    const characterName = CharacterData.getCharacterName(this.selectedCharacterType) || 'Unknown';
    const skillName = CharacterData.getSkillName(this.gameManager.getPlayer().getSkillType());
    const weaponName = CharacterData.getWeaponName(this.gameManager.getPlayer().getWeaponType());
    
    // スキル情報表示
    this.gameManager.createSkillInfoDisplay(skillName);
    this.gameManager.createWeaponInfoDisplay(characterName);
    // 武器情報表示
    this.gameManager.createWeaponInfoDisplay(weaponName);
    // キー操作ガイド
    this.add.text(16, this.cameras.main.height - 110, 
      `操作: WASD移動 / クリックで攻撃 / スペースでスキル / Qでアルティメット`, {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: { x: 8, y: 4 }
      })
      .setScrollFactor(0)
      .setDepth(100);
  }
  
  // キャラクター情報表示
  private displayCharacterInfo(): void {
    const characterName = CharacterData.getCharacterName(this.selectedCharacterType);
    
    // キャラクター名を表示
    const characterInfoText = this.add.text(this.cameras.main.width / 2, 50, 
      `キャラクター: ${characterName}`, {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: { x: 12, y: 6 }
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(100);
    
    // 表示を3秒後に消す
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: characterInfoText,
        alpha: 0,
        duration: 500,
        onComplete: () => characterInfoText.destroy()
      });
    });
  }
  
  // キャラクタータイプから表示名を取得
  /*
  private getCharacterDisplayName(type: CharacterType): string {
    switch (type) {
      case CharacterType.TANK: return 'タンク';
      case CharacterType.SPEEDER: return 'スピーダー';
      case CharacterType.SNIPER: return 'スナイパー';
      case CharacterType.HEALER: return 'ヒーラー';
      case CharacterType.THROWER: return '爆弾魔';
      default: return 'バランス型';
    }
  }
  */
  // スキルエフェクト表示の強化
  showSkillEffect(type: SkillType, x: number, y: number): void {
    // 既存のエフェクトをクリア
    this.clearSkillAnimationEffects();
    
    // スキルタイプに応じたエフェクト
    switch (type) {
      case SkillType.SHIELD:
        this.showShieldEffect(x, y);
        break;
      case SkillType.DASH:
        this.showDashEffect(x, y);
        break;
      case SkillType.SCOPE:
        this.showScopeEffect(x, y);
        break;
      case SkillType.HEAL:
        this.showHealEffect(x, y);
        break;
      case SkillType.MINEFIELD:
        this.showMinefieldEffect(x, y);
        break;
      case SkillType.BOMB:
        this.showBombEffect(x, y);
        break;
    }
  }
  
  // スキル使用時のエフェクト表示
  private showShieldEffect(x: number, y: number): void {
    // シールドエフェクト（プレイヤーの周りに青い円）
    const shield = this.add.circle(x, y, 45, 0x00aaff, 0.3)
      .setStrokeStyle(3, 0x00ffff, 1)
      .setDepth(50);
    
    const shieldHighlight = this.add.circle(x, y, 50, 0x00ffff, 0)
      .setStrokeStyle(1, 0x00ffff, 0.5)
      .setDepth(50);
    
    // エフェクトのアニメーション（拡大→元のサイズに）
    this.tweens.add({
      targets: [shield, shieldHighlight],
      scale: { from: 0, to: 1 },
      alpha: { from: 0.8, to: 0.3 },
      duration: 500,
      ease: 'Back.easeOut'
    });
    
    // シールドパーティクル
    const particles = this.add.particles(x, y, 'default', {
      speed: 100,
      scale: { start: 0.2, end: 0 },
      blendMode: 'ADD',
      tint: 0x00ffff,
      lifespan: 1000,
      quantity: 10,
      frequency: 100
    })
    .setDepth(50);
    
    this.skillAnimationEffects.push(shield, shieldHighlight, particles);
    
    // エフェクトを一定時間後に削除
    this.time.delayedCall(2000, () => {
      this.clearSkillAnimationEffects();
    });
  }
  
  private showDashEffect(x: number, y: number): void {
    // ダッシュの軌跡エフェクト
    const trail = this.add.particles(x, y, 'default', {
      speed: { min: 10, max: 50 },
      scale: { start: 0.3, end: 0 },
      blendMode: 'ADD',
      tint: 0x88ff88,
      lifespan: 500,
      quantity: 20
    })
    .setDepth(10);
    
    this.skillAnimationEffects.push(trail);
    
    // エフェクトを一定時間後に削除
    this.time.delayedCall(800, () => {
      this.clearSkillAnimationEffects();
    });
  }
  
  private showScopeEffect(x: number, y: number): void {
    // スコープのエフェクト（照準円）
    const outerCircle = this.add.circle(x, y, 55, 0x0000ff, 0)
      .setStrokeStyle(2, 0x0000ff, 0.5)
      .setDepth(50);
    
    const innerCircle = this.add.circle(x, y, 30, 0x0000ff, 0)
      .setStrokeStyle(1, 0x0000ff, 0.7)
      .setDepth(50);
    
    // 十字線
    const crosshair = this.add.graphics()
      .setPosition(x, y)
      .setDepth(50);
    
    crosshair.lineStyle(1, 0x0000ff, 0.7);
    crosshair.beginPath();
    crosshair.moveTo(0, -20);
    crosshair.lineTo(0, 20);
    crosshair.moveTo(-20, 0);
    crosshair.lineTo(20, 0);
    crosshair.strokePath();
    
    this.skillAnimationEffects.push(outerCircle, innerCircle, crosshair);
    
    // エフェクトを一定時間後に削除
    this.time.delayedCall(3000, () => {
      this.clearSkillAnimationEffects();
    });
  }
  
  private showHealEffect(x: number, y: number): void {
    // 回復エフェクト（緑の輝きと上昇する+マーク）
    const healGlow = this.add.circle(x, y, 40, 0x00ff00, 0.3)
      .setDepth(50);
    
    // 回復パーティクル
    const particles = this.add.particles(x, y, 'default', {
      speed: { min: 20, max: 70 },
      angle: { min: 270, max: 360 },
      scale: { start: 0.4, end: 0 },
      blendMode: 'ADD',
      tint: 0x00ff00,
      lifespan: 1000,
      quantity: 20
    })
    .setDepth(50);
    
    // 回復数値の表示
    for (let i = 0; i < 3; i++) {
      const healText = this.add.text(
        x + Phaser.Math.Between(-30, 30),
        y,
        '+' + Phaser.Math.Between(5, 15),
        { 
          fontSize: '18px',
          color: '#00ff00',
          fontStyle: 'bold'
        }
      )
      .setOrigin(0.5)
      .setDepth(51);
      
      this.tweens.add({
        targets: healText,
        y: y - 50,
        alpha: { from: 1, to: 0 },
        duration: 1000,
        delay: i * 300,
        ease: 'Power1',
        onComplete: () => {
          healText.destroy();
        }
      });
      
      this.skillAnimationEffects.push(healText);
    }
    
    this.skillAnimationEffects.push(healGlow, particles);
    
    // エフェクトを一定時間後に削除
    this.time.delayedCall(1500, () => {
      this.clearSkillAnimationEffects();
    });
  }
  
  private showMinefieldEffect(x: number, y: number): void {
    // 地雷設置エフェクト
    const mine = this.add.circle(x, y, 15, 0xff0000, 0.7)
      .setStrokeStyle(2, 0xff5500, 1)
      .setDepth(5);
    
    // 点滅エフェクト
    this.tweens.add({
      targets: mine,
      alpha: { from: 0.7, to: 0.3 },
      yoyo: true,
      repeat: -1,
      duration: 500
    });
    
    // 警告マーク
    const warningText = this.add.text(x, y - 20, '!', {
      fontSize: '16px',
      color: '#ff0000',
      fontStyle: 'bold'
    })
    .setOrigin(0.5)
    .setDepth(6);
    
    // 警告マークをアニメーション
    this.tweens.add({
      targets: warningText,
      y: y - 30,
      alpha: { from: 1, to: 0 },
      duration: 700,
      repeat: -1
    });
    
    this.skillAnimationEffects.push(mine, warningText);
    
    // エフェクトを15秒後に削除（地雷の寿命）
    this.time.delayedCall(15000, () => {
      // 消える前に爆発エフェクト
      this.showExplosionEffect(x, y, 80, 0.5);
      this.clearSkillAnimationEffects();
    });
  }
  
  private showBombEffect(x: number, y: number): void {
    // 爆弾投げエフェクト
    this.showExplosionEffect(x, y, 100, 1);
  }
  
  // 爆発エフェクト（サイズと強度を調整可能）
  private showExplosionEffect(x: number, y: number, radius: number, intensity: number): void {
    // 爆発の光球
    const explosion = this.add.circle(x, y, radius, 0xff8800, 0.6)
      .setDepth(50);
    
    // 爆発の外輪
    const explosionRing = this.add.circle(x, y, radius * 0.8, 0xff0000, 0)
      .setStrokeStyle(4, 0xff8800, 0.8)
      .setDepth(50);
    
    // 爆発の中心が明るいグラデーション
    const gradient = this.add.circle(x, y, radius * 0.4, 0xffff00, 0.7)
      .setDepth(51);
    
    // 爆発パーティクル
    const particles = this.add.particles(x, y, 'default', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      tint: 0xff7700,
      lifespan: 800,
      quantity: 30 * intensity,
      emitZone: {
        type: 'edge',
        source: new Phaser.Geom.Circle(0, 0, radius * 0.7),
        quantity: 30 * intensity
      }
    })
    .setDepth(52);
    
    // 煙パーティクル
    const smoke = this.add.particles(x, y, 'default', {
      speed: { min: 20, max: 70 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.3, end: 0 },
      tint: 0x333333,
      lifespan: 1500,
      quantity: 20 * intensity
    })
    .setDepth(49);
    
    // カメラシェイク
    this.cameras.main.shake(300 * intensity, 0.01 * intensity);
    
    this.skillAnimationEffects.push(explosion, explosionRing, gradient, particles, smoke);
    
    // エフェクトのアニメーション
    this.tweens.add({
      targets: explosion,
      scale: { from: 0.2, to: 1.2 },
      alpha: { from: 0.8, to: 0 },
      duration: 700,
      ease: 'Power2'
    });
    
    this.tweens.add({
      targets: explosionRing,
      scale: { from: 0.5, to: 1.5 },
      alpha: { from: 1, to: 0 },
      duration: 800,
      ease: 'Power1'
    });
    
    this.tweens.add({
      targets: gradient,
      scale: { from: 1.2, to: 0.4 },
      alpha: { from: 0.9, to: 0 },
      duration: 500,
      ease: 'Power3'
    });
    
    // エフェクトを一定時間後に削除
    this.time.delayedCall(1500, () => {
      this.clearSkillAnimationEffects();
    });
  }
  
  // スキルエフェクトをクリア
  private clearSkillAnimationEffects(): void {
    this.skillAnimationEffects.forEach(effect => {
      if (effect && !effect.destroy) {
        effect.destroy();
      }
    });
    this.skillAnimationEffects = [];
  }

  private createSkillCooldownDisplay(): void {
    // スキルクールダウンを表示するグラフィック要素
    this.gameManager.createSkillCooldownDisplay();
  }

  update(_: number) {  // timeパラメータを使用していなくても、Phaserのフレームワークとの整合性のために残す
    if (!this.gameManager.getPlayer()) {
      return; // プレイヤーがまだ作成されていなければスキップ
    }
    
    // プレイヤーの物理ボディが有効であることを確認
    this.gameManager.getPlayer().ensurePhysicsBody();
    
    // プレイヤー移動処理 - タッチスクリーンでは移動ジョイスティックを使用
    const moveJoystick = this.gameManager.getMoveJoystick();
    if (moveJoystick) {
      const moveVector = moveJoystick.getVector();
      this.gameManager.getPlayer().move(moveVector.x, moveVector.y);
    } else {
      // デスクトップ: キーボードの入力で移動
      const directionX = Number(this.gameManager.getCursors().right.isDown) - Number(this.gameManager.getCursors().left.isDown);
      const directionY = Number(this.gameManager.getCursors().down.isDown) - Number(this.gameManager.getCursors().up.isDown);
      this.gameManager.getPlayer().move(directionX, directionY);
    }
    
    // 武器の照準表示（マウスの場合）
    if (!this.gameManager.isMobile()) {
      const pointer = this.input.activePointer;
      if (pointer.isDown) {
        // マウスの世界座標を取得
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        
        // 移動ジョイスティックとスキルジョイスティックの操作中でなければ照準を表示
        const moveJoystick = this.gameManager.getMoveJoystick();
        const skillJoystick = this.gameManager.getSkillJoystick();
        if ((!moveJoystick || !moveJoystick.isBeingUsed(pointer)) && 
            (!skillJoystick || !skillJoystick.isBeingUsed(pointer))) {
          this.gameManager.showWeaponAiming(worldPoint.x, worldPoint.y);
        }
      } else {
        // マウスを押していない場合は照準を消去
        this.gameManager.clearWeaponAiming();
      }
    }
    
    // キーボード入力でスキル使用
    if (this.gameManager.getCursors().space?.isDown && this.gameManager.getPlayer().canUseSkill()) {
      // スペースキーでスキル発動（前方向）
      const angle = this.gameManager.getPlayer().rotation;
      const targetX = this.gameManager.getPlayer().x + Math.cos(angle) * 200;
      const targetY = this.gameManager.getPlayer().y + Math.sin(angle) * 200;
      this.gameManager.getPlayer().useSkill(targetX, targetY);
      this.gameManager.playSkillActivateSound();
    }
    
    // アルティメットスキル発動（Qキー）
    if (Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey('Q')) && 
        this.gameManager.getPlayer().canUseUltimate()) {
      this.gameManager.getPlayer().useUltimate();
      this.gameManager.playUltimateActivateSound();
    }
    
    // ボットAIの更新（AIが有効な場合のみ）
    if (this.aiEnabled) {
      this.enemyBots.forEach(({ ai }) => {
        ai.update();
      });
    }
    
    // プレイヤーと茂みの判定
    if (this.gameManager.getMap() && this.gameManager.getMap().isInBush(this.gameManager.getPlayer())) {
      this.gameManager.getPlayer().enterBush();
    } else {
      this.gameManager.getPlayer().exitBush();
    }
    
    // UI更新
    if (this.gameManager.getUI()) {
      this.gameManager.getUI().update();
    }
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
    
    const gameManager = this.gameManager;
    if (!gameManager) return;  // 安全チェックを追加
    
    // 既存のUIをクリア
    if (gameManager.getUI()) {
      gameManager.getUI().destroy();
      gameManager.setUI(undefined);
    }
    
    // 既存のジョイスティックをクリア
    const moveJoystick = gameManager.getMoveJoystick();
    if (moveJoystick) {
      moveJoystick.destroy();
      gameManager.setMoveJoystick(undefined);
    }
    const skillJoystick = gameManager.getSkillJoystick();
    if (skillJoystick) {
      skillJoystick.destroy();
      gameManager.setSkillJoystick(undefined);
    }
    
    // 既存のスキルクールダウン表示をクリア
    const skillCooldownDisplay = gameManager.getSkillCooldownDisplay();
    if (skillCooldownDisplay) {
      skillCooldownDisplay.clear();
      skillCooldownDisplay.destroy();
      gameManager.setSkillCooldownDisplay(undefined);
    }
    
    // 既存のプレイヤーを削除
    if (gameManager.getPlayer()) {
      gameManager.getPlayer().destroy();
      gameManager.setPlayer(undefined);
    }
    
    // 既存のマップを削除
    if (gameManager.getMap()) {
      gameManager.getMap().destroy();
      gameManager.setMap(undefined);
    }
    
    // 既存のイベントリスナーをクリーンアップ
    this.input.off('pointerdown');
    
    // スキルエフェクトをクリア
    this.clearSkillAnimationEffects();
    
    // スキル情報表示をクリア
    const skillInfoText = gameManager.getSkillInfoText();
    if (skillInfoText) {
      skillInfoText.destroy();
      gameManager.setSkillInfoText(undefined);
    }
    
    // 武器情報表示をクリア
    const weaponInfoText = gameManager.getWeaponInfoText();
    if (weaponInfoText) {
      weaponInfoText.destroy();
      gameManager.setWeaponInfoText(undefined);
    }
    
    // AIトグルボタンをクリア
    if (this.aiToggleButton) {
      this.aiToggleButton.destroy();
      this.aiToggleButton = undefined;
    }
  }

  // 敵ボットを作成
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
      const bot = this.gameManager.getCharacterFactory().createCharacter(botType, pos.x, pos.y);
      
      // 難易度を設定（例: 最初は簡単、順に難しく）
      const difficulty = index as BotDifficulty;
      
      // AIを割り当て
      const ai = new BotAI(this, bot, this.gameManager.getPlayer(), difficulty);
      
      // ボットリストに追加
      this.enemyBots.push({ bot, ai });
    });
  }
  
  // 衝突判定を設定
  private setupCollisions(): void {
    // 壁が初期化されているか確認
    if (!this.gameManager.getMap() || !this.gameManager.getMap().getWalls()) {
      console.warn('マップまたは壁が初期化されていません');
      return;
    }

    // プレイヤーが初期化されているか確認
    if (!this.gameManager.getPlayer()) {
      console.warn('プレイヤーが初期化されていません');
      return;
    }

    // プレイヤーと壁の衝突
    this.physics.add.collider(this.gameManager.getPlayer(), this.gameManager.getMap().getWalls());
    
    // ボットと壁の衝突
    this.enemyBots.forEach(({ bot }) => {
      if (bot && this.gameManager.getMap().getWalls()) {
        this.physics.add.collider(bot, this.gameManager.getMap().getWalls());
      }
    });
    
    // 弾のグループが初期化されているか確認
    const playerBullets = this.gameManager.getPlayer().getWeapon()?.getBullets();
    if (!playerBullets) {
      console.warn('プレイヤーの弾グループが初期化されていません');
      return;
    }
    
    // プレイヤーの弾と壁の衝突
    this.physics.add.collider(
      playerBullets,
      this.gameManager.getMap().getWalls(),
      (bulletObj, wall) => {  // 未使用の変数名を_wallに変更
        if (bulletObj instanceof Phaser.Physics.Arcade.Sprite) {
          const bullet = bulletObj as Bullet;
          bullet.onHit(wall);
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
                
                // 弾の所有者とターゲットが同じでない場合のみダメージ処理
                if (bullet.owner !== enemyPlayer) {
                  const damage = bullet.getDamage();
                  enemyPlayer.takeDamage(damage);
                  bullet.onHit(enemy);
                  
                  this.gameManager.playHitSound();
                }
              }
            } catch (e) {
              console.warn('ボットダメージ処理エラー:', e);
            }
          },
          // 衝突判定前のコールバック - 弾の所有者とターゲットが同じでない場合のみ処理
          (bulletObj, enemy) => {
            if (bulletObj instanceof Bullet && enemy instanceof Player) {
              return bulletObj.owner !== enemy;
            }
            return true;
          },
          this
        );
        
        // ボットの弾が初期化されているか確認
        const botBullets = bot.getWeapon()?.getBullets();
        if (botBullets) {
          // 敵ボットの弾とプレイヤーの衝突
          this.physics.add.overlap(
            botBullets,
            this.gameManager.getPlayer(),
            (bulletObj, playerObj) => {
              try {
                if (bulletObj instanceof Phaser.Physics.Arcade.Sprite && 
                    playerObj instanceof Phaser.Physics.Arcade.Sprite) {
                  const bullet = bulletObj as Bullet;
                  
                  // 弾の所有者とターゲットが同じでない場合のみダメージ処理
                  if (bullet.owner !== playerObj) {
                    const damage = bullet.getDamage();
                    this.gameManager.getPlayer().takeDamage(damage);
                    bullet.onHit(playerObj);
                    
                    this.gameManager.playDamageSound();
                  }
                }
              } catch (e) {
                console.warn('プレイヤーダメージ処理エラー:', e);
              }
            },
            // 衝突判定前のコールバック - 弾の所有者とターゲットが同じでない場合のみ処理
            (bulletObj, playerObj) => {
              if (bulletObj instanceof Bullet && playerObj instanceof Player) {
                return bulletObj.owner !== playerObj;
              }
              return true;
            },
            this
          );
        }
      }
    });
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

  // 攻撃アクションの設定（クリックかタップで攻撃）
  private setupAttackAction(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // ジョイスティックの操作でなく、UIボタン上でもない場合のみ攻撃
      const moveJoystick = this.gameManager.getMoveJoystick();
      const skillJoystick = this.gameManager.getSkillJoystick();
      if ((!moveJoystick || !moveJoystick.isBeingUsed(pointer)) && 
          (!skillJoystick || !skillJoystick.isBeingUsed(pointer))) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.gameManager.getPlayer().attack(worldPoint.x, worldPoint.y);
      }
    });
  }
}

// CharacterTypeの定数を修正
const characterOptions = [
  {
    text: 'ナイト', 
    value: CharacterType.KNIGHT, 
    description: 'バランス型', 
    color: '#ffffff'
  },
  {
    text: 'タンカー', 
    value: CharacterType.TANKER, 
    description: '防御型', 
    color: '#ff0000'
  },
  {
    text: 'アーチャー', 
    value: CharacterType.ARCHER, 
    description: '射撃型', 
    color: '#00ff00'
  },
  {
    text: 'スナイパー', 
    value: CharacterType.SNIPER, 
    description: '狙撃型', 
    color: '#0000ff'
  },
  {
    text: '爆弾魔', 
    value: CharacterType.BOMBER, 
    description: '爆発型', 
    color: '#ff00ff'
  },
];

// 'characterOptions'の値が読み込まれないエラーを修正するため、使用する
if (characterOptions.length > 0) {
  console.debug('利用可能なキャラクター数:', characterOptions.length);
}
