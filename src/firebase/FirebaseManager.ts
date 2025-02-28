import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  signInAnonymously, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  Timestamp,
  deleteDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { CharacterType } from '../characters/CharacterFactory';

// Firebaseの設定
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "lowlessness-arena.firebaseapp.com",
  projectId: "lowlessness-arena",
  storageBucket: "lowlessness-arena.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export class FirebaseManager {
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;
  private user: User | null = null;
  private userId: string = '';
  private isAuthenticated: boolean = false;
  private gameId: string | null = null;
  private onGameUpdateCallback?: (data: any) => void;
  private onPlayerJoinedCallback?: (playerId: string) => void;
  private onPlayerLeftCallback?: (playerId: string) => void;
  private gameListener?: () => void;
  private playersListener?: () => void;
  
  constructor() {
    // Firebaseの初期化
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    
    // 認証状態の監視
    onAuthStateChanged(this.auth, (user) => {
      this.user = user;
      this.userId = user ? user.uid : '';
      this.isAuthenticated = !!user;
      
      if (user) {
        console.log('Firebase: ユーザー認証成功', this.userId);
      } else {
        console.log('Firebase: 未認証状態');
      }
    });
  }
  
  // 匿名認証でサインイン
  async signInAnonymously(): Promise<boolean> {
    try {
      await signInAnonymously(this.auth);
      return true;
    } catch (error) {
      console.error('Firebase: 匿名サインインに失敗しました', error);
      return false;
    }
  }
  
  // ゲームを作成（ホスト側）
  async createGame(): Promise<string | null> {
    if (!this.isAuthenticated) {
      await this.signInAnonymously();
    }
    
    try {
      // ゲームドキュメントを作成
      const gamesCollection = collection(this.db, 'games');
      const gameRef = doc(gamesCollection);
      
      const gameData = {
        hostId: this.userId,
        status: 'waiting', // waiting, playing, finished
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        playerCount: 1,
        maxPlayers: 2, // 1v1対戦を想定
      };
      
      await setDoc(gameRef, gameData);
      
      // プレイヤー情報を保存
      const playerData = {
        userId: this.userId,
        gameId: gameRef.id,
        characterType: 'default',
        isReady: true, // ホストは常に準備完了状態
        joinedAt: Timestamp.now()
      };
      
      const playersCollection = collection(this.db, 'games', gameRef.id, 'players');
      await setDoc(doc(playersCollection, this.userId), playerData);
      
      this.gameId = gameRef.id;
      return gameRef.id;
      
    } catch (error) {
      console.error('Firebase: ゲーム作成に失敗しました', error);
      return null;
    }
  }
  
  // ゲームに参加（ゲスト側）
  async joinGame(gameId: string): Promise<boolean> {
    if (!this.isAuthenticated) {
      await this.signInAnonymously();
    }
    
    try {
      // ゲームの存在を確認
      const gameRef = doc(this.db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (!gameSnap.exists()) {
        console.error('Firebase: 指定されたゲームが見つかりませんでした');
        return false;
      }
      
      const gameData = gameSnap.data();
      
      // ゲームが満員でないことを確認
      if (gameData.playerCount >= gameData.maxPlayers) {
        console.error('Firebase: ゲームは既に満員です');
        return false;
      }
      
      // プレイヤー情報を保存
      const playerData = {
        userId: this.userId,
        gameId: gameId,
        characterType: 'default',
        isReady: true,
        joinedAt: Timestamp.now()
      };
      
      const playersCollection = collection(this.db, 'games', gameId, 'players');
      await setDoc(doc(playersCollection, this.userId), playerData);
      
      // ゲーム情報を更新
      await updateDoc(gameRef, {
        playerCount: gameData.playerCount + 1,
        updatedAt: Timestamp.now()
      });
      
      this.gameId = gameId;
      return true;
      
    } catch (error) {
      console.error('Firebase: ゲーム参加に失敗しました', error);
      return false;
    }
  }
  
  // ゲームから退出
  async leaveGame(): Promise<boolean> {
    if (!this.isAuthenticated || !this.gameId) {
      return false;
    }
    
    try {
      // プレイヤー情報を削除
      const playerRef = doc(this.db, 'games', this.gameId, 'players', this.userId);
      await deleteDoc(playerRef);
      
      // ゲーム情報を更新
      const gameRef = doc(this.db, 'games', this.gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        
        if (gameData.hostId === this.userId) {
          // ホストの場合はゲームを削除
          await deleteDoc(gameRef);
        } else {
          // ゲストの場合はプレイヤーカウントを減らす
          await updateDoc(gameRef, {
            playerCount: Math.max(1, gameData.playerCount - 1),
            updatedAt: Timestamp.now()
          });
        }
      }
      
      // リスナーを解除
      this.unsubscribeListeners();
      this.gameId = null;
      
      return true;
      
    } catch (error) {
      console.error('Firebase: ゲーム退出に失敗しました', error);
      return false;
    }
  }
  
  // プレイヤーの準備状態を更新
  async setPlayerReady(isReady: boolean): Promise<boolean> {
    if (!this.isAuthenticated || !this.gameId) {
      return false;
    }
    
    try {
      const playerRef = doc(this.db, 'games', this.gameId, 'players', this.userId);
      await updateDoc(playerRef, { isReady });
      return true;
    } catch (error) {
      console.error('Firebase: 準備状態の更新に失敗しました', error);
      return false;
    }
  }
  
  // キャラクタータイプを更新
  async setCharacterType(characterType: CharacterType): Promise<boolean> {
    if (!this.isAuthenticated || !this.gameId) {
      return false;
    }
    
    try {
      const playerRef = doc(this.db, 'games', this.gameId, 'players', this.userId);
      await updateDoc(playerRef, { characterType });
      return true;
    } catch (error) {
      console.error('Firebase: キャラクタータイプの更新に失敗しました', error);
      return false;
    }
  }
  
  // ゲーム状態の更新
  async updateGameState(state: string): Promise<boolean> {
    if (!this.isAuthenticated || !this.gameId) {
      return false;
    }
    
    try {
      const gameRef = doc(this.db, 'games', this.gameId);
      await updateDoc(gameRef, {
        status: state,
        updatedAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Firebase: ゲーム状態の更新に失敗しました', error);
      return false;
    }
  }
  
  // プレイヤー位置の更新（リアルタイム通信用）
  async updatePlayerPosition(x: number, y: number, rotation: number): Promise<boolean> {
    if (!this.isAuthenticated || !this.gameId) {
      return false;
    }
    
    try {
      const playerStateRef = doc(this.db, 'games', this.gameId, 'playerStates', this.userId);
      await setDoc(playerStateRef, {
        position: { x, y },
        rotation,
        timestamp: Timestamp.now()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Firebase: プレイヤー位置の更新に失敗しました', error);
      return false;
    }
  }
  
  // プレイヤーアクション（攻撃など）の更新
  async sendPlayerAction(action: string, targetX: number, targetY: number): Promise<boolean> {
    if (!this.isAuthenticated || !this.gameId) {
      return false;
    }
    
    try {
      const actionsCollection = collection(this.db, 'games', this.gameId, 'actions');
      await setDoc(doc(actionsCollection), {
        playerId: this.userId,
        action,
        target: { x: targetX, y: targetY },
        timestamp: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Firebase: アクション送信に失敗しました', error);
      return false;
    }
  }
  
  // ゲーム状態の更新
  async getGameData(): Promise<any> {
    if (!this.gameId) {
      return null;
    }
    
    try {
      const gameRef = doc(this.db, 'games', this.gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (gameSnap.exists()) {
        return gameSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Firebase: ゲームデータの取得に失敗しました', error);
      return null;
    }
  }
  
  // ゲーム状態を監視（ゲーム開始など）
  subscribeToGameUpdates(callback: (data: any) => void): void {
    if (!this.gameId) return;
    
    this.onGameUpdateCallback = callback;
    
    const gameRef = doc(this.db, 'games', this.gameId);
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      }
    });
    
    this.gameListener = unsubscribe;
  }
  
  // プレイヤー参加・退出を監視
  subscribeToPlayerUpdates(
    onJoined: (playerId: string) => void,
    onLeft: (playerId: string) => void
  ): void {
    if (!this.gameId) return;
    
    this.onPlayerJoinedCallback = onJoined;
    this.onPlayerLeftCallback = onLeft;
    
    const playersQuery = query(collection(this.db, 'games', this.gameId, 'players'));
    const unsubscribe = onSnapshot(playersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && change.doc.id !== this.userId) {
          onJoined(change.doc.id);
        }
        if (change.type === 'removed' && change.doc.id !== this.userId) {
          onLeft(change.doc.id);
        }
      });
    });
    
    this.playersListener = unsubscribe;
  }
  
  // リスナーの解除
  unsubscribeListeners(): void {
    if (this.gameListener) {
      this.gameListener();
      this.gameListener = undefined;
    }
    
    if (this.playersListener) {
      this.playersListener();
      this.playersListener = undefined;
    }
  }
  
  // 利用可能なゲームの一覧を取得
  async getAvailableGames(): Promise<any[]> {
    try {
      const gamesQuery = query(
        collection(this.db, 'games'),
        where('status', '==', 'waiting'),
        where('playerCount', '<', 2)
      );
      
      const querySnapshot = await getDocs(gamesQuery);
      const games: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        games.push({
          id: doc.id,
          ...data
        });
      });
      
      return games;
    } catch (error) {
      console.error('Firebase: 利用可能なゲームの取得に失敗しました', error);
      return [];
    }
  }
  
  getUserId(): string {
    return this.userId;
  }
  
  getGameId(): string | null {
    return this.gameId;
  }
  
  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  // Firestoreインスタンスを取得
  getDb(): Firestore {
    return this.db;
  }
  
  // プレイヤー状態の変更を監視（位置情報など）
  subscribeToPlayerState(playerId: string, callback: (data: any) => void): () => void {
    if (!this.gameId) return () => {};
    
    const playerStateRef = doc(this.db, 'games', this.gameId, 'playerStates', playerId);
    const unsubscribe = onSnapshot(playerStateRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      }
    });
    
    return unsubscribe;
  }
  
  // プレイヤーアクションを監視（攻撃、スキル使用など）
  subscribeToPlayerActions(playerId: string, callback: (action: any) => void): () => void {
    if (!this.gameId) return () => {};
    
    const actionsQuery = query(
      collection(this.db, 'games', this.gameId, 'actions'),
      where('playerId', '==', playerId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    
    const unsubscribe = onSnapshot(actionsQuery, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          callback(change.doc.data());
        }
      });
    });
    
    return unsubscribe;
  }
  
  // スキル使用アクション送信
  async sendSkillAction(): Promise<boolean> {
    return this.sendPlayerAction('skill', 0, 0);
  }
  
  // アルティメット使用アクション送信
  async sendUltimateAction(): Promise<boolean> {
    return this.sendPlayerAction('ultimate', 0, 0);
  }

  // ゲームの状態を取得するメソッドを追加
  async getGameStatus(gameId: string): Promise<string> {
    try {
      // Firestoreのdocメソッドは正しい形式で使用
      const gameRef = doc(this.db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (gameSnap.exists()) {
        return gameSnap.data().status || 'unknown';
      }
      return 'unknown';
    } catch (error) {
      console.error('Firebase: ゲーム状態の取得に失敗しました', error);
      return 'error';
    }
  }

  async getGameDocument() {
    const docRef = doc(this.db, `games/${this.gameId}`);
    return await getDoc(docRef);
  }
}