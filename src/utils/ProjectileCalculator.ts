import Phaser from 'phaser';

/**
 * 弾道計算を行うユーティリティクラス
 * 様々な武器タイプの軌道を計算
 */
export class ProjectileCalculator {
  
  /**
   * 放物線の軌道を計算する
   * @param startX 開始X座標
   * @param startY 開始Y座標
   * @param angle 発射角度（ラジアン）
   * @param power 発射力
   * @param gravity 重力
   * @param steps 計算ステップ数
   * @param maxTime 最大時間
   * @returns 放物線の軌道座標配列
   */
  calculateParabolicTrajectory(startX: number, startY: number, angle: number, power: number, gravity: number = 980, steps: number = 20, maxTime: number = 2): { x: number, y: number }[] {
    const points: { x: number, y: number }[] = [];
    
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * maxTime;
      const x = startX + power * Math.cos(angle) * t;
      const y = startY + power * Math.sin(angle) * t + (0.5 * gravity * t * t);
      points.push({ x, y });
    }
    
    return points;
  }
  
  /**
   * 直線の軌道を計算する
   * @param startX 開始X座標
   * @param startY 開始Y座標
   * @param angle 方向角度（ラジアン）
   * @param distance 距離
   * @returns 始点と終点の座標
   */
  calculateLinearTrajectory(startX: number, startY: number, angle: number, distance: number): { start: { x: number, y: number }, end: { x: number, y: number } } {
    return {
      start: { x: startX, y: startY },
      end: { 
        x: startX + Math.cos(angle) * distance,
        y: startY + Math.sin(angle) * distance
      }
    };
  }
  
  /**
   * 扇形の範囲を計算する
   * @param startX 中心X座標
   * @param startY 中心Y座標
   * @param angle 中心角度（ラジアン）
   * @param distance 距離
   * @param spreadAngle 広がり角度（ラジアン）
   * @returns 扇形の頂点座標配列
   */
  calculateShotgunSpread(startX: number, startY: number, angle: number, distance: number, spreadAngle: number = Math.PI/6): { 
    center: { x: number, y: number }, 
    left: { x: number, y: number }, 
    right: { x: number, y: number }
  } {
    const leftAngle = angle - spreadAngle;
    const rightAngle = angle + spreadAngle;
    
    return {
      center: { 
        x: startX + Math.cos(angle) * distance,
        y: startY + Math.sin(angle) * distance
      },
      left: { 
        x: startX + Math.cos(leftAngle) * distance,
        y: startY + Math.sin(leftAngle) * distance
      },
      right: { 
        x: startX + Math.cos(rightAngle) * distance,
        y: startY + Math.sin(rightAngle) * distance
      }
    };
  }
  
  /**
   * 着弾点の計算（距離減衰あり）
   * @param distance 距離
   * @param baseDamage 基本ダメージ
   * @param radius 有効半径
   * @returns 計算されたダメージ
   */
  calculateDamageWithFalloff(distance: number, baseDamage: number, radius: number): number {
    if (distance > radius) return 0;
    return baseDamage * (1 - distance / radius);
  }
  
  /**
   * レイキャストによる壁判定
   * @param scene シーン
   * @param startX 開始X座標
   * @param startY 開始Y座標
   * @param endX 終了X座標
   * @param endY 終了Y座標
   * @param wallLayer 壁レイヤー
   * @returns 衝突点の座標（衝突しなかった場合はnull）
   */
  checkRaycastHitWall(
    _scene: Phaser.Scene, // 未使用パラメータにアンダースコアを追加
    startX: number, 
    startY: number, 
    endX: number, 
    endY: number,
    wallLayer?: Phaser.Tilemaps.TilemapLayer
  ): { x: number, y: number } | null {
    if (!wallLayer) return null;
    
    // 線分のタイルとの交差判定
    //const line = new Phaser.Geom.Line(startX, startY, endX, endY);
    const tileXY = wallLayer.worldToTileXY(startX, startY);
    const endTileXY = wallLayer.worldToTileXY(endX, endY);
    
    // 線分のステップで移動しながらタイルの衝突をチェック
    const deltaX = Math.abs(endTileXY.x - tileXY.x);
    const deltaY = Math.abs(endTileXY.y - tileXY.y);
    const steps = Math.max(deltaX, deltaY) * 2;
    
    if (steps === 0) return null;
    
    // dxとdyはLineインターフェースに存在しないので手動で計算
    const dx = endX - startX;
    const dy = endY - startY;
    const stepX = dx / steps;
    const stepY = dy / steps;
    
    // 線分に沿ってチェックポイントを進めながら壁判定
    for (let i = 1; i <= steps; i++) {
      const pointX = startX + (stepX * i);
      const pointY = startY + (stepY * i);
      
      const tile = wallLayer.getTileAtWorldXY(pointX, pointY);
      
      // タイルが存在し、コリジョンがある場合
      if (tile && tile.collides) {
        // 衝突点を若干戻して壁のちょうど手前で止まるようにする
        const backStep = 2; // 2ピクセル手前
        const collisionX = pointX - (stepX / steps) * backStep;
        const collisionY = pointY - (stepY / steps) * backStep;
        
        return { x: collisionX, y: collisionY };
      }
    }
    
    return null; // 衝突なし
  }

  /**
   * 指定範囲内のコリジョンオブジェクトを検出する
   * @param scene シーン
   * @param x 中心X座標
   * @param y 中心Y座標
   * @param radius 検出半径
   * @param objectsGroup 検出対象のオブジェクトグループ
   * @returns 範囲内のオブジェクト配列と距離
   */
  getObjectsInRadius<T extends Phaser.GameObjects.GameObject>(
    _scene: Phaser.Scene, // 未使用パラメータにアンダースコアを追加
    x: number,
    y: number,
    radius: number,
    objectsGroup?: Phaser.Physics.Arcade.Group | T[] | undefined
  ): Array<{ object: T; distance: number }> {
    const result: Array<{ object: T; distance: number }> = [];
    
    if (!objectsGroup) return result;
    
    const objects = Array.isArray(objectsGroup) 
      ? objectsGroup 
      : objectsGroup.getChildren() as T[];
    
    objects.forEach(obj => {
      if (!obj.active) return;
      
      // オブジェクトがx, yプロパティを持っていることを確認
      if ('x' in obj && 'y' in obj) {
        const objX = obj.x as number;
        const objY = obj.y as number;
        
        const distance = Phaser.Math.Distance.Between(x, y, objX, objY);
        
        if (distance <= radius) {
          result.push({ object: obj, distance });
        }
      }
    });
    
    // 距離で昇順ソート
    return result.sort((a, b) => a.distance - b.distance);
  }
  
  /**
   * 2点間の角度を計算
   * @param x1 開始X座標
   * @param y1 開始Y座標
   * @param x2 終了X座標
   * @param y2 終了Y座標
   * @returns 角度（ラジアン）
   */
  calculateAngle(x1: number, y1: number, x2: number, y2: number): number {
    return Math.atan2(y2 - y1, x2 - x1);
  }
  
  /**
   * 投射物の最終位置を予測する
   * @param startX 開始X座標
   * @param startY 開始Y座標
   * @param angle 発射角度（ラジアン）
   * @param power 発射力
   * @param gravity 重力
   * @param maxDistance 最大飛距離
   * @returns 投射物の最終位置
   */
  predictProjectileLanding(
    startX: number,
    startY: number,
    angle: number,
    power: number,
    gravity: number = 980,
    maxDistance: number = 1000
  ): { x: number, y: number } {
    // 水平方向の最大到達距離を計算
    const horizontalDistance = Math.min(
      power * Math.cos(angle) * 2,
      maxDistance
    );
    
    // 水平方向の飛行時間
    const flightTime = horizontalDistance / (power * Math.cos(angle));
    
    // 最終的な着地点のY座標
    const finalY = startY + 
                 power * Math.sin(angle) * flightTime + 
                 0.5 * gravity * flightTime * flightTime;
    
    return {
      x: startX + horizontalDistance,
      y: finalY
    };
  }
}