import Phaser from 'phaser';
import { Player, SkillType } from '../objects/Player';
import { Map, MapType } from '../objects/Map';
import { SoundManager } from '../utils/SoundManager';
import { GameEffects } from '../utils/GameEffects';
import { CharacterFactory, CharacterType } from '../characters/CharacterFactory';
import { InputController } from '../controllers/InputController';
import { UI } from '../ui/UI';
import { SkillUI } from '../ui/SkillUI';
import { VirtualJoystick } from '../utils/VirtualJoystick';

// WeaponTypeは実際に使われている場合はインポートを残す、使われていない場合は削除

/**
 * TrainingSceneとOnlineGameSceneで共通して使用する
 * ゲームマネージャークラス
 */
export class GameManager {
  private scene: Phaser.Scene;
  private player!: Player;
  private map!: Map;
  private ui!: UI;
  private skillUI!: SkillUI;
  private soundManager!: SoundManager;
  private gameEffects!: GameEffects;
  private characterFactory!: CharacterFactory;
  private inputController!: InputController;
  private _isMobile: boolean; // プロパティ名を_isMobileに変更
  private gameStarted: boolean = false;
  private moveJoystick?: VirtualJoystick;
  private skillJoystick?: VirtualJoystick;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private skillCooldownDisplay?: Phaser.GameObjects.Graphics;
  private skillInfoText?: Phaser.GameObjects.Text;
  private weaponInfoText?: Phaser.GameObjects.Text;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this._isMobile = !scene.sys.game.device.os.desktop; // プロパティ名変更
    
    // 必要なマネージャークラスを初期化
    this.soundManager = new SoundManager(scene);
    this.gameEffects = new GameEffects(scene);
    this.characterFactory = new CharacterFactory(scene);
    
