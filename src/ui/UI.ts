import Phaser from 'phaser';
import { Player, PlayerState } from '../objects/Player';
import { GameConfig } from '../config/GameConfig';

/**
 * ゲーム内のUI要素を管理するクラス
 */
export class UI {
  private scene: Phaser.Scene;
  private player: Player;
  private healthBar: Phaser.GameObjects.Graphics;
  private skillBar: Phaser.GameObjects.Graphics;
  private ultimateBar: Phaser.GameObjects.Graphics;
  private scoreText: Phaser.GameObjects.Text;
  private timerText: Phaser.GameObjects.Text;
  private infoText: Phaser.GameObjects.Text;
  private notificationText: Phaser.GameObjects.Text;
  private debugText?: Phaser.GameObjects.Text;
  private fpsText?: Phaser.GameObjects.Text;
  private score: number = 0;
  private gameTime: number = 0;
  private startTime: number = 0;
  private uiElements: Phaser.GameObjects.GameObject[] = [];
  
  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    
    // UI要素の作成
    this.createUI();
    
    // FPS表示（オプション）
    if (GameConfig.options.showFPS) {
      this.fpsText = this.scene.add.text(
        10, 10, 'FPS: 0', 
        { fontSize: '16px', color: '#ffff00' }
      )
      .setScrollFactor(0)
      .setDepth(1000);
      
      this.uiElements.push(this.fpsText);
    }
    
