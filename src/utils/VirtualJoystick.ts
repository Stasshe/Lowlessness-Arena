import Phaser from 'phaser';
import { WeaponAiming } from './WeaponAiming';
import { WeaponType } from '../utils/WeaponTypes';
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
  private joystickId: string; // ジョイスティックの一意のID
  private wasActive: boolean = false;
  private justReleased: boolean = false;
  
  constructor(scene: Phaser.Scene, isSkill: boolean = false, player?: Player) {
    this.scene = scene;
    this.isSkillJoystick = isSkill;
    this.player = player;
    this.joystickId = isSkill ? 'skillJoystick' : 'moveJoystick';
    
    // 位置はスキルかどうかで変える
    const posX = isSkill ? scene.cameras.main.width - 150 : 150;
    const posY = scene.cameras.main.height - 150;
    
    // ベースとサムの画像を設定
    this.base = scene.add.image(posX, posY, 'joystick-base')
      .setScrollFactor(0)
      .setAlpha(0.7)
      .setDepth(1000)
      .setInteractive(); // 対話可能にする
    
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
    // ベースに直接ポインターダウンイベントをアタッチ
    this.base.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.pointerDown) {
        this.pointerDown = true;
        this.activePointer = pointer;
        this.updateJoystickPosition(pointer.x, pointer.y);
      }
    });
    
    // グローバルなポインタームーブイベント
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
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
    
    // グローバルなポインターアップイベント
    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.pointerDown && this.activePointer && this.activePointer.id === pointer.id) {
        // スキルジョイスティックの場合、離した時にスキルを使用
        if (this.isSkillJoystick && this.player) {
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
            // コンソールにデバッグ情報
            console.log("ジョイスティックリリース: 角度=", angle, "距離=", distance);
            
            // ワールド座標を計算
            const targetPos = this.getTargetWorldPosition();
            if (targetPos) {
              console.log("スキル実行準備: ターゲット座標=", targetPos.x, targetPos.y);
              
              // 直接 useSkill を呼び出すのではなく、イベントとして通知
              this.scene.events.emit('joystick-skill', targetPos.x, targetPos.y);
              
              // 照準表示をクリア
              if (this.weaponAiming) {
                this.weaponAiming.clear();
              }
            }
          }
        }
        
        this.resetJoystick();
      }
    });
    
    // ポインターがキャンセルされた場合も対応
    this.scene.input.on('pointercancel', (pointer: Phaser.Input.Pointer) => {
      if (this.activePointer && this.activePointer.id === pointer.id) {
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
    if (!this.activePointer) return false;
    return this.pointerDown && this.activePointer.id === pointer.id;
  }
  
  // このジョイスティックが使われているか確認するメソッド
  isActive(): boolean {
    return this.pointerDown;
  }
  
  // 使用中のポインターIDを取得するメソッド
  getActivePointerId(): number | null {
    return this.activePointer ? this.activePointer.id : null;
  }
  
  getTargetWorldPosition(): Phaser.Math.Vector2 | null {
    if (!this.player) return null;

    // 角度とベクトル長を計算
    const angle = this.angle();
    const vecLength = this.length();
    
    // ジョイスティックのベクトル長を正規化して距離にマッピング
    // 最大半径は50なので、vecLength/50が正規化された値(0-1)になる
    const normalizedLength = Math.min(vecLength / 50, 1.0);
    // 投擲距離は300-800の間でマッピング
    const throwDistance = 300 + normalizedLength * 500;
    
    console.log(`ジョイスティック: 角度=${angle}rad, 距離=${throwDistance}px, 正規化長=${normalizedLength}`);

    // プレイヤーの位置から計算した世界座標を返す
    const targetX = this.player.x + Math.cos(angle) * throwDistance;
    const targetY = this.player.y + Math.sin(angle) * throwDistance;
    
    return new Phaser.Math.Vector2(targetX, targetY);
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
    this.base.off('pointerdown');
    this.scene.input.off('pointermove');
    this.scene.input.off('pointerup');
    this.scene.input.off('pointercancel');
    
    // 表示要素を破棄
    this.base.destroy();
    this.thumb.destroy();
    
    // 照準表示も破棄
    if (this.weaponAiming) {
      this.weaponAiming.getGraphics().destroy();
    }
  }
  
  // ジョイスティックの種類を取得
  getJoystickId(): string {
    return this.joystickId;
  }

  update(): void {
    // 前のフレームでアクティブだったか記憶
    const wasActiveLastFrame = this.wasActive;
    
    // アクティブ状態を更新
    this.wasActive = this.isActive();
    
    // アクティブから非アクティブに変わった瞬間を検知
    this.justReleased = wasActiveLastFrame && !this.wasActive;
  }
  
  /**
   * ジョイスティックが離されたかどうかをチェック
   */
  wasReleased(): boolean {
    const released = this.justReleased;
    this.justReleased = false; // チェックしたらリセット
    return released;
  }
}
