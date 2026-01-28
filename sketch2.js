let img;
let myFont;

// 交互组件
let sizeSlider, tightSlider, contrastSlider, brightSlider, canvasSlider;
let charInput;
let rInput, gInput, bInput; 
let uploadBtn, saveBtn; 
let sortedChars = ""; 

function preload() {
  // 确保资源路径正确
  img = loadImage('microscope.jpg'); 
  myFont = loadFont('G15_Font.ttf');
}

function setup() {
  // 开启 SVG 模式实现矢量化
  // 建议配合 index.html 中的 p5.js v1.4.1 和 p5.svg v1.3.1 使用以确兼容性
  createCanvas(600, 600, SVG); 
  
  // --- UI 组件创建 ---
  createP('1. Upload Image:');
  uploadBtn = createFileInput(handleFile);

  createP('2. Insert Glyphs:');
  charInput = createInput('@#*+=-.'); 
  charInput.size(400);
  charInput.input(() => { updateSortedChars(); redraw(); });

  createP('3. Character Color:');
  let colorDiv = createDiv('');
  rInput = createInput('0'); rInput.size(40); rInput.parent(colorDiv);
  gInput = createInput('0'); gInput.size(40); gInput.parent(colorDiv);
  bInput = createInput('0'); bInput.size(40); bInput.parent(colorDiv);
  rInput.input(redraw); gInput.input(redraw); bInput.input(redraw);

  createP('4. Canvas Width:');
  canvasSlider = createSlider(200, 1200, 600, 10);
  canvasSlider.input(redraw);

  createP('5. Font Size / Spacing / Brightness / Contrast:');
  sizeSlider = createSlider(5, 40, 10, 1);
  sizeSlider.input(redraw);
  tightSlider = createSlider(0.3, 1.5, 0.7, 0.05);
  tightSlider.input(redraw);
  brightSlider = createSlider(-100, 100, 0, 1);
  brightSlider.input(redraw);
  contrastSlider = createSlider(0.5, 3.0, 1.2, 0.1);
  contrastSlider.input(redraw);

  createP('6. Export');
  saveBtn = createButton('Export Vector SVG');
  saveBtn.mousePressed(exportVectorSVG);

  textFont(myFont);
  textAlign(LEFT, TOP);
  
  updateSortedChars();
  
  // 停止自动循环以防 SVG 渲染导致浏览器崩溃
  noLoop(); 
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
  noStroke(); // 确保矢量路径没有多余边框

  textSize(charSize);

  let stepX = charSize * tightness;
  let stepY = charSize * tightness;
  let cols = floor(width / stepX);
  let rows = floor(height / stepY);

  let tempImg = img.get();
  tempImg.resize(cols, rows);
  tempImg.loadPixels();

  // 移除了 randomSeed(99)，因为现在没有随机逻辑了

  for (let y = 0; y < tempImg.height; y++) {
    for (let x = 0; x < tempImg.width; x++) {
      let i = (x + y * tempImg.width) * 4;
      let bright = 0.2126 * tempImg.pixels[i] + 0.7152 * tempImg.pixels[i+1] + 0.0722 * tempImg.pixels[i+2];

      bright += brightnessAdd;
      bright = (bright - 128) * contrast + 128;
      bright = constrain(bright, 0, 255);

      if (bright > 245) continue; 

      if (sortedChars.length > 0) {
        // --- 已修改：回归确定性映射逻辑，与 PNG 版本完全一致 ---
        let charIdx = floor(map(bright, 0, 245, 0, sortedChars.length - 1));
        charIdx = constrain(charIdx, 0, sortedChars.length - 1);
        
        text(sortedChars[charIdx], x * stepX, y * stepY);
      }
    }
  }
  console.log("Vector frame rendered.");
}

function exportVectorSVG() {
  saveCanvas('ascii_design_vector', 'svg');
}

function updateSortedChars() {
  let inputVal = charInput.value().replace(/\s/g, '');
  if (inputVal.length === 0) {
    sortedChars = "";
    return;
  }
  let charList = inputVal.split('');
  let weights = [];
  
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
}

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, () => {
      redraw();
    });
  }
}
