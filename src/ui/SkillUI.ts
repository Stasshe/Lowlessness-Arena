import Phaser from 'phaser';
import { Player, SkillType } from '../objects/Player';

/**
 * スキルUI管理クラス
 * スキルクールダウンやスキル発動状態の表示を担当
 */
export class SkillUI {
  private scene: Phaser.Scene;
  private player: Player;
  private skillCooldownGraphics: Phaser.GameObjects.Graphics;
  private skillIcon?: Phaser.GameObjects.Image;
  private ultimateIcon?: Phaser.GameObjects.Image;
  private ultimateCooldownGraphics: Phaser.GameObjects.Graphics;
  private skillReadyText?: Phaser.GameObjects.Text;
  private ultimateReadyText?: Phaser.GameObjects.Text;
  private isSkillReady: boolean = false;
  private isUltimateReady: boolean = false;
  
  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    
    // クールダウン表示用のグラフィックス
    this.skillCooldownGraphics = scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(100);
    
    this.ultimateCooldownGraphics = scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(100);
    
    // スキルアイコンの作成
    this.createSkillIcons();
    
    // 更新イベントを設定
    scene.time.addEvent({
      delay: 100, // 100ms毎に更新
      callback: this.update,
      callbackScope: this,
      loop: true
    });
  }
  
  private createSkillIcons(): void {
    const skillType = this.player.getSkillType();
    // スキルアイコンの配置位置
    const skillX = this.scene.cameras.main.width - 100;
    const skillY = this.scene.cameras.main.height - 100;
    
    // スキルアイコン用の背景 - 使用していればそのまま残す。未使用であれば型を変更して使用、または削除
    this.scene.add.circle(skillX, skillY, 30, 0x000000, 0.6)
      .setScrollFactor(0)
      .setDepth(99);
    
    // スキルタイプに基づいたアイコンを表示
    switch (skillType) {
      case SkillType.SHIELD:
        this.skillIcon = this.scene.add.image(skillX, skillY, 'shield_icon')
          .setDisplaySize(40, 40)
          .setScrollFactor(0)
          .setDepth(100);
        break;
        
      case SkillType.DASH:
        this.skillIcon = this.scene.add.image(skillX, skillY, 'dash_icon')
          .setDisplaySize(40, 40)
          .setScrollFactor(0)
          .setDepth(100);
        break;
        
      case SkillType.SCOPE:
        this.skillIcon = this.scene.add.image(skillX, skillY, 'scope_icon')
          .setDisplaySize(40, 40)
          .setScrollFactor(0)
          .setDepth(100);
        break;
          
      // 他のスキルタイプについても同様に
      default:
        // デフォルトはスキルという文字を表示
        this.scene.add.text(skillX, skillY, 'S', {
          fontSize: '26px',
          color: '#ffffff'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(100);
        break;
    }
    
    // アルティメットアイコン
    const ultimateX = this.scene.cameras.main.width - 50;
    const ultimateY = 50;
    
    this.scene.add.circle(ultimateX, ultimateY, 25, 0x000000, 0.6)
      .setScrollFactor(0)
      .setDepth(99);
      
    // アルティメットを表す"U"を表示
    this.scene.add.text(ultimateX, ultimateY, 'U', {
      fontSize: '26px',
      color: '#ff8800',
      fontStyle: 'bold'
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(100);
    
    // スキルキー表示（PC用）
    if (this.scene.sys.game.device.os.desktop) {
      this.scene.add.text(skillX, skillY + 38, 'SPACE', {
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: { x: 4, y: 2 }
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);
      
      this.scene.add.text(ultimateX, ultimateY + 32, 'Q', {
        fontSize: '12px',
        color: '#ff8800',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: { x: 4, y: 2 }
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);
    }
    
    // スキル準備完了テキスト（初期は非表示）
    this.skillReadyText = this.scene.add.text(skillX, skillY, '準備完了!', {
      fontSize: '14px',
      color: '#00ffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 6, y: 3 }
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(101)
    .setVisible(false);
    
    // アルティメット準備完了テキスト（初期は非表示）
    this.ultimateReadyText = this.scene.add.text(ultimateX, ultimateY, '準備完了!', {
      fontSize: '14px',
      color: '#ff8800',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 6, y: 3 }
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(101)
    .setVisible(false);
  }
  
  update = (): void => {
    this.updateSkillCooldown();
    this.updateUltimateCooldown();
    
    // スキルの準備状態をチェック
    const isSkillReadyNow = this.player.canUseSkill();
    if (!this.isSkillReady && isSkillReadyNow) {
      this.showSkillReady();
    }
    this.isSkillReady = isSkillReadyNow;
    
    // アルティメットの準備状態をチェック
    const isUltimateReadyNow = this.player.canUseUltimate();
    if (!this.isUltimateReady && isUltimateReadyNow) {
      this.showUltimateReady();
    }
    this.isUltimateReady = isUltimateReadyNow;
  }
  
  private updateSkillCooldown(): void {
    // スキルのクールダウン情報を取得
    const skillCooldown = this.player.getSkillCooldownPercent();
    
    // グラフィックをクリア
    this.skillCooldownGraphics.clear();
    
    // スキルアイコンの位置
    const x = this.scene.cameras.main.width - 100;
    const y = this.scene.cameras.main.height - 100;
    
    // クールダウンが完了していない場合
    if (skillCooldown < 1) {
      // 灰色の円でクールダウン状態を表現
      this.skillCooldownGraphics.fillStyle(0x000000, 0.7);
      this.skillCooldownGraphics.slice(
        x, y, 30,
        0, // 開始角度
        Math.PI * 2 * (1 - skillCooldown), // 終了角度
        true // 反時計回り
      );
      this.skillCooldownGraphics.fillPath();
    }
  }
  
  private updateUltimateCooldown(): void {
    // アルティメットのクールダウン情報を取得
    const ultimateCooldown = this.player.getUltimateCooldownPercent();
    
    // グラフィックをクリア
    this.ultimateCooldownGraphics.clear();
    
    // アルティメットアイコンの位置
    const x = this.scene.cameras.main.width - 50;
    const y = 50;
    
    // クールダウンが完了していない場合
    if (ultimateCooldown < 1) {
      // 灰色の円でクールダウン状態を表現
      this.ultimateCooldownGraphics.fillStyle(0x000000, 0.7);
      this.ultimateCooldownGraphics.slice(
        x, y, 25,
        0, // 開始角度
        Math.PI * 2 * (1 - ultimateCooldown), // 終了角度
        true // 反時計回り
      );
      this.ultimateCooldownGraphics.fillPath();
    } else {
      // クールダウン完了時は輝くエフェクト
      this.ultimateCooldownGraphics.lineStyle(2, 0xff8800, 0.8 + Math.sin(this.scene.time.now / 200) * 0.2);
      this.ultimateCooldownGraphics.strokeCircle(x, y, 28);
    }
  }
  
  private showSkillReady(): void {
    if (!this.skillReadyText) return;
    
    // スキル準備完了テキストを表示
    this.skillReadyText.setVisible(true);
    
    // パルスアニメーション
    this.scene.tweens.add({
      targets: this.skillReadyText,
      scaleX: { from: 0.8, to: 1.2 },
      scaleY: { from: 0.8, to: 1.2 },
      alpha: { from: 1, to: 0 },
      duration: 1000,
      onComplete: () => {
        if (this.skillReadyText) {
          this.skillReadyText.setVisible(false);
          this.skillReadyText.setScale(1);
          this.skillReadyText.setAlpha(1);
        }
      }
    });
    
    // アイコンを点滅
    if (this.skillIcon) {
      this.scene.tweens.add({
        targets: this.skillIcon,
        alpha: { from: 1, to: 0.5 },
        yoyo: true,
        repeat: 3,
        duration: 200
      });
    }
  }
  
  private showUltimateReady(): void {
    if (!this.ultimateReadyText) return;
    
    // アルティメット準備完了テキストを表示
    this.ultimateReadyText.setVisible(true);
    
    // パルスアニメーション
    this.scene.tweens.add({
      targets: this.ultimateReadyText,
      scaleX: { from: 0.8, to: 1.2 },
      scaleY: { from: 0.8, to: 1.2 },
      alpha: { from: 1, to: 0 },
      duration: 1000,
      onComplete: () => {
        if (this.ultimateReadyText) {
          this.ultimateReadyText.setVisible(false);
          this.ultimateReadyText.setScale(1);
          this.ultimateReadyText.setAlpha(1);
        }
      }
    });
    
    // アイコンを点滅
    if (this.ultimateIcon) {
      this.scene.tweens.add({
        targets: this.ultimateIcon,
        alpha: { from: 1, to: 0.5 },
        yoyo: true,
        repeat: 3,
        duration: 200
      });
    }
  }
  
  destroy(): void {
    if (this.skillCooldownGraphics) this.skillCooldownGraphics.destroy();
    if (this.ultimateCooldownGraphics) this.ultimateCooldownGraphics.destroy();
    if (this.skillIcon) this.skillIcon.destroy();
    if (this.ultimateIcon) this.ultimateIcon.destroy();
    if (this.skillReadyText) this.skillReadyText.destroy();
    if (this.ultimateReadyText) this.ultimateReadyText.destroy();
  }
}
