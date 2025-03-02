import Phaser from 'phaser';
import { ProjectileCalculator } from './ProjectileCalculator';
import { WeaponType } from './WeaponTypes';
import { SkillType } from '../objects/Player';

// 照準表示のスタイル設定
export interface AimingConfig {
  lineColor: number;
  lineAlpha: number;
  fillColor: number;
  fillAlpha: number;
  lineWidth: number;
  maxDistance: number;
  showTrajectory: boolean;
}

/**
 * 武器の照準と軌道表示を管理するクラス
 */
export class WeaponAiming {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private calculator: ProjectileCalculator;
  private config: AimingConfig;
  private wallLayer?: Phaser.Tilemaps.TilemapLayer;
  
  constructor(scene: Phaser.Scene, calculator: ProjectileCalculator, config?: Partial<AimingConfig>) {
    this.scene = scene;
    this.calculator = calculator;
    this.graphics = scene.add.graphics();
    
    // デフォルト設定
    this.config = {
      lineColor: 0xffffff,
      lineAlpha: 0.7,
      fillColor: 0xff0000,
      fillAlpha: 0.5,
      lineWidth: 2,
      maxDistance: 500,
      showTrajectory: true,
      ...config
    };
  }
  
  /**
   * 壁レイヤーを設定
   */
  setWallLayer(layer: Phaser.Tilemaps.TilemapLayer): void {
    this.wallLayer = layer;
  }
  
  /**
   * 照準の表示設定を更新
   */
  updateConfig(config: Partial<AimingConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * 照準表示をクリア
   */
  clear(): void {
    this.graphics.clear();
  }
  
  /**
   * 武器タイプに基づいた照準を表示
   */
  showAiming(
    startX: number, 
    startY: number, 
    angle: number, 
    joystickDistance: number, 
    weaponType: WeaponType
  ): { targetPoint: Phaser.Math.Vector2, trajectoryPoints?: Phaser.Math.Vector2[] } {
    this.graphics.clear();
    
    this.graphics.lineStyle(this.config.lineWidth, this.config.lineColor, this.config.lineAlpha);
    this.graphics.fillStyle(this.config.fillColor, this.config.fillAlpha);
    
    let result: { targetPoint: Phaser.Math.Vector2, trajectoryPoints?: Phaser.Math.Vector2[] };
    
    switch(weaponType) {
      case WeaponType.SNIPER:
        result = this.showSniperAiming(startX, startY, angle);
        break;
      case WeaponType.SHOTGUN:
        result = this.showShotgunAiming(startX, startY, angle);
        break;
      case WeaponType.THROWER:
        result = this.showThrowerAiming(startX, startY, angle, joystickDistance);
        break;
      case WeaponType.BOMB:
        result = this.showBombAiming(startX, startY, angle, joystickDistance);
        break;
      case WeaponType.MACHINEGUN:
        result = this.showMachineGunAiming(startX, startY, angle);
        break;
      case WeaponType.SLING:
        // スリング用の特別照準（Bomberキャラクター用）
        result = this.showSlingAiming(startX, startY, angle, joystickDistance);
        break;
      default:
        result = this.showDefaultAiming(startX, startY, angle);
        break;
    }
    
    return result;
  }
  
  /**
   * デフォルト武器の照準表示
   */
  private showDefaultAiming(startX: number, startY: number, angle: number): { targetPoint: Phaser.Math.Vector2 } {
    const distance = this.config.maxDistance * 0.6;
    const trajectory = this.calculator.calculateLinearTrajectory(startX, startY, angle, distance);
    
    let endPoint = new Phaser.Math.Vector2(trajectory.end.x, trajectory.end.y);
    
    // 壁判定
    if (this.wallLayer) {
      const hitPoint = this.calculator.checkRaycastHitWall(
        this.scene, startX, startY, trajectory.end.x, trajectory.end.y, this.wallLayer
      );
      
      if (hitPoint) {
        endPoint = new Phaser.Math.Vector2(hitPoint.x, hitPoint.y);
      }
    }
    
    // 照準線を描画
    this.graphics.lineBetween(startX, startY, endPoint.x, endPoint.y);
    
    // 照準ポイントを描画
    this.graphics.fillCircle(endPoint.x, endPoint.y, 5);
    
    return { targetPoint: endPoint };
  }
  
  /**
   * スナイパーの照準表示
   */
  private showSniperAiming(startX: number, startY: number, angle: number): { targetPoint: Phaser.Math.Vector2 } {
    const distance = this.config.maxDistance * 1.5; // スナイパーは射程が長い
    const trajectory = this.calculator.calculateLinearTrajectory(startX, startY, angle, distance);
    
    let endPoint = new Phaser.Math.Vector2(trajectory.end.x, trajectory.end.y);
    
    // 壁判定
    if (this.wallLayer) {
      const hitPoint = this.calculator.checkRaycastHitWall(
        this.scene, startX, startY, trajectory.end.x, trajectory.end.y, this.wallLayer
      );
      
      if (hitPoint) {
        endPoint = new Phaser.Math.Vector2(hitPoint.x, hitPoint.y);
      }
    }
    
    // レーザーサイトのような点線を描画
    const dashLength = 10;
    const gapLength = 5;
    const lineLength = Phaser.Math.Distance.Between(startX, startY, endPoint.x, endPoint.y);
    const segments = Math.floor(lineLength / (dashLength + gapLength));
    
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);
    
    for (let i = 0; i < segments; i++) {
      const startDash = i * (dashLength + gapLength);
      const dashX1 = startX + directionX * startDash;
      const dashY1 = startY + directionY * startDash;
      const dashX2 = startX + directionX * (startDash + dashLength);
      const dashY2 = startY + directionY * (startDash + dashLength);
      
      this.graphics.lineBetween(dashX1, dashY1, dashX2, dashY2);
    }
    
    // スコープ的な円を描画
    this.graphics.lineStyle(1, this.config.lineColor, this.config.lineAlpha);
    this.graphics.strokeCircle(endPoint.x, endPoint.y, 15);
    this.graphics.strokeCircle(endPoint.x, endPoint.y, 5);
    
    // 照準線の交差
    this.graphics.lineBetween(endPoint.x - 20, endPoint.y, endPoint.x + 20, endPoint.y);
    this.graphics.lineBetween(endPoint.x, endPoint.y - 20, endPoint.x, endPoint.y + 20);
    
    return { targetPoint: endPoint };
  }
  
