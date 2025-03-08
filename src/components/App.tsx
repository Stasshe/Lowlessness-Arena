import { Component, createSignal } from 'solid-js';
import './App.css';

export const App: Component = () => {
  const [isLoading, setIsLoading] = createSignal(true);

  // ロード完了後の処理
  setTimeout(() => {
    setIsLoading(false);
  }, 2000);

  // ロビーページに移動（キャラクター選択画面）
  const goToLobby = () => {
    window.location.href = 'lobby.html';
  };

  return (
    <div class="welcome-screen">
      {isLoading() ? (
        <div class="loading">
          <h2>ローディング中...</h2>
          <div class="spinner"></div>
        </div>
      ) : (
        <div class="menu">
          <h1>Lowlessness Arena</h1>
          <div class="button-container">
            <button onClick={goToLobby} class="main-button">
              プレイ開始
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
