import { render } from 'solid-js/web';
import { App } from './components/App';

// ルートコンポーネントをレンダリング
const root = document.getElementById('app');
if (root) {
  render(() => <App />, root);
}
