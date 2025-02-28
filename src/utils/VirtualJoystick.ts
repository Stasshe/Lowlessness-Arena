import Phaser from 'phaser';

/**
 * モバイル用の仮想ジョイスティッククラス
 * 移動操作とスキル発動方向指示の2種類のモードをサポート
 */
export class VirtualJoystick {
  private scene: Phaser.Scene;
  private base: Phaser.GameObjects.Graphics;
  private stick: Phaser.GameObjects.Graphics;
  private targetLine?: Phaser.GameObjects.Graphics;
  private targetCircle?: Phaser.GameObjects.Graphics;
  private trajectoryLine?: Phaser.GameObjects.Graphics;
  private pointer: Phaser.Input.Pointer | null = null;
  private vector: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
  private isForSkill: boolean;
  private maxDistance: number = 64;
  private readonly baseRadius: number = 32;
  private readonly stickRadius: number = 16;

  constructor(scene: Phaser.Scene, isForSkill: boolean = false) {
    this.scene = scene;
    this.isForSkill = isForSkill;

    const cameraWidth = scene.cameras.main.width;
    const cameraHeight = scene.cameras.main.height;
    const x = this.isForSkill ? cameraWidth - 100 : 100;
    const y = cameraHeight - 100;

    // ベース円を作成
    this.base = scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(200);
    this.base.setPosition(x, y);
    this.drawBase();

    // スティック円を作成
    this.stick = scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(201);
    this.stick.setPosition(x, y);
    this.drawStick();

    if (this.isForSkill) {
      // 方向線
      this.targetLine = scene.add.graphics()
        .setScrollFactor(0)
        .setDepth(190);
      
      // ターゲットサークル
      this.targetCircle = scene.add.graphics()
        .setScrollFactor(0)
        .setDepth(190);

      // 放物線の軌道
      this.trajectoryLine = scene.add.graphics()
        .setScrollFactor(0)
        .setDepth(190);
    }

    this.bindEvents();
  }

  private drawBase(): void {
    this.base.clear();
    this.base.lineStyle(2, 0x666666);
    this.base.strokeCircle(0, 0, this.baseRadius);
    this.base.fillStyle(0x333333, 0.3);
    this.base.fillCircle(0, 0, this.baseRadius);
  }

  private drawStick(): void {
    this.stick.clear();
    this.stick.fillStyle(0x666666, 0.8);
    this.stick.fillCircle(0, 0, this.stickRadius);
  }

  private bindEvents(): void {
    this.scene.input.on('pointerdown', this.onPointerDown, this);
    this.scene.input.on('pointermove', this.onPointerMove, this);
    this.scene.input.on('pointerup', this.onPointerUp, this);
  }
  
  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    const distance = Phaser.Math.Distance.Between(
      pointer.x, pointer.y,
      this.base.x, this.base.y
    );
    
