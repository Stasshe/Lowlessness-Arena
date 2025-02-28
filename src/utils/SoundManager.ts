import Phaser from 'phaser';

export class SoundManager {
  private scene: Phaser.Scene;
  private sounds: Map<string, Phaser.Sound.BaseSound>;
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.8;
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.sounds = new Map();
    
    // ローカルストレージから設定を読み込み
    this.loadSettings();
    
    // 音声ファイルのロード
    this.preloadSounds();
  }
  
  private preloadSounds(): void {
    // BGM
    this.scene.load.audio('menu_bgm', 'assets/sounds/menu_bgm.mp3');
    this.scene.load.audio('game_bgm', 'assets/sounds/game_bgm.mp3');
    this.scene.load.audio('victory_bgm', 'assets/sounds/victory_bgm.mp3');
    
    // 効果音
    this.scene.load.audio('button_click', 'assets/sounds/button_click.mp3');
    this.scene.load.audio('shoot', 'assets/sounds/shoot.mp3');
    this.scene.load.audio('hit', 'assets/sounds/hit.mp3');
    this.scene.load.audio('explosion', 'assets/sounds/explosion.mp3');
    this.scene.load.audio('skill_activate', 'assets/sounds/skill_activate.mp3');
    this.scene.load.audio('ultimate_activate', 'assets/sounds/ultimate_activate.mp3');
    this.scene.load.audio('player_damage', 'assets/sounds/player_damage.mp3');
    this.scene.load.audio('player_death', 'assets/sounds/player_death.mp3');
    this.scene.load.audio('countdown', 'assets/sounds/countdown.mp3');
    
    this.scene.load.once('complete', () => {
      this.setupSounds();
    });
  }
  
  private setupSounds(): void {
    // BGMを設定
    this.addSound('menu_bgm', true);
    this.addSound('game_bgm', true);
    this.addSound('victory_bgm', true);
    
    // 効果音を設定
    this.addSound('button_click');
    this.addSound('shoot');
    this.addSound('hit');
    this.addSound('explosion');
    this.addSound('skill_activate');
    this.addSound('ultimate_activate');
    this.addSound('player_damage');
    this.addSound('player_death');
    this.addSound('countdown');
    
    // 音量設定を適用
    this.updateVolumes();
  }
  
  private addSound(key: string, isMusic: boolean = false): void {
    try {
      const sound = this.scene.sound.add(key);
      if (sound) {
        if (isMusic) {
          // 音楽はループさせる
          sound.loop = true;
          
          // 音量設定
          // ※ PhaserのBaseSoundインターフェースは型定義が不完全
          this.setSoundVolume(sound, this.musicVolume);
        } else {
          // 効果音の音量設定
          this.setSoundVolume(sound, this.sfxVolume);
        }
        
        this.sounds.set(key, sound);
      }
    } catch (error) {
      console.warn(`サウンドの追加に失敗しました: ${key}`, error);
    }
  }
  
  // 異なる種類のサウンドオブジェクトに対応する汎用メソッド
  private setSoundVolume(sound: Phaser.Sound.BaseSound, volume: number): void {
    try {
      // WebAudio APIの異なる実装に対応
      // @ts-ignore - Phaserのサウンドオブジェクトには様々なプロパティが存在
      if (typeof sound.setVolume === 'function') {
        // @ts-ignore
        sound.setVolume(volume);
      }
      // @ts-ignore - HTML5Audioベースの実装用
      else if (sound.volume !== undefined) {
        // @ts-ignore
        sound.volume = volume;
      }
      // @ts-ignore - WebAudioのデータフローノードを持つ実装用
      else if (sound._sound && sound._sound.setVolume) {
        // @ts-ignore
        sound._sound.setVolume(volume);
      }
      // Phaserの内部プロパティを直接設定
      else {
        // @ts-ignore - 最終手段
        sound._volume = volume;
      }
    } catch (e) {
      console.warn(`音量設定に失敗しました: ${e}`);
    }
  }

  playMusic(key: string): void {
    // 現在のBGMを停止
    if (this.currentMusic) {
      this.currentMusic.stop();
    }
    
    // 新しいBGMを再生
    const music = this.sounds.get(key);
    if (music) {
      music.play();
      this.currentMusic = music;
    }
  }
  
  stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }
  
  playSfx(key: string): void {
    const sfx = this.sounds.get(key);
    if (sfx && !sfx.isPlaying) {
      sfx.play();
    }
  }
  
  setMusicVolume(volume: number): void {
    this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
    this.updateVolumes();
    this.saveSettings();
  }
  
  setSfxVolume(volume: number): void {
    this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
    this.updateVolumes();
    this.saveSettings();
  }
  
  private updateVolumes(): void {
    this.sounds.forEach((sound, key) => {
      try {
        if (key.includes('_bgm')) {
          // 音楽の音量を設定
          this.setSoundVolume(sound, this.musicVolume);
        } else {
          // 効果音の音量を設定
          this.setSoundVolume(sound, this.sfxVolume);
        }
      } catch (error) {
        console.warn(`音量の設定に失敗しました: ${key}`, error);
      }
    });
  }
  
  private loadSettings(): void {
    try {
      const musicVol = localStorage.getItem('musicVolume');
      const sfxVol = localStorage.getItem('sfxVolume');
      
      if (musicVol) {
        this.musicVolume = parseFloat(musicVol);
      }
      
      if (sfxVol) {
        this.sfxVolume = parseFloat(sfxVol);
      }
    } catch (e) {
      console.warn('ローカルストレージにアクセスできません', e);
    }
  }
  
  private saveSettings(): void {
    try {
      localStorage.setItem('musicVolume', this.musicVolume.toString());
      localStorage.setItem('sfxVolume', this.sfxVolume.toString());
    } catch (e) {
      console.warn('ローカルストレージへの保存に失敗しました', e);
    }
  }
  
  getMusicVolume(): number {
    return this.musicVolume;
  }
  
  getSfxVolume(): number {
    return this.sfxVolume;
  }
}
