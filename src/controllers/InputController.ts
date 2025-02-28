import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { VirtualJoystick } from '../utils/VirtualJoystick';
import { GameEffects } from '../utils/GameEffects';

export class InputController {
  private scene: Phaser.Scene;
  private player: Player;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveJoystick?: VirtualJoystick;
  private skillJoystick?: VirtualJoystick;
  private isMobile: boolean;
  private gameEffects: GameEffects;
  private onSkillUsed?: (targetX: number, targetY: number) => void;
  private onUltimateUsed?: () => void;
  private onAttack?: (targetX: number, targetY: number) => void;
  
  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.isMobile = !scene.sys.game.device.os.desktop;
    this.gameEffects = new GameEffects(scene);
    
    // キーボード入力の設定
    this.cursors = scene.input.keyboard!.createCursorKeys();
    
    // モバイルの場合はジョイスティックを作成
    if (this.isMobile) {
      this.createVirtualJoysticks();
    }
    
    // クリック/タップ攻撃の設定
    this.setupAttackInput();
    
    // キーボードスキル入力の設定
    this.setupKeyboardInput();
  }
  
  private createVirtualJoysticks(): void {
    // 移動用ジョイスティック（左側）
    this.moveJoystick = new VirtualJoystick(this.scene, false);
    
    // スキル用ジョイスティック（右側）
    this.skillJoystick = new VirtualJoystick(this.scene, true, this.player);
  }
  
  private setupAttackInput(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // ジョイスティックの操作でない場合のみ攻撃として処理
      if ((!this.moveJoystick || !this.moveJoystick.isBeingUsed(pointer)) && 
          (!this.skillJoystick || !this.skillJoystick.isBeingUsed(pointer))) {
        
        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.player.attack(worldPoint.x, worldPoint.y);
        
        // コールバックを呼び出し
        if (this.onAttack) {
          this.onAttack(worldPoint.x, worldPoint.y);
        }
      }
    });
  }
  
  private setupKeyboardInput(): void {
    // スキル使用（スペースキー）
    this.scene.input.keyboard!.on('keydown-SPACE', () => {
      if (this.player.canUseSkill()) {
        const targetAngle = this.player.rotation;
        const targetX = this.player.x + Math.cos(targetAngle) * 200;
        const targetY = this.player.y + Math.sin(targetAngle) * 200;
        
        this.player.useSkill(targetX, targetY);
        this.gameEffects.showSkillEffect(this.player.getSkillType(), targetX, targetY);
        
        // コールバックを呼び出し
        if (this.onSkillUsed) {
          this.onSkillUsed(targetX, targetY);
        }
      }
    });
    
    // アルティメットスキル（Qキー）
    this.scene.input.keyboard!.on('keydown-Q', () => {
      if (this.player.canUseUltimate()) {
        this.player.useUltimate();
        
        // コールバックを呼び出し
        if (this.onUltimateUsed) {
          this.onUltimateUsed();
        }
      }
    });
  }
  
  update(): void {
    // プレイヤーがなければ処理しない
    if (!this.player) return;
    
    // モバイルジョイスティックによる移動
    if (this.moveJoystick) {
      const moveVector = this.moveJoystick.getVector();
      this.player.move(moveVector.x, moveVector.y);
    } else {
      // キーボードによる移動
      const directionX = Number(this.cursors.right.isDown || this.scene.input.keyboard!.addKey('D').isDown) -
                         Number(this.cursors.left.isDown || this.scene.input.keyboard!.addKey('A').isDown);
      const directionY = Number(this.cursors.down.isDown || this.scene.input.keyboard!.addKey('S').isDown) -
                         Number(this.cursors.up.isDown || this.scene.input.keyboard!.addKey('W').isDown);
                         
      this.player.move(directionX, directionY);
    }
    
    // スキルジョイスティックの処理
    if (this.skillJoystick) {
      // ベクトルの長さをチェック
      const vectorLength = this.skillJoystick.length();
      
      // スキルジョイスティックが離された時にスキル発動
      if (vectorLength > 0.5 && !this.skillJoystick.isBeingUsed(this.scene.input.activePointer)) {
        const targetPos = this.skillJoystick.getTargetWorldPosition();
        if (targetPos && this.player.canUseSkill()) {
          this.player.useSkill(targetPos.x, targetPos.y);
          
          // コールバックを呼び出し
          if (this.onSkillUsed) {
            this.onSkillUsed(targetPos.x, targetPos.y);
          }
        }
      }
    }
  }
  
  // イベントリスナーを設定
  onSkill(callback: (targetX: number, targetY: number) => void): void {
    this.onSkillUsed = callback;
  }
  
  onUltimate(callback: () => void): void {
    this.onUltimateUsed = callback;
  }
  
  onAttackUsed(callback: (targetX: number, targetY: number) => void): void {
    this.onAttack = callback;
  }
  
  // プレイヤーの参照を更新
  setPlayer(player: Player): void {
    this.player = player;
    
    // スキルジョイスティックがあれば更新
    if (this.skillJoystick) {
      // これでエラーが解消されます
      this.skillJoystick.setPlayer(player);
    }
  }
  
  // 移動ジョイスティックの取得
  getMoveJoystick(): VirtualJoystick | undefined {
    return this.moveJoystick;
  }
  
  // スキルジョイスティックの取得
  getSkillJoystick(): VirtualJoystick | undefined {
    return this.skillJoystick;
  }
  
  // キーボードの設定が変更された場合の更新
  updateKeyboardControls(newControls: Phaser.Types.Input.Keyboard.CursorKeys): void {
    this.cursors = newControls;
  }
  
  // マウスやタッチの有効・無効を切り替え
  setPointerEnabled(enabled: boolean): void {
    if (enabled) {
      this.setupAttackInput();
    } else {
      this.scene.input.off('pointerdown');
    }
  }
  
  // ジョイスティックの有効・無効を切り替え
  setJoysticksEnabled(enabled: boolean): void {
    if (enabled && this.isMobile) {
      if (!this.moveJoystick) {
        this.createVirtualJoysticks();
      }
    } else {
      if (this.moveJoystick) {
        this.moveJoystick.destroy();
        this.moveJoystick = undefined;
      }
      
      if (this.skillJoystick) {
        this.skillJoystick.destroy();
        this.skillJoystick = undefined;
      }
    }
  }
  
  // リソースを解放
  destroy(): void {
    // イベントリスナーを解除
    this.scene.input.off('pointerdown');
    
    // キーボードのリスナーを解除
    this.scene.input.keyboard!.off('keydown-SPACE');
    this.scene.input.keyboard!.off('keydown-Q');
    
    // ジョイスティックを解放
    if (this.moveJoystick) {
      this.moveJoystick.destroy();
      this.moveJoystick = undefined;
    }
    
    if (this.skillJoystick) {
      this.skillJoystick.destroy();
      this.skillJoystick = undefined;
    }
  }
}