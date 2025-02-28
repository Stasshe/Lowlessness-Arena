import Phaser from 'phaser';
import { WeaponAiming, WeaponType } from './WeaponAiming';
import { Player } from '../objects/Player';
import { ProjectileCalculator } from './ProjectileCalculator';

export class VirtualJoystick {
  private scene: Phaser.Scene;
  private base: Phaser.GameObjects.Image;
  private thumb: Phaser.GameObjects.Image;
  private isSkillJoystick: boolean;
  private player?: Player;
  private weaponAiming?: WeaponAiming;
  private pointerDown: boolean = false;
  private activePointer: Phaser.Input.Pointer | null = null;
  
  constructor(scene: Phaser.Scene, isSkill: boolean = false, player?: Player) {
    this.scene = scene;
    this.isSkillJoystick = isSkill;
    this.player = player;
    
    // 位置はスキルかどうかで変える
    const posX = isSkill ? scene.cameras.main.width - 150 : 150;
    const posY = scene.cameras.main.height - 150;
    
    // ベースとサムの画像を設定
    this.base = scene.add.image(posX, posY, 'joystick-base')
      .setScrollFactor(0)
      .setAlpha(0.7)
      .setDepth(1000);
    
    this.thumb = scene.add.image(posX, posY, 'joystick')
      .setScrollFactor(0)
      .setAlpha(0.9)
      .setDepth(1001);
    
    // スキルジョイスティックの場合は照準システムを初期化
    if (isSkill && player) {
      const calculator = new ProjectileCalculator();
      this.weaponAiming = new WeaponAiming(scene, calculator, {
        lineColor: 0x00ffff,
        fillColor: 0x00ffff,
        fillAlpha: 0.3,
        lineWidth: 2,
        maxDistance: 500,
        showTrajectory: true
      });
    }
    
    // イベントリスナーを設定
    this.setupListeners();
  }
  
  private setupListeners(): void {
    // ポインターダウンイベント
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // 既に別のポインターが使用中なら無視
      if (this.pointerDown) return;
      
      // このジョイスティックのエリア内かチェック
      const touchX = pointer.x;
      const touchY = pointer.y;
      const distance = Phaser.Math.Distance.Between(
        this.base.x, this.base.y,
        touchX, touchY
      );
      
      // ジョイスティックの範囲内ならアクティブに
      if (distance < this.base.displayWidth / 2) {
        this.pointerDown = true;
        this.activePointer = pointer;
        this.updateJoystickPosition(touchX, touchY);
      }
    });
    
    // ポインタームーブイベント
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // このジョイスティックがアクティブで、かつ同じポインターの場合のみ処理
      if (this.pointerDown && this.activePointer && this.activePointer.id === pointer.id) {
        this.updateJoystickPosition(pointer.x, pointer.y);
        
        // スキルジョイスティックかつプレイヤーが設定されている場合、照準を表示
        if (this.isSkillJoystick && this.player && this.weaponAiming) {
          const angle = Math.atan2(
            pointer.y - this.base.y,
            pointer.x - this.base.x
          );
          
          const distance = Phaser.Math.Distance.Between(
            this.base.x, this.base.y,
            pointer.x, pointer.y
          );
          
          // プレイヤーのウェポンタイプに基づいて照準を表示
          const weaponType = this.player.getWeaponType() as unknown as WeaponType;
          
          this.weaponAiming.showAiming(
            this.player.x, 
            this.player.y, 
            angle, 
            distance,
            weaponType
          );
        }
      }
    });
    
    // ポインターアップイベント
    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      // このジョイスティックのポインターなら解除
      if (this.pointerDown && this.activePointer && this.activePointer.id === pointer.id) {
        // スキルジョイスティックの場合、離した時にスキルを使用
        if (this.isSkillJoystick && this.player && this.player.canUseSkill()) {
          const angle = Math.atan2(
            pointer.y - this.base.y,
            pointer.x - this.base.x
          );
          
          const distance = Phaser.Math.Distance.Between(
            this.base.x, this.base.y,
            pointer.x, pointer.y
          );
          
          // 最小距離条件（誤操作防止）
          if (distance > 20) {
            const targetX = this.player.x + Math.cos(angle) * 100;
            const targetY = this.player.y + Math.sin(angle) * 100;
            this.player.useSkill(targetX, targetY);
            
            // 照準表示をクリア
            if (this.weaponAiming) {
              this.weaponAiming.clear();
            }
          }
        }
        
        this.resetJoystick();
      }
    });
  }
  
  private updateJoystickPosition(pointerX: number, pointerY: number): void {
    // ジョイスティックの最大半径
    const maxRadius = 50;
    
    // ベースからの距離と角度を計算
    const distance = Phaser.Math.Distance.Between(
      this.base.x, this.base.y,
      pointerX, pointerY
    );
    const angle = Math.atan2(pointerY - this.base.y, pointerX - this.base.x);
    
    // 最大距離を制限
    const limitedDistance = Math.min(distance, maxRadius);
    
    // サムの位置を更新
    this.thumb.x = this.base.x + Math.cos(angle) * limitedDistance;
    this.thumb.y = this.base.y + Math.sin(angle) * limitedDistance;
  }
  
  private resetJoystick(): void {
    // サムをベースの中央に戻す
    this.thumb.x = this.base.x;
    this.thumb.y = this.base.y;
    this.pointerDown = false;
    this.activePointer = null;
    
    // 照準表示をクリア
    if (this.isSkillJoystick && this.weaponAiming) {
      this.weaponAiming.clear();
    }
  }
  
  getVector(): Phaser.Math.Vector2 {
    // ベースからサムへのベクトルを計算（-1.0〜1.0の範囲）
    const dx = (this.thumb.x - this.base.x) / 50;
    const dy = (this.thumb.y - this.base.y) / 50;
    return new Phaser.Math.Vector2(dx, dy);
  }
  
  length(): number {
    // ベースからサムまでの距離を取得
    return Phaser.Math.Distance.Between(
      this.base.x, this.base.y,
      this.thumb.x, this.thumb.y
    );
  }
  
  angle(): number {
    // ベースからサムへの角度を取得
    return Math.atan2(
      this.thumb.y - this.base.y,
      this.thumb.x - this.base.x
    );
  }
  
  getBase(): Phaser.GameObjects.Image {
    return this.base;
  }
  
  getThumb(): Phaser.GameObjects.Image {
    return this.thumb;
  }
  
  isBeingUsed(pointer: Phaser.Input.Pointer): boolean {
    // nullチェックを修正（booleanが期待される場所でnullを返さない）
    if (!this.activePointer) return false;
    return this.pointerDown && this.activePointer.id === pointer.id;
  }
  
  getTargetWorldPosition(): Phaser.Math.Vector2 | null {
    if (!this.player) return null;
    
    const angle = this.angle();
    const distance = Math.min(this.length() * 5, 500); // スケーリングして適切な距離に
    
    return new Phaser.Math.Vector2(
      this.player.x + Math.cos(angle) * distance,
      this.player.y + Math.sin(angle) * distance
    );
  }
  
  getAiming(): WeaponAiming | undefined {
    return this.weaponAiming;
  }
  
  /**
   * プレイヤー参照を設定するためのメソッドを追加
   */
  setPlayer(player: Player): void {
    this.player = player;
  }
  
  destroy(): void {
    // イベントリスナーを削除
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointermove');
    this.scene.input.off('pointerup');
    
    // 表示要素を破棄
    this.base.destroy();
    this.thumb.destroy();
    
    // 照準表示も破棄
    if (this.weaponAiming) {
      this.weaponAiming.getGraphics().destroy();
    }
  }
}
