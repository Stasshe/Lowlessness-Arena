import Phaser from 'phaser';

export class VirtualJoystick {
  private scene: Phaser.Scene;
  private base: Phaser.GameObjects.Arc;
  private stick: Phaser.GameObjects.Arc;
  private baseRadius: number = 60;
  private stickRadius: number = 30;
  private pointer: Phaser.Input.Pointer | null = null;
  private vector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private isSkillJoystick: boolean = false;
  private targetLine: Phaser.GameObjects.Graphics | null = null;
  private targetCircle: Phaser.GameObjects.Arc | null = null;
  private maxDistance: number = 200; // スキルの最大距離
  
  constructor(scene: Phaser.Scene, isSkillJoystick: boolean = false, x?: number, y?: number) {
    this.scene = scene;
    this.isSkillJoystick = isSkillJoystick;
    
    // ジョイスティックの位置
    let posX = x;
    let posY = y;
    
    if (posX === undefined || posY === undefined) {
      // デフォルトは画面左下（移動用）か右下（スキル用）
      if (this.isSkillJoystick) {
        posX = scene.cameras.main.width - 150;
        posY = scene.cameras.main.height - 150;
      } else {
        posX = 150;
        posY = scene.cameras.main.height - 150;
      }
    }
    
    // ベース部分（半透明の円）
    this.base = scene.add.circle(posX, posY, this.baseRadius, 0x888888, 0.5)
      .setDepth(100)
      .setScrollFactor(0)
      .setStrokeStyle(2, this.isSkillJoystick ? 0x00ffff : 0xffffff, 0.8);
    
    // スティック部分（内側の円）
    this.stick = scene.add.circle(posX, posY, this.stickRadius, this.isSkillJoystick ? 0x00ffff : 0xffffff, 0.8)
      .setDepth(101)
      .setScrollFactor(0);
    
    // スキルジョイスティック用の狙い線と着弾地点表示を初期化
    if (this.isSkillJoystick) {
      this.targetLine = scene.add.graphics()
        .setDepth(90)
        .setScrollFactor(0);
      
      this.targetCircle = scene.add.circle(posX, posY, 10, 0x00ffff, 0.6)
        .setDepth(91)
        .setScrollFactor(0)
        .setVisible(false);
    }
    
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
      
      // スキルジョイスティックの場合は狙い線を表示
      if (this.isSkillJoystick && this.targetLine) {
        this.updateTargetLine();
      }
    }
  }
  
  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.pointer && this.pointer.id === pointer.id) {
      this.updateStickPosition(pointer);
      
      // スキルジョイスティックの場合は狙い線を更新
      if (this.isSkillJoystick && this.targetLine) {
        this.updateTargetLine();
      }
    }
  }
  
  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.pointer && this.pointer.id === pointer.id) {
      this.pointer = null;
      
      // スティックをリセット
      this.stick.setPosition(this.base.x, this.base.y);
      this.vector.reset();
      
      // スキルジョイスティックの場合は狙い線を非表示
      if (this.isSkillJoystick) {
        if (this.targetLine) this.targetLine.clear();
        if (this.targetCircle) this.targetCircle.setVisible(false);
      }
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
  
  private updateTargetLine(): void {
    if (!this.targetLine || !this.targetCircle) return;
    
    // ベクトルの方向と大きさに基づいて狙い線を描画
    this.targetLine.clear();
    
    const startX = this.scene.cameras.main.scrollX + this.base.x;
    const startY = this.scene.cameras.main.scrollY + this.base.y;
    
    // ベクトルの長さに応じてスキルの飛距離を変更（最大距離はmaxDistance）
    const length = this.vector.length();
    const distance = length * this.maxDistance;
    
    // ワールド座標上での目標地点
    const targetX = startX + this.vector.x * distance;
    const targetY = startY + this.vector.y * distance;
    
    // 線と円を描画（線の太さと透明度はベクトルの長さに基づく）
    this.targetLine.lineStyle(2 * length, 0x00ffff, 0.5 * length);
    this.targetLine.lineBetween(startX, startY, targetX, targetY);
    
    // 着弾点の円を表示
    this.targetCircle.setPosition(targetX, targetY);
    this.targetCircle.setRadius(10 + 10 * length);
    this.targetCircle.setVisible(true);
    this.targetCircle.setAlpha(0.4 * length);
  }
  
  getVector(): { x: number; y: number } {
    return this.vector;
  }
  
  getTargetWorldPosition(): { x: number; y: number } | null {
    if (!this.isSkillJoystick || !this.vector.length()) return null;
    
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
  
  getBase(): Phaser.GameObjects.Arc {
    return this.base;
  }

  length(): number {
    return this.vector.length();
  }
}
