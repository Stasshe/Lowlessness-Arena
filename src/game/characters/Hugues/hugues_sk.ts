import Phaser from 'phaser';
import { AimType } from '../../config';
import { Character } from '../../entities/Character';
import { Projectile, ProjectileConfig } from '../../entities/Projectile';

export class HuguesSkill {
  private scene: Phaser.Scene;
  private owner: Character;
  private bulletCount: number = 6; // ショットガンの弾数
  private spreadAngle: number = Math.PI / 12; // 15度の拡散
  
  constructor(scene: Phaser.Scene, owner: Character) {
    this.scene = scene;
    this.owner = owner;
  }
  
  execute(angle: number, force: number): void {
    // 範囲内をランダムに弾を散らす
    for (let i = 0; i < this.bulletCount; i++) {
      // 発射角度をランダムに変動させる
      const randomAngle = angle + (Math.random() * this.spreadAngle * 2 - this.spreadAngle);
      
      // 発射位置調整
      const offsetX = Math.cos(angle) * 30;
      const offsetY = Math.sin(angle) * 30;
      
      // 投射物の設定
      const config: ProjectileConfig = {
        speed: 500,
        damage: this.owner.stats.damage.skill / this.bulletCount, // ダメージを弾数で分散
        range: this.owner.stats.attackRange.skill,
        lifespan: 1000,
        aimType: AimType.DIRECT,
        piercing: false,
        aoe: false,
        spreadAngle: this.spreadAngle
      };
      
      // 投射物の作成
      const bullet = new Projectile(
        this.scene, 
        this.owner.x + offsetX,
        this.owner.y + offsetY,
        'bullet',
        this.owner,
        config,
        this.owner.team
      );
      
      // 発射
      bullet.fire(Math.cos(randomAngle), Math.sin(randomAngle));
      
      // 対象との衝突検出
      this.scene.physics.add.overlap(bullet, this.scene.children.getAll().filter(obj => 
        obj instanceof Character && obj !== this.owner && obj.team !== this.owner.team
      ), (bullet, target) => {
        (bullet as Projectile).hitTarget(target as Character);
      });
      
      // 壁との衝突検出
      const map = (this.scene as any).map;
      if (map && map.getWallLayer()) {
        this.scene.physics.add.collider(bullet, map.getWallLayer(), () => {
          bullet.destroy();
        });
      }
    }
    
    // 発射音
    this.scene.sound.play('shot', { volume: 0.5 });
  }
}
