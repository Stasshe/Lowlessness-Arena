const esbuild = require('esbuild');
const { solidPlugin } = require('esbuild-plugin-solid');
const fs = require('fs');
const path = require('path');

const isDev = process.argv.includes('--dev');

// エントリーポイントファイル
const entryPoints = [
  './src/index.tsx',
  
];

// ビルド設定
const buildOptions = {
  entryPoints,
  bundle: true,
  minify: !isDev,
  sourcemap: isDev,
  target: ['es2020'],
  outdir: 'dist',
  plugins: [solidPlugin()],
  loader: {
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.svg': 'file',
    '.gif': 'file',
    '.mp3': 'file',
    '.wav': 'file',
    '.ogg': 'file',
  },
  define: {
    'process.env.NODE_ENV': isDev ? '"development"' : '"production"'
  }
};

// HTMLファイルをdistフォルダにコピー
const copyHtmlFiles = () => {
  const htmlDir = './src/html';
  const distDir = './dist';
  
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }
  
  const files = fs.readdirSync(htmlDir);
  files.forEach(file => {
    if (file.endsWith('.html')) {
      fs.copyFileSync(path.join(htmlDir, file), path.join(distDir, file));
    }
  });
};

// アセットフォルダをdistにコピー
const copyAssets = () => {
  const assetsDir = './src/assets';
  const distAssetsDir = './dist/assets';
  
  if (fs.existsSync(assetsDir)) {
    if (!fs.existsSync(distAssetsDir)) {
      fs.mkdirSync(distAssetsDir, { recursive: true });
    }
    
    const copyDir = (src, dest) => {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
          }
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };
    
    copyDir(assetsDir, distAssetsDir);
  }
};

// 開発モードの場合はウォッチモードを有効化
if (isDev) {
  esbuild.context(buildOptions).then(ctx => {
    copyHtmlFiles();
    copyAssets();
    console.log('⚡ Build complete! Watching for changes...');
    return ctx.watch();
  }).catch(() => process.exit(1));
} else {
  esbuild.build(buildOptions).then(() => {
    copyHtmlFiles();
    copyAssets();
    console.log('⚡ Build complete!');
  }).catch(() => process.exit(1));
}
