import { render } from 'solid-js/web';
import { LobbyApp } from './components/LobbyApp';

// ロビーページ初期化
const root = document.getElementById('lobby');
if (root) {
  render(() => <LobbyApp />, root);
}
