import Phaser from 'phaser';
import { AimType } from '../../config';
import { Character } from '../../entities/Character';
import { Projectile, ProjectileConfig } from '../../entities/Projectile';

export class HuguesNormalAttack {
  private scene: Phaser.Scene;
  private owner: Character;
  
  constructor(scene: Phaser.Scene, owner: Character) {
    this.scene = scene;
    this.owner = owner;
  }
  
  execute(targetX: number, targetY: number): void {
    // 発射角度計算
    const angle = Phaser.Math.Angle.Between(this.owner.x, this.owner.y, targetX, targetY);
    
    // 発射位置調整
    const offsetX = Math.cos(angle) * 30;
    const offsetY = Math.sin(angle) * 30;
    
    // 投射物の設定
    const config: ProjectileConfig = {
      speed: 600,
      damage: this.owner.stats.damage.normal,
      range: this.owner.stats.attackRange.normal,
      lifespan: 2000,
      aimType: AimType.DIRECT,
      piercing: false,
      aoe: false
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
    bullet.fire(Math.cos(angle), Math.sin(angle));
    
    // 発射音
    this.scene.sound.play('shot', { volume: 0.3 });
    
    // 対象となるキャラクターたちとの衝突検出
    const charactersToCheck = this.scene.children.getAll().filter(obj => 
      obj instanceof Character && obj !== this.owner && obj.team !== this.owner.team
    ) as Phaser.GameObjects.GameObject[];
    
    if (charactersToCheck.length > 0) {
      this.scene.physics.add.overlap(
        bullet,
        charactersToCheck,
        (bulletObj, targetObj) => {
          const character = targetObj as Character;
          if (character) {
            (bulletObj as Projectile).hitTarget(character);
          }
        }
      );
    }
    
    // 壁との衝突検出
    const map = (this.scene as any).map;
    if (map && map.getWallLayer()) {
      this.scene.physics.add.collider(bullet, map.getWallLayer(), () => {
        bullet.destroy();
      });
    }
  }
}
