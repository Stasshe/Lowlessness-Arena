import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

/**
 * ゲーム内のサウンドを一元管理するマネージャークラス
 */
export class SoundManager {
  private scene: Phaser.Scene;
  private currentMusic?: Phaser.Sound.BaseSound;
  private sfxVolume: number = 0.5;
  private musicVolume: number = 0.3;
  private isMuted: boolean = false;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.loadSavedSettings();
  }
  
  /**
   * 保存された音量設定を読み込む
   */
  private loadSavedSettings(): void {
    try {
      const savedMusicVolume = localStorage.getItem('musicVolume');
      const savedSfxVolume = localStorage.getItem('sfxVolume');
      const savedMuted = localStorage.getItem('soundMuted');
      
      if (savedMusicVolume !== null) {
        this.musicVolume = parseFloat(savedMusicVolume);
      }
      
      if (savedSfxVolume !== null) {
        this.sfxVolume = parseFloat(savedSfxVolume);
      }
      
      if (savedMuted !== null) {
        this.isMuted = savedMuted === 'true';
      }
      
      // 読み込んだ設定を反映
      this.applyVolumeSettings();
    } catch (e) {
      console.warn('音量設定の読み込みに失敗:', e);
    }
  }
  
  /**
   * 音量設定を保存
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('musicVolume', this.musicVolume.toString());
      localStorage.setItem('sfxVolume', this.sfxVolume.toString());
      localStorage.setItem('soundMuted', this.isMuted.toString());
    } catch (e) {
      console.warn('音量設定の保存に失敗:', e);
    }
  }
  
  /**
   * 音量設定を適用
   */
  private applyVolumeSettings(): void {
    if (!this.scene.sound) return;
    
    // ミュート状態を設定
    this.scene.sound.mute = this.isMuted;
    
    // 再生中のBGMがあれば音量を適用
    if (this.currentMusic) {
      this.currentMusic.volume = this.musicVolume;
    }
  }
  
  /**
   * BGMを再生
   */
  playMusic(key: string, loop: boolean = true): void {
    // サウンド無効の場合は何もしない
    if (!GameConfig.options.soundEnabled) return;
    
    try {
      // 既に同じ曲が再生中なら何もしない
      if (this.currentMusic?.key === key && this.currentMusic.isPlaying) {
        return;
      }
      
      // 既存の音楽を停止
      if (this.currentMusic?.isPlaying) {
        this.currentMusic.stop();
      }
      
      // 新しい音楽を再生
      this.currentMusic = this.scene.sound.add(key);
      this.currentMusic.play({ 
        volume: this.musicVolume, 
        loop 
      });
      
    } catch (e) {
      console.warn(`BGM ${key} の再生に失敗:`, e);
    }
  }
  
  /**
   * 効果音を再生
   */
  playSfx(key: string): void {
    // サウンド無効の場合は何もしない
    if (!GameConfig.options.soundEnabled) return;
    
    try {
      this.scene.sound.play(key, {
        volume: this.sfxVolume
      });
    } catch (e) {
      console.warn(`効果音 ${key} の再生に失敗:`, e);
    }
  }
  
  /**
   * 音量フェード付きで音楽を再生
   */
  fadeMusicIn(key: string, duration: number = 1000): void {
    try {
      // 既存の音楽をフェードアウト
      if (this.currentMusic?.isPlaying) {
        this.currentMusic.stop();
      }
      
      // 新しい音楽をボリューム0で追加
      this.currentMusic = this.scene.sound.add(key);
      this.currentMusic.play({
        volume: 0,
        loop: true
      });
      
      // フェードイン
      this.scene.tweens.add({
        targets: this.currentMusic,
        volume: this.musicVolume,
        duration: duration,
        ease: 'Linear'
      });
    } catch (e) {
      console.warn(`BGM ${key} のフェードインに失敗:`, e);
    }
  }
  
  /**
   * 音楽をフェードアウトして停止
   */
  fadeMusicOut(duration: number = 1000): void {
    if (!this.currentMusic || !this.currentMusic.isPlaying) return;
    
    try {
      // フェードアウト
      this.scene.tweens.add({
        targets: this.currentMusic,
        volume: 0,
        duration: duration,
        ease: 'Linear',
        onComplete: () => {
          if (this.currentMusic) {
            this.currentMusic.stop();
          }
        }
      });
    } catch (e) {
      console.warn('BGMのフェードアウトに失敗:', e);
    }
  }
  
  /**
   * すべてのサウンドを停止
   */
  stopAll(): void {
    try {
      this.scene.sound.stopAll();
      this.currentMusic = undefined;
    } catch (e) {
      console.warn('サウンド停止に失敗:', e);
    }
  }
  
  /**
   * 音楽ボリュームを設定
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
    
    if (this.currentMusic) {
      this.currentMusic.volume = this.musicVolume;
    }
    
    this.saveSettings();
  }
  
  /**
   * 効果音ボリュームを設定
   */
  setSfxVolume(volume: number): void {
    this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
    this.saveSettings();
  }
  
  /**
   * ミュート状態を切り替え
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.scene.sound) {
      this.scene.sound.mute = this.isMuted;
    }
    this.saveSettings();
    return this.isMuted;
  }
  
  /**
   * 現在のミュート状態を取得
   */
  isSoundMuted(): boolean {
    return this.isMuted;
  }
  
  /**
   * 現在の音楽ボリュームを取得
   */
  getMusicVolume(): number {
    return this.musicVolume;
  }
  
  /**
   * 現在の効果音ボリュームを取得
   */
  getSfxVolume(): number {
    return this.sfxVolume;
  }
}
