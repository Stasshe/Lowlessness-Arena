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
  //private activePointers: Set<number> = new Set(); // アクティブなポインターIDを追跡
  
  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.isMobile = !scene.sys.game.device.os.desktop;
    this.gameEffects = new GameEffects(scene);
    
    // プレイヤーにIDを設定（衝突判定用）
    if (!player.getData('id')) {
      player.setData('id', `player_${Date.now()}`);
      console.log("プレイヤーIDを設定:", player.getData('id'));
    }
    
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
    
    // ジョイスティックスキル用のイベントリスナーを設定
    this.scene.events.on('joystick-skill', (x: number, y: number) => {
      console.log("joystick-skill イベント受信:", x, y);
      this.handleSkillUsage(x, y);
    });
    
    // 複数タッチを有効化
    this.scene.input.addPointer(2); // デフォルトの1ポインター + 2追加で合計3つのタッチポイントを許可
  }

  // スキル使用処理を共通化
  private handleSkillUsage(targetX: number, targetY: number): void {
    if (this.player && this.player.canUseSkill()) {
      console.log("スキル実行処理: ターゲット=", targetX, targetY);
      
      try {
        // プレイヤーにIDが設定されているか確認
        if (!this.player.getData('id')) {
          this.player.setData('id', `player_${Date.now()}`);
          console.log("スキル使用前にプレイヤーIDを設定:", this.player.getData('id'));
        }
        
        // デバッグ用の視覚的フィードバック
        this.scene.add.circle(targetX, targetY, 20, 0xff0000, 0.5)
          .setDepth(100)
          .setAlpha(0.8);
        
        // スキル発動
        const success = this.player.useSkill(targetX, targetY);
        console.log("スキル発動結果:", success ? "成功" : "失敗");
        
        // エフェクトを表示
        this.gameEffects.showSkillEffect(this.player.getSkillType(), targetX, targetY);
        
        // 効果音
        try {
          this.scene.sound.play('skill_activate');
        } catch (e) {
          console.warn("効果音エラー:", e);
        }
        
        // コールバックを呼び出し
        if (this.onSkillUsed) {
          this.onSkillUsed(targetX, targetY);
        }
      } catch (error) {
        console.error("スキル発動中にエラー:", error);
      }
    } else {
      console.log("スキルが使用できません: クールダウン中 or プレイヤーが無効");
    }
  }
  
  private createVirtualJoysticks(): void {
    // 移動用ジョイスティック（左側）
    this.moveJoystick = new VirtualJoystick(this.scene, false);
    
    // スキル用ジョイスティック（右側）
    this.skillJoystick = new VirtualJoystick(this.scene, true, this.player);
  }
  
  private setupAttackInput(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // すでにどちらかのジョイスティックが使用中のポインターなら無視
      if (this.isPointerUsedByJoystick(pointer)) {
        return;
      }
      
      // ジョイスティックエリアでなければ攻撃処理
      if (this.isAttackPointer(pointer)) {
        // プレイヤーにIDが設定されているか確認
        if (!this.player.getData('id')) {
          this.player.setData('id', `player_${Date.now()}`);
        }
        
        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.player.attack(worldPoint.x, worldPoint.y);
        
        // コールバックを呼び出し
        if (this.onAttack) {
          this.onAttack(worldPoint.x, worldPoint.y);
        }
      }
    });
  }
  
  // ポインターがジョイスティックによって使用されているか確認
  private isPointerUsedByJoystick(pointer: Phaser.Input.Pointer): boolean {
    if (this.moveJoystick && this.moveJoystick.isBeingUsed(pointer)) {
      return true;
    }
    if (this.skillJoystick && this.skillJoystick.isBeingUsed(pointer)) {
      return true;
    }
    return false;
  }
  
  // このポインターが攻撃用かどうかを判断
  private isAttackPointer(pointer: Phaser.Input.Pointer): boolean {
    // ジョイスティックエリアでないかを確認
    if (this.moveJoystick) {
      const moveBase = this.moveJoystick.getBase();
      const distToMove = Phaser.Math.Distance.Between(
        moveBase.x, moveBase.y,
        pointer.x, pointer.y
      );
      if (distToMove < moveBase.displayWidth) {
        return false;
      }
    }
    
    if (this.skillJoystick) {
      const skillBase = this.skillJoystick.getBase();
      const distToSkill = Phaser.Math.Distance.Between(
        skillBase.x, skillBase.y,
        pointer.x, pointer.y
      );
      if (distToSkill < skillBase.displayWidth) {
        return false;
      }
    }
    
    return true;
  }
  
  // キーボードのスペースキー処理も共通関数を使用
  private setupKeyboardInput(): void {
    // スキル使用（スペースキー）
    this.scene.input.keyboard!.on('keydown-SPACE', () => {
      const targetAngle = this.player.rotation;
      const targetX = this.player.x + Math.cos(targetAngle) * 200;
      const targetY = this.player.y + Math.sin(targetAngle) * 200;
      
      this.handleSkillUsage(targetX, targetY);
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
      // 使用中の場合のみ移動を適用
      if (this.moveJoystick.isActive()) {
        this.player.move(moveVector.x, moveVector.y);
      } else {
        // ジョイスティックが使われていない場合は停止
        this.player.move(0, 0);
      }
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
      // スキルジョイスティックの使用状態をチェック
      if (this.skillJoystick.wasReleased()) {
        const vectorLength = this.skillJoystick.length();
        // ある程度の長さがあれば、スキルを発動
        if (vectorLength > 0.3) {
          const targetPos = this.skillJoystick.getTargetWorldPosition();
          if (targetPos && this.player.canUseSkill()) {
            console.log("スキル発動ログ: 目標位置=", targetPos.x, targetPos.y);
            
            try {
              // デバッグ用の視覚的フィードバック
              this.scene.add.circle(targetPos.x, targetPos.y, 20, 0xff0000, 0.5)
                .setDepth(100);
              
              // スキル発動
              const success = this.player.useSkill(targetPos.x, targetPos.y);
              console.log("スキル発動結果:", success ? "成功" : "失敗");
              
              // 効果音
              this.scene.sound.play('skill_activate');
              
              // コールバックを呼び出し
              if (this.onSkillUsed) {
                this.onSkillUsed(targetPos.x, targetPos.y);
              }
            } catch (error) {
              console.error("スキル発動中にエラー:", error);
            }
          } else {
            console.log("スキル発動できません: ターゲット=", targetPos, "クールダウン状態=", !this.player.canUseSkill());
          }
        }
      }
    }
    
    // ジョイスティックの状態を更新
    if (this.moveJoystick) {
      this.moveJoystick.update();
    }
    
    if (this.skillJoystick) {
      this.skillJoystick.update();
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
    
    // プレイヤーにIDを設定（衝突判定用）
    if (!player.getData('id')) {
      player.setData('id', `player_${Date.now()}`);
    }
    
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