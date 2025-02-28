import Phaser from 'phaser';
import { SkillType } from '../objects/Player';

/**
 * ゲーム内の視覚効果と演出を管理するためのユーティリティクラス
 * トレーニングモードとオンラインモードで共通して使用
 */
export class GameEffects {
  private scene: Phaser.Scene;
  private effects: Phaser.GameObjects.GameObject[] = [];
  private readonly particleTint = {
    explosion: 0xff7700,
    fire: 0xff4400,
    heal: 0x00ff00,
    shield: 0x00ffff,
    dash: 0x88ff88,
    sniper: 0x0000ff,
    smoke: 0x333333,
    blood: 0xff0000
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * スキル効果を表示
   */
  showSkillEffect(type: SkillType, x: number, y: number): void {
    this.clearEffects(); // 既存のエフェクトをクリア
    
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
        this.showExplosionEffect(x, y, 100, 1.0);
        break;
    }
  }

  /**
   * シールドエフェクト
   */
  private showShieldEffect(x: number, y: number): void {
    // シールドを表示（プレイヤーの周りに青い円）
    const shield = this.scene.add.circle(x, y, 45, this.particleTint.shield, 0.3)
      .setStrokeStyle(3, this.particleTint.shield, 1)
      .setDepth(50);
    
    const shieldHighlight = this.scene.add.circle(x, y, 50, this.particleTint.shield, 0)
      .setStrokeStyle(1, this.particleTint.shield, 0.5)
      .setDepth(50);
    
    // エフェクトのアニメーション（拡大→元のサイズに）
    this.scene.tweens.add({
      targets: [shield, shieldHighlight],
      scale: { from: 0, to: 1 },
      alpha: { from: 0.8, to: 0.3 },
      duration: 500,
      ease: 'Back.easeOut'
    });
    
    // シールドパーティクル
    const particles = this.scene.add.particles(x, y, 'default', {
      speed: 100,
      scale: { start: 0.2, end: 0 },
      blendMode: 'ADD',
      tint: this.particleTint.shield,
      lifespan: 1000,
      quantity: 10,
      frequency: 100
    })
    .setDepth(50);
    
    this.effects.push(shield, shieldHighlight, particles);
    
    // エフェクトを一定時間後に削除
    this.scene.time.delayedCall(2000, () => {
      this.clearEffects();
    });
  }

  /**
   * ダッシュエフェクト
   */
  private showDashEffect(x: number, y: number): void {
    // ダッシュの軌跡エフェクト
    const trail = this.scene.add.particles(x, y, 'default', {
      speed: { min: 10, max: 50 },
      scale: { start: 0.3, end: 0 },
      blendMode: 'ADD',
      tint: this.particleTint.dash,
      lifespan: 500,
      quantity: 20
    })
    .setDepth(10);
    
    this.effects.push(trail);
    
    // エフェクトを一定時間後に削除
    this.scene.time.delayedCall(800, () => {
      this.clearEffects();
    });
  }

  /**
   * スコープ（スナイパー用照準）エフェクト
   */
  private showScopeEffect(x: number, y: number): void {
    // スコープのエフェクト（照準円）
    const outerCircle = this.scene.add.circle(x, y, 55, this.particleTint.sniper, 0)
      .setStrokeStyle(2, this.particleTint.sniper, 0.5)
      .setDepth(50);
    
    const innerCircle = this.scene.add.circle(x, y, 30, this.particleTint.sniper, 0)
      .setStrokeStyle(1, this.particleTint.sniper, 0.7)
      .setDepth(50);
    
    // 十字線
    const crosshair = this.scene.add.graphics()
      .setPosition(x, y)
      .setDepth(50);
    
    crosshair.lineStyle(1, this.particleTint.sniper, 0.7);
    crosshair.beginPath();
    crosshair.moveTo(0, -20);
    crosshair.lineTo(0, 20);
    crosshair.moveTo(-20, 0);
    crosshair.lineTo(20, 0);
    crosshair.strokePath();
    
    this.effects.push(outerCircle, innerCircle, crosshair);
    
    // エフェクトを一定時間後に削除
    this.scene.time.delayedCall(3000, () => {
      this.clearEffects();
    });
  }

