import Phaser from 'phaser';

/**
 * 弾の種類を表す型
 */
export type BulletType = 'normal' | 'explosive' | 'sniper' | 'parabolic' | 'bounce';

/**
 * 武器の弾を表すクラス
 */
export class Bullet extends Phaser.Physics.Arcade.Sprite {
  // protected変数に変更
  protected bulletType: BulletType = 'normal';
  protected bulletSpeed: number = 0;
  protected bulletDamage: number = 0;
  protected maxDistance: number = 0;
  protected initialX: number = 0;
  protected initialY: number = 0;
  
  private lifespan: number = 2000; // 弾の寿命（ミリ秒）
  private damage: number = 20;     // 基本ダメージ
  private spawnTime: number = 0;   // 生成時刻
  private isArcProjectile: boolean = false; // 弧を描く投射物かどうか
  private arcHeight: number = 0;   // 弧の高さ
  private startX: number = 0;      // 開始位置X
  private startY: number = 0;      // 開始位置Y
  private targetX: number = 0;     // 目標位置X
  private targetY: number = 0;     // 目標位置Y
  private _owner: any;             // 所有者（プレイヤーまたは敵）
  private isExplosive: boolean = false; // 爆発する弾かどうか
  private explosionRadius: number = 0;  // 爆発半径
  private penetration: boolean = false; // 貫通するかどうか

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bullet'); 
    
