import { Player } from '../../entities/Player';
import { TeamType } from '../../config';
import { HuguesNormalAttack } from './hugues_na';
import { HuguesSkill } from './hugues_sk';
import { HuguesUltimate } from './hugues_ult';

export class Hugues extends Player {
  // キャラクター固有のプロパティ
  private normalAttack: HuguesNormalAttack;
  private skill: HuguesSkill;
  private ultimate: HuguesUltimate;
  
  constructor(scene: Phaser.Scene, x: number, y: number, team: TeamType, isPlayer: boolean = true) {
    // キャラクター設定
    const config = {
      name: 'ヒューズ',
      type: 'hugues',
      maxHp: 100,
      speed: 100,
      normalAttackDamage: 2,
      skillDamage: 5,
      ultimateDamage: 0, // 壁生成は直接ダメージなし
      normalAttackRange: 300,
      skillRange: 200,
      ultimateRange: 150,
      normalAttackCooldown: 500, // ミリ秒
      skillCooldown: 3000, // 3秒
      ultimateCooldown: 20000 // 20秒
    };
    
    super(scene, x, y, `${config.type}-idle`, config, team, isPlayer);
    
    // 攻撃クラスの初期化
    this.normalAttack = new HuguesNormalAttack(scene, this);
    this.skill = new HuguesSkill(scene, this);
    this.ultimate = new HuguesUltimate(scene, this);
  }
  
  // 通常攻撃の実行（ピストル）
  protected executeNormalAttack(targetX: number, targetY: number): void {
    this.normalAttack.execute(targetX, targetY);
  }
  
  // スキルの実行（ショットガン）
  protected executeSkill(angle: number, force: number): void {
    this.skill.execute(angle, force);
  }
  
  // アルティメットの実行（要塞の壁）
  protected executeUltimate(angle: number, force: number): void {
    this.ultimate.execute(angle, force);
  }
}