  /**
   * 回復エフェクト
   */
  private showHealEffect(x: number, y: number): void {
    // 回復エフェクト（緑の輝きと上昇する+マーク）
    const healGlow = this.scene.add.circle(x, y, 40, this.particleTint.heal, 0.3)
      .setDepth(50);
    
    // 回復パーティクル
    const particles = this.scene.add.particles(x, y, 'default', {
      speed: { min: 20, max: 70 },
      angle: { min: 270, max: 360 },
      scale: { start: 0.4, end: 0 },
      blendMode: 'ADD',
      tint: this.particleTint.heal,
      lifespan: 1000,
      quantity: 20
    })
    .setDepth(50);
    
    // 回復数値の表示
    for (let i = 0; i < 3; i++) {
      const healText = this.scene.add.text(
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
      
      this.scene.tweens.add({
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
      
      this.effects.push(healText);
    }
    
    this.effects.push(healGlow, particles);
    
    // エフェクトを一定時間後に削除
    this.scene.time.delayedCall(1500, () => {
      this.clearEffects();
    });
  }

  /**
   * 地雷設置エフェクト
   */
  private showMinefieldEffect(x: number, y: number): void {
    // 地雷設置エフェクト
    const mine = this.scene.add.circle(x, y, 15, 0xff0000, 0.7)
      .setStrokeStyle(2, 0xff5500, 1)
      .setDepth(5);
    
    // 点滅エフェクト
    this.scene.tweens.add({
      targets: mine,
      alpha: { from: 0.7, to: 0.3 },
      yoyo: true,
      repeat: -1,
      duration: 500
    });
    
    // 警告マーク
    const warningText = this.scene.add.text(x, y - 20, '!', {
      fontSize: '16px',
      color: '#ff0000',
      fontStyle: 'bold'
    })
    .setOrigin(0.5)
    .setDepth(6);
    
    // 警告マークをアニメーション
    this.scene.tweens.add({
      targets: warningText,
      y: y - 30,
      alpha: { from: 1, to: 0 },
      duration: 700,
      repeat: -1
    });
    
    this.effects.push(mine, warningText);
    
    // エフェクトを15秒後に削除（地雷の寿命）
    this.scene.time.delayedCall(15000, () => {
      // 消える前に爆発エフェクト
      this.showExplosionEffect(x, y, 80, 0.5);
      this.clearEffects();
    });
  }

  /**
   * 爆発エフェクト（サイズと強度を調整可能）
   */
  showExplosionEffect(x: number, y: number, radius: number, intensity: number): void {
    // 爆発の光球
    const explosion = this.scene.add.circle(x, y, radius, this.particleTint.explosion, 0.6)
      .setDepth(50);
    
    // 爆発の外輪
    const explosionRing = this.scene.add.circle(x, y, radius * 0.8, 0xff0000, 0)
      .setStrokeStyle(4, this.particleTint.explosion, 0.8)
      .setDepth(50);
    
    // 爆発の中心が明るいグラデーション
    const gradient = this.scene.add.circle(x, y, radius * 0.4, 0xffff00, 0.7)
      .setDepth(51);
    
    // 爆発パーティクル
    const particles = this.scene.add.particles(x, y, 'default', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      tint: this.particleTint.explosion,
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
    const smoke = this.scene.add.particles(x, y, 'default', {
      speed: { min: 20, max: 70 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.3, end: 0 },
      tint: this.particleTint.smoke,
      lifespan: 1500,
      quantity: 20 * intensity
    })
    .setDepth(49);
    
    // カメラシェイク
    this.scene.cameras.main.shake(300 * intensity, 0.01 * intensity);
    
    this.effects.push(explosion, explosionRing, gradient, particles, smoke);
    
    // エフェクトのアニメーション
    this.scene.tweens.add({
      targets: explosion,
      scale: { from: 0.2, to: 1.2 },
      alpha: { from: 0.8, to: 0 },
      duration: 700,
      ease: 'Power2'
    });
    
    this.scene.tweens.add({
      targets: explosionRing,
      scale: { from: 0.5, to: 1.5 },
      alpha: { from: 1, to: 0 },
      duration: 800,
      ease: 'Power1'
    });
    
    this.scene.tweens.add({
      targets: gradient,
      scale: { from: 1.2, to: 0.4 },
      alpha: { from: 0.9, to: 0 },
      duration: 500,
      ease: 'Power3'
    });
    
    // 爆発音
    try {
      this.scene.sound.play('explosion');
    } catch (e) {
      console.warn('爆発音の再生に失敗:', e);
    }
    
    // エフェクトを一定時間後に削除
    this.scene.time.delayedCall(1500, () => {
      this.clearEffects();
    });
  }

  /**
   * 被弾エフェクト
   */
  showHitEffect(x: number, y: number, damage: number): void {
    // 血しぶきパーティクル
    const blood = this.scene.add.particles(x, y, 'default', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.2, end: 0 },
      tint: this.particleTint.blood,
      lifespan: 600,
      quantity: Math.min(20, damage / 5), // ダメージに応じてパーティクル量を調整
      angle: { min: 0, max: 360 }
    })
    .setDepth(40);
    
    // ダメージテキスト
    const damageText = this.scene.add.text(
      x, 
      y - 20, 
      damage.toString(), 
      { 
        fontSize: '18px', 
        color: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }
    )
    .setOrigin(0.5)
    .setDepth(100);
    
    // ダメージテキストのアニメーション
    this.scene.tweens.add({
      targets: damageText,
      y: y - 50,
      alpha: { from: 1, to: 0 },
      duration: 800,
      ease: 'Power1',
      onComplete: () => {
        damageText.destroy();
      }
    });
    
    this.effects.push(blood, damageText);
    
    // 小さいカメラシェイク
    this.scene.cameras.main.shake(100, 0.005);
    
    // 効果音
    try {
      this.scene.sound.play('hit');
    } catch (e) {
      console.warn('ヒット音の再生に失敗:', e);
    }
    
    // エフェクトを一定時間後に削除
    this.scene.time.delayedCall(1000, () => {
      blood.destroy();
    });
  }

  /**
   * キル演出（プレイヤーが相手を倒した時）
   */
  showKillEffect(x: number, y: number): void {
    // 大きな爆発エフェクト
    this.showExplosionEffect(x, y, 120, 1.5);
    
    // キルテキスト（画面中央に表示）
    const killText = this.scene.add.text(
      this.scene.cameras.main.width / 2, 
      this.scene.cameras.main.height * 0.4, 
      'KILL!', 
      { 
        fontSize: '48px', 
        color: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
      }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(200)
    .setAlpha(0);
    
    // テキストアニメーション
    this.scene.tweens.add({
      targets: killText,
      alpha: { from: 0, to: 1 },
      scale: { from: 1.5, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: killText,
          alpha: 0,
          scale: 0.8,
          delay: 1000,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            killText.destroy();
          }
        });
      }
    });

    // キル効果音
    try {
      this.scene.sound.play('kill');
    } catch (e) {
      console.warn('キル音の再生に失敗:', e);
    }
  }