    this.setActive(false);
    this.setVisible(false);
    this.spawnTime = scene.time.now;
  }
  
  /**
   * 弾を発射する
   * @param x 発射位置X
   * @param y 発射位置Y
   * @param angle 発射角度
   * @param speed 発射速度
   * @param damage ダメージ量
   * @param maxDistance 最大飛距離
   * @param bulletType 弾の種類（オプション）
   * @param affectedByGravity 重力の影響を受けるか（オプション）
   */
  fire(
    x: number, 
    y: number, 
    angle: number, 
    speed: number, 
    damage: number, 
    maxDistance: number,
    bulletType: BulletType = 'normal',
    affectedByGravity: boolean = false
  ): void {
    // リセット前に現在の所有者を一時保存
    const currentOwner = this._owner;
    
    // 状態をリセットして初期化
    this.reset(x, y);
    
    // 所有者を再設定（リセット後に必要）
    this._owner = currentOwner;
    
    // 有効化と表示
    this.setActive(true);
    this.setVisible(true);
    
    // 弾の種類を設定
    this.bulletType = bulletType;
    
    // 放物線弾の場合は別の設定
    if (this.bulletType === 'parabolic') {
      this.fireParabolic(x, y, angle, speed, damage, maxDistance);
      return;
    }
    
    // 位置を明示的に設定
    this.setPosition(x, y);
    this.setRotation(angle);
    
    // 初期位置を記録（飛距離計算用）
    this.initialX = x;
    this.initialY = y;
    
    // 物理パラメータを設定
    this.bulletSpeed = speed;
    this.bulletDamage = damage;
    this.maxDistance = maxDistance;
    this.damage = damage;  // ダメージ値も更新
    this.spawnTime = this.scene.time.now;
    
    // 弾の外観設定
    this.setupBulletAppearance();
    
    // 各種フラグをリセット
    this.penetration = false;
    this.isExplosive = false;
    this.isArcProjectile = false;
    
    // 物理ボディを有効化（最初に一度無効にして再度有効化することで問題を回避）
    this.disableBody(false, false);
    this.enableBody(true, x, y, true, true);
    
    // 速度ベクトルを設定
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    this.setVelocity(vx, vy);
    
    // 物理ボディのパラメータを設定
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      
      // 重力の影響を設定
      body.setAllowGravity(affectedByGravity);
      
      // デバッグ表示を有効（問題がある場合確認用）
      body.debugShowBody = this.scene.game.config.physics.arcade?.debug || false;
      body.debugShowVelocity = this.scene.game.config.physics.arcade?.debug || false;
      
      // 自分自身と所有者の衝突を無効に
      body.checkCollision.none = false;
    }
    
    // 弾ごとの特殊動作
    this.setupSpecialBehavior();
    
    console.log(`弾発射: owner=${this._owner?.name || 'unknown'}, type=${bulletType}, angle=${angle}, speed=${speed}, pos=(${x},${y})`);
  }
  
  /**
   * 放物線を描く弾の発射
   */
  private fireParabolic(x: number, y: number, angle: number, speed: number, damage: number, maxDistance: number): void {
    // 基本設定
    this.setPosition(x, y);
    this.setRotation(angle);
    this.initialX = x;
    this.initialY = y;
    
    // パラメータの設定
    this.bulletSpeed = speed;
    this.bulletDamage = damage;
    this.maxDistance = maxDistance;
    
    // 放物線の弾の外観
    this.setScale(0.4);
    this.setTint(0x88ff88);
    
    // 物理ボディを有効化
    this.enableBody(true, x, y, true, true);
    
    // 速度ベクトルを設定（上向きにも力を加える）
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 200; // 上向きの初速を加える
    this.setVelocity(vx, vy);
    
    // 重力を有効化
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(true);
      body.setGravityY(600); // 放物線用に重力を設定
    }
  }
  
  /**
   * 弾の種類を設定
   */
  setBulletType(type: BulletType): void {
    this.bulletType = type;
  }
  
  /**
   * 弾のダメージ値を取得
   */
  getBulletDamage(): number {
    return this.bulletDamage;
  }
  /**
   * 弾の種類を取得
   */
  getBulletType(): BulletType {
    return this.bulletType;
  }
  
  /**
   * 更新処理
   */
  update(time: number, _delta: number): void {  // 未使用パラメータにアンダースコア追加
    // すでに非アクティブであれば何もしない
    if (!this.active) return;

    // 弾が画面外に出たかどうかをチェック
    const outOfBounds = this.x < -100 || this.x > (this.scene.game.config.width as number) + 100 ||
                       this.y < -100 || this.y > (this.scene.game.config.height as number) + 100;

    // 画面外に出たら非アクティブにする
    if (outOfBounds) {
      this.deactivate();
      return;
    }
    
    // 飛距離が最大値を超えたら破棄
    const distanceTraveled = Phaser.Math.Distance.Between(
      this.initialX, this.initialY, this.x, this.y
    );
    
    if (distanceTraveled >= this.maxDistance) {
      // 爆発弾の場合は爆発エフェクト
      if (this.bulletType === 'explosive') {
        this.explode();
      }
      
      this.deactivate();
      return;
    }

    // 寿命が過ぎたら非アクティブに
    if (time > this.spawnTime + this.lifespan) {
      this.deactivate();
      return;
    }

    // 物理ボディがある場合は速度をチェック
    if (this.body && this.body.velocity && (this.body instanceof Phaser.Physics.Arcade.Body)) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      
      // 速度が極端に遅くなったら（ほぼ停止したら）弾を消滅させる
      // ただし放物線弾は除く（重力の影響で遅くなることがあるため）
      const minSpeed = 50;
      const currentSpeed = Math.sqrt(body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y);
      
      if (currentSpeed < minSpeed && this.bulletType !== 'parabolic' && !body.blocked.none) {
        console.log('弾が減速しすぎたため消滅:', currentSpeed);
        this.deactivate();
        return;
      }
    }

    // 弧を描く投射物の場合は位置を計算
    if (this.isArcProjectile) {
      const progress = (time - this.spawnTime) / this.lifespan;
      
      if (progress >= 1) {
        this.deactivate();
        return;
      }
      
      // 線形補間で位置を計算
      const x = this.startX + (this.targetX - this.startX) * progress;
      const y = this.startY + (this.targetY - this.startY) * progress;
      
      // 放物線の高さは sin(π*progress) で計算
      const heightOffset = Math.sin(Math.PI * progress) * this.arcHeight;
      
      this.setPosition(x, y - heightOffset);
      
      // 角度も計算（次のフレームの位置から方向を算出）
      const nextProgress = Math.min(1, progress + 0.01);
      const nextX = this.startX + (this.targetX - this.startX) * nextProgress;
      const nextY = this.startY + (this.targetY - this.startY) * nextProgress;
      const nextHeightOffset = Math.sin(Math.PI * nextProgress) * this.arcHeight;
      
      const angle = Phaser.Math.Angle.Between(
        x, y - heightOffset,
        nextX, nextY - nextHeightOffset
      );
      
      this.setRotation(angle);
    }
  }
  
  /**
   * 弾が何かに当たった時の処理
   */
  onHit(target: any): void {
    // すでに非アクティブならスキップ
    if (!this.active) return;
    
    // 所有者と同じなら何もしない
    if (this.isSameOwner(target)) {
      console.log("弾が所有者と衝突: 無視します");
      return;
    }
    
    console.log('弾が衝突:', this.bulletType, target);
    
    // 爆発弾の場合は爆発エフェクト
    if (this.bulletType === 'explosive' || this.isExplosive) {
      this.explode();
    }
    
    // 貫通でなければ非アクティブに
    if (!this.penetration) {
      this.deactivate();
    }
  }
  
  /**
   * 爆発弾の爆発処理
   */
  private explode(): void {
    // 爆発エフェクト
    const particles = this.scene.add.particles(this.x, this.y, 'default', {
      speed: 100,
      scale: { start: 0.4, end: 0 },
      blendMode: 'ADD',
      tint: 0xff7700,
      lifespan: 500,
      quantity: 20
    });
    
    // エフェクトを時間経過で消す
    this.scene.time.delayedCall(500, () => {
      particles.destroy();
    });
    
    // 爆発音
    try {
      this.scene.sound.play('small_explosion');
    } catch (e) {}

    // 爆発エフェクト
    const explosion = this.scene.add.circle(this.x, this.y, this.explosionRadius, 0xff6600, 0.5)
      .setStrokeStyle(4, 0xff8800, 1);
    
    
    // 爆発範囲内の敵にダメージを与える処理
    // （実際のダメージ適用は呼び出し側で処理）
    
    // エフェクトを一定時間後に消す
    this.scene.time.delayedCall(800, () => {
      explosion.destroy();
      particles.destroy();
    });
    
    // 爆発音
    try {
      this.scene.sound.play('explosion');
    } catch (e) {}
    
    // 爆発範囲を表示（デバッグ用）
    if (this.scene.game.config.physics.arcade?.debug) {
      const explosionArea = this.scene.add.circle(
        this.x, this.y, this.explosionRadius, 0xff0000, 0.3
      );
      this.scene.time.delayedCall(300, () => explosionArea.destroy());
    }
    
    // 弾は消滅
    this.deactivate();
  }

  /**
   * 初期設定
   * @param x 初期X座標
   * @param y 初期Y座標
   * @param angle 発射角度（ラジアン）
   * @param speed 速度
   * @param damage ダメージ量
   * @param range 射程距離
   * @param owner 所有者
   */
  init(x: number, y: number, angle: number, speed: number, damage: number, range: number, owner: any): void {
    this.setActive(true);
    this.setVisible(true);
    this.enableBody(true, x, y, true, true);
    
    this.spawnTime = this.scene.time.now;
    this.damage = damage;
    this._owner = owner;
    this.lifespan = (range / speed) * 1000; // 射程/速度で寿命を計算
    
    // 速度とサイズの設定
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.setRotation(angle);
    this.setSize(8, 8);
    this.setDisplaySize(8, 8);
    
    // 発光エフェクト
    this.setTint(0xffff99);
  }
  
  /**
   * 弧を描く投射物として初期化
   */
  initArc(x: number, y: number, targetX: number, targetY: number, height: number, duration: number, damage: number, owner: any): void {
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(x, y);
    
    this.isArcProjectile = true;
    this.startX = x;
    this.startY = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.arcHeight = height;
    this.damage = damage;
    this._owner = owner;
    this.lifespan = duration;
    this.spawnTime = this.scene.time.now;
    
    // 弧を描くオブジェクトの場合は物理ボディを無効化
    this.disableBody(true, false);
  }
  
  /**
   * 爆発設定
   * @param isExplosive 爆発するかどうか
   * @param radius 爆発半径
   */
  setExplosive(isExplosive: boolean, radius: number = 50): void {
    this.isExplosive = isExplosive;
    this.explosionRadius = radius;
  }
  
  /**
   * 貫通設定
   * @param penetrate 貫通するかどうか
   */
  setPenetration(penetrate: boolean): void {
    this.penetration = penetrate;
  }

  /**
   * 弾を非アクティブ化
   */
  deactivate(): void {
    if (!this.active) return; // すでに非アクティブならスキップ
    
    this.setActive(false);
    this.setVisible(false);
    this.disableBody(true, true);
    
    // ログ出力（デバッグ用）
    console.log('弾を非アクティブ化:', this.bulletType, this.x, this.y);
  }
  
  /**
   * ダメージ量を取得
   */
  getDamage(): number {
    return this.damage;
  }
  
  /**
   * 所有者を取得
   */
  get owner(): any {
    return this._owner;
  }
  
  /**
   * 所有者を設定
   */
  setOwner(owner: any): void {
    this._owner = owner;
    
    // 親子関係を設定し、物理衝突を回避
    if (owner && owner.body && this.body) {
      // 衝突グループを設定（データ属性を使用）
      if (owner.getData && typeof owner.getData === 'function') {
        const ownerId = owner.getData('id');
        if (ownerId) {
          this.setData('ownerID', ownerId);
        }
      }
    }
  }
  
  /**
   * 爆発情報を取得
   */
  getExplosiveInfo(): { isExplosive: boolean, radius: number } {
    return {
      isExplosive: this.isExplosive,
      radius: this.explosionRadius
    };
  }
  
  /**
   * 貫通情報を取得
   */
  isPenetrating(): boolean {
    return this.penetration;
  }

  /**
   * 弾の外観を設定
   */
  private setupBulletAppearance(): void {
    switch (this.bulletType) {
      case 'normal':
        this.setScale(0.5, 0.3);
        break;
      case 'explosive':
        this.setScale(0.8);
        this.setTint(0xff6600);
        break;
      case 'sniper':
        this.setScale(0.7, 0.2);
        this.setTint(0xff0000);
        break;
      case 'bounce':
        this.setScale(0.4);
        this.setTint(0xffaa00);
        break;
      default:
        this.setScale(0.5);
    }
  }
  
  /**
   * 弾の特殊動作を設定
   */
  private setupSpecialBehavior(): void {
    // 弾のタイプに応じた特殊な動作
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      
      // 弾の衝突バウンド範囲を設定
      body.setSize(this.width * 0.8, this.height * 0.8, true);
      body.onWorldBounds = true; // ワールド境界での衝突を検出
      
      // 弾が壁に当たった時の処理を設定
      body.world.on('worldbounds', (hitBody: Phaser.Physics.Arcade.Body) => {
        if (hitBody.gameObject === this) {
          if (this.bulletType === 'bounce') {
            // バウンド弾はそのまま
          } else {
            // その他の弾は消滅
            this.deactivate();
          }
        }
      }, this);
      
      switch (this.bulletType) {
        case 'bounce':
          // バウンドする弾
          body.setBounce(0.6);
          body.setCollideWorldBounds(true);
          break;
        case 'sniper':
          // 貫通弾
          this.penetration = true;
          break;
        case 'explosive':
          // 爆発する弾
          this.setExplosive(true, 40);
          break;
        case 'parabolic':
          // 放物線弾（重力の影響を受ける）
          body.setAllowGravity(true);
          body.setGravityY(600);
          break;
      }
    }
  }

  /**
   * 所有者と対象が同じかどうか判定
   * @param target 衝突対象
   * @returns 所有者と同じならtrue
   */
  isSameOwner(target: any): boolean {
    // 所有者が設定されていない場合はfalse
    if (!this._owner) {
      return false;
    }
    
    // 対象が所有者と同じかチェック（参照比較）
    if (this._owner === target) {
      return true;
    }
    
    // IDによる比較
    if (this._owner.getData && target.getData &&
        typeof this._owner.getData === 'function' && 
        typeof target.getData === 'function') {
      
      const ownerId = this._owner.getData('id');
      const targetId = target.getData('id');
      
      if (ownerId && targetId && ownerId === targetId) {
        return true;
      }
    }
    
    // GameObjectのデータ属性でチェック
    if (this.getData && typeof this.getData === 'function') {
      const ownerID = this.getData('ownerID');
      if (target.getData && typeof target.getData === 'function') {
        const targetId = target.getData('id');
        if (ownerID && targetId && ownerID === targetId) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * この弾が指定したターゲットにダメージを与えられるかを判定
   * @param target ダメージを与える対象
   * @returns ダメージ可能ならtrue、所有者自身などの場合はfalse
   */
  canDamage(target: any): boolean {
    // 所有者と同じ場合はダメージ不可
    if (this.isSameOwner(target)) {
      return false;
    }
    
    // アクティブでない弾はダメージを与えない
    if (!this.active) {
      return false;
    }
    
    return true;
  }

  /**
   * 状態をリセット
   */
  reset(x: number, y: number): void {
    // 位置をリセット
    this.setPosition(x, y);
    
    // 速度をゼロに
    this.setVelocity(0, 0);
    
    // フラグをリセット
    this.penetration = false;
    this.isExplosive = false;
    this.isArcProjectile = false;
    this.explosionRadius = 0;
    
    // 時間をリセット
    this.spawnTime = this.scene.time.now;
    this.lifespan = 2000;
    
    // NOTE: ownerは保持します（fire()でリセット後に再設定されるため）
  }
}
