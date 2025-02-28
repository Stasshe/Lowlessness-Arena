import Phaser from 'phaser';

export class VirtualJoystick {
  private scene: Phaser.Scene;
  private base: Phaser.GameObjects.Image;
  private stick: Phaser.GameObjects.Image;
  private baseRadius: number = 60;
  private stickRadius: number = 30;
  private pointer: Phaser.Input.Pointer | null = null;
  private vector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // 画面左下にジョイスティックを配置
    const x = 150;
    const y = scene.cameras.main.height - 150;
    
    // ベース部分
    this.base = scene.add.image(x, y, 'joystick-base')
      .setDepth(100)
      .setScrollFactor(0)
      .setAlpha(0.7)
      .setDisplaySize(this.baseRadius * 2, this.baseRadius * 2);
    
    // スティック部分
    this.stick = scene.add.image(x, y, 'joystick')
      .setDepth(101)
      .setScrollFactor(0)
      .setAlpha(0.9)
      .setDisplaySize(this.stickRadius * 2, this.stickRadius * 2);
    
    // タッチ入力の設定
    scene.input.on('pointerdown', this.onPointerDown, this);
    scene.input.on('pointermove', this.onPointerMove, this);
    scene.input.on('pointerup', this.onPointerUp, this);
  }
  
  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    const distance = Phaser.Math.Distance.Between(
      pointer.x, pointer.y,
      this.base.x, this.base.y
    );
    
    // ジョイスティック範囲内のみ反応
    if (distance <= this.baseRadius) {
      this.pointer = pointer;
      this.updateStickPosition(pointer);
    }
  }
  
  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.pointer && this.pointer.id === pointer.id) {
      this.updateStickPosition(pointer);
    }
  }
  
  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.pointer && this.pointer.id === pointer.id) {
      this.pointer = null;
      // スティックをリセット
      this.stick.setPosition(this.base.x, this.base.y);
      this.vector.reset();
    }
  }
  
  private updateStickPosition(pointer: Phaser.Input.Pointer): void {
    // スティックの位置を計算
    const dx = pointer.x - this.base.x;
    const dy = pointer.y - this.base.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.min(this.baseRadius, Math.sqrt(dx * dx + dy * dy));
    
    // スティックの位置を更新
    const x = this.base.x + distance * Math.cos(angle);
    const y = this.base.y + distance * Math.sin(angle);
    this.stick.setPosition(x, y);
    
    // 移動方向ベクトルを更新
    this.vector.x = dx / this.baseRadius;
    this.vector.y = dy / this.baseRadius;
    
    // 大きさを1に正規化
    if (this.vector.length() > 1) {
      this.vector.normalize();
    }
  }
  
  getVector(): { x: number; y: number } {
    // Vector2互換のオブジェクトを返す
    return {
      x: this.vector.x,
      y: this.vector.y
    };
  }
  
  isBeingUsed(pointer: Phaser.Input.Pointer): boolean {
    return this.pointer !== null && this.pointer.id === pointer.id;
  }
}
