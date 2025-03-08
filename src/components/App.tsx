import { Component, createSignal } from 'solid-js';
import './App.css';

export const App: Component = () => {
  const [isLoading, setIsLoading] = createSignal(true);

  // ロード完了後の処理
  setTimeout(() => {
    setIsLoading(false);
  }, 2000);

  // ゲームプレイページに移動
  const startGame = () => {
    window.location.href = 'game.html';
  };

  // ロビーページに移動
  const goToLobby = () => {
    window.location.href = 'lobby.html';
  };

  // Solid-JSはReactとは異なり、JSXをトランスパイルする方法が違います
  // solid-jsのjsxImportSourceをtsconfig.jsonに設定済みなのでエラーは解消されるはずです
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
              ロビーへ進む
            </button>
            <button onClick={startGame} class="main-button">
              トレーニングモード
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
