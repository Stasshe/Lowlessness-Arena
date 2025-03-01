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
  calculateParabolicTrajectory(
    startX: number, 
    startY: number, 
    angle: number, 
    power: number, 
    gravity: number = 980, 
    steps: number = 20, 
    maxTime: number = 2
  ): Phaser.Math.Vector2[] {
    const points: Phaser.Math.Vector2[] = [];
    
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * maxTime;
      const x = startX + power * Math.cos(angle) * t;
      const y = startY + power * Math.sin(angle) * t + (0.5 * gravity * t * t);
      points.push(new Phaser.Math.Vector2(x, y));
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
  calculateLinearTrajectory(
    startX: number, 
    startY: number, 
    angle: number, 
    distance: number
  ): { start: Phaser.Math.Vector2, end: Phaser.Math.Vector2, angle: number } {
    const endX = startX + Math.cos(angle) * distance;
    const endY = startY + Math.sin(angle) * distance;
    
    return {
      start: new Phaser.Math.Vector2(startX, startY),
      end: new Phaser.Math.Vector2(endX, endY),
      angle: angle
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
  calculateShotgunSpread(
    startX: number, 
    startY: number, 
    angle: number, 
    distance: number, 
    spreadAngle: number = Math.PI/6
  ): { center: Phaser.Math.Vector2, left: Phaser.Math.Vector2, right: Phaser.Math.Vector2 } {
    const leftAngle = angle - spreadAngle;
    const rightAngle = angle + spreadAngle;
    
    return {
      center: new Phaser.Math.Vector2(
        startX + Math.cos(angle) * distance,
        startY + Math.sin(angle) * distance
      ),
      left: new Phaser.Math.Vector2(
        startX + Math.cos(leftAngle) * distance,
        startY + Math.sin(leftAngle) * distance
      ),
      right: new Phaser.Math.Vector2(
        startX + Math.cos(rightAngle) * distance,
        startY + Math.sin(rightAngle) * distance
      )
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
    scene: Phaser.Scene, 
    startX: number, 
    startY: number, 
    endX: number, 
    endY: number, 
    wallLayer: Phaser.Tilemaps.TilemapLayer
  ): Phaser.Math.Vector2 | null {
    // レイキャストを行う
    const line = new Phaser.Geom.Line(startX, startY, endX, endY);
    let hasCollision = false;
    let hitPoint = null;
    
    // タイルとの交差判定
    const tileRay = (wallLayer.tilemapLayer as any).tileRaycast || wallLayer.tilemapLayer.tileRaycast;
    
    if (tileRay) {
      // Phaser 3.55+
      const ray = tileRay.call(wallLayer.tilemapLayer, line);
      if (ray && ray.length > 0) {
        hasCollision = true;
        hitPoint = new Phaser.Math.Vector2(ray[0].point.x, ray[0].point.y);
      }
    } else {
      // 互換性のためのフォールバック
      // タイルマップを線分がカバーする矩形領域でループ
      const dx = endX - startX;
      const dy = endY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const directionX = dx / distance;
      const directionY = dy / distance;
      
      // 少しずつ線をたどる
      const step = 8;
      for (let i = 0; i <= distance; i += step) {
        const x = startX + directionX * i;
        const y = startY + directionY * i;
        
        // 対応するタイルをチェック
        const tile = wallLayer.getTileAtWorldXY(x, y, true);
        if (tile && tile.collides) {
          hasCollision = true;
          hitPoint = new Phaser.Math.Vector2(x, y);
          break;
        }
      }
    }
    
    return hitPoint;
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