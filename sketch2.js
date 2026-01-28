let img;
let myFont;

// 交互组件
let sizeSlider, tightSlider, contrastSlider, brightSlider, canvasSlider;
let charInput;
let rInput, gInput, bInput; 
let uploadBtn, saveBtn; 
let sortedChars = ""; 

function preload() {
  // 请确保文件名与你的文件匹配
  img = loadImage('microscope.jpg'); 
  myFont = loadFont('G15_Font.ttf');
}

function setup() {
  createCanvas(600, 600);
  
  // --- UI 组件创建 ---
  createP('1. Upload Image:');
  uploadBtn = createFileInput(handleFile);

  createP('2. Insert Glyphs:');
  charInput = createInput('@#*+=-.'); 
  charInput.size(400);

  createP('3. Character Color:');
  let colorDiv = createDiv('');
  rInput = createInput('0'); rInput.size(40); rInput.parent(colorDiv);
  createSpan(' R ').parent(colorDiv);
  gInput = createInput('0'); gInput.size(40); gInput.parent(colorDiv);
  createSpan(' G ').parent(colorDiv);
  bInput = createInput('0'); bInput.size(40); bInput.parent(colorDiv);
  createSpan(' B ').parent(colorDiv);

  createP('4. Canvas Width:');
  canvasSlider = createSlider(200, 1200, 600, 10);

  createP('5. Font Size / Spacing / Brightness / Contrast:');
  sizeSlider = createSlider(5, 40, 10, 1);
  tightSlider = createSlider(0.3, 1.5, 0.7, 0.05);
  brightSlider = createSlider(-100, 100, 0, 1);
  contrastSlider = createSlider(0.5, 3.0, 1.2, 0.1);

  createP('6. Export');
  saveBtn = createButton('Export Transparent PNG');
  saveBtn.mousePressed(exportTransparentPNG);

  textFont(myFont);
  textAlign(LEFT, TOP);
  
  updateSortedChars();
  charInput.input(updateSortedChars);
  
  // 如果你不希望画面一直闪烁，可以取消下面这行的注释
  // noLoop(); 
}

function draw() {
  clear(); 
  
  if (!img) return; 

  let targetWidth = canvasSlider.value();
  let aspectRatio = img.height / img.width;
  let targetHeight = targetWidth * aspectRatio;
  if (width !== targetWidth || height !== targetHeight) {
    resizeCanvas(targetWidth, targetHeight);
  }

  let charSize = sizeSlider.value();
  let tightness = tightSlider.value();
  let contrast = contrastSlider.value();
  let brightnessAdd = brightSlider.value();
  
  let r = parseInt(rInput.value()) || 0;
  let g = parseInt(gInput.value()) || 0;
  let b = parseInt(bInput.value()) || 0;
  fill(r, g, b);

  textSize(charSize);

  let stepX = charSize * tightness;
  let stepY = charSize * tightness;
  let cols = floor(width / stepX);
  let rows = floor(height / stepY);

  let tempImg = img.get();
  tempImg.resize(cols, rows);
  tempImg.loadPixels();

  // 这里的 randomSeed 可以保证每一帧生成的随机分布是固定的，
  // 除非你移动了滑块。这样画面就不会一直疯狂闪烁。
  randomSeed(99); 

  for (let y = 0; y < tempImg.height; y++) {
    for (let x = 0; x < tempImg.width; x++) {
      let i = (x + y * tempImg.width) * 4;
      let bright = 0.2126 * tempImg.pixels[i] + 0.7152 * tempImg.pixels[i+1] + 0.0722 * tempImg.pixels[i+2];

      bright += brightnessAdd;
      bright = (bright - 128) * contrast + 128;
      bright = constrain(bright, 0, 255);

      if (bright > 245) continue; 

      if (sortedChars.length > 0) {
        // --- 随机逻辑核心开始 ---
        // 1. 先计算目标亮度对应的理想索引
        let baseIdx = floor(map(bright, 0, 245, 0, sortedChars.length - 1));
        
        // 2. 引入随机偏移量。这里范围设为 1，即在 baseIdx 的前后 1 位范围内波动。
        // 如果你想随机感更强，可以把 1 改成 2 或更大。
        let offset = floor(random(-1, 2)); 
        let charIdx = constrain(baseIdx + offset, 0, sortedChars.length - 1);
        
        text(sortedChars[charIdx], x * stepX, y * stepY);
        // --- 随机逻辑核心结束 ---
      }
    }
  }
}

function exportTransparentPNG() {
  saveCanvas('ascii_transparent', 'png');
}

function updateSortedChars() {
  let inputVal = charInput.value().replace(/\s/g, '');
  if (inputVal.length === 0) {
    sortedChars = "";
    return;
  }
  let charList = inputVal.split('');
  let weights = [];
  
  // 临时创建一个图形上下文来测量字符深浅
  for (let c of charList) {
    let pg = createGraphics(40, 40);
    pg.textFont(myFont);
    pg.textSize(30);
    pg.fill(0);
    pg.text(c, 0, 0);
    pg.loadPixels();
    let count = 0;
    for (let i = 3; i < pg.pixels.length; i += 4) {
      if (pg.pixels[i] > 50) count++;
    }
    weights.push({ char: c, weight: count });
  }
  
  weights.sort((a, b) => b.weight - a.weight);
  sortedChars = weights.map(w => w.char).join('');
  
  // 更新字符后重新渲染
  redraw();
}

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, () => {
      redraw();
    });
  }
}