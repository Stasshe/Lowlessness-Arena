#!/bin/bash

# 必要なディレクトリ構造を作成
echo "ディレクトリ構造を作成中..."

mkdir -p src/assets/images/characters/{hugues,gawain,lancel,beatrice,marguerite}
mkdir -p src/assets/images/tiles
mkdir -p src/assets/images/projectiles
mkdir -p src/assets/images/effects
mkdir -p src/assets/images/ui
mkdir -p src/assets/sounds

# プレースホルダー画像を作成する関数
create_placeholder_image() {
  local filename=$1
  local text=$2
  local width=${3:-64}
  local height=${4:-64}
  local bgcolor=${5:-"#3498db"}
  local textcolor=${6:-"#ffffff"}
  
  convert -size ${width}x${height} xc:${bgcolor} \
    -gravity center -pointsize 14 -fill ${textcolor} -annotate 0 "${text}" \
    "${filename}"
  
  echo "作成: ${filename}"
}

# キャラクターのスプライトシートを作成
echo "キャラクター用のプレースホルダー画像を作成中..."

# キャラクターアニメーションフレームの作成
create_character_animations() {
  local character=$1
  local color=$2
  
  # アイドル (4フレーム)
  convert -size 256x64 xc:none \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nidle 0" \) -geometry +0+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nidle 1" \) -geometry +64+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nidle 2" \) -geometry +128+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nidle 3" \) -geometry +192+0 -composite \
    "src/assets/images/characters/${character}/${character}-idle.png"
  
  # 走る (8フレーム)
  convert -size 512x64 xc:none \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nrun 0" \) -geometry +0+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nrun 1" \) -geometry +64+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nrun 2" \) -geometry +128+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nrun 3" \) -geometry +192+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nrun 4" \) -geometry +256+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nrun 5" \) -geometry +320+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nrun 6" \) -geometry +384+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nrun 7" \) -geometry +448+0 -composite \
    "src/assets/images/characters/${character}/${character}-run.png"
  
  # 攻撃 (6フレーム)
  convert -size 384x64 xc:none \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nattack 0" \) -geometry +0+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nattack 1" \) -geometry +64+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nattack 2" \) -geometry +128+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nattack 3" \) -geometry +192+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nattack 4" \) -geometry +256+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nattack 5" \) -geometry +320+0 -composite \
    "src/assets/images/characters/${character}/${character}-attack.png"
  
  # スキル (6フレーム)
  convert -size 384x64 xc:none \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nskill 0" \) -geometry +0+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nskill 1" \) -geometry +64+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nskill 2" \) -geometry +128+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nskill 3" \) -geometry +192+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nskill 4" \) -geometry +256+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nskill 5" \) -geometry +320+0 -composite \
    "src/assets/images/characters/${character}/${character}-skill.png"
  
  # アルティメット (8フレーム)
  convert -size 512x64 xc:none \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nult 0" \) -geometry +0+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nult 1" \) -geometry +64+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nult 2" \) -geometry +128+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nult 3" \) -geometry +192+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nult 4" \) -geometry +256+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nult 5" \) -geometry +320+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nult 6" \) -geometry +384+0 -composite \
    \( -size 64x64 xc:${color} -gravity center -pointsize 12 -fill white -annotate 0 "${character}\nult 7" \) -geometry +448+0 -composite \
    "src/assets/images/characters/${character}/${character}-ultimate.png"
  
  # キャラクターのポートレイト
  create_placeholder_image "src/assets/images/characters/${character}/${character}-portrait.png" "${character}" 200 200 ${color}
}

# 各キャラクターのスプライトを作成
create_character_animations "hugues" "#3498db"     # 青
create_character_animations "gawain" "#f39c12"     # オレンジ
create_character_animations "lancel" "#2ecc71"     # 緑
create_character_animations "beatrice" "#9b59b6"   # 紫
create_character_animations "marguerite" "#e74c3c" # 赤

# タイル画像
echo "タイル画像を作成中..."
create_placeholder_image "src/assets/images/tiles/floor.png" "Floor" 64 64 "#95a5a6"
create_placeholder_image "src/assets/images/tiles/wall.png" "Wall" 64 64 "#34495e"
create_placeholder_image "src/assets/images/tiles/grass.png" "Grass" 64 64 "#27ae60"

# 投射物画像
echo "投射物画像を作成中..."
create_placeholder_image "src/assets/images/projectiles/bullet.png" "•" 16 16 "#f39c12"
create_placeholder_image "src/assets/images/projectiles/arrow.png" "→" 24 8 "#2ecc71"
create_placeholder_image "src/assets/images/projectiles/bomb.png" "◉" 24 24 "#e74c3c"

