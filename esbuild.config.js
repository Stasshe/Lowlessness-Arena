const esbuild = require('esbuild');
const { solidPlugin } = require('esbuild-plugin-solid');
const { inlineImage } = require('esbuild-plugin-inline-image');
const fs = require('fs');
const path = require('path');

const isDev = process.argv.includes('--dev');

// Make sure dist directory exists
if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist', { recursive: true });
}

// Copy index.html to dist
fs.copyFileSync('./src/index.html', './dist/index.html');

// Copy assets folder to dist if it exists
if (fs.existsSync('./src/assets')) {
  const copyDir = (src, dest) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  
  copyDir('./src/assets', './dist/assets');
}

esbuild.build({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  minify: !isDev,
  sourcemap: isDev,
  outfile: './dist/bundle.js',
  loader: {
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.gif': 'file',
    '.svg': 'file',
    '.mp3': 'file',
    '.ogg': 'file',
    '.wav': 'file'
  },
  plugins: [
    solidPlugin(),
    inlineImage({
      limit: -1 // inline all images
    })
  ],
  define: {
    'process.env.NODE_ENV': isDev ? '"development"' : '"production"'
  },
  watch: isDev ? {
    onRebuild(error, result) {
      if (error) console.error('Build failed:', error);
      else console.log('Build succeeded');
    }
  } : false
}).then(() => {
  console.log('Build complete');
  if (isDev) {
    console.log('Watching for changes...');
  }
}).catch(err => {
  console.error(err);
  process.exit(1);
});