  /**
   * ショットガンの照準表示
   */
  private showShotgunAiming(startX: number, startY: number, angle: number): { targetPoint: Phaser.Math.Vector2 } {
    const distance = this.config.maxDistance * 0.4; // ショットガンは射程が短い
    const spreadAngle = Math.PI / 6; // 30度の拡散
    
    const spread = this.calculator.calculateShotgunSpread(
      startX, startY, angle, distance, spreadAngle
    );
    
    // 中央の照準点
    let centerPoint = new Phaser.Math.Vector2(spread.center.x, spread.center.y);
    
    // 壁判定
    if (this.wallLayer) {
      const hitPoint = this.calculator.checkRaycastHitWall(
        this.scene, startX, startY, spread.center.x, spread.center.y, this.wallLayer
      );
      
      if (hitPoint) {
        centerPoint = new Phaser.Math.Vector2(hitPoint.x, hitPoint.y);
      }
    }
    
    // 扇状の範囲を描画
    const arcRadius = Phaser.Math.Distance.Between(startX, startY, centerPoint.x, centerPoint.y);
    const startAngle = angle - spreadAngle;
    const endAngle = angle + spreadAngle;
    
    // 扇形を描画
    this.graphics.beginPath();
    this.graphics.moveTo(startX, startY);
    this.graphics.lineTo(
      startX + Math.cos(startAngle) * arcRadius,
      startY + Math.sin(startAngle) * arcRadius
    );
    this.graphics.arc(startX, startY, arcRadius, startAngle, endAngle);
    this.graphics.lineTo(startX, startY);
    this.graphics.closePath();
    this.graphics.fillPath();
    this.graphics.strokePath();
    
    return { targetPoint: centerPoint };
  }
  