    // ゲーム開始時間を記録
    this.startTime = Date.now();
  }
  
  /**
   * UI要素の作成
   */
  private createUI(): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // ヘルスバー
    this.healthBar = this.scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(100);
      
    this.drawHealthBar();
    this.uiElements.push(this.healthBar);
    
    // スキルクールダウンバー
    this.skillBar = this.scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(100);
      
    this.drawSkillBar();
    this.uiElements.push(this.skillBar);
    
    // アルティメットゲージ
    this.ultimateBar = this.scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(100);
      
    this.drawUltimateBar();
    this.uiElements.push(this.ultimateBar);
    
    // スコア表示
    this.scoreText = this.scene.add.text(
      width - 20, 20, 'スコア: 0', 
      { 
        fontSize: '18px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    )
    .setOrigin(1, 0)
    .setScrollFactor(0)
    .setDepth(100);
    
    this.uiElements.push(this.scoreText);
    
    // タイマー表示
    this.timerText = this.scene.add.text(
      width / 2, 20, '00:00', 
      { 
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }
    )
    .setOrigin(0.5, 0)
    .setScrollFactor(0)
    .setDepth(100);
    
    this.uiElements.push(this.timerText);
    
    // プレイヤー情報表示
    this.infoText = this.scene.add.text(
      width / 2, height - 40, '', 
      { 
        fontSize: '18px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    )
    .setOrigin(0.5, 0)
    .setScrollFactor(0)
    .setDepth(100);
    
    this.uiElements.push(this.infoText);
    
    // 通知メッセージ表示用
    this.notificationText = this.scene.add.text(
      width / 2, height / 2 - 100, '', 
      { 
        fontSize: '32px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
      }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(200);
    
    this.uiElements.push(this.notificationText);
    
    // デバッグ情報（オプション）
    if (GameConfig.options.debug) {
      this.debugText = this.scene.add.text(
        10, height - 20, '', 
        { fontSize: '12px', color: '#00ff00' }
      )
      .setScrollFactor(0)
      .setDepth(100);
      
      this.uiElements.push(this.debugText);
    }
  }
  
  /**
   * ヘルスバーの描画
   */
  private drawHealthBar(): void {
    const width = 200;
    const height = 20;
    const x = 10;
    const y = 40;
    const borderWidth = 2;
    
    // 背景（黒）
    this.healthBar.fillStyle(0x000000, 0.8);
    this.healthBar.fillRect(x - borderWidth, y - borderWidth, 
                           width + borderWidth * 2, height + borderWidth * 2);
    
    // 体力の割合
    const ratio = this.player.getHealth() / this.player.getMaxHealth();
    
    // 体力ゲージの色（赤→黄→緑）
    let color = 0xff0000;
    if (ratio > 0.7) color = 0x00ff00;
    else if (ratio > 0.3) color = 0xffff00;
    
    // 体力ゲージ
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(x, y, width * ratio, height);
    
    // HP値をテキストで表示
    const hpText = `HP: ${Math.ceil(this.player.getHealth())} / ${this.player.getMaxHealth()}`;
    
    // 既存のテキストがあれば更新、なければ作成
    if (!this.healthBar.getData('hpText')) {
      const text = this.scene.add.text(x + 5, y + 2, hpText, {
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setScrollFactor(0).setDepth(100);
      
      this.healthBar.setData('hpText', text);
      this.uiElements.push(text);
    } else {
      this.healthBar.getData('hpText').setText(hpText);
    }
  }
  
  /**
   * スキルバーの描画
   */
  private drawSkillBar(): void {
    const width = 150;
    const height = 12;
    const x = 10;
    const y = 70;
    const borderWidth = 1;
    
    // 背景（黒）
    this.skillBar.fillStyle(0x000000, 0.8);
    this.skillBar.fillRect(x - borderWidth, y - borderWidth, 
                          width + borderWidth * 2, height + borderWidth * 2);
    
    // スキルのクールダウン割合
    const ratio = this.player.getSkillCooldownPercent();
    
    // スキルゲージ
    this.skillBar.fillStyle(0x00ffff, 1);
    this.skillBar.fillRect(x, y, width * ratio, height);
    
    // ラベル
    const skillText = `スキル: ${ratio >= 1 ? '準備完了' : `${Math.floor(ratio * 100)}%`}`;
    
    // 既存のテキストがあれば更新、なければ作成
    if (!this.skillBar.getData('skillText')) {
      const text = this.scene.add.text(x + 5, y - 15, skillText, {
        fontSize: '12px',
        color: '#00ffff',
        stroke: '#000000',
        strokeThickness: 1
      }).setScrollFactor(0).setDepth(100);
      
      this.skillBar.setData('skillText', text);
      this.uiElements.push(text);
    } else {
      this.skillBar.getData('skillText').setText(skillText);
    }
  }
  
  /**
   * アルティメットバーの描画
   */
  private drawUltimateBar(): void {
    const width = 150;
    const height = 12;
    const x = 10;
    const y = 95;
    const borderWidth = 1;
    
    // 背景（黒）
    this.ultimateBar.fillStyle(0x000000, 0.8);
    this.ultimateBar.fillRect(x - borderWidth, y - borderWidth, 
                             width + borderWidth * 2, height + borderWidth * 2);
    
    // アルティメットのクールダウン割合
    const ratio = this.player.getUltimateCooldownPercent();
    
    // アルティメットゲージ
    this.ultimateBar.fillStyle(0xff6600, 1);
    this.ultimateBar.fillRect(x, y, width * ratio, height);
    
    // ラベル
    const ultimateText = `アルティメット: ${ratio >= 1 ? '準備完了' : `${Math.floor(ratio * 100)}%`}`;
    
    // 既存のテキストがあれば更新、なければ作成
    if (!this.ultimateBar.getData('ultimateText')) {
      const text = this.scene.add.text(x + 5, y - 15, ultimateText, {
        fontSize: '12px',
        color: '#ff6600',
        stroke: '#000000',
        strokeThickness: 1
      }).setScrollFactor(0).setDepth(100);
      
      this.ultimateBar.setData('ultimateText', text);
      this.uiElements.push(text);
    } else {
      this.ultimateBar.getData('ultimateText').setText(ultimateText);
    }
  }
  
  /**
   * UIの更新
   */
  update(): void {
    // 体力バーの更新
    this.updateHealthBar();
    
    // スキルとアルティメットゲージの更新
    this.updateSkillBar();
    this.updateUltimateBar();
    
    // 時間の更新
    this.updateTimer();
    
    // スコアの更新
    this.updateScore();
    
    // プレイヤー情報の更新
    this.updatePlayerInfo();
    
    // デバッグ情報の更新
    if (this.debugText) {
      this.updateDebugInfo();
    }
  }
  
  /**
   * ヘルスバーの更新
   */
  private updateHealthBar(): void {
    // 既存の描画をクリア
    this.healthBar.clear();
    
    // 再描画
    this.drawHealthBar();
  }
  
  /**
   * スキルバーの更新
   */
  private updateSkillBar(): void {
    // 既存の描画をクリア
    this.skillBar.clear();
    
    // 再描画
    this.drawSkillBar();
  }
  
  /**
   * アルティメットバーの更新
   */
  private updateUltimateBar(): void {
    // 既存の描画をクリア
    this.ultimateBar.clear();
    
    // 再描画
    this.drawUltimateBar();
  }
  
  /**
   * タイマーの更新
   */
  private updateTimer(): void {
    // 経過時間を計算
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    this.gameTime = elapsed;
    
    // 分:秒の形式でフォーマット
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    this.timerText.setText(formattedTime);
  }
  
  /**
   * スコア表示の更新
   */
  private updateScore(): void {
    this.scoreText.setText(`スコア: ${this.score}`);
  }
  
  /**
   * プレイヤー情報の更新
   */
  private updatePlayerInfo(): void {
    // プレイヤーの状態に応じた表示
    let infoString = '';
    
    try {
      // 状態によって表示を変更
      if (this.player.getState() === PlayerState.DEAD) {
        infoString = '復活中...';
      } else if (this.isInBush()) {
        infoString = '隠れている';
      }
      
      this.infoText.setText(infoString);
    } catch (e) {
      console.warn('プレイヤー情報の更新に失敗:', e);
      this.infoText.setText('');
    }
  }

  // isInBush関数をPlayer.tsのisInBushプロパティにアクセスするように修正
  private isInBush(): boolean {
    return this.player.isInBush;
  }
  
  /**
   * デバッグ情報の更新
   */
  private updateDebugInfo(): void {
    if (!this.debugText) return;
    
    // FPSなどのデバッグ情報
    const fps = Math.round(this.scene.game.loop.actualFps);
    
    let debugString = `FPS: ${fps} | Pos: ${Math.round(this.player.x)}, ${Math.round(this.player.y)}`;
    
    // Performanceオブジェクトをチェックして安全に使用
    if (typeof performance !== 'undefined') {
      // memory プロパティがあるかチェック (Chrome特有の機能)
      if ((performance as any).memory) {
        const memoryMB = Math.round((performance as any).memory.usedJSHeapSize / 1048576);
        debugString += ` | Memory: ${memoryMB} MB`;
      }
    }
    
    this.debugText.setText(debugString);
  }
  
  /**
   * スコアを加算
   */
  addScore(points: number): void {
    this.score += points;
    this.updateScore();
    
    // スコア加算表示のエフェクト
    if (points > 0) {
      const pointsText = this.scene.add.text(
        this.scene.cameras.main.width - 100,
        60,
        `+${points}`,
        { fontSize: '24px', color: '#ffff00' }
      )
      .setScrollFactor(0)
      .setDepth(100);
      
      // アニメーション
      this.scene.tweens.add({
        targets: pointsText,
        y: 40,
        alpha: { from: 1, to: 0 },
        duration: 1000,
        onComplete: () => pointsText.destroy()
      });
    }
  }
  
  /**
   * 通知メッセージを表示
   */
  showNotification(message: string, duration: number = 2000): void {
    this.notificationText.setText(message);
    this.notificationText.setAlpha(0);
    
    // フェードイン→フェードアウトのアニメーション
    this.scene.tweens.add({
      targets: this.notificationText,
      alpha: 1,
      y: this.scene.cameras.main.height / 3,
      duration: 300,
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.notificationText,
          alpha: 0,
          delay: duration,
          duration: 300,
          onComplete: () => {
            this.notificationText.setText('');
          }
        });
      }
    });
  }
  
  /**
   * ゲームオーバー表示
   */
  showGameOver(message: string = 'ゲームオーバー'): void {
    // 大きなゲームオーバー表示
    const gameOverText = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      message,
      {
        fontSize: '64px',
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center'
      }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(200)
    .setAlpha(0);
    
    this.uiElements.push(gameOverText);
    
    // アニメーション
    this.scene.tweens.add({
      targets: gameOverText,
      alpha: 1,
      scale: { from: 1.5, to: 1 },
      duration: 500,
      ease: 'Power2'
    });
    
    // 結果表示
    const resultText = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2 + 80,
      `最終スコア: ${this.score}\n生存時間: ${this.formatTime(this.gameTime)}`,
      {
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
      }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(200)
    .setAlpha(0);
    
    this.uiElements.push(resultText);
    
    // アニメーション（遅延させて表示）
    this.scene.tweens.add({
      targets: resultText,
      alpha: 1,
      delay: 500,
      duration: 500
    });
  }
  
  /**
   * 時間フォーマット（秒→分:秒）
   */
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  /**
   * リソース解放
   */
  destroy(): void {
    // グラフィックス要素の削除
    this.healthBar.clear();
    
    // HP テキスト削除
    if (this.healthBar.getData('hpText')) {
      this.healthBar.getData('hpText').destroy();
    }
    
    // スキルテキスト削除
    if (this.skillBar.getData('skillText')) {
      this.skillBar.getData('skillText').destroy();
    }
    
    // アルティメットテキスト削除
    if (this.ultimateBar.getData('ultimateText')) {
      this.ultimateBar.getData('ultimateText').destroy();
    }
    
    // 全UI要素の削除
    this.uiElements.forEach(element => {
      if (element && element.active && element.scene) {
        element.destroy();
      }
    });
    
    this.uiElements = [];
  }
  
  /**
   * ゲッター
   */
  getScore(): number {
    return this.score;
  }
  
  getGameTime(): number {
    return this.gameTime;
  }
}