# エフェクト
echo "エフェクト画像を作成中..."
create_placeholder_image "src/assets/images/effects/explosion.png" "BOOM" 64 64 "#e74c3c"

# エフェクトアニメーション（爆発）
convert -size 1024x64 xc:none \
  \( -size 64x64 xc:"#e74c3c" -gravity center -fill white -annotate 0 "BOOM\n1" \) -geometry +0+0 -composite \
  \( -size 64x64 xc:"#e74c3c" -gravity center -fill white -annotate 0 "BOOM\n2" \) -geometry +64+0 -composite \
  \( -size 64x64 xc:"#e74c3c" -gravity center -fill white -annotate 0 "BOOM\n3" \) -geometry +128+0 -composite \
  \( -size 64x64 xc:"#e74c3c" -gravity center -fill white -annotate 0 "BOOM\n4" \) -geometry +192+0 -composite \
  \( -size 64x64 xc:"#e74c3c" -gravity center -fill white -annotate 0 "BOOM\n5" \) -geometry +256+0 -composite \
  \( -size 64x64 xc:"#e74c3c" -gravity center -fill white -annotate 0 "BOOM\n6" \) -geometry +320+0 -composite \
  \( -size 64x64 xc:"#e74c3c" -gravity center -fill white -annotate 0 "BOOM\n7" \) -geometry +384+0 -composite \
  \( -size 64x64 xc:"#e74c3c" -gravity center -fill white -annotate 0 "BOOM\n8" \) -geometry +448+0 -composite \
  \( -size 64x64 xc:"#e74c3c" -gravity center -fill white -annotate 0 "BOOM\n9" \) -geometry +512+0 -composite \
  \( -size 64x64 xc:"#e74c3c" -gravity center -fill white -annotate 0 "BOOM\n10" \) -geometry +576+0 -composite \
  \( -size 64x64 xc:"#e74c3c" -gravity center -fill white -annotate 0 "BOOM\n11" \) -geometry +640+0 -composite \
  \( -size 64x64 xc:"#e74c3c" -gravity center -fill white -annotate 0 "BOOM\n12" \) -geometry +704+0 -composite \
  \( -size 64x64 xc:"#e74c3c" -gravity center -fill white -annotate 0 "BOOM\n13" \) -geometry +768+0 -composite \
  \( -size 64x64 xc:"#e74c3c" -gravity center -fill white -annotate 0 "BOOM\n14" \) -geometry +832+0 -composite \
  \( -size 64x64 xc:"#e74c3c" -gravity center -fill white -annotate 0 "BOOM\n15" \) -geometry +896+0 -composite \
  \( -size 64x64 xc:"#e74c3c" -gravity center -fill white -annotate 0 "BOOM\n16" \) -geometry +960+0 -composite \
  "src/assets/images/effects/explosion-anim.png"

# UI要素
echo "UI要素を作成中..."
create_placeholder_image "src/assets/images/ui/health-bar.png" "" 200 20 "#2ecc71"
create_placeholder_image "src/assets/images/ui/health-bar-bg.png" "" 200 20 "#2c3e50"
create_placeholder_image "src/assets/images/ui/skill-button.png" "S" 80 80 "#3498db"
create_placeholder_image "src/assets/images/ui/ult-button.png" "ULT" 80 80 "#e74c3c"
create_placeholder_image "src/assets/images/logo.png" "Lowlessness\nArena" 256 128 "#3498db" "#ffffff"
create_placeholder_image "src/assets/images/loading-bar.png" "Loading..." 400 30 "#3498db"

# CSSファイルのディレクトリ作成
mkdir -p src/assets/css

# 音声ファイル生成（Sox を使用）
if command -v sox > /dev/null; then
  echo "音声ファイルを作成中..."
  # ショット音
  sox -n "src/assets/sounds/shot.mp3" synth 0.1 sin 1000 vol 0.3
  # ヒット音
  sox -n "src/assets/sounds/hit.mp3" synth 0.15 noise vol 0.2
  # 爆発音
  sox -n "src/assets/sounds/explosion.mp3" synth 0.5 noise fade 0 0.1 0.5 vol 0.4
  echo "音声ファイル作成完了"
else
  echo "警告: sox コマンドが見つからないため、音声ファイルは作成されません。"
  echo "必要に応じて空のファイルを作成します..."
  touch src/assets/sounds/shot.mp3
  touch src/assets/sounds/hit.mp3
  touch src/assets/sounds/explosion.mp3
fi

echo "アセット準備完了！"
echo "必要に応じて、実際のゲーム用アセットに差し替えてください。"
