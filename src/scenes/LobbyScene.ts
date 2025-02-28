import Phaser from 'phaser';
//import { GameConfig } from '../config/GameConfig';
import { SoundManager } from '../utils/SoundManager';
import { FirebaseManager } from '../firebase/FirebaseManager';
import { CharacterType } from '../characters/CharacterFactory';

export class LobbyScene extends Phaser.Scene {
  private firebaseManager: FirebaseManager;
  private soundManager!: SoundManager;
  private availableGames: any[] = [];
  private gamesList!: Phaser.GameObjects.Container;
  private selectedCharacterType: CharacterType = CharacterType.DEFAULT;
  private characterPreview!: Phaser.GameObjects.Sprite;
  private isCreatingGame: boolean = false;
  private isJoiningGame: boolean = false;
  private refreshTimer!: Phaser.Time.TimerEvent;
  
  constructor() {
    super('LobbyScene');
    this.firebaseManager = new FirebaseManager();
  }
  
  preload(): void {
    // UIアセット
    this.load.image('button', 'assets/ui/button.png');
    this.load.image('panel', 'assets/ui/panel.png');
    
    // キャラクターアセット
    this.load.image('default_character', 'assets/characters/default.png');
    this.load.image('tank_character', 'assets/characters/tank.png');
    this.load.image('speeder_character', 'assets/characters/speeder.png');
    this.load.image('sniper_character', 'assets/characters/sniper.png');
    this.load.image('healer_character', 'assets/characters/healer.png');
    this.load.image('thrower_character', 'assets/characters/thrower.png');
    
    // サウンド
    this.load.audio('button_click', 'assets/sounds/button_click.mp3');
  }
  
  async create(): Promise<void> {
    // サウンドマネージャーの初期化
    this.soundManager = new SoundManager(this);
    
    // BGM再生
    this.soundManager.playMusic('menu_bgm');
    
    // 背景
    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x222222)
      .setOrigin(0, 0);
    
    // タイトル
    this.add.text(this.cameras.main.width / 2, 50, 'オンライン対戦ロビー', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // 戻るボタン
    /*
    const backButton = this.add.text(50, 50, '← メニューへ戻る', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#444444',
      padding: { x: 10, y: 5 }
    })
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      this.soundManager.playSfx('button_click');
      this.scene.start('MainMenuScene');
    });
    */
    // キャラクター選択セクション
    this.createCharacterSelection();
    
    // ゲーム作成ボタン
    const createGameButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 100, 'ゲームを作成', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#007700',
      padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', async () => {
      if (this.isCreatingGame || this.isJoiningGame) return;
      
      this.soundManager.playSfx('button_click');
      this.isCreatingGame = true;
      createGameButton.setText('作成中...');
      
      // Firebase匿名認証
      if (!this.firebaseManager.isUserAuthenticated()) {
        await this.firebaseManager.signInAnonymously();
      }
      
      // キャラクタータイプを設定
      await this.firebaseManager.setCharacterType(this.selectedCharacterType);
      
      // ゲーム作成
      const gameId = await this.firebaseManager.createGame();
      
      if (gameId) {
        // 作成成功、ゲームシーンへ移動
        this.scene.start('OnlineGameScene', { firebaseManager: this.firebaseManager });
      } else {
        // 作成失敗
        this.isCreatingGame = false;
        createGameButton.setText('ゲームを作成');
        this.showMessage('ゲーム作成に失敗しました。もう一度お試しください。');
      }
    });
    
    // ゲーム一覧セクション
    this.add.text(this.cameras.main.width / 2, 220, '参加可能なゲーム', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // ゲームリストの表示エリアを作成
    this.gamesList = this.add.container(0, 0);
    
    // 更新ボタン
    this.add.text(this.cameras.main.width / 2 + 150, 220, '⟳ 更新', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#0077aa',
      padding: { x: 10, y: 5 }
    })
    .setOrigin(0, 0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      this.soundManager.playSfx('button_click');
      this.refreshGamesList();
    });
    // 初回のゲームリスト読み込み
    await this.refreshGamesList();
    
    // 定期的に自動更新するタイマーを設定
    this.refreshTimer = this.time.addEvent({
      delay: 10000, // 10秒ごとに更新
      callback: this.refreshGamesList,
      callbackScope: this,
      loop: true
    });
  }
  
  private createCharacterSelection(): void {
    // キャラクター選択のタイトル
    this.add.text(this.cameras.main.width / 4, 120, 'キャラクター選択', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // キャラクタープレビュー表示
    this.characterPreview = this.add.sprite(this.cameras.main.width / 4, 180, 'default_character')
      .setScale(0.8);
    
    // キャラクター選択ボタン
    const characterTypes = [
      { type: CharacterType.DEFAULT, name: 'デフォルト' },
      { type: CharacterType.TANK, name: 'タンク' },
      { type: CharacterType.SPEEDER, name: 'スピーダー' },
      { type: CharacterType.SNIPER, name: 'スナイパー' },
      { type: CharacterType.HEALER, name: 'ヒーラー' },
      { type: CharacterType.THROWER, name: '投擲兵' }
    ];
    
    // キャラクターボタンを横に並べる
    characterTypes.forEach((char, index) => {
      const button = this.add.text(
        80 + index * 120,
        300,
        char.name,
        {
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: '#555555',
          padding: { x: 10, y: 5 }
        }
      )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.soundManager.playSfx('button_click');
        this.selectedCharacterType = char.type;
        this.updateCharacterPreview();
        
        // 選択されたボタンのみ色を変更
        characterTypes.forEach((_, i) => {
          const btn = this.children.getByName(`char_btn_${i}`) as Phaser.GameObjects.Text;
          btn.setBackgroundColor(i === index ? '#0077aa' : '#555555');
        });
      });
      
      // ボタンに名前を付けて識別できるようにする
      button.setName(`char_btn_${index}`);
      
      // デフォルトで最初のキャラクターを選択
      if (index === 0) {
        button.setBackgroundColor('#0077aa');
      }
    });
    
    this.updateCharacterPreview();
  }
  
  private updateCharacterPreview(): void {
    // キャラクタータイプに合わせてプレビュー画像を更新
    const textureKey = `${this.selectedCharacterType}_character`;
    
    // テクスチャが存在するか確認
    if (this.textures.exists(textureKey)) {
      this.characterPreview.setTexture(textureKey);
    } else {
      this.characterPreview.setTexture('default_character');
    }
  }
  
  private async refreshGamesList(): Promise<void> {
    // 既存のリストをクリア
    this.gamesList.removeAll(true);
    
    // 匿名認証されていなければ認証
    if (!this.firebaseManager.isUserAuthenticated()) {
      await this.firebaseManager.signInAnonymously();
    }
    
    // 利用可能なゲームを取得
    this.availableGames = await this.firebaseManager.getAvailableGames();
    
    if (this.availableGames.length === 0) {
      // 利用可能なゲームがない場合のメッセージ
      const noGamesText = this.add.text(
        this.cameras.main.width / 2,
        350,
        '利用可能なゲームがありません。新しくゲームを作成してください。',
        { fontSize: '18px', color: '#aaaaaa' }
      )
      .setOrigin(0.5);
      
      this.gamesList.add(noGamesText);
    } else {
      // ゲームリストを表示（最大5つまで）
      const displayGames = this.availableGames.slice(0, 5);
      
      displayGames.forEach((game, index) => {
        const y = 350 + index * 50;
        
        // ゲーム情報の背景パネル
        const panel = this.add.rectangle(
          this.cameras.main.width / 2,
          y,
          500,
          40,
          0x333333
        )
        .setOrigin(0.5);
        
        // ゲームID（短縮表示）
        const shortId = game.id.substring(0, 8) + '...';
        const gameText = this.add.text(
          this.cameras.main.width / 2 - 220,
          y,
          `ゲーム ${shortId} - プレイヤー: ${game.playerCount}/${game.maxPlayers}`,
          { fontSize: '16px', color: '#ffffff' }
        )
        .setOrigin(0, 0.5);
        
        // 参加ボタン
        const joinButton = this.add.text(
          this.cameras.main.width / 2 + 180,
          y,
          '参加する',
          {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#0077aa',
            padding: { x: 10, y: 5 }
          }
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', async () => {
          if (this.isJoiningGame || this.isCreatingGame) return;
          
          this.soundManager.playSfx('button_click');
          this.isJoiningGame = true;
          joinButton.setText('参加中...');
          
          // ゲームに参加
          const success = await this.firebaseManager.joinGame(game.id);
          
          if (success) {
            // 参加成功、ゲームシーンへ移動
            this.scene.start('OnlineGameScene', { firebaseManager: this.firebaseManager });
          } else {
            // 参加失敗
            this.isJoiningGame = false;
            joinButton.setText('参加する');
            this.showMessage('ゲーム参加に失敗しました。別のゲームを試してください。');
            
            // リストを更新
            this.refreshGamesList();
          }
        });
        
        // コンテナに追加
        this.gamesList.add([panel, gameText, joinButton]);
      });
    }
  }
  
  private showMessage(text: string): void {
    // メッセージ表示用オーバーレイ
    const messageBox = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      400,
      200,
      0x000000,
      0.8
    )
    .setOrigin(0.5);
    
    const message = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      text,
      { fontSize: '20px', color: '#ffffff', align: 'center', wordWrap: { width: 350 } }
    )
    .setOrigin(0.5);
    
    // OKボタン
    const okButton = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 60,
      'OK',
      { fontSize: '18px', color: '#ffffff', backgroundColor: '#0077aa', padding: { x: 20, y: 10 } }
    )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      this.soundManager.playSfx('button_click');
      messageBox.destroy();
      message.destroy();
      okButton.destroy();
    });
  }
  
  update(): void {
    // シーン更新処理（必要に応じて追加）
  }
  
  shutdown(): void {
    // シーン終了時の後処理
    if (this.refreshTimer) {
      this.refreshTimer.destroy();
    }
  }
}
