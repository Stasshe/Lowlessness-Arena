import Phaser from 'phaser';

export class VirtualJoystick {
  private scene: Phaser.Scene;
  private baseElement: HTMLDivElement;
  private thumbElement: HTMLDivElement;
  private baseX: number;
  private baseY: number;
  private centerX: number;
  private centerY: number;
  private maxDistance: number;
  private pointer: Phaser.Input.Pointer | null = null;
  public isActive = false;
  public isPointerDown = false;
  
  constructor(scene: Phaser.Scene, x: number, y: number, className: string) {
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;
    this.centerX = x;
    this.centerY = y;
    this.maxDistance = 50; // ジョイスティックの最大移動距離
    
    // ベース要素作成
    this.baseElement = document.createElement('div');
    this.baseElement.className = `virtual-joystick ${className}`;
    this.baseElement.style.left = `${x - 60}px`;
    this.baseElement.style.top = `${y - 60}px`;
    
    // サム（動かす部分）要素作成
    this.thumbElement = document.createElement('div');
    this.thumbElement.className = 'joystick-thumb';
    this.thumbElement.style.left = '50%';
    this.thumbElement.style.top = '50%';
    
    this.baseElement.appendChild(this.thumbElement);
    document.body.appendChild(this.baseElement);
    
    // イベントリスナーの追加
    this.baseElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.baseElement.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.baseElement.addEventListener('pointerup', this.onPointerUp.bind(this));
    this.baseElement.addEventListener('pointerout', this.onPointerUp.bind(this));
  }
  
  private onPointerDown(event: PointerEvent): void {
    this.isPointerDown = true;
    this.isActive = true;
    this.pointer = {
      x: event.clientX,
      y: event.clientY
    } as Phaser.Input.Pointer;
    
    this.updateJoystickPosition(event);
  }
  
  private onPointerMove(event: PointerEvent): void {
    if (this.isPointerDown) {
      this.updateJoystickPosition(event);
    }
  }
  
  private onPointerUp(event: PointerEvent): void {
    this.isPointerDown = false;
    this.isActive = false;
    this.pointer = null;
    
    // ジョイスティックを中央に戻す
    this.thumbElement.style.left = '50%';
    this.thumbElement.style.top = '50%';
  }
  
  private updateJoystickPosition(event: PointerEvent): void {
    const rect = this.baseElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let deltaX = event.clientX - centerX;
    let deltaY = event.clientY - centerY;
    
    // 距離の計算
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // 最大距離を超えないようにする
    if (distance > this.maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      deltaX = Math.cos(angle) * this.maxDistance;
      deltaY = Math.sin(angle) * this.maxDistance;
    }
    
    // サムの位置を更新
    const thumbX = 50 + (deltaX / rect.width) * 100;
    const thumbY = 50 + (deltaY / rect.height) * 100;
    this.thumbElement.style.left = `${thumbX}%`;
    this.thumbElement.style.top = `${thumbY}%`;
    
    // ポインター位置を更新
    if (this.pointer) {
      this.pointer.x = centerX + deltaX;
      this.pointer.y = centerY + deltaY;
    }
  }
  
  // ジョイスティックのX方向の値を取得 (-1.0 ~ 1.0)
  public getX(): number {
    if (!this.isActive || !this.pointer) return 0;
    
    const rect = this.baseElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    return (this.pointer.x - centerX) / this.maxDistance;
  }
  
  // ジョイスティックのY方向の値を取得 (-1.0 ~ 1.0)
  public getY(): number {
    if (!this.isActive || !this.pointer) return 0;
    
    const rect = this.baseElement.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    return (this.pointer.y - centerY) / this.maxDistance;
  }
  
  // ジョイスティックの角度を取得 (ラジアン)
  public getAngle(): number {
    return Math.atan2(this.getY(), this.getX());
  }
  
  // ジョイスティックの力を取得 (0.0 ~ 1.0)
  public getForce(): number {
    const x = this.getX();
    const y = this.getY();
    const force = Math.min(1, Math.sqrt(x * x + y * y));
    return force;
  }
  
  // 要素の削除
  public destroy(): void {
    this.baseElement.removeEventListener('pointerdown', this.onPointerDown.bind(this));
    this.baseElement.removeEventListener('pointermove', this.onPointerMove.bind(this));
    this.baseElement.removeEventListener('pointerup', this.onPointerUp.bind(this));
    this.baseElement.removeEventListener('pointerout', this.onPointerUp.bind(this));
    
    document.body.removeChild(this.baseElement);
  }
}
