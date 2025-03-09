document.getElementById("fileInput").addEventListener("change", handleFile);
document.getElementById("downloadBtn").addEventListener("click", downloadImage);

let colorTable = {};
let progressBar = document.createElement("progress");
progressBar.id = "progressBar";
progressBar.value = 0;
progressBar.max = 100;
document.querySelector(".container").appendChild(progressBar);

// 2つのJSONファイルをロードし、データを統合
Promise.all([
    fetch('color_table_part1.json').then(response => response.json()),
    fetch('color_table_part2.json').then(response => response.json())
]).then(([data1, data2]) => {
    colorTable = { ...data1, ...data2 };
    console.log("カラーテーブルのロード完了", Object.keys(colorTable).length, "件のエントリ");
}).catch(error => console.error("JSONファイルの読み込みエラー:", error));

function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    if (file.type.startsWith("image/")) {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            applyColorTransform(ctx, canvas.width, canvas.height);
        };
        img.src = URL.createObjectURL(file);
    }
}

function applyColorTransform(ctx, width, height) {
    let imageData = ctx.getImageData(0, 0, width, height);
    let data = imageData.data;
    let totalPixels = width * height;
    let processedPixels = 0;

    console.log("画像処理開始: ", width, "x", height, "ピクセル");

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i+1], b = data[i+2];
        let key = `${r},${g},${b}`;

        if (colorTable.hasOwnProperty(key)) {
            let [newR, newG, newB] = colorTable[key].split(',').map(Number);
            data[i] = newR;
            data[i+1] = newG;
            data[i+2] = newB;
        } else {
            let nearestColor = findNearestColor(r, g, b);
            data[i] = nearestColor[0];
            data[i+1] = nearestColor[1];
            data[i+2] = nearestColor[2];
        }

        processedPixels++;
        if (processedPixels % 1000 === 0) {
            progressBar.value = (processedPixels / totalPixels) * 100;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    progressBar.value = 100;
    console.log("画像処理完了");
}

function findNearestColor(r, g, b) {
    let minDistance = Infinity;
    let closestColor = [r, g, b];

    for (let key in colorTable) {
        let [cr, cg, cb] = key.split(',').map(Number);
        let distance = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;

        if (distance < minDistance) {
            minDistance = distance;
            closestColor = colorTable[key].split(',').map(Number);
        }
    }

    return closestColor;
}

function downloadImage() {
    const canvas = document.getElementById("canvas");
    const link = document.createElement("a");
    link.download = "converted_image.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}