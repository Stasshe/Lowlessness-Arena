import Phaser from 'phaser';
import { Player, SkillType } from '../../objects/Player';
import { BaseCharacter } from './../BaseCharacter';
import { WeaponType } from '../../utils/WeaponTypes';

/**
 * メディック（ヒーラー）のキャラクタークラス
 */
export class Healer extends BaseCharacter {
  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player);
  }
  
  getName(): string {
    return 'メディック';
  }
  
  getSkillName(): string {
    return 'セルフヒーリング';
  }
  
  getUltimateName(): string {
    return 'リジェネレーション・フィールド';
  }
  
  getSkillDescription(): string {
    return '自身のHPを回復する';
  }
  
  getUltimateDescription(): string {
    return '広範囲の回復エリアを展開し、継続的に回復効果を与える';
  }
  
  getWeaponType(): WeaponType {
    return WeaponType.MACHINEGUN;
  }
  
  getSkillType(): SkillType {
    return SkillType.HEAL;
  }
  
  initializeStats(): void {
    this.player.setMaxHealth(90);
    this.player.setSpeed(200);
    this.player.setWeapon(this.getWeaponType());
    this.player.setSpecialAbility(this.getSkillType());
    this.player.setTint(0x00ffff);
  }
  
  useSkill(_targetX: number, _targetY: number): void {
    // セルフヒーリング: HP回復
    
    // 回復量（最大HPの30%）
    const healAmount = this.player.getMaxHealth() * 0.3;
    
    // 回復エフェクト
    const healCircle = this.scene.add.circle(this.player.x, this.player.y, 40, 0x00ff00, 0.3)
      .setStrokeStyle(2, 0x00ff00, 0.8);
    
    // 拡大エフェクト
    this.scene.tweens.add({
      targets: healCircle,
      scale: { from: 0.5, to: 1.2 },
      alpha: { from: 0.8, to: 0 },
      duration: 700,
      onComplete: () => {
        healCircle.destroy();
      }
    });
    
    // 回復パーティクル
    const particles = this.scene.add.particles(this.player.x, this.player.y, 'default', {
      speed: { min: 20, max: 70 },
      angle: { min: 270, max: 360 },
      scale: { start: 0.4, end: 0 },
      blendMode: 'ADD',
      tint: 0x00ff00,
      lifespan: 1000,
      quantity: 20
    });
    
    // パーティクルを時間経過で削除
    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });
    
    // 回復処理
    this.player.heal(healAmount);
    
    // 回復数値の表示
    const healText = this.scene.add.text(
      this.player.x, this.player.y - 40,
      `+${Math.floor(healAmount)}`,
      {
        fontSize: '20px',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
    
    // テキストのアニメーション
    this.scene.tweens.add({
      targets: healText,
      y: healText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => healText.destroy()
    });
    
    // 効果音
    try {
      this.scene.sound.play('heal');
    } catch (e) {}
  }
  
  useUltimate(): void {
    // リジェネレーション・フィールド: 継続的な回復領域
    const fieldRadius = 150;
    const duration = 10000; // 10秒間持続
    const healFrequency = 1000; // 1秒ごとに回復
    const healAmount = 10; // 一回あたりの回復量
    
    // 回復フィールドの可視化
    const healField = this.scene.add.circle(this.player.x, this.player.y, fieldRadius, 0x00ff00, 0.2)
      .setStrokeStyle(3, 0x00ff00, 0.5);
    
    // パルスエフェクト
    this.scene.tweens.add({
      targets: healField,
      scale: { from: 0.8, to: 1.0 },
      alpha: { from: 0.5, to: 0.2 },
      yoyo: true,
      repeat: -1,
      duration: 1000
    });
    
    // 中央の明るいエフェクト
    const center = this.scene.add.circle(this.player.x, this.player.y, 40, 0x00ff00, 0.4)
      .setStrokeStyle(2, 0x00ff00, 0.7);
    
    // 中央のシンボル（十字）
    const crossSize = 30;
    const cross = this.scene.add.graphics()
      .lineStyle(5, 0x00ff00, 0.8)
      .beginPath()
      .moveTo(this.player.x - crossSize/2, this.player.y)
      .lineTo(this.player.x + crossSize/2, this.player.y)
      .moveTo(this.player.x, this.player.y - crossSize/2)
      .lineTo(this.player.x, this.player.y + crossSize/2)
      .closePath()
      .strokePath();
    
    // フィールドをプレイヤーに追従
    let healTimer: Phaser.Time.TimerEvent;
    
    const updateFieldPosition = () => {
      if (healField) {
        healField.setPosition(this.player.x, this.player.y);
        center.setPosition(this.player.x, this.player.y);
        
        // 十字位置更新
        cross.clear();
        cross.lineStyle(5, 0x00ff00, 0.8);
        cross.beginPath();
        cross.moveTo(this.player.x - crossSize/2, this.player.y);
        cross.lineTo(this.player.x + crossSize/2, this.player.y);
        cross.moveTo(this.player.x, this.player.y - crossSize/2);
        cross.lineTo(this.player.x, this.player.y + crossSize/2);
        cross.closePath();
        cross.strokePath();
        
        // フィールド内のプレイヤーを回復
        this.player.heal(healAmount);
        
        // 回復効果のビジュアル
        this.scene.add.particles(this.player.x, this.player.y, 'default', {
          speed: { min: 20, max: 50 },
          scale: { start: 0.2, end: 0 },
          blendMode: 'ADD',
          tint: 0x00ff00,
          lifespan: 500,
          quantity: 5
        });
      }
    };
    
    // 定期的に回復処理を実行
    healTimer = this.scene.time.addEvent({
      delay: healFrequency,
      callback: updateFieldPosition,
      repeat: duration / healFrequency - 1
    });
    
    // フィールド追従処理
    this.scene.time.addEvent({
      delay: 30,
      callback: () => {
        if (healField) {
          healField.setPosition(this.player.x, this.player.y);
          center.setPosition(this.player.x, this.player.y);
          
          // 十字位置更新
          cross.clear();
          cross.lineStyle(5, 0x00ff00, 0.8);
          cross.beginPath();
          cross.moveTo(this.player.x - crossSize/2, this.player.y);
          cross.lineTo(this.player.x + crossSize/2, this.player.y);
          cross.moveTo(this.player.x, this.player.y - crossSize/2);
          cross.lineTo(this.player.x, this.player.y + crossSize/2);
          cross.closePath();
          cross.strokePath();
        }
      },
      repeat: duration / 30
    });
    
    // 持続時間終了後にフィールドを消去
    this.scene.time.delayedCall(duration, () => {
      healTimer.destroy();
      
      // フェードアウト
      this.scene.tweens.add({
        targets: [healField, center],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          healField.destroy();
          center.destroy();
          cross.destroy();
        }
      });
    });
    
    // 効果音
    try {
      this.scene.sound.play('heal_field');
    } catch (e) {}
  }
}