    // キーボード入力を設定
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
  }
  
  /**
   * マップを作成
   */
  createMap(mapType: MapType): void {
    this.map = new Map(this.scene, mapType);
  }
  
  /**
   * プレイヤーを作成
   */
  createPlayer(characterType: CharacterType, x: number, y: number): void {
    this.player = this.characterFactory.createCharacter(characterType, x, y);
  }
  
  // CharacterFactoryのゲッターを追加
  getCharacterFactory(): CharacterFactory {
    return this.characterFactory;
  }
  
  /**
   * UI を作成
   */
  createUI(): void {
    this.ui = new UI(this.scene, this.player);
    this.skillUI = new SkillUI(this.scene, this.player);
  }
  
  /**
   * キーボード入力を設定
   */
  setupKeyboardInput(): void {
    if (this.inputController) {
      this.inputController.destroy();
    }
    
    this.inputController = new InputController(this.scene, this.player);
    
    // 追加のキーボードショートカットをここに設定可能
  }
  
  /**
   * バーチャルジョイスティックを作成（モバイル用）
   */
  createJoysticks(): void {
    this.moveJoystick = new VirtualJoystick(this.scene, false);
    this.skillJoystick = new VirtualJoystick(this.scene, true, this.player);
  }
  
  /**
   * スキルクールダウン表示を作成
   */
  createSkillCooldownDisplay(): void {
    // スキルクールダウンを表示するグラフィック要素
    this.skillCooldownDisplay = this.scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(200);
    
    // 更新イベントを設定
    this.scene.time.addEvent({
      delay: 100, // 100ms毎に更新
      callback: this.updateSkillCooldownDisplay,
      callbackScope: this,
      loop: true
    });
  }
  
  /**
   * スキルクールダウン表示を更新
   */
  updateSkillCooldownDisplay = (): void => {
    if (!this.skillCooldownDisplay || !this.player) return;
    
    this.skillCooldownDisplay.clear();
    
    // スキルのクールダウン情報を取得
    const skillCooldown = this.player.getSkillCooldownPercent();
    const ultimateCooldown = this.player.getUltimateCooldownPercent();
    
    // スキルジョイスティックのベース位置
    const baseX = this.skillJoystick?.getBase().x ?? (this.scene.cameras.main.width - 150);
    const baseY = this.skillJoystick?.getBase().y ?? (this.scene.cameras.main.height - 150);
    
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
    const ultimateX = this.scene.cameras.main.width - 50;
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
  
  /**
   * スキル情報表示を作成
   */
  createSkillInfoDisplay(skillName: string): void {
    this.skillInfoText = this.scene.add.text(16, this.scene.cameras.main.height - 80, 
      `スキル: ${skillName} [スペースキー]`, {
        fontSize: '16px',
        color: '#00ffff',
      })
      .setScrollFactor(0)
      .setDepth(100);
  }
  
  /**
   * 武器情報表示を作成
   */
  createWeaponInfoDisplay(weaponName: string): void {
    this.weaponInfoText = this.scene.add.text(16, this.scene.cameras.main.height - 50, 
      `武器: ${weaponName}`, {
        fontSize: '16px',
        color: '#ffff00',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: { x: 8, y: 4 }
      })
      .setScrollFactor(0)
      .setDepth(100);
  }
  
  /**
   * ゲームを開始
   */
  startGame(): void {
    if (this.gameStarted) return;
    
    this.gameStarted = true;
    
    // カウントダウン表示とゲーム開始
    this.gameEffects.showCountdown(() => {
      // BGM再生
      try {
        this.soundManager.playMusic('game_bgm');
      } catch (e) {
        console.warn('BGM再生エラー:', e);
      }
    });
  }
  
  /**
   * シーン更新処理
   */
  update(time: number): void {
    if (!this.player) return;
    
    // 入力コントローラーを更新
    if (this.inputController) {
      this.inputController.update();
    }
    
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
    
    // SkillUI更新
    if (this.skillUI) {
      this.skillUI.update();
    }
  }
  
  /**
   * 効果音再生メソッド
   */
  playSelectSound(): void {
    this.soundManager.playSfx('select');
  }
  
  playButtonClickSound(): void {
    this.soundManager.playSfx('button_click');
  }
  
  playSkillActivateSound(): void {
    this.soundManager.playSfx('skill_activate');
  }
  
  playUltimateActivateSound(): void {
    this.soundManager.playSfx('ultimate_activate');
  }
  
  // ヒット効果音再生メソッドを追加
  playHitSound(): void {
    this.soundManager.playSfx('hit');
  }
  
  // ダメージ効果音再生メソッドを追加
  playDamageSound(): void {
    this.soundManager.playSfx('damage');
  }
  
  /**
   * 指定キャラクターで爆発エフェクトを表示
   */
  showExplosion(x: number, y: number, radius: number = 100, intensity: number = 1.0): void {
    this.gameEffects.showExplosionEffect(x, y, radius, intensity);
  }
  
  /**
   * プレイヤーにダメージを与えた時のエフェクト
   */
  showHitEffect(x: number, y: number, damage: number): void {
    this.gameEffects.showHitEffect(x, y, damage);
  }
  
  /**
   * キル演出を表示
   */
  showKillEffect(x: number, y: number): void {
    this.gameEffects.showKillEffect(x, y);
  }
  
  /**
   * スキルエフェクトを表示
   */
  showSkillEffect(skillType: SkillType, x: number, y: number): void {
    this.gameEffects.showSkillEffect(skillType, x, y);
  }
  
  /**
   * スキル使用可能通知
   */
  showSkillReady(): void {
    this.gameEffects.showSkillReadyNotification();
  }
  
  /**
   * アルティメット使用可能通知
   */
  showUltimateReady(): void {
    this.gameEffects.showUltimateReadyNotification();
  }
  
  // ゲッター・セッターメソッド
  getPlayer(): Player {
    return this.player;
  }
  
  setPlayer(player: Player | undefined): void {
    this.player = player as Player;
  }
  
  getMap(): Map {
    return this.map;
  }
  
  setMap(map: Map | undefined): void {
    this.map = map as Map;
  }
  
  getUI(): UI {
    return this.ui;
  }
  
  setUI(ui: UI | undefined): void {
    this.ui = ui as UI;
  }
  
  getMoveJoystick(): VirtualJoystick | undefined {
    return this.moveJoystick;
  }
  
  setMoveJoystick(joystick: VirtualJoystick | undefined): void {
    this.moveJoystick = joystick;
  }
  
  getSkillJoystick(): VirtualJoystick | undefined {
    return this.skillJoystick;
  }
  
  setSkillJoystick(joystick: VirtualJoystick | undefined): void {
    this.skillJoystick = joystick;
  }
  
  getCursors(): Phaser.Types.Input.Keyboard.CursorKeys {
    return this.cursors;
  }
  
  getSkillCooldownDisplay(): Phaser.GameObjects.Graphics | undefined {
    return this.skillCooldownDisplay;
  }
  
  setSkillCooldownDisplay(display: Phaser.GameObjects.Graphics | undefined): void {
    this.skillCooldownDisplay = display;
  }
  
  getSkillInfoText(): Phaser.GameObjects.Text | undefined {
    return this.skillInfoText;
  }
  
  setSkillInfoText(text: Phaser.GameObjects.Text | undefined): void {
    this.skillInfoText = text;
  }
  
  getWeaponInfoText(): Phaser.GameObjects.Text | undefined {
    return this.weaponInfoText;
  }
  
  setWeaponInfoText(text: Phaser.GameObjects.Text | undefined): void {
    this.weaponInfoText = text;
  }
  
  isMobile(): boolean {
    return this._isMobile; // メソッドで値を返す
  }
  
  /**
   * 衝突判定を設定
   */
  setupCollisions(otherPlayers: Player[] = []): void {
    // プレイヤーと壁の衝突
    this.scene.physics.add.collider(this.player, this.map.getWalls());
    
    // 他のプレイヤーに対する衝突設定
    otherPlayers.forEach(otherPlayer => {
      // 他プレイヤーと壁の衝突
      this.scene.physics.add.collider(otherPlayer, this.map.getWalls());
      
      // プレイヤー同士の衝突（オプション）
      this.scene.physics.add.collider(this.player, otherPlayer);
    });
    
    // プレイヤーの弾と壁の衝突
    const playerBullets = this.player.getWeapon()?.getBullets();
    if (playerBullets) {
      this.scene.physics.add.collider(
        playerBullets,
        this.map.getWalls(),
        (bullet: any, _wall: any) => {
          if (bullet.onHit) {
            bullet.onHit();
          }
        }
      );
      
      // 弾と他プレイヤーの衝突
      otherPlayers.forEach(otherPlayer => {
        this.scene.physics.add.overlap(
          playerBullets,
          otherPlayer,
          (bullet: any, player: any) => {
            if (bullet.onHit && player.takeDamage) {
              const damage = bullet.getDamage();
              player.takeDamage(damage);
              bullet.onHit();
              this.gameEffects.showHitEffect(player.x, player.y, damage);
            }
          }
        );
      });
    }
  }
  
  /**
   * リソースをクリーンアップ
   */
  destroy(): void {
    // UIを解放
    if (this.ui) {
      this.ui.destroy();
    }
    
    // SkillUIを解放
    if (this.skillUI) {
      this.skillUI.destroy();
    }
    
    // InputControllerを解放
    if (this.inputController) {
      this.inputController.destroy();
    }
    
    // ジョイスティックを解放
    if (this.moveJoystick) {
      this.moveJoystick.destroy();
    }
    
    if (this.skillJoystick) {
      this.skillJoystick.destroy();
    }
    
    // スキルクールダウン表示を解放
    if (this.skillCooldownDisplay) {
      this.skillCooldownDisplay.destroy();
    }
    
    // テキスト表示を解放
    if (this.skillInfoText) {
      this.skillInfoText.destroy();
    }
    
    if (this.weaponInfoText) {
      this.weaponInfoText.destroy();
    }
    
    // プレイヤーを解放
    if (this.player) {
      this.player.destroy();
    }
    
    // マップを解放
    if (this.map) {
      this.map.destroy();
    }
    
    // サウンドを停止
    this.soundManager.stopAll();
    
    // エフェクトを解放
    this.gameEffects.destroy();
  }
}
