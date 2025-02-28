import Phaser from 'phaser';

/**
 * Phaser TweenManagerのcreateTimelineメソッドの互換性問題を解決するヘルパー
 * @param scene Phaserシーン
 * @param duration アニメーション完了までの時間（ミリ秒）
 * @returns タイムラインオブジェクトまたは互換性のあるシミュレーション
 */
export function createSafeTimeline(scene: Phaser.Scene, duration: number = 1000): any {
  // 型のチェックを行わない方法で対応（any型を使用）
  const tweens = scene.tweens as any;
  if (tweens.createTimeline) {
    return tweens.createTimeline();
  }
  
  // thisの参照問題を解決するためにselfという変数を使う
  const self = {};
  
  // フォールバック: タイムラインAPIをシミュレート
  return {
    add: (config: any) => {
      scene.tweens.add(config);
      return self;
    },
    play: () => {},
    setCallback: (event: string, callback: Function) => {
      if (event === 'onComplete') {
        scene.time.delayedCall(duration, callback);
      }
      return self;
    }
  };
}

/**
 * 放物線の軌道に沿ってオブジェクトを移動させる
 * @param scene Phaserシーン
 * @param object 移動させるオブジェクト
 * @param points 軌道の点の配列
 * @param duration 移動にかかる時間（ミリ秒）
 * @param onComplete 完了時のコールバック
 */
export function moveAlongPath(
  scene: Phaser.Scene,
  object: Phaser.GameObjects.GameObject, 
  points: Array<{x: number, y: number}>,
  duration: number,
  onComplete?: Function
): void {
  if (points.length < 2) return;
  
  const timeline = createSafeTimeline(scene, duration);
  const timePerSegment = duration / (points.length - 1);
  
  for (let i = 1; i < points.length; i++) {
    const prevPoint = points[i - 1];
    const point = points[i];
    
    // 2点間の角度を計算
    const pointAngle = Math.atan2(
      point.y - prevPoint.y,
      point.x - prevPoint.x
    );
    
    timeline.add({
      targets: object,
      x: point.x,
      y: point.y,
      rotation: pointAngle,
      duration: timePerSegment,
      ease: 'Linear'
    });
  }
  
  if (onComplete) {
    timeline.setCallback('onComplete', onComplete);
  }
  
  timeline.play();
}