  /**
   * 投擲武器の照準表示
   */
  private showThrowerAiming(
    startX: number, 
    startY: number, 
    angle: number, 
    joystickDistance: number
  ): { targetPoint: Phaser.Math.Vector2, trajectoryPoints: Phaser.Math.Vector2[] } {
    // ジョイスティックの距離に応じて発射力を調整
    const normalizedDistance = Math.min(joystickDistance / 100, 1);
    const power = 300 + normalizedDistance * 500; // 300-800の範囲で変化
    
    // 放物線の軌道を計算
    const trajectoryPoints = this.calculator.calculateParabolicTrajectory(
      startX, startY, angle, power, 980, 20, 2
    );
    
    // 壁との衝突判定
    let endPoint: Phaser.Math.Vector2 | null = null;
    let endPointIndex = trajectoryPoints.length - 1;
    
    if (this.wallLayer) {
      for (let i = 1; i < trajectoryPoints.length; i++) {
        const prevPoint = trajectoryPoints[i - 1];
        const currentPoint = trajectoryPoints[i];
        
        const hitPoint = this.calculator.checkRaycastHitWall(
          this.scene, prevPoint.x, prevPoint.y, currentPoint.x, currentPoint.y, this.wallLayer
        );
        
        if (hitPoint) {
          endPoint = new Phaser.Math.Vector2(hitPoint.x, hitPoint.y);
          endPointIndex = i;
          break;
        }
      }
    }
    
    if (!endPoint) {
      const lastPoint = trajectoryPoints[trajectoryPoints.length - 1];
      endPoint = new Phaser.Math.Vector2(lastPoint.x, lastPoint.y);
    }
    
    // 有効な軌道点のみを使用
    const validTrajectoryPoints = trajectoryPoints.slice(0, endPointIndex + 1);
    
    // 放物線を描画
    if (this.config.showTrajectory) {
      for (let i = 1; i < validTrajectoryPoints.length; i++) {
        const prevPoint = validTrajectoryPoints[i - 1];
        const currentPoint = validTrajectoryPoints[i];
        this.graphics.lineBetween(prevPoint.x, prevPoint.y, currentPoint.x, currentPoint.y);
      }
    }
    
    // 着弾地点を描画
    this.graphics.fillCircle(endPoint.x, endPoint.y, 8);
    
    // 着弾範囲を示す円を描画
    this.graphics.strokeCircle(endPoint.x, endPoint.y, 30);
    
    // ベクトル配列に変換
    const vectorPoints = validTrajectoryPoints.map(p => new Phaser.Math.Vector2(p.x, p.y));
    
    return { 
      targetPoint: endPoint,
      trajectoryPoints: vectorPoints
    };
  }
  
  /**
   * スリングショット（投石）の照準表示
   */
  private showSlingAiming(
    startX: number, 
    startY: number, 
    angle: number, 
    joystickDistance: number
  ): { targetPoint: Phaser.Math.Vector2, trajectoryPoints: Phaser.Math.Vector2[] } {
    // ジョイスティックの距離に応じて発射力を調整
    const normalizedDistance = Math.min(joystickDistance / 100, 1);
    const power = 300 + normalizedDistance * 300; // 300-600の範囲で変化
    
    // 放物線の軌道を計算（重力を大きくして弧を強調）
    const trajectoryPoints = this.calculator.calculateParabolicTrajectory(
      startX, startY, angle, power, 880, 15, 1.0
    );
    
    // 軌道の中間点（頂点付近）を取得してゴムの引っ張り表現に使用
    const middleIndex = Math.floor(trajectoryPoints.length / 2);
    const middlePoint = trajectoryPoints[middleIndex];
    
    // 軌道を描画
    if (this.config.showTrajectory) {
      // 軌道を点線で表示
      for (let i = 1; i < trajectoryPoints.length; i++) {
        const prevPoint = trajectoryPoints[i - 1];
        const currentPoint = trajectoryPoints[i];
        
        // 破線効果
        if (i % 2 === 0) {
          this.graphics.lineBetween(prevPoint.x, prevPoint.y, currentPoint.x, currentPoint.y);
        }
      }
    }
    
    // スリングのゴム紐表現
    this.graphics.lineStyle(1, 0xff8800, 0.7);
    this.graphics.lineBetween(startX - 10, startY, middlePoint.x, middlePoint.y);
    this.graphics.lineBetween(startX + 10, startY, middlePoint.x, middlePoint.y);
    
    // 着弾地点
    const endPoint = trajectoryPoints[trajectoryPoints.length - 1];
    
    // 着弾地点を描画
    this.graphics.fillStyle(0xffaa00, 0.8);
    this.graphics.fillCircle(endPoint.x, endPoint.y, 5);
    
    // 照準円を描画
    this.graphics.lineStyle(1, 0xffaa00, 0.5);
    this.graphics.strokeCircle(endPoint.x, endPoint.y, 15);
    
    return {
      targetPoint: new Phaser.Math.Vector2(endPoint.x, endPoint.y),
      trajectoryPoints: trajectoryPoints
    };
  }
  