  /**
   * 復活エフェクト
   */
  showRespawnEffect(x: number, y: number): void {
    // 復活パーティクル
    const respawnParticles = this.scene.add.particles(x, y, 'default', {
      speed: { min: 10, max: 50 },
      scale: { start: 0, end: 0.4 },
      blendMode: 'ADD',
      tint: 0x00ffff,
      lifespan: 800,
      quantity: 30
    })
    .setDepth(40);
    
    // 輝く円
    const glow = this.scene.add.circle(x, y, 60, 0xffffff, 0.6)
      .setDepth(39);
    
    this.scene.tweens.add({
      targets: glow,
      alpha: 0,
      scale: 1.5,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        glow.destroy();
      }
    });
    
    this.effects.push(respawnParticles);
    
    // 復活効果音
    try {
      this.scene.sound.play('respawn');
    } catch (e) {
      console.warn('復活音の再生に失敗:', e);
    }
    
    // エフェクトを一定時間後に削除
    this.scene.time.delayedCall(1000, () => {
      respawnParticles.destroy();
    });
  }

  /**
   * スキル使用可能になった時の通知エフェクト
   */
  showSkillReadyNotification(): void {
    // 画面上部に通知テキスト
    const notificationText = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      50,
      'スキル準備完了!',
      {
        fontSize: '20px',
        color: '#00ffff',
        stroke: '#000000',
        strokeThickness: 3,
        padding: { x: 10, y: 5 },
        backgroundColor: 'rgba(0,0,0,0.3)'
      }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(200)
    .setAlpha(0);
    
    // テキストのアニメーション
    this.scene.tweens.add({
      targets: notificationText,
      alpha: 1,
      y: 60,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: notificationText,
          alpha: 0,
          y: 40,
          delay: 1500,
          duration: 300,
          onComplete: () => {
            notificationText.destroy();
          }
        });
      }
    });
    
    // 通知効果音
    try {
      this.scene.sound.play('skill_ready');
    } catch (e) {
      console.warn('スキル準備音の再生に失敗:', e);
    }
  }

  /**
   * アルティメット使用可能になった時の通知エフェクト
   */
  showUltimateReadyNotification(): void {
    // 画面中央に大きな通知
    const notificationText = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2.5,
      'アルティメット準備完了!',
      {
        fontSize: '32px',
        color: '#ff6600',
        stroke: '#000000',
        strokeThickness: 4,
        padding: { x: 20, y: 10 },
        backgroundColor: 'rgba(0,0,0,0.4)'
      }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(200)
    .setAlpha(0);
    
    // テキストのアニメーション
    this.scene.tweens.add({
      targets: notificationText,
      alpha: 1,
      scale: { from: 1.2, to: 1 },
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: notificationText,
          alpha: 0,
          scale: 0.8,
          delay: 2000,
          duration: 400,
          ease: 'Power2',
          onComplete: () => {
            notificationText.destroy();
          }
        });
      }
    });
    
    // キーガイド表示（Qキー）
    const keyGuide = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2.5 + 50,
      'Qキーで発動',
      {
        fontSize: '18px',
        color: '#ffffff',
        padding: { x: 10, y: 5 }
      }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(200)
    .setAlpha(0);
    
    this.scene.tweens.add({
      targets: keyGuide,
      alpha: 1,
      delay: 400,
      duration: 300,
      onComplete: () => {
        this.scene.tweens.add({
          targets: keyGuide,
          alpha: 0,
          delay: 2000,
          duration: 300,
          onComplete: () => {
            keyGuide.destroy();
          }
        });
      }
    });
    
    // アルティメット準備完了効果音
    try {
      this.scene.sound.play('ultimate_ready');
    } catch (e) {
      console.warn('アルティメット準備音の再生に失敗:', e);
    }
  }

  /**
   * ゲーム開始時のカウントダウン表示
   */
  showCountdown(callback: () => void): void {
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2.5;
    
    // 3
    this.scene.time.delayedCall(500, () => {
      const num3 = this.scene.add.text(centerX, centerY, '3', {
        fontSize: '120px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 10
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setAlpha(0);
      
      this.scene.tweens.add({
        targets: num3,
        alpha: 1,
        scale: { from: 1.5, to: 1 },
        duration: 300,
        onComplete: () => {
          this.scene.tweens.add({
            targets: num3,
            alpha: 0,
            scale: 0.8,
            duration: 300,
            delay: 400
          });
        }
      });
      
      try {
        this.scene.sound.play('countdown');
      } catch (e) {}
    });
    
    // 2
    this.scene.time.delayedCall(1500, () => {
      const num2 = this.scene.add.text(centerX, centerY, '2', {
        fontSize: '120px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 10
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setAlpha(0);
      
      this.scene.tweens.add({
        targets: num2,
        alpha: 1,
        scale: { from: 1.5, to: 1 },
        duration: 300,
        onComplete: () => {
          this.scene.tweens.add({
            targets: num2,
            alpha: 0,
            scale: 0.8,
            duration: 300,
            delay: 400
          });
        }
      });
      
      try {
        this.scene.sound.play('countdown');
      } catch (e) {}
    });
    
    // 1
    this.scene.time.delayedCall(2500, () => {
      const num1 = this.scene.add.text(centerX, centerY, '1', {
        fontSize: '120px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 10
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setAlpha(0);
      
      this.scene.tweens.add({
        targets: num1,
        alpha: 1,
        scale: { from: 1.5, to: 1 },
        duration: 300,
        onComplete: () => {
          this.scene.tweens.add({
            targets: num1,
            alpha: 0,
            scale: 0.8,
            duration: 300,
            delay: 400
          });
        }
      });
      
      try {
        this.scene.sound.play('countdown');
      } catch (e) {}
    });
    
    // スタート！
    this.scene.time.delayedCall(3500, () => {
      const start = this.scene.add.text(centerX, centerY, 'スタート!', {
        fontSize: '80px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setAlpha(0);
      
      this.scene.tweens.add({
        targets: start,
        alpha: 1,
        scale: { from: 1.2, to: 1 },
        duration: 300,
        onComplete: () => {
          this.scene.tweens.add({
            targets: start,
            alpha: 0,
            scale: 1.5,
            duration: 400,
            delay: 600,
            onComplete: () => {
              callback(); // カウントダウン後のコールバックを実行
            }
          });
        }
      });
      
      try {
        this.scene.sound.play('game_start');
      } catch (e) {}
    });
  }

  /**
   * 勝利演出
   */
  showVictoryEffect(): void {
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;
    
    // 勝利テキスト
    const victoryText = this.scene.add.text(centerX, centerY, 'VICTORY!', {
      fontSize: '84px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 10,
      fontStyle: 'bold'
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(200)
    .setAlpha(0);
    
    // テキストアニメーション
    this.scene.tweens.add({
      targets: victoryText,
      alpha: 1,
      scale: { from: 0.5, to: 1 },
      duration: 800,
      ease: 'Back.easeOut'
    });
    
    // 勝利パーティクル（紙吹雪）
    const confetti = this.scene.add.particles(centerX, 0, 'default', {
      speed: { min: 100, max: 300 },
      angle: { min: 220, max: 320 },
      scale: { start: 0.1, end: 0.5 },
      tint: [0xffff00, 0x00ff00, 0x0000ff, 0xff00ff, 0xff0000],
      lifespan: 4000,
      quantity: 100,
      frequency: 100,
      gravityY: 300
    })
    .setScrollFactor(0)
    .setDepth(199);
    
    this.effects.push(victoryText, confetti);
    
    // カメラフラッシュ
    this.scene.cameras.main.flash(500);
    
    // 勝利効果音
    try {
      this.scene.sound.play('victory');
    } catch (e) {
      console.warn('勝利音の再生に失敗:', e);
    }
    
    // エフェクトを一定時間後にクリアアップ
    this.scene.time.delayedCall(6000, () => {
        this.clearEffects();
      });
    }
  
    /**
     * 敗北演出
     */
    showDefeatEffect(): void {
      const centerX = this.scene.cameras.main.width / 2;
      const centerY = this.scene.cameras.main.height / 2;
      
      // 敗北テキスト
      const defeatText = this.scene.add.text(centerX, centerY, 'DEFEAT...', {
        fontSize: '72px',
        color: '#ff3333',
        stroke: '#000000',
        strokeThickness: 8,
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setAlpha(0);
      
      // テキストアニメーション
      this.scene.tweens.add({
        targets: defeatText,
        alpha: 1,
        y: centerY - 20,
        duration: 1000,
        ease: 'Power2'
      });
      
      // 敗北効果音
      try {
        this.scene.sound.play('defeat');
      } catch (e) {
        console.warn('敗北音の再生に失敗:', e);
      }
      
      // カメラシェイク
      this.scene.cameras.main.shake(700, 0.01);
      
      this.effects.push(defeatText);
      
      // エフェクトを一定時間後にクリアアップ
      this.scene.time.delayedCall(4000, () => {
        this.clearEffects();
      });
    }
  
    /**
     * ヒット効果音を再生する
     */
    playHitSound(type: string = 'normal'): void {
      try {
        switch (type) {
          case 'headshot':
            this.scene.sound.play('headshot');
            break;
          case 'critical':
            this.scene.sound.play('critical');
            break;
          default:
            this.scene.sound.play('hit');
            break;
        }
      } catch (e) {
        console.warn('効果音の再生に失敗:', e);
      }
    }
  
    /**
     * 弾丸射撃の視覚効果
     */
    showBulletEffect(startX: number, startY: number, endX: number, endY: number, bulletSpeed: number = 1000): void {
      // 弾速を使用して弾道エフェクトのアニメーション時間を計算
      const distance = Phaser.Math.Distance.Between(startX, startY, endX, endY);
      const duration = distance / bulletSpeed * 1000; // 距離/弾速 * 1000(ミリ秒)
      
      // 弾道ラインのトレイル
      const graphics = this.scene.add.graphics().setDepth(30);
      graphics.lineStyle(2, 0xffffff, 0.5);
      graphics.lineBetween(startX, startY, endX, endY);
      
      // 着弾点のきらめき
      const impact = this.scene.add.circle(endX, endY, 5, 0xffffff, 0.8).setDepth(31);
      
      // トレイルのフェードアウト - 弾速に応じた時間
      this.scene.tweens.add({
        targets: graphics,
        alpha: 0,
        duration: Math.min(200, duration), // 最大200msに制限
        onComplete: () => {
          graphics.destroy();
        }
      });
      
      // 着弾点のアニメーション
      this.scene.tweens.add({
        targets: impact,
        alpha: 0,
        scale: 2,
        duration: 300,
        onComplete: () => {
          impact.destroy();
        }
      });
    }
  
    /**
     * ステータスエフェクト表示（バフ/デバフ）
     */
    showStatusEffect(x: number, y: number, type: string): Phaser.GameObjects.Container {
      const icons = {
        buff_speed: '⚡',
        buff_attack: '🔥',
        buff_defense: '🛡️',
        debuff_slow: '❄️',
        debuff_poison: '☠️',
        stun: '💫'
      };
      
      const colors = {
        buff_speed: 0xffff00,
        buff_attack: 0xff6600,
        buff_defense: 0x0099ff,
        debuff_slow: 0x00ffff,
        debuff_poison: 0x00ff00,
        stun: 0xffcc00
      };
      
      // アイコン選択
      const icon = icons[type as keyof typeof icons] || '❓';
      const color = colors[type as keyof typeof colors] || 0xffffff;
      
      // 表示コンテナ作成
      const container = this.scene.add.container(x, y);
      
      // 背景円
      const circle = this.scene.add.circle(0, 0, 15, color, 0.3)
        .setStrokeStyle(2, color, 0.8);
      
      // テキスト
      const text = this.scene.add.text(0, 0, icon, {
        fontSize: '14px',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      // コンテナに追加
      container.add([circle, text]);
      container.setDepth(60);
      
      // 浮遊アニメーション効果
      this.scene.tweens.add({
        targets: container,
        y: '-=5',
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.effects.push(container);
      return container;
    }
  
    /**
     * 死亡エフェクト
     */
    showDeathEffect(x: number, y: number): void {
      // 爆発効果
      const explosion = this.scene.add.particles(x, y, 'default', {
        speed: { min: 100, max: 200 },
        scale: { start: 0.4, end: 0 },
        blendMode: 'ADD',
        tint: 0xff0000,
        lifespan: 800,
        quantity: 40
      })
      .setDepth(40);
      
      // 煙効果
      const smoke = this.scene.add.particles(x, y, 'default', {
        speed: { min: 20, max: 50 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.3, end: 0 },
        tint: 0x222222,
        lifespan: 2000,
        quantity: 20
      })
      .setDepth(39);
      
      this.effects.push(explosion, smoke);
      
      // カメラシェイク
      this.scene.cameras.main.shake(500, 0.02);
      
      // 死亡エフェクト音
      try {
        this.scene.sound.play('player_death');
      } catch (e) {
        console.warn('死亡効果音の再生に失敗:', e);
      }
      
      // エフェクトを一定時間後に削除
      this.scene.time.delayedCall(2000, () => {
        explosion.destroy();
        smoke.destroy();
      });
    }
  
    /**
     * 全てのエフェクトをクリア
     */
    clearEffects(): void {
      this.effects.forEach(effect => {
        if (effect && !this.isDestroyed(effect)) {
          effect.destroy();
        }
      });
      this.effects = [];
    }

    /**
     * オブジェクトが既に破棄されているかチェックするヘルパーメソッド
     */
    private isDestroyed(obj: Phaser.GameObjects.GameObject): boolean {
      // 安全に実行するためにオブジェクトの状態をチェック
      // isTransitionActiveを避けて安全なチェックに変更
      return !obj.active || !obj.scene || 
             (obj.scene && obj.scene.sys && !obj.scene.sys.isActive());
    }
  
    /**
     * リソース解放
     */
    destroy(): void {
      this.clearEffects();
    }
  }
