import Phaser from 'phaser';
import { Player, PlayerState } from '../objects/Player';
import { CharacterManager } from '../characters/CharacterManager';
import { GameConfig } from '../config/GameConfig';

export class UIManager {
  private scene: Phaser.Scene;
  private player: Player;
  private characterManager: CharacterManager;
  private healthBar: Phaser.GameObjects.Graphics;
  private skillCooldownBar: Phaser.GameObjects.Graphics;
  private ultimateCooldownBar: Phaser.GameObjects.Graphics;
  private statusText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private timerText: Phaser.GameObjects.Text;
  private messageText: Phaser.GameObjects.Text;
  private activeSkillButton: string = 'attack'; // 'attack', 'skill', 'ultimate'
  private skillButtons: {[key: string]: Phaser.GameObjects.Image} = {};
  private skillButtonTints = {
    normal: 0xffffff,
    active: 0x00ffff,
    cooldown: 0x666666
  };
  private characterNameText: Phaser.GameObjects.Text;
  
  constructor(scene: Phaser.Scene, player: Player, characterManager: CharacterManager) {
    this.scene = scene;
    this.player = player;
    this.characterManager = characterManager;
    
    // ヘルスバー
    this.healthBar = scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(20);
    
    // スキルクールダウンバー
    this.skillCooldownBar = scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(20);
    
    // アルティメットクールダウンバー
    this.ultimateCooldownBar = scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(20);
    
    // ステータステキスト
    this.statusText = scene.add.text(16, 16, '', {
      font: '18px Arial',
      color: '#ffffff'
    })
    .setScrollFactor(0)
    .setDepth(20);
    
    // スコアテキスト
    this.scoreText = scene.add.text(
      GameConfig.WIDTH - 16, 16, '0', {
      font: '24px Arial',
      color: '#ffffff'
    })
    .setOrigin(1, 0)
    .setScrollFactor(0)
    .setDepth(20);
    
    // タイマーテキスト
    this.timerText = scene.add.text(
      GameConfig.WIDTH / 2, 16, '00:00', {
      font: '24px Arial',
      color: '#ffffff'
    })
    .setOrigin(0.5, 0)
    .setScrollFactor(0)
    .setDepth(20);
    
    // メッセージテキスト（中央）
    this.messageText = scene.add.text(
      GameConfig.WIDTH / 2, GameConfig.HEIGHT / 2, '', {
      font: '32px Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(30)
    .setVisible(false);
    
    // キャラクター名テキスト（プレイヤー名の表示）
    this.characterNameText = scene.add.text(
      16, GameConfig.HEIGHT - 40, this.getCharacterDisplayName(), {
      font: '18px Arial',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 8, y: 4 }
    })
    .setScrollFactor(0)
    .setDepth(20);
    
    // スキルボタンの初期化
    this.initializeSkillButtons();
    
    // 最初の更新
    this.updateHealthBar();
    this.updateCooldownBars();
    this.updateStatusText();
  }
  
  /**
   * スキルボタンの初期化
   */
  private initializeSkillButtons(): void {
    // アタックボタン
    this.skillButtons.attack = this.scene.add.image(GameConfig.WIDTH - 50, GameConfig.HEIGHT - 150, 'attack_button')
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(20)
      .setTint(this.skillButtonTints.active)
      .setScale(0.7);
    
    // スキルボタン
    this.skillButtons.skill = this.scene.add.image(GameConfig.WIDTH - 120, GameConfig.HEIGHT - 150, 'skill_button')
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(20)
      .setTint(this.skillButtonTints.normal)
      .setScale(0.7);
    
    // アルティメットボタン
    this.skillButtons.ultimate = this.scene.add.image(GameConfig.WIDTH - 190, GameConfig.HEIGHT - 150, 'ultimate_button')
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(20)
      .setTint(this.skillButtonTints.normal)
      .setScale(0.7);
    
    // ボタンクリックイベント
    this.skillButtons.attack.on('pointerdown', () => this.setActiveSkillButton('attack'));
    this.skillButtons.skill.on('pointerdown', () => this.setActiveSkillButton('skill'));
    this.skillButtons.ultimate.on('pointerdown', () => this.setActiveSkillButton('ultimate'));
  }
  
  /**
   * アクティブなスキルボタンを設定
   */
  setActiveSkillButton(buttonType: string): void {
    this.activeSkillButton = buttonType;
    
    // ボタンの見た目を更新
    Object.keys(this.skillButtons).forEach(key => {
      if (key === buttonType) {
        this.skillButtons[key].setTint(this.skillButtonTints.active);
      } else {
        this.skillButtons[key].setTint(this.skillButtonTints.normal);
      }
    });
    
    // クールダウン中のボタンは強調表示しない
    if (buttonType === 'skill' && !this.player.canUseSkill()) {
      this.skillButtons.skill.setTint(this.skillButtonTints.cooldown);
    } else if (buttonType === 'ultimate' && !this.player.canUseUltimate()) {
      this.skillButtons.ultimate.setTint(this.skillButtonTints.cooldown);
    }
  }
  
  /**
   * 現在のアクティブスキルボタンを取得
   */
  getActiveSkillButton(): string {
    return this.activeSkillButton;
  }
  
  /**
   * キャラクター名の表示用テキストを取得
   */
  private getCharacterDisplayName(): string {
    const character = this.characterManager.getCharacter();
    if (character) {
      return character.getName();
    }
    return 'プレイヤー';
  }
  
  /**
   * UIの更新
   */
  update(time: number, delta: number): void {
    // HPバー更新
    this.updateHealthBar();
    
    // クールダウンバー更新
    this.updateCooldownBars();
    
    // スキルボタンの状態更新
    this.updateSkillButtonStates();
    
    // ステータステキスト更新
    this.updateStatusText();
    
    // キャラクター名の更新
    this.characterNameText.setText(this.getCharacterDisplayName());
    
    // タイマー更新
    this.updateTimer(time);
  }
  
  /**
   * ヘルスバー更新
   */
  private updateHealthBar(): void {
    this.healthBar.clear();
    
    const barX = 20;
    const barY = 40;
    const barWidth = 200;
    const barHeight = 20;
    
    // HPの割合を計算
    const healthRatio = this.player.getHealth() / this.player.getMaxHealth();
    
    // 背景（黒）
    this.healthBar.fillStyle(0x000000, 0.8);
    this.healthBar.fillRect(barX, barY, barWidth, barHeight);
    
    // HPの割合に応じて色を変更
    let color = 0xff0000; // 赤
    if (healthRatio > 0.7) {
      color = 0x00ff00; // 緑
    } else if (healthRatio > 0.3) {
      color = 0xffff00; // 黄
    }
    
    // HP（色付き）
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(barX, barY, barWidth * healthRatio, barHeight);
    
    // 枠線
    this.healthBar.lineStyle(2, 0xffffff, 1);
    this.healthBar.strokeRect(barX, barY, barWidth, barHeight);
    
    // HP値テキスト
    const healthText = `${Math.floor(this.player.getHealth())}/${this.player.getMaxHealth()}`;
    // テキストがあれば更新、なければ作成
    if (!this.healthBar.getData('healthText')) {
      const text = this.scene.add.text(barX + barWidth / 2, barY + barHeight / 2, healthText, {
        font: '14px Arial',
        color: '#ffffff'
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(21);
      
      this.healthBar.setData('healthText', text);
    } else {
      this.healthBar.getData('healthText').setText(healthText);
    }
  }
  
  /**
   * クールダウンバー更新
   */
  private updateCooldownBars(): void {
    // スキルクールダウンバーの更新
    this.updateSkillCooldownBar();
    
    // アルティメットクールダウンバーの更新
    this.updateUltimateCooldownBar();
  }
  
  /**
   * スキルクールダウンバー更新
   */
  private updateSkillCooldownBar(): void {
    this.skillCooldownBar.clear();
    
    const barX = GameConfig.WIDTH - 140;
    const barY = GameConfig.HEIGHT - 100;
    const barWidth = 100;
    const barHeight = 10;
    
    // クールダウン進行度合い
    const cooldownRatio = this.player.getSkillCooldownPercent();
    
    // 背景（黒）
    this.skillCooldownBar.fillStyle(0x000000, 0.6);
    this.skillCooldownBar.fillRect(barX, barY, barWidth, barHeight);
    
    // クールダウン（水色）
    this.skillCooldownBar.fillStyle(0x00ffff, 0.8);
    this.skillCooldownBar.fillRect(barX, barY, barWidth * cooldownRatio, barHeight);
    
    // 枠線
    this.skillCooldownBar.lineStyle(1, 0xffffff, 0.5);
    this.skillCooldownBar.strokeRect(barX, barY, barWidth, barHeight);
    
    // スキル準備完了時に点滅エフェクトを表示
    if (cooldownRatio >= 1.0) {
      this.updateSkillButtonStates();
    }
  }
  
  /**
   * アルティメットクールダウンバー更新
   */
  private updateUltimateCooldownBar(): void {
    this.ultimateCooldownBar.clear();
    
    const barX = GameConfig.WIDTH - 210;
    const barY = GameConfig.HEIGHT - 100;
    const barWidth = 60;
    const barHeight = 10;
    
    // クールダウン進行度合い
    const cooldownRatio = this.player.getUltimateCooldownPercent();
    
    // 背景（黒）
    this.ultimateCooldownBar.fillStyle(0x000000, 0.6);
    this.ultimateCooldownBar.fillRect(barX, barY, barWidth, barHeight);
    
    // クールダウン（赤橙）
    this.ultimateCooldownBar.fillStyle(0xff6600, 0.8);
    this.ultimateCooldownBar.fillRect(barX, barY, barWidth * cooldownRatio, barHeight);
    
    // 枠線
    this.ultimateCooldownBar.lineStyle(1, 0xffffff, 0.5);
    this.ultimateCooldownBar.strokeRect(barX, barY, barWidth, barHeight);
    
    // アルティメット準備完了時に点滅エフェクトを表示
    if (cooldownRatio >= 1.0) {
      this.updateSkillButtonStates();
    }
  }
  
  /**
   * スキルボタンの状態更新
   */
  private updateSkillButtonStates(): void {
    // スキルボタンのクールダウン表示
    if (this.player.canUseSkill()) {
      if (this.activeSkillButton === 'skill') {
        this.skillButtons.skill.setTint(this.skillButtonTints.active);
      } else {
        this.skillButtons.skill.setTint(this.skillButtonTints.normal);
      }
    } else {
      this.skillButtons.skill.setTint(this.skillButtonTints.cooldown);
    }
    
    // アルティメットボタンのクールダウン表示
    if (this.player.canUseUltimate()) {
      if (this.activeSkillButton === 'ultimate') {
        this.skillButtons.ultimate.setTint(this.skillButtonTints.active);
      } else {
        this.skillButtons.ultimate.setTint(this.skillButtonTints.normal);
      }
    } else {
      this.skillButtons.ultimate.setTint(this.skillButtonTints.cooldown);
    }
  }
  
  /**
   * ステータステキスト更新
   */
  private updateStatusText(): void {
    const stateText = this.getPlayerStateText();
    const character = this.characterManager.getCharacter();
    let characterInfo = '';
    
    if (character) {
      characterInfo = `${character.getSkillName()}\n${character.getUltimateName()}`;
    }
    
    this.statusText.setText(`${stateText}\n${characterInfo}`);
  }
  
  /**
   * プレイヤーの状態テキストを取得
   */
  private getPlayerStateText(): string {
    switch (this.player.getState()) {
      case PlayerState.IDLE:
        return '待機中';
      case PlayerState.MOVING:
        return '移動中';
      case PlayerState.ATTACKING:
        return '攻撃中';
      case PlayerState.RELOADING:
        return 'リロード中';
      case PlayerState.USING_SKILL:
        return 'スキル使用中';
      case PlayerState.DEAD:
        return '死亡';
      default:
        return '';
    }
  }
  
  /**
   * タイマー更新
   */
  private updateTimer(time: number): void {
    const gameTime = Math.floor(time / 1000);
    const minutes = Math.floor(gameTime / 60);
    const seconds = gameTime % 60;
    
    this.timerText.setText(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  }
  
  /**
   * スコア更新
   */
  setScore(score: number): void {
    this.scoreText.setText(`${score}`);
  }
  
  /**
   * メッセージ表示
   */
  showMessage(message: string, duration: number = 2000): void {
    this.messageText.setText(message);
    this.messageText.setVisible(true);
    
    // 既存のタイマーがあればキャンセル
    if (this.messageText.getData('timer')) {
      this.messageText.getData('timer').remove();
    }
    
    // 指定時間後にメッセージを非表示にする
    const timer = this.scene.time.delayedCall(duration, () => {
      this.messageText.setVisible(false);
    });
    
    this.messageText.setData('timer', timer);
  }
  
  /**
   * リソース解放
   */
  destroy(): void {
    // 各UIコンポーネントを破棄
    this.healthBar.destroy();
    this.skillCooldownBar.destroy();
    this.ultimateCooldownBar.destroy();
    this.statusText.destroy();
    this.scoreText.destroy();
    this.timerText.destroy();
    this.messageText.destroy();
    this.characterNameText.destroy();
    
    // ヘルステキストの破棄
    if (this.healthBar.getData('healthText')) {
      this.healthBar.getData('healthText').destroy();
    }
    
    // スキルボタンの破棄
    Object.values(this.skillButtons).forEach(button => button.destroy());
  }
}
