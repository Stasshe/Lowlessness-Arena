import 'phaser';

declare module 'phaser' {
  namespace Sound {
    interface BaseSound {
      // Phaserのサウンドオブジェクトに不足している型定義を追加
      loop?: boolean;
      volume?: number;
      setVolume?(value: number): void;
      _volume?: number;
      _sound?: {
        setVolume?(value: number): void;
      };
    }
  }
  
  namespace Math {
    interface Vector2 {
      // Vector2に明示的にxとyを宣言
      x: number;
      y: number;
    }
  }
}
