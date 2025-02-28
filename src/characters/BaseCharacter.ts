import Phaser from 'phaser';
import { Player, SkillType } from '../objects/Player';
import { WeaponType } from '../utils/WeaponTypes';

/**
 * すべてのキャラクタークラスの基底となる抽象クラス
 */
export abstract class BaseCharacter {
  protected scene: Phaser.Scene;
  protected player: Player;
  
  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
  }
  
  /**
   * キャラクター固有のスキルを発動
   * @param targetX 対象X座標
   * @param targetY 対象Y座標
   */
  abstract useSkill(targetX: number, targetY: number): void;
  
  /**
   * キャラクター固有のアルティメット能力を発動
   */
  abstract useUltimate(): void;
  
  /**
   * キャラクターの初期ステータスを設定
   */
  abstract initializeStats(): void;
  
  /**
   * 特別な攻撃処理が必要な場合はオーバーライドする
   * @param _targetX 対象X座標（未使用の場合はプレフィックスに_を付ける）
   * @param _targetY 対象Y座標（未使用の場合はプレフィックスに_を付ける）
   * @returns 特別処理を行った場合はtrue
   */
  useAttack(_targetX: number, _targetY: number): boolean {
    return false; // デフォルトでは特別処理なし
  }
  
  /**
   * アップデートループで毎フレーム呼ばれる処理
   * キャラクターの特殊な継続的効果などを実装
   * @param _time 現在の時間（未使用の場合はプレフィックスに_を付ける）
   * @param _delta 前フレームからの経過時間（未使用の場合はプレフィックスに_を付ける）
   */
  update(_time: number, _delta: number): void {
    // デフォルトでは何もしない
  }
  
  /**
   * 武器タイプを取得
   */
  abstract getWeaponType(): WeaponType;
  
  /**
   * スキルタイプを取得
   */
  abstract getSkillType(): SkillType;
  
  /**
   * キャラクター名を取得
   */
  abstract getName(): string;
  
  /**
   * スキル名を取得
   */
  abstract getSkillName(): string;
  
  /**
   * アルティメット名を取得
   */
  abstract getUltimateName(): string;
  
  /**
   * スキル説明を取得
   */
  abstract getSkillDescription(): string;
  
  /**
   * アルティメット説明を取得
   */
  abstract getUltimateDescription(): string;
  
  /**
   * リソースの解放
   */
  destroy(): void {
    // 各サブクラスで必要に応じてオーバーライド
  }
}
