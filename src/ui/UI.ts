import Phaser from 'phaser';
import { Player } from '../objects/Player';

export class UI {
  private scene: Phaser.Scene;
  private player: Player;
  private healthBar: Phaser.GameObjects.Graphics;
  private skillBar: Phaser.GameObjects.Graphics;
  private ultimateBar: Phaser.GameObjects.Graphics;
  private scoreText: Phaser.GameObjects.Text;
  private elements: Phaser.GameObjects.GameObject[] = [];
  
  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    
    // ヘルスバー
    this.healthBar = scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(100);
    this.elements.push(this.healthBar);
    
    // スキルバー
    this.skillBar = scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(100);
    this.elements.push(this.skillBar);
    
    // アルティメットバー
    this.ultimateBar = scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(100);
    this.elements.push(this.ultimateBar);
    
    // スコアテキスト
    this.scoreText = scene.add.text(10, 10, 'スコア: 0', { 
      fontSize: '18px', 
      color: '#ffffff' 
    })
    .setScrollFactor(0)
    .setDepth(100);
    this.elements.push(this.scoreText);
  }
  
  update(): void {
    this.updateHealthBar();
    this.updateSkillBar();
    this.updateUltimateBar();
  }
  
  private updateHealthBar(): void {
    this.healthBar.clear();
    
    // 画面左上にヘルスバーを表示
    const barX = 10;
    const barY = 40;
    const width = 200;
    const height = 15;
    const borderWidth = 2;
    
    // 背景（黒）
    this.healthBar.fillStyle(0x000000, 0.8);
    this.healthBar.fillRect(barX - borderWidth, barY - borderWidth, width + borderWidth * 2, height + borderWidth * 2);
    
    // HPの割合に応じて色を変更
    const ratio = this.player.getHealth() / this.player.getMaxHealth();
    let color = 0xff0000; // 赤
    
    if (ratio > 0.7) {
      color = 0x00ff00; // 緑
    } else if (ratio > 0.3) {
      color = 0xffff00; // 黄
    }
    
    // 内側（HP）
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(barX, barY, width * ratio, height);
    
    // HP値を表示
    this.healthBar.fillStyle(0xffffff, 1);
    this.healthBar.fillRect(barX + width * ratio - 1, barY, 2, height);
  }
  
  private updateSkillBar(): void {
    this.skillBar.clear();
    
    // スキルゲージの表示
    const barX = 10;
    const barY = 65;
    const width = 150;
    const height = 10;
    
    // 背景（グレー）
    this.skillBar.fillStyle(0x444444, 0.8);
    this.skillBar.fillRect(barX, barY, width, height);
    
    // スキルの準備状態に応じて色を変更
    const cooldownPercent = this.player.getSkillCooldownPercent();
    const color = cooldownPercent >= 1 ? 0x00ffff : 0x888888; // スキル準備完了なら青、そうでなければグレー
    
    // スキルゲージ
    this.skillBar.fillStyle(color, 1);
    this.skillBar.fillRect(barX, barY, width * cooldownPercent, height);
    
    // ラベル
    this.skillBar.lineStyle(1, 0xffffff, 1);
    this.skillBar.strokeRect(barX, barY, width, height);
  }
  
  private updateUltimateBar(): void {
    this.ultimateBar.clear();
    
    // アルティメットゲージの表示
    const barX = 10;
    const barY = 85;
    const width = 150;
    const height = 10;
    
    // 背景（グレー）
    this.ultimateBar.fillStyle(0x444444, 0.8);
    this.ultimateBar.fillRect(barX, barY, width, height);
    
    // アルティメットの準備状態に応じて色を変更
    const cooldownPercent = this.player.getUltimateCooldownPercent();
    const color = cooldownPercent >= 1 ? 0xff6600 : 0x888888; // アルティメット準備完了ならオレンジ、そうでなければグレー
    
    // アルティメットゲージ
    this.ultimateBar.fillStyle(color, 1);
    this.ultimateBar.fillRect(barX, barY, width * cooldownPercent, height);
    
    // ラベル
    this.ultimateBar.lineStyle(1, 0xffffff, 1);
    this.ultimateBar.strokeRect(barX, barY, width, height);
  }
  
  // リソース解放
  destroy(): void {
    this.elements.forEach(element => {
      if (element) element.destroy();
    });
    this.elements = [];
  }
}
