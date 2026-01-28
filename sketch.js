let img;
let myFont;

// 交互组件
let sizeSlider, tightSlider, contrastSlider, brightSlider, canvasSlider;
let charInput;
let rInput, gInput, bInput; 
let uploadBtn, saveBtn; // 添加保存按钮
let sortedChars = ""; 

function preload() {
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

  createP('4. Canvas Width(maintain the original aspect ratio):');
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
}

function draw() {
  // --- 核心修改：使用 clear() 代替 background() 实现透明 ---
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

  for (let y = 0; y < tempImg.height; y++) {
    for (let x = 0; x < tempImg.width; x++) {
      let i = (x + y * tempImg.width) * 4;
      let bright = 0.2126 * tempImg.pixels[i] + 0.7152 * tempImg.pixels[i+1] + 0.0722 * tempImg.pixels[i+2];

      bright += brightnessAdd;
      bright = (bright - 128) * contrast + 128;
      bright = constrain(bright, 0, 255);

      // 背景消除：亮度高于阈值的像素不进行绘制，从而保持画布在该处透明
      if (bright > 245) continue; 

      if (sortedChars.length > 0) {
        let charIdx = floor(map(bright, 0, 245, 0, sortedChars.length - 1));
        charIdx = constrain(charIdx, 0, sortedChars.length - 1);
        text(sortedChars[charIdx], x * stepX, y * stepY);
      }
    }
  }
}

function exportTransparentPNG() {
  saveCanvas('ascii_transparent', 'png');
}

// 排序函数（保持不变）
function updateSortedChars() {
  let inputVal = charInput.value().replace(/\s/g, '');
  if (inputVal.length === 0) {
    sortedChars = "";
    return;
  }
  let charList = inputVal.split('');
  let weights = [];
  push();
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
  pop();
  weights.sort((a, b) => b.weight - a.weight);
  sortedChars = weights.map(w => w.char).join('');
}

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data);
  }
}