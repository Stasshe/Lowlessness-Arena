import Phaser from 'phaser';

export interface JoystickConfig {
  x: number;
  y: number;
  radius: number;
  base?: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
  thumb?: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
  fixedPosition?: boolean;
  followCursor?: boolean;
}

export interface JoystickState {
  angle: number;
  distance: number;
  x: number;
  y: number;
  isActive: boolean;
  pointer: Phaser.Input.Pointer | null;
}

/**
 * 複数の入力を同時に処理するためのマネージャークラス
 */
export class InputManager {
  private scene: Phaser.Scene;
  private joysticks: Map<string, {
    config: JoystickConfig;
    state: JoystickState;
    graphics?: Phaser.GameObjects.Graphics;
  }> = new Map();
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  /**
   * ジョイスティックを作成して登録
   */
  createJoystick(id: string, config: JoystickConfig): JoystickState {
    // グラフィックスを作成
    const graphics = this.scene.add.graphics();
    
    // デフォルトのベース円を作成
    let base = config.base;
    if (!base) {
      graphics.fillStyle(0xFFFFFF, 0.5);
      graphics.fillCircle(config.x, config.y, config.radius);
      graphics.lineStyle(2, 0xFFFFFF, 1);
      graphics.strokeCircle(config.x, config.y, config.radius);
      
      base = this.scene.add.arc(config.x, config.y, config.radius, 0, 360, false, 0xFFFFFF, 0);
    }
    
    // デフォルトのサムスティックを作成
    let thumb = config.thumb;
    if (!thumb) {
      const thumbRadius = config.radius * 0.5;
      graphics.fillStyle(0xFFFFFF, 0.8);
      graphics.fillCircle(config.x, config.y, thumbRadius);
      
      thumb = this.scene.add.arc(config.x, config.y, thumbRadius, 0, 360, false, 0xFFFFFF, 0);
    }
    
    // 初期状態を作成
    const state: JoystickState = {
      angle: 0,
      distance: 0,
      x: 0,
      y: 0,
      isActive: false,
      pointer: null
    };
    
    // ジョイスティックを登録
    this.joysticks.set(id, { config, state, graphics });
    
    return state;
  }
  