    // ベースの近くでタッチした場合のみ反応
    const activationRadius = this.isForSkill ? 100 : 70;
    if (distance <= activationRadius) {
      this.pointer = pointer;
      this.updateStickPosition(pointer.x, pointer.y);
      
      // スキルジョイスティックの場合はターゲットラインとサークルを表示
      if (this.isForSkill && this.targetLine && this.targetCircle) {
        this.updateTargetVisuals();
      }
    }
  }
  
  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.pointer && this.pointer.id === pointer.id) {
      this.updateStickPosition(pointer.x, pointer.y);
      
      // スキルジョイスティックの場合はターゲットラインとサークルを更新
      if (this.isForSkill && this.targetLine && this.targetCircle) {
        this.updateTargetVisuals();
      }
    }
  }
  
  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.pointer && this.pointer.id === pointer.id) {
      // スティックを元の位置に戻す
      this.resetStick();
      this.pointer = null;
      
      // スキルジョイスティックの場合はターゲットラインとサークルを非表示
      if (this.isForSkill && this.targetLine && this.targetCircle) {
        this.targetLine.clear();
        this.targetCircle.clear();
      }
    }
  }
  
  private updateStickPosition(x: number, y: number): void {
    const dx = x - this.base.x;
    const dy = y - this.base.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 方向ベクトルを計算
    if (distance === 0) {
      this.vector.reset();
    } else {
      this.vector.x = dx / distance;
      this.vector.y = dy / distance;
    }
    
    // スティックの位置を更新（最大距離を制限）
    if (distance <= this.maxDistance) {
      this.stick.x = x;
      this.stick.y = y;
    } else {
      this.stick.x = this.base.x + (dx / distance) * this.maxDistance;
      this.stick.y = this.base.y + (dy / distance) * this.maxDistance;
    }
  }
  
  private resetStick(): void {
    this.stick.x = this.base.x;
    this.stick.y = this.base.y;
    this.vector.reset();
    
    // スキルジョイスティックの場合はターゲットラインとサークルをクリア
    if (this.isForSkill && this.targetLine && this.targetCircle) {
      this.targetLine.clear();
      this.targetCircle.clear();
    }
  }
  
  private updateTargetVisuals(): void {
    if (!this.targetLine || !this.targetCircle || !this.trajectoryLine || !this.scene) return;

    this.targetLine.clear();
    this.targetCircle.clear();
    this.trajectoryLine.clear();

    const length = this.vector.length();
    if (length > 0.2) {
      const power = Math.min(length, 1) * 300; // 投擲力（距離）
      const angle = Math.atan2(this.vector.y, this.vector.x);
      const gravity = 980; // 重力加速度
      const points: { x: number, y: number }[] = [];

      // 放物線の軌道を計算
      for (let t = 0; t < 1; t += 0.1) {
        const x = this.base.x + power * Math.cos(angle) * t;
        const y = this.base.y + (power * Math.sin(angle) * t) + (0.5 * gravity * t * t);
        points.push({ x, y });
      }

      // 放物線の描画
      this.trajectoryLine.lineStyle(2, 0x00ff00, 0.3);
      this.trajectoryLine.beginPath();
      points.forEach((point, index) => {
        if (index === 0) {
          this.trajectoryLine?.moveTo(point.x, point.y);
        } else {
          this.trajectoryLine?.lineTo(point.x, point.y);
        }
      });
      this.trajectoryLine.strokePath();

      // 着弾点の表示
      if (points.length > 0) {
        const lastPoint = points[points.length - 1];
        this.targetCircle.lineStyle(2, 0xff0000);
        this.targetCircle.strokeCircle(lastPoint.x, lastPoint.y, 20);
        
        // 着弾エフェクトのアニメーション
        const impactCircle = this.scene.add.circle(lastPoint.x, lastPoint.y, 5, 0xff0000);
        this.scene.tweens.add({
          targets: impactCircle,
          scale: 2,
          alpha: 0,
          duration: 500,
          onComplete: () => impactCircle.destroy()
        });
      }
    }
  }
  
  getVector(): { x: number; y: number } {
    return this.vector;
  }
  
  getTargetWorldPosition(): { x: number; y: number } | null {
    if (!this.isForSkill || !this.vector.length()) return null;
    
    const length = this.vector.length();
    const distance = length * this.maxDistance;
    
    return {
      x: this.scene.cameras.main.scrollX + this.base.x + this.vector.x * distance,
      y: this.scene.cameras.main.scrollY + this.base.y + this.vector.y * distance
    };
  }
  
  isBeingUsed(pointer: Phaser.Input.Pointer): boolean {
    return this.pointer !== null && this.pointer.id === pointer.id;
  }
  
  getBase(): Phaser.GameObjects.Graphics {
    return this.base;
  }

  length(): number {
    return this.vector.length();
  }

  // リソース解放用のメソッドを追加
  destroy(): void {
    try {
      // イベントリスナーを解除
      this.scene.input.off('pointerdown', this.onPointerDown, this);
      this.scene.input.off('pointermove', this.onPointerMove, this);
      this.scene.input.off('pointerup', this.onPointerUp, this);
      
      // グラフィックスオブジェクトの削除
      [this.base, this.stick, this.targetLine, this.targetCircle, this.trajectoryLine].forEach(obj => {
        if (obj?.active && this.scene?.children.exists(obj)) {
          obj.destroy();
        }
      });
      
      this.pointer = null;
      this.vector.reset();
    } catch (e) {
      console.warn('VirtualJoystick destroy error:', e);
    }
  }
}
