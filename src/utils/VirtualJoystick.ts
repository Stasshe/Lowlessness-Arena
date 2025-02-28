import Phaser from 'phaser';

/**
 * モバイル用の仮想ジョイスティッククラス
 * 移動操作とスキル発動方向指示の2種類のモードをサポート
 */
export class VirtualJoystick {
  private scene: Phaser.Scene;
  private base: Phaser.GameObjects.Image;
  private stick: Phaser.GameObjects.Image;
  private targetLine?: Phaser.GameObjects.Graphics;
  private targetCircle?: Phaser.GameObjects.Graphics;
  private pointer: Phaser.Input.Pointer | null = null;
  private vector: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
  private isForSkill: boolean;
  private maxDistance: number = 64;
  
  constructor(scene: Phaser.Scene, isForSkill: boolean = false) {
    this.scene = scene;
    this.isForSkill = isForSkill;
    
    const cameraWidth = scene.cameras.main.width;
    const cameraHeight = scene.cameras.main.height;
    
    // ジョイスティックの位置を設定（移動用は左下、スキル用は右下）
    const x = this.isForSkill ? cameraWidth - 100 : 100;
    const y = cameraHeight - 100;
    
    // ジョイスティックのベース（背景）を作成
    this.base = scene.add.image(x, y, 'joystick-base')
      .setScrollFactor(0) // カメラに追従しない
      .setAlpha(0.7)
      .setDepth(200);
      
    // スティック（操作する部分）を作成
    this.stick = scene.add.image(x, y, 'joystick')
      .setScrollFactor(0)
      .setAlpha(0.8)
      .setDepth(200);
    
    // スキル用ジョイスティックの場合は、方向線とターゲットサークルを作成
    if (this.isForSkill) {
      // 方向を示す線
      this.targetLine = scene.add.graphics()
        .setScrollFactor(0)
        .setDepth(190);
      
      // ターゲットサークル
      this.targetCircle = scene.add.graphics()
        .setScrollFactor(0)
        .setDepth(190);
    }
    
    // 入力を受け取れるように設定
    this.bindEvents();
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
    if (!this.targetLine || !this.targetCircle || !this.scene) return;
    
    this.targetLine.clear();
    this.targetCircle.clear();
    
    // ベクトルの長さが十分なら方向線とターゲットサークルを描画
    const length = this.vector.length();
    if (length > 0.2) {
      // 方向線の描画（スクリーン座標）
      const lineLength = 1000; // 画面外まで十分な長さ
      const lineEndX = this.base.x + this.vector.x * lineLength;
      const lineEndY = this.base.y + this.vector.y * lineLength;
      
      this.targetLine.lineStyle(2, 0x00ffff, 0.5);
      this.targetLine.beginPath();
      this.targetLine.moveTo(this.base.x, this.base.y);
      this.targetLine.lineTo(lineEndX, lineEndY);
      this.targetLine.strokePath();
      
      // ターゲットサークルの描画
      const targetX = this.base.x + this.vector.x * this.maxDistance;
      const targetY = this.base.y + this.vector.y * this.maxDistance;
      
      this.targetCircle.fillStyle(0x00ffff, 0.5);
      this.targetCircle.fillCircle(targetX, targetY, 10);
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
  
  getBase(): Phaser.GameObjects.Image {
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
      
      // 描画要素を削除（存在するかどうかをscene内で確認）
      if (this.base) {
        // 明示的に存在確認とactive確認を行う
        if (this.base.active && this.scene && this.scene.children.exists(this.base)) {
          this.base.destroy();
        }
      }
      
      if (this.stick) {
        // 明示的に存在確認とactive確認を行う
        if (this.stick.active && this.scene && this.scene.children.exists(this.stick)) {
          this.stick.destroy();
        }
      }
      
      if (this.targetLine) {
        // 明示的に存在確認とactive確認を行う
        if (this.targetLine.active && this.scene && this.scene.children.exists(this.targetLine)) {
          this.targetLine.destroy();
        }
      }
      
      if (this.targetCircle) {
        // 明示的に存在確認とactive確認を行う
        if (this.targetCircle.active && this.scene && this.scene.children.exists(this.targetCircle)) {
          this.targetCircle.destroy();
        }
      }
      
      // 参照をクリア
      this.pointer = null;
      this.vector.reset();
    } catch (e) {
      console.warn('VirtualJoystick destroy error:', e);
    }
  }
}
