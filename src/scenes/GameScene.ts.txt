import Phaser from 'phaser';
import { VirtualJoystick } from '../controls/VirtualJoystick';
import { Player, PlayerState } from '../objects/Player';
import { CharacterManager } from '../characters/CharacterManager';
import { CharacterType } from '../characters/CharacterFactory';
import { MapManager } from '../map/MapManager';
import { UIManager } from '../ui/UIManager';
import { GameConfig } from '../config/GameConfig';
import { EnemyBot } from '../ai/EnemyBot';

export default class GameScene extends Phaser.Scene {
  private player: Player | null = null;
  private characterManager: CharacterManager | null = null;
  private mapManager: MapManager | null = null;
  private uiManager: UIManager | null = null;
  private joystick: VirtualJoystick | null = null;
  private actionButtons: {[key: string]: Phaser.GameObjects.Image} = {};
  private enemyBots: EnemyBot[] = [];
  private spawnInterval: number = 0;
  private isPaused: boolean = false;
  private isGameOver: boolean = false;
  private isDebugMode: boolean = false;
  private targetingLine: Phaser.GameObjects.Graphics | null = null;
  private enemyLayer: Phaser.GameObjects.Layer | null = null;
  private playerLayer: Phaser.GameObjects.Layer | null = null;
  private uiLayer: Phaser.GameObjects.Layer | null = null;
  private selectedCharacterType: CharacterType = CharacterType.DEFAULT;
  private enemiesKilled: number = 0;
  private gameTime: number = 0;
  private lastAimingTime: number = 0;
  
  constructor() {
    super('GameScene');
  }

  // ...existing code...

  create() {
    // ...existing code...
    
    // マップ生成
    this.mapManager = new MapManager(this);
    const map = this.mapManager.createMap('main_map');
    
    // プレイヤー作成
    const spawnPoint = this.mapManager.getPlayerSpawnPoint();
    this.player = new Player(this, spawnPoint.x, spawnPoint.y);
    
    // ウォールレイヤーを照準に設定
    const wallLayer = this.mapManager.getWallLayer();
    if (wallLayer && this.player) {
      this.player.setWallLayer(wallLayer);
    }
    
    // キャラクター管理を初期化
    this.characterManager = new CharacterManager(this, this.player);
    // 選択されたキャラクタータイプを設定
    this.characterManager.changeCharacterType(this.selectedCharacterType);
    
    // UI管理を初期化
    this.uiManager = new UIManager(this, this.player, this.characterManager);
    
    // ジョイスティック作成
    this.createControls();
    
    // 衝突判定設定
    this.setupCollisions();
    
    // カメラ設定
    this.setCameraFollow();
    
    // デバッグモード
    this.setupDebugMode();
    
    // ...existing code...
  }
  
  update(time: number, delta: number) {
    // ...existing code...
    
    // プレイヤーがnullの場合は処理しない
    if (!this.player || this.isPaused || this.isGameOver) return;
    
    // キャラクターマネージャーの更新
    if (this.characterManager) {
      this.characterManager.update(time, delta);
    }
    
    // プレイヤーを更新
    this.player.update(time);
    
    // ジョイスティック操作による移動
    this.handlePlayerMovement();
    
    // 照準表示を更新
    this.updateTargeting(time);
    
    // UIの更新
    if (this.uiManager) {
      this.uiManager.update(time, delta);
    }
    
    // ...existing code...
  }
  
  // ...existing code...
  
  /**
   * 照準表示を更新する
   */
  private updateTargeting(time: number): void {
    if (!this.player || !this.characterManager) return;
    
    // 照準の更新は30ms毎に行う（パフォーマンス最適化）
    if (time - this.lastAimingTime < 30) return;
    this.lastAimingTime = time;
    
    // タッチまたはマウス位置を取得
    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // プレイヤーからの方向を取得
    const directionX = worldPoint.x - this.player.x;
    const directionY = worldPoint.y - this.player.y;
    
    // ポインターとジョイスティックの距離
    let joystickDistance = 0;
    if (this.joystick && this.joystick.isDown()) {
      joystickDistance = this.joystick.getDistance();
    }
    
    // プレイヤーの状態に応じて照準表示を切り替え
    const currentSkillButton = this.getActiveSkillButton();
    
    // 現在のスキルボタンに基づいて照準を切り替え
    if (currentSkillButton === 'ultimate' && this.player.canUseUltimate()) {
      // アルティメットの照準表示
      this.characterManager.updateAiming(worldPoint.x, worldPoint.y, joystickDistance);
    } else if (currentSkillButton === 'skill' && this.player.canUseSkill()) {
      // スキルの照準表示
      this.characterManager.updateSkillAiming(worldPoint.x, worldPoint.y, joystickDistance);
    } else {
      // 通常攻撃の照準表示
      this.characterManager.updateAiming(worldPoint.x, worldPoint.y, joystickDistance);
    }
  }
  