  /**
   * 入力イベントをセットアップ
   */
  setupEvents(): void {
    // ポインターダウンイベントを設定
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer);
    });
    
    // ポインタームーブイベントを設定
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerMove(pointer);
    });
    
    // ポインターアップイベントを設定
    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerUp(pointer);
    });
  }
  
  /**
   * ポインターダウン時の処理
   */
  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    // 各ジョイスティックをチェック
    for (const [id, joystick] of this.joysticks) {
      // すでにアクティブなものはスキップ
      if (joystick.state.isActive) continue;
      
      const { config } = joystick;
      
      // ポインターが円内にあるかチェック
      const distance = Phaser.Math.Distance.Between(
        config.x, config.y, pointer.x, pointer.y
      );
      
      if (distance <= config.radius || config.followCursor) {
        joystick.state.isActive = true;
        joystick.state.pointer = pointer;
        
        // フォローカーソルモードの場合、ベースを移動
        if (config.followCursor && !config.fixedPosition) {
          config.x = pointer.x;
          config.y = pointer.y;
          
          if (config.base instanceof Phaser.GameObjects.Image || 
              config.base instanceof Phaser.GameObjects.Arc) {
            config.base.setPosition(pointer.x, pointer.y);
          }
          
          if (config.thumb instanceof Phaser.GameObjects.Image || 
              config.thumb instanceof Phaser.GameObjects.Arc) {
            config.thumb.setPosition(pointer.x, pointer.y);
          }
          
          if (joystick.graphics) {
            joystick.graphics.clear();
            joystick.graphics.fillStyle(0xFFFFFF, 0.5);
            joystick.graphics.fillCircle(pointer.x, pointer.y, config.radius);
            joystick.graphics.lineStyle(2, 0xFFFFFF, 1);
            joystick.graphics.strokeCircle(pointer.x, pointer.y, config.radius);
            
            const thumbRadius = config.radius * 0.5;
            joystick.graphics.fillStyle(0xFFFFFF, 0.8);
            joystick.graphics.fillCircle(pointer.x, pointer.y, thumbRadius);
          }
        }
        
        break; // 1つのポインターにつき最初に見つかったジョイスティックのみ処理
      }
    }
  }
  
  /**
   * ポインタームーブ時の処理
   */
  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    // 各ジョイスティックをチェック
    for (const [id, joystick] of this.joysticks.entries()) { // id変数を使わないように修正
      const { state, config } = joystick;
      
      // このポインターが制御しているジョイスティックのみ処理
      if (state.isActive && state.pointer && state.pointer.id === pointer.id) {
        // ジョイスティックの中心からポインターまでの距離と角度を計算
        const distance = Phaser.Math.Distance.Between(
          config.x, config.y, pointer.x, pointer.y
        );
        
        // ジョイスティックの範囲内に収める
        const limitedDistance = Math.min(distance, config.radius);
        
        // 角度を計算
        const angle = Math.atan2(pointer.y - config.y, pointer.x - config.x);
        
        // サムスティックの位置を計算
        const thumbX = config.x + Math.cos(angle) * limitedDistance;
        const thumbY = config.y + Math.sin(angle) * limitedDistance;
        
        // サムスティックを移動
        if (config.thumb instanceof Phaser.GameObjects.Image || 
            config.thumb instanceof Phaser.GameObjects.Arc) {
          config.thumb.setPosition(thumbX, thumbY);
        }
        
        // グラフィックスの更新
        if (joystick.graphics) {
          joystick.graphics.clear();
          // ベース円
          joystick.graphics.fillStyle(0xFFFFFF, 0.5);
          joystick.graphics.fillCircle(config.x, config.y, config.radius);
          joystick.graphics.lineStyle(2, 0xFFFFFF, 1);
          joystick.graphics.strokeCircle(config.x, config.y, config.radius);
          
          // サムスティック
          const thumbRadius = config.radius * 0.5;
          joystick.graphics.fillStyle(0xFFFFFF, 0.8);
          joystick.graphics.fillCircle(thumbX, thumbY, thumbRadius);
        }
        
        // 状態を更新
        state.angle = angle;
        state.distance = limitedDistance;
        state.x = Math.cos(angle) * (limitedDistance / config.radius);
        state.y = Math.sin(angle) * (limitedDistance / config.radius);
        
        // カスタムイベントを発火
        this.scene.events.emit(`joystick-${id}-move`, state);
      }
    }
  }
  
  /**
   * ポインターアップ時の処理
   */
  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    // 各ジョイスティックをチェック
    for (const [id, joystick] of this.joysticks.entries()) {
      const { state, config } = joystick;
      
      // このポインターが制御しているジョイスティックのみリセット
      if (state.isActive && state.pointer && state.pointer.id === pointer.id) {
        state.isActive = false;
        state.pointer = null;
        state.angle = 0;
        state.distance = 0;
        state.x = 0;
        state.y = 0;
        
        // サムスティックを中心に戻す
        if (config.thumb instanceof Phaser.GameObjects.Image || 
            config.thumb instanceof Phaser.GameObjects.Arc) {
          config.thumb.setPosition(config.x, config.y);
        }
        
        // グラフィックスの更新
        if (joystick.graphics) {
          joystick.graphics.clear();
          // ベース円
          joystick.graphics.fillStyle(0xFFFFFF, 0.5);
          joystick.graphics.fillCircle(config.x, config.y, config.radius);
          joystick.graphics.lineStyle(2, 0xFFFFFF, 1);
          joystick.graphics.strokeCircle(config.x, config.y, config.radius);
          
          // サムスティック（中央）
          const thumbRadius = config.radius * 0.5;
          joystick.graphics.fillStyle(0xFFFFFF, 0.8);
          joystick.graphics.fillCircle(config.x, config.y, thumbRadius);
        }
        
        // カスタムイベントを発火
        this.scene.events.emit(`joystick-${id}-release`, state);
      }
    }
  }
  
  /**
   * 特定のジョイスティックの状態を取得
   */
  getJoystickState(id: string): JoystickState | undefined {
    return this.joysticks.get(id)?.state;
  }
  
  /**
   * すべてのジョイスティックの状態をリセット
   */
  resetAll(): void {
    for (const [id, joystick] of this.joysticks.entries()) {
      const { state, config } = joystick;
      
      state.isActive = false;
      state.pointer = null;
      state.angle = 0;
      state.distance = 0;
      state.x = 0;
      state.y = 0;
      
      // サムスティックを中心に戻す
      if (config.thumb instanceof Phaser.GameObjects.Image || 
          config.thumb instanceof Phaser.GameObjects.Arc) {
        config.thumb.setPosition(config.x, config.y);
      }
      
      // グラフィックスの更新
      if (joystick.graphics) {
        joystick.graphics.clear();
        // ベース円
        joystick.graphics.fillStyle(0xFFFFFF, 0.5);
        joystick.graphics.fillCircle(config.x, config.y, config.radius);
        joystick.graphics.lineStyle(2, 0xFFFFFF, 1);
        joystick.graphics.strokeCircle(config.x, config.y, config.radius);
        
        // サムスティック（中央）
        const thumbRadius = config.radius * 0.5;
        joystick.graphics.fillStyle(0xFFFFFF, 0.8);
        joystick.graphics.fillCircle(config.x, config.y, thumbRadius);
      }
      
      // カスタムイベントを発火
      this.scene.events.emit(`joystick-${id}-release`, state);
    }
  }
  
  /**
   * 特定のジョイスティックのグラフィックスを表示/非表示
   */
  setJoystickVisibility(id: string, visible: boolean): void {
    const joystick = this.joysticks.get(id);
    if (joystick) {
      if (joystick.graphics) {
        joystick.graphics.setVisible(visible);
      }
      
      if (joystick.config.base instanceof Phaser.GameObjects.Image || 
          joystick.config.base instanceof Phaser.GameObjects.Arc) {
        joystick.config.base.setVisible(visible);
      }
      
      if (joystick.config.thumb instanceof Phaser.GameObjects.Image || 
          joystick.config.thumb instanceof Phaser.GameObjects.Arc) {
        joystick.config.thumb.setVisible(visible);
      }
    }
  }
  
  /**
   * ジョイスティックの位置を変更する
   */
  updateJoystickPosition(id: string, x: number, y: number): void {
    const joystick = this.joysticks.get(id);
    if (joystick) {
      const { config } = joystick;
      
      config.x = x;
      config.y = y;
      
      if (config.base instanceof Phaser.GameObjects.Image || 
          config.base instanceof Phaser.GameObjects.Arc) {
        config.base.setPosition(x, y);
      }
      
      if (!joystick.state.isActive) {
        if (config.thumb instanceof Phaser.GameObjects.Image || 
            config.thumb instanceof Phaser.GameObjects.Arc) {
          config.thumb.setPosition(x, y);
        }
      }
      
      if (joystick.graphics && !joystick.state.isActive) {
        joystick.graphics.clear();
        // ベース円
        joystick.graphics.fillStyle(0xFFFFFF, 0.5);
        joystick.graphics.fillCircle(x, y, config.radius);
        joystick.graphics.lineStyle(2, 0xFFFFFF, 1);
        joystick.graphics.strokeCircle(x, y, config.radius);
        
        // サムスティック（中央）
        const thumbRadius = config.radius * 0.5;
        joystick.graphics.fillStyle(0xFFFFFF, 0.8);
        joystick.graphics.fillCircle(x, y, thumbRadius);
      }
    }
  }
  
  /**
   * クリーンアップ
   */
  destroy(): void {
    // イベントリスナーを削除
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointermove');
    this.scene.input.off('pointerup');
    
    // グラフィックスを削除
    for (const [id, joystick] of this.joysticks.entries()) {
      if (joystick.graphics) {
        joystick.graphics.destroy();
      }
      
      if (joystick.config.base instanceof Phaser.GameObjects.Image || 
          joystick.config.base instanceof Phaser.GameObjects.Arc) {
        joystick.config.base.destroy();
      }
      
      if (joystick.config.thumb instanceof Phaser.GameObjects.Image || 
          joystick.config.thumb instanceof Phaser.GameObjects.Arc) {
        joystick.config.thumb.destroy();
      }
    }
    
    // マップをクリア
    this.joysticks.clear();
  }
}