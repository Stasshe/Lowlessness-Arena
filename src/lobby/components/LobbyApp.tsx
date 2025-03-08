import { Component, createSignal, For } from 'solid-js';
import './LobbyApp.css';

interface Character {
  id: string;
  name: string;
  type: string;
  hp: number;
  speed: number;
  abilities: string[];
  imageUrl: string;
}

export const LobbyApp: Component = () => {
  // キャラクター一覧
  const characters: Character[] = [
    {
      id: 'hugues',
      name: 'ヒューズ',
      type: '騎士',
      hp: 100,
      speed: 100,
      abilities: ['ピストル', 'バレットストーム', '要塞の壁'],
      imageUrl: 'assets/images/characters/hugues/hugues-portrait.png'
    },
    {
      id: 'gawain',
      name: 'ガウェイン',
      type: 'タンカー',
      hp: 150,
      speed: 75,
      abilities: ['パワースラム', 'チャージアサルト', '守護の盾'],
      imageUrl: 'assets/images/characters/gawain/gawain-portrait.png'
    },
    {
      id: 'lancel',
      name: 'ランセル',
      type: '狙撃手',
      hp: 75,
      speed: 100,
      abilities: ['アーク・アロー', 'トリプルシャワー', '矢の雨'],
      imageUrl: 'assets/images/characters/lancel/lancel-portrait.png'
    },
    {
      id: 'beatrice',
      name: 'ベアトリス',
      type: 'スナイパー',
      hp: 80,
      speed: 90,
      abilities: ['精密射撃', '貫通弾', '連射'],
      imageUrl: 'assets/images/characters/beatrice/beatrice-portrait.png'
    },
    {
      id: 'marguerite',
      name: 'マルグリット',
      type: '爆弾魔',
      hp: 100,
      speed: 90,
      abilities: ['石投げ', '爆弾投げ', '大爆発'],
      imageUrl: 'assets/images/characters/marguerite/marguerite-portrait.png'
    }
  ];

  // 選択中のキャラクター
  const [selectedCharacter, setSelectedCharacter] = createSignal<Character | null>(null);

  // ゲーム開始
  const startGame = (mode: 'training' | 'online') => {
    if (!selectedCharacter()) {
      alert('キャラクターを選択してください');
      return;
    }

    // 選択されたキャラクターをローカルストレージに保存
    localStorage.setItem('selectedCharacter', selectedCharacter()!.id);
    
    // ゲームページに移動
    window.location.href = mode === 'online' ? 'game.html?mode=online' : 'game.html?mode=training';
  };

  // ホームに戻る
  const goToHome = () => {
    window.location.href = 'index.html';
  };

  return (
    <div class="lobby-container">
      <header class="header">
        <h1>キャラクター選択</h1>
        <button onClick={goToHome} class="back-button">戻る</button>
      </header>
      
      <div class="content">
        <div class="character-selection">
          <For each={characters}>
            {(character) => (
              <div 
                class={`character-card ${selectedCharacter() === character ? 'selected' : ''}`} 
                onClick={() => setSelectedCharacter(character)}
              >
                <img src={character.imageUrl} alt={character.name} class="character-img" />
                <div class="character-info">
                  <h3 class="character-name">{character.name}</h3>
                  <p class="character-type">{character.type}</p>
                  <div class="character-stats">
                    <div>HP: {character.hp}</div>
                    <div>速度: {character.speed}</div>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
        
        <div class="sidebar">
          {selectedCharacter() ? (
            <div class="selected-character-info">
              <h2>{selectedCharacter()!.name}</h2>
              <h3>{selectedCharacter()!.type}</h3>
              <div class="abilities">
                <h4>アビリティ</h4>
                <ul>
                  {selectedCharacter()!.abilities.map((ability) => (
                    <li>{ability}</li>
                  ))}
                </ul>
              </div>
              
              <div class="game-modes">
                <button onClick={() => startGame('training')} class="game-mode-btn">
                  トレーニングモード
                </button>
                <button onClick={() => startGame('online')} class="game-mode-btn">
                  オンラインマッチ
                </button>
              </div>
            </div>
          ) : (
            <div class="character-prompt">
              <h3>キャラクターを選択してください</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