  /**
   * 攻撃ボタン押下時の処理
   */
  private onAttackButtonDown(): void {
    if (!this.player || this.player.getState() === PlayerState.DEAD) return;
    
    // ポインタ位置を取得
    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // キャラクターの特殊攻撃を試みる
    if (this.characterManager && this.characterManager.trySpecialAttack(worldPoint.x, worldPoint.y)) {
      return; // 特殊攻撃が実行された場合は標準攻撃を行わない
    }
    
    // 標準攻撃を実行
    this.player.attack(worldPoint.x, worldPoint.y);
  }
  
  /**
   * スキルボタン押下時の処理
   */
  private onSkillButtonDown(): void {
    if (!this.player || !this.characterManager || this.player.getState() === PlayerState.DEAD) return;
    
    // クールダウン中は使用不可
    if (!this.player.canUseSkill()) return;
    
    // ポインタ位置を取得
    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // スキルを使用
    this.characterManager.useSkill(worldPoint.x, worldPoint.y);
  }
  
  /**
   * アルティメットボタン押下時の処理
   */
  private onUltimateButtonDown(): void {
    if (!this.player || !this.characterManager || this.player.getState() === PlayerState.DEAD) return;
    
    // クールダウン中は使用不可
    if (!this.player.canUseUltimate()) return;
    
    // アルティメットを使用
    this.characterManager.useUltimate();
  }
  
  /**
   * アクティブなスキルボタンを取得
   */
  private getActiveSkillButton(): string {
    // UIマネージャーからアクティブボタン情報を取得
    if (this.uiManager) {
      return this.uiManager.getActiveSkillButton();
    }
    return 'attack'; // デフォルトは攻撃
  }
  
  /**
   * コントロールの初期化
   */
  private createControls(): void {
    // ...existing code...
    
    // 仮想ジョイスティックの作成
    this.joystick = new VirtualJoystick(this, 100, GameConfig.HEIGHT - 100, 50);
    
    // アクションボタンの作成
    this.actionButtons.attack = this.add.image(GameConfig.WIDTH - 50, GameConfig.HEIGHT - 50, 'attack_button')
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(20);
      
    this.actionButtons.skill = this.add.image(GameConfig.WIDTH - 130, GameConfig.HEIGHT - 50, 'skill_button')
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(20);
      
    this.actionButtons.ultimate = this.add.image(GameConfig.WIDTH - 210, GameConfig.HEIGHT - 50, 'ultimate_button')
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(20);
    
    // ボタンイベントの登録
    this.actionButtons.attack.on('pointerdown', () => this.onAttackButtonDown());
    this.actionButtons.skill.on('pointerdown', () => this.onSkillButtonDown());
    this.actionButtons.ultimate.on('pointerdown', () => this.onUltimateButtonDown());
    
    // ...existing code...
  }
  
  // ...existing code...
  
  /**
   * 壁との衝突設定
   */
  private setupCollisions(): void {
    if (!this.player || !this.mapManager) return;
    
    // 壁レイヤーを取得
    const wallLayer = this.mapManager.getWallLayer();
    if (wallLayer) {
      // プレイヤーと壁の衝突を設定
      this.physics.add.collider(this.player, wallLayer);
      
      // 壁レイヤーを照準表示に設定
      if (this.characterManager) {
        this.characterManager.setWallLayer(wallLayer);
      }
    }
    
    // ...existing code...
  }
  
  /**
   * キャラクターのタイプを変更する
   */
  changeCharacter(type: CharacterType): void {
    if (this.characterManager) {
      this.characterManager.changeCharacterType(type);
    }
  }
  
  /**
   * 現在選択されているキャラクタータイプを設定
   */
  setSelectedCharacterType(type: CharacterType): void {
    this.selectedCharacterType = type;
  }
  
  /**
   * ゲームのクリーンアップ
   */
  shutdown(): void {
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    
    if (this.characterManager) {
      this.characterManager.destroy();
      this.characterManager = null;
    }
    
    if (this.uiManager) {
      this.uiManager.destroy();
      this.uiManager = null;
    }
    
    if (this.joystick) {
      this.joystick.destroy();
      this.joystick = null;
    }
    
    // ...existing code...
  }
}