  /**
   * 爆弾の照準表示
   */
  private showBombAiming(startX: number, startY: number, angle: number, joystickDistance: number): { targetPoint: Phaser.Math.Vector2 } {
    // 爆弾は短い距離のみ
    const distance = Math.min(this.config.maxDistance * 0.3, joystickDistance * 2);
    const trajectory = this.calculator.calculateLinearTrajectory(startX, startY, angle, distance);
    
    let endPoint = new Phaser.Math.Vector2(trajectory.end.x, trajectory.end.y);
    
    // 爆発範囲を示す円を描画
    this.graphics.strokeCircle(endPoint.x, endPoint.y, 50);
    this.graphics.fillCircle(endPoint.x, endPoint.y, 10);
    
    // 中心からのラインを描画
    this.graphics.lineBetween(startX, startY, endPoint.x, endPoint.y);
    
    return { targetPoint: endPoint };
  }
  
  /**
   * マシンガンの照準表示
   */
  private showMachineGunAiming(startX: number, startY: number, angle: number): { targetPoint: Phaser.Math.Vector2 } {
    const distance = this.config.maxDistance * 0.8;
    const trajectory = this.calculator.calculateLinearTrajectory(startX, startY, angle, distance);
    
    let endPoint = new Phaser.Math.Vector2(trajectory.end.x, trajectory.end.y);
    
    // 壁判定
    if (this.wallLayer) {
      const hitPoint = this.calculator.checkRaycastHitWall(
        this.scene, startX, startY, trajectory.end.x, trajectory.end.y, this.wallLayer
      );
      
      if (hitPoint) {
        endPoint = new Phaser.Math.Vector2(hitPoint.x, hitPoint.y);
      }
    }
    
    // 照準線を描画
    this.graphics.lineBetween(startX, startY, endPoint.x, endPoint.y);
    
    // 照準マークを描画 (クロスヘア風)
    const size = 12;
    this.graphics.strokeCircle(endPoint.x, endPoint.y, size);
    this.graphics.lineBetween(endPoint.x - size, endPoint.y, endPoint.x + size, endPoint.y);
    this.graphics.lineBetween(endPoint.x, endPoint.y - size, endPoint.x, endPoint.y + size);
    
    return { targetPoint: endPoint };
  }
  
  /**
   * グラフィックスレイヤーを取得
   */
  getGraphics(): Phaser.GameObjects.Graphics {
    return this.graphics;
  }
  
  /**
   * スキル照準を表示
   */
  showSkillAiming(
    startX: number, 
    startY: number, 
    angle: number, 
    joystickDistance: number,
    skillType: string | SkillType
  ): { targetPoint: Phaser.Math.Vector2, area?: Phaser.Geom.Circle | Phaser.Geom.Rectangle } {
    this.graphics.clear();
    this.graphics.lineStyle(this.config.lineWidth, 0x00ffff, this.config.lineAlpha);
    this.graphics.fillStyle(0x00ffff, 0.3);
    
    // スキルタイプに基づいて異なる照準を表示
    switch(skillType) {
      case SkillType.DASH:
        return this.showDashSkillAiming(startX, startY, angle, joystickDistance);
      case SkillType.SHIELD:
        return this.showShieldSkillAiming(startX, startY);
      case SkillType.HEAL:
        return this.showHealSkillAiming(startX, startY);
      case SkillType.SCOPE:
        return this.showScopeSkillAiming(startX, startY, angle);
      case SkillType.BOMB:
        return this.showBombSkillAiming(startX, startY, angle, joystickDistance);
      case SkillType.MINEFIELD:
        return this.showMinefieldSkillAiming(startX, startY);
      default:
        return this.showDefaultSkillAiming(startX, startY);
    }
  }
  
  private showDefaultSkillAiming(startX: number, startY: number): { targetPoint: Phaser.Math.Vector2, area: Phaser.Geom.Circle } {
    const radius = 50;
    this.graphics.strokeCircle(startX, startY, radius);
    this.graphics.fillCircle(startX, startY, radius);
    
    return { 
      targetPoint: new Phaser.Math.Vector2(startX, startY),
      area: new Phaser.Geom.Circle(startX, startY, radius)
    };
  }
  
  private showDashSkillAiming(
    startX: number, 
    startY: number, 
    angle: number, 
    joystickDistance: number
  ): { targetPoint: Phaser.Math.Vector2 } {
    const dashDistance = Math.min(200, joystickDistance * 3);
    const endX = startX + Math.cos(angle) * dashDistance;
    const endY = startY + Math.sin(angle) * dashDistance;
    
    // 矢印を描画
    this.graphics.lineBetween(startX, startY, endX, endY);
    
    // 矢印の先端
    const arrowSize = 10;
    const arrowAngle1 = angle + Math.PI * 0.8;
    const arrowAngle2 = angle - Math.PI * 0.8;
    
    this.graphics.lineBetween(
      endX, endY,
      endX + Math.cos(arrowAngle1) * arrowSize,
      endY + Math.sin(arrowAngle1) * arrowSize
    );
    
    this.graphics.lineBetween(
      endX, endY,
      endX + Math.cos(arrowAngle2) * arrowSize,
      endY + Math.sin(arrowAngle2) * arrowSize
    );
    
    return { targetPoint: new Phaser.Math.Vector2(endX, endY) };
  }
  
  private showShieldSkillAiming(startX: number, startY: number): { targetPoint: Phaser.Math.Vector2, area: Phaser.Geom.Circle } {
    const radius = 50;
    
    // 盾のような円を描画
    this.graphics.strokeCircle(startX, startY, radius);
    
    // 内側の円も描画
    this.graphics.lineStyle(3, 0x00ffff, 0.5);
    this.graphics.strokeCircle(startX, startY, radius * 0.7);
    
    return { 
      targetPoint: new Phaser.Math.Vector2(startX, startY),
      area: new Phaser.Geom.Circle(startX, startY, radius)
    };
  }
  
  private showHealSkillAiming(startX: number, startY: number): { targetPoint: Phaser.Math.Vector2, area: Phaser.Geom.Circle } {
    const radius = 80;
    
    // 回復エリアを描画
    this.graphics.strokeCircle(startX, startY, radius);
    this.graphics.fillCircle(startX, startY, radius);
    
    // 十字マーク
    this.graphics.lineStyle(4, 0xffffff, 0.8);
    const crossSize = radius * 0.5;
    this.graphics.lineBetween(startX, startY - crossSize, startX, startY + crossSize);
    this.graphics.lineBetween(startX - crossSize, startY, startX + crossSize, startY);
    
    return { 
      targetPoint: new Phaser.Math.Vector2(startX, startY),
      area: new Phaser.Geom.Circle(startX, startY, radius)
    };
  }
  
  private showScopeSkillAiming(
    startX: number, 
    startY: number, 
    angle: number
  ): { targetPoint: Phaser.Math.Vector2 } {
    const distance = this.config.maxDistance * 1.5;
    const endX = startX + Math.cos(angle) * distance;
    const endY = startY + Math.sin(angle) * distance;
    
    // スコープの視界を描画
    const leftAngle = angle - 0.1;
    const rightAngle = angle + 0.1;
    
    this.graphics.beginPath();
    this.graphics.moveTo(startX, startY);
    this.graphics.lineTo(
      startX + Math.cos(leftAngle) * distance,
      startY + Math.sin(leftAngle) * distance
    );
    this.graphics.arc(startX, startY, distance, leftAngle, rightAngle);
    this.graphics.lineTo(startX, startY);
    this.graphics.closePath();
    this.graphics.fillPath();
    
    return { targetPoint: new Phaser.Math.Vector2(endX, endY) };
  }
  
  private showBombSkillAiming(
    startX: number, 
    startY: number, 
    angle: number,
    joystickDistance: number
  ): { targetPoint: Phaser.Math.Vector2, area: Phaser.Geom.Circle } {
    // ジョイスティック距離に基づいた投擲距離
    const maxDistance = 200;
    const throwDistance = Math.min(maxDistance, joystickDistance * 2);
    
    // Bomber用のカスタム照準として放物線を表示
    const normalizedDistance = Math.min(joystickDistance / 100, 1);
    const power = 300 + normalizedDistance * 500; // 300-800の範囲で変化
    
    // 放物線の軌道を計算
    const trajectoryPoints = this.calculator.calculateParabolicTrajectory(
      startX, startY, angle, power, 980, 15, 1.5
    );
    
    // 放物線を描画
    if (this.config.showTrajectory) {
      for (let i = 1; i < trajectoryPoints.length; i++) {
        const prevPoint = trajectoryPoints[i - 1];
        const currentPoint = trajectoryPoints[i];
        // 破線効果
        if (i % 2 === 0) {
          this.graphics.lineBetween(prevPoint.x, prevPoint.y, currentPoint.x, currentPoint.y);
        }
      }
    }
    
    // 終点位置
    const endX = trajectoryPoints[trajectoryPoints.length - 1].x;
    const endY = trajectoryPoints[trajectoryPoints.length - 1].y;
    
    const blastRadius = 70;
    
    // 爆発範囲を描画
    this.graphics.strokeCircle(endX, endY, blastRadius);
    this.graphics.fillCircle(endX, endY, blastRadius);
    
    return { 
      targetPoint: new Phaser.Math.Vector2(endX, endY),
      area: new Phaser.Geom.Circle(endX, endY, blastRadius)
    };
  }
  
  private showMinefieldSkillAiming(
    startX: number, 
    startY: number
  ): { targetPoint: Phaser.Math.Vector2, area: Phaser.Geom.Circle } {
    // 地雷の設置範囲
    const radius = 30;
    
    // 地雷エリアを描画
    this.graphics.strokeCircle(startX, startY, radius);
    this.graphics.fillCircle(startX, startY, radius);
    
    // 十字マーク
    this.graphics.lineStyle(2, 0xff0000, 0.8);
    this.graphics.lineBetween(startX - radius * 0.5, startY, startX + radius * 0.5, startY);
    this.graphics.lineBetween(startX, startY - radius * 0.5, startX, startY + radius * 0.5);
    
    // 外側の点線円（爆発範囲）
    this.graphics.lineStyle(1, 0xff0000, 0.5);
    
    // 爆発範囲を破線で表示
    const explosionRadius = 80;
    const segments = 24;
    const arcSize = (Math.PI * 2) / segments;
    
    for (let i = 0; i < segments; i++) {
      if (i % 2 === 0) {
        const startAngle = i * arcSize;
        const endAngle = (i + 1) * arcSize;
        this.graphics.beginPath();
        this.graphics.arc(startX, startY, explosionRadius, startAngle, endAngle);
        this.graphics.strokePath();
      }
    }
    
    return { 
      targetPoint: new Phaser.Math.Vector2(startX, startY),
      area: new Phaser.Geom.Circle(startX, startY, radius)
    };
  }

  /**
   * 点線の軌道を描画する
   * @param points 点の配列
   * @param color 線の色
   * @param alpha 透明度
   * @param dotSize ドットのサイズ
   */
  drawDottedLine(
    points: Phaser.Math.Vector2[], 
    color: number = 0xffffff,
    alpha: number = 0.7,
    dotSize: number = 3
  ): void {
    if (points.length < 2) return;
    
    // 点ごとに円を描画
    for (let i = 0; i < points.length; i += 2) { // 2点おきに描画して点線に
      const point = points[i];
      this.graphics.fillStyle(color, alpha);
      this.graphics.fillCircle(point.x, point.y, dotSize);
    }
  }
  
  /**
   * 円を描画する
   * @param x 中心X
   * @param y 中心Y
   * @param radius 半径
   * @param color 色
   * @param alpha 透明度
   */
  drawCircle(
    x: number, 
    y: number, 
    radius: number, 
    color: number = 0xffffff,
    alpha: number = 0.5
  ): void {
    this.graphics.lineStyle(2, color, alpha);
    this.graphics.strokeCircle(x, y, radius);
    
    this.graphics.fillStyle(color, alpha * 0.3);
    this.graphics.fillCircle(x, y, radius);
  }
}
