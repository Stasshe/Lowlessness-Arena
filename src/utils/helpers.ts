/**
 * ランダムIDを生成する
 * @param length ID長さ
 * @returns ランダムID
 */
export function getRandomId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charLength = chars.length;
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charLength));
  }
  
  return result;
}

/**
 * 2点間の距離を計算する
 */
export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * 角度を度からラジアンに変換する
 */
export function degToRad(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * 角度をラジアンから度に変換する
 */
export function radToDeg(radians: number): number {
  return radians * 180 / Math.PI;
}

/**
 * 2点間の角度を取得する (ラジアン)
 */
export function getAngle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * オブジェクトがブラウザ環境であるかの判定
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * デバイスがモバイルであるかの判定
 */
export function isMobile(): boolean {
  if (!isBrowser()) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * オブジェクトの深いコピーを作成する
 */
export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 値を最小値と最大値の間に収める
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 放物線の軌道を計算する関数
 * @param startX 開始X座標
 * @param startY 開始Y座標
 * @param endX 終了X座標
 * @param endY 終了Y座標
 * @param heightFactor 放物線の高さ係数（1.0がデフォルト）
 * @param steps 計算するポイントの数
 * @returns 放物線上の点の配列 [{x, y}, ...]
 */
export function calculateParabola(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  heightFactor: number = 1.0,
  steps: number = 10
): Array<{x: number, y: number}> {
  const points = [];
  const distance = getDistance(startX, startY, endX, endY);
  
  // 放物線の最大高さ（距離に比例）
  const maxHeight = distance * 0.5 * heightFactor;
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = startX + (endX - startX) * t;
    
    // 放物線の方程式: y = a * (x-h)^2 + k
    // ここではシンプルな計算を使用
    const parabolicT = t * (1 - t); // 0→0.5→0 の値になる
    const height = maxHeight * parabolicT * 4; // 4を掛けて最大値を1にする
    
    // 直線の中間点からの高さで放物線を作る
    const linearY = startY + (endY - startY) * t;
    const y = linearY - height; // 2D画面では上が-Y方向
    
    points.push({x, y});
  }
  
  return points;
}
