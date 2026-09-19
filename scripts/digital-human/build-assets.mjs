import { createHash } from "node:crypto";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ImageData, createCanvas } from "@napi-rs/canvas";
import { initializeCanvas, readPsd } from "ag-psd";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const defaultPsd = "D:\\Dsk\\MouseWithoutBorders\\ScreenCaptures\\虚拟形象(1).psd";
const defaultOut = path.join(root, "public", "images", "digital-human");

initializeCanvas(createCanvas, (width, height) => new ImageData(width, height));

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const psdPath = path.resolve(argument("--psd", defaultPsd));
const outputDir = path.resolve(argument("--out", defaultOut));
const outputScale = Number(argument("--scale", "0.5"));
const checkOnly = process.argv.includes("--check");

if (!Number.isFinite(outputScale) || outputScale <= 0 || outputScale > 1) {
  throw new Error("--scale must be greater than 0 and no greater than 1");
}

await access(psdPath);
const psdBuffer = await readFile(psdPath);
const sourceHash = createHash("sha256").update(psdBuffer).digest("hex");
const psd = readPsd(psdBuffer, { skipThumbnail: true });

if (!psd.canvas || !psd.width || !psd.height) {
  throw new Error("PSD composite canvas is unavailable");
}

const width = psd.width;
const height = psd.height;
const sourceContext = psd.canvas.getContext("2d");
const sourceImage = sourceContext.getImageData(0, 0, psd.width, psd.height);
removeConnectedPaperBackground(sourceImage);

const byName = new Map(
  (psd.children ?? [])
    .filter((layer) => layer.canvas)
    .map((layer) => [layer.name, layer])
);

function layerMask(names) {
  const canvas = createCanvas(psd.width, psd.height);
  const context = canvas.getContext("2d");
  for (const name of names) {
    const layer = byName.get(name);
    if (!layer) {
      throw new Error(`Missing PSD layer: ${name}`);
    }
    context.drawImage(layer.canvas, layer.left, layer.top);
  }
  return canvas;
}

function polygonMask(points, feather = 2) {
  const canvas = createCanvas(psd.width, psd.height);
  const context = canvas.getContext("2d");
  context.save();
  context.filter = `blur(${feather}px)`;
  context.fillStyle = "#fff";
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) {
    context.lineTo(x, y);
  }
  context.closePath();
  context.fill();
  context.restore();
  return canvas;
}

function ellipseMask(cx, cy, rx, ry, feather = 2) {
  const canvas = createCanvas(psd.width, psd.height);
  const context = canvas.getContext("2d");
  context.save();
  context.filter = `blur(${feather}px)`;
  context.fillStyle = "#fff";
  context.beginPath();
  context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
  return canvas;
}

const masks = {
  head: polygonMask(
    [
      [1090, 470],
      [1125, 610],
      [1260, 350],
      [1455, 165],
      [1690, 310],
      [1850, 555],
      [1765, 730],
      [1760, 945],
      [1620, 1115],
      [1330, 1035],
      [1130, 860]
    ],
    3
  ),
  hairFront: layerMask(["头发1", "头发2", "头发3"]),
  hairBack: layerMask(["头发4", "头发5"]),
  eyeLeft: layerMask(["眼左"]),
  eyeRight: layerMask(["眼右"]),
  browLeft: layerMask(["眉毛左"]),
  browRight: layerMask(["眉毛右"]),
  mouth: ellipseMask(1418, 815, 78, 27, 2),
  smoke: polygonMask(
    [
      [2010, 705],
      [2130, 610],
      [2285, 665],
      [2325, 780],
      [2240, 870],
      [2115, 970],
      [1985, 900]
    ],
    4
  ),
  leftArmUpper: layerMask(["左胳膊上"]),
  leftArmLower: layerMask(["左胳膊下"]),
  leftHand: polygonMask(
    [
      [520, 1325],
      [765, 1255],
      [900, 1410],
      [835, 1575],
      [520, 1585],
      [455, 1450]
    ],
    2
  ),
  jacketFlap: layerMask(["上衣中", "头发6"]),
  rightArmUpper: polygonMask(
    [
      [1640, 790],
      [1835, 730],
      [2090, 960],
      [2010, 1175],
      [1815, 1035],
      [1660, 900]
    ],
    3
  ),
  rightForearm: polygonMask(
    [
      [1900, 995],
      [2115, 1165],
      [1870, 1435],
      [1680, 1590],
      [1480, 1535],
      [1710, 1270]
    ],
    3
  ),
  rightHand: polygonMask(
    [
      [1415, 1420],
      [1650, 1360],
      [1795, 1515],
      [1635, 1650],
      [1445, 1600],
      [1375, 1500]
    ],
    2
  ),
  leftLeg: polygonMask(
    [
      [375, 1570],
      [730, 1450],
      [1050, 1760],
      [1010, 2250],
      [570, 2550],
      [230, 2380],
      [340, 1940]
    ],
    4
  ),
  rightLeg: polygonMask(
    [
      [790, 1495],
      [1240, 1430],
      [1390, 1910],
      [1340, 2390],
      [960, 2480],
      [790, 2100]
    ],
    4
  ),
  leftShoe: polygonMask(
    [
      [140, 2500],
      [440, 2380],
      [690, 2625],
      [640, 3050],
      [300, 3250],
      [90, 3020]
    ],
    3
  ),
  rightShoe: polygonMask(
    [
      [720, 2190],
      [1090, 2160],
      [1310, 2440],
      [1250, 2800],
      [910, 2910],
      [700, 2640]
    ],
    3
  )
};

const sourcePixels = sourceImage.data;
const maskData = new Map();
const unionMask = new Uint8Array(width * height);

for (const [id, canvas] of Object.entries(masks)) {
  const data = canvas
    .getContext("2d")
    .getImageData(0, 0, width, height).data;
  maskData.set(id, data);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let index = 0; index < unionMask.length; index += 1) {
    const alpha = data[index * 4 + 3];
    if (alpha > unionMask[index]) {
      unionMask[index] = alpha;
    }
    if (alpha > 2) {
      const x = index % width;
      const y = Math.floor(index / width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX >= minX) {
    console.log(
      `Mask ${id}: ${minX},${minY} - ${maxX},${maxY}`
    );
  }
}

const base = new Uint8ClampedArray(sourcePixels);
for (let index = 0; index < unionMask.length; index += 1) {
  if (unionMask[index] > 1) {
    base[index * 4 + 3] = 0;
  }
}
fillMaskedInterior(base, sourcePixels, unionMask, width, height);

function removeConnectedPaperBackground(image) {
  const data = image.data;
  const pixelCount = width * height;
  const background = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  const isPaper = (index) => {
    const offset = index * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    return (
      r >= 242 &&
      g >= 242 &&
      b >= 242 &&
      Math.max(r, g, b) - Math.min(r, g, b) <= 12
    );
  };

  const enqueue = (index) => {
    if (index >= 0 && index < pixelCount && !background[index] && isPaper(index)) {
      background[index] = 1;
      queue[tail] = index;
      tail += 1;
    }
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head];
    head += 1;
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(index - 1);
    if (x + 1 < width) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y + 1 < height) enqueue(index + width);
  }

  for (let index = 0; index < pixelCount; index += 1) {
    if (background[index]) {
      data[index * 4 + 3] = 0;
    }
  }
}

function fillMaskedInterior(target, source, mask, imageWidth, imageHeight) {
  const pixelCount = imageWidth * imageHeight;
  const filled = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  for (let index = 0; index < pixelCount; index += 1) {
    if (!mask[index] && source[index * 4 + 3] >= 8) {
      filled[index] = 1;
    }
  }

  const neighbors = [-1, 1, -imageWidth, imageWidth, -imageWidth - 1, -imageWidth + 1, imageWidth - 1, imageWidth + 1];
  for (let index = 0; index < pixelCount; index += 1) {
    if (filled[index] || source[index * 4 + 3] < 8) continue;
    const x = index % imageWidth;
    const y = Math.floor(index / imageWidth);
    const touchesFilled = neighbors.some((delta) => {
      const next = index + delta;
      if (next < 0 || next >= pixelCount || filled[next] !== 1) return false;
      const nextX = next % imageWidth;
      return Math.abs(nextX - x) <= 1 && Math.abs(Math.floor(next / imageWidth) - y) <= 1;
    });
    if (touchesFilled) {
      queue[tail] = index;
      tail += 1;
      filled[index] = 2;
    }
  }

  while (head < tail) {
    const index = queue[head];
    head += 1;
    const x = index % imageWidth;
    const y = Math.floor(index / imageWidth);
    let red = 0;
    let green = 0;
    let blue = 0;
    let alpha = 0;
    let count = 0;

    for (const delta of neighbors) {
      const next = index + delta;
      if (next < 0 || next >= pixelCount) continue;
      const nextX = next % imageWidth;
      const nextY = Math.floor(next / imageWidth);
      if (Math.abs(nextX - x) > 1 || Math.abs(nextY - y) > 1) continue;
      if (filled[next] !== 1) continue;
      const offset = next * 4;
      if (target[offset + 3] < 8) continue;
      red += target[offset];
      green += target[offset + 1];
      blue += target[offset + 2];
      alpha += target[offset + 3];
      count += 1;
    }

    if (count) {
      const offset = index * 4;
      target[offset] = Math.round(red / count);
      target[offset + 1] = Math.round(green / count);
      target[offset + 2] = Math.round(blue / count);
      target[offset + 3] = Math.max(24, Math.round(alpha / count));
      filled[index] = 1;
    }

    if (x > 0) enqueueFill(index - 1);
    if (x + 1 < imageWidth) enqueueFill(index + 1);
    if (y > 0) enqueueFill(index - imageWidth);
    if (y + 1 < imageHeight) enqueueFill(index + imageWidth);
  }

  function enqueueFill(next) {
    if (
      next >= 0 &&
      next < pixelCount &&
      filled[next] === 0 &&
      mask[next] &&
      source[next * 4 + 3] >= 8
    ) {
      filled[next] = 2;
      queue[tail] = next;
      tail += 1;
    }
  }
}

function extractPart(mask) {
  const data = new Uint8ClampedArray(width * height * 4);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let index = 0; index < width * height; index += 1) {
    const alpha = mask[index * 4 + 3];
    if (alpha < 2) continue;
    const sourceOffset = index * 4;
    if (sourcePixels[sourceOffset + 3] < 2) continue;
    const targetOffset = index * 4;
    data[targetOffset] = sourcePixels[sourceOffset];
    data[targetOffset + 1] = sourcePixels[sourceOffset + 1];
    data[targetOffset + 2] = sourcePixels[sourceOffset + 2];
    data[targetOffset + 3] = Math.round(
      (sourcePixels[sourceOffset + 3] * alpha) / 255
    );
    const x = index % width;
    const y = Math.floor(index / width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  if (maxX < minX || maxY < minY) {
    throw new Error("Generated an empty digital-human layer");
  }

  return {
    data,
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

async function writePngBuffer(
  imageData,
  imageWidth,
  imageHeight,
  target,
  scale = 1
) {
  const canvas = createCanvas(imageWidth, imageHeight);
  canvas.getContext("2d").putImageData(imageData, 0, 0);
  await sharp(canvas.toBuffer("image/png"))
    .resize({ width: Math.max(1, Math.round(imageWidth * scale)) })
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })
    .toFile(target);
}

function cropImageData(imageData, imageWidth, left, top, cropWidth, cropHeight) {
  const cropped = new Uint8ClampedArray(cropWidth * cropHeight * 4);
  for (let y = 0; y < cropHeight; y += 1) {
    const sourceStart = ((top + y) * imageWidth + left) * 4;
    const targetStart = y * cropWidth * 4;
    cropped.set(
      imageData.data.slice(sourceStart, sourceStart + cropWidth * 4),
      targetStart
    );
  }
  return new ImageData(cropped, cropWidth, cropHeight);
}

if (checkOnly) {
  const preview = createCanvas(width, height);
  preview.getContext("2d").putImageData(new ImageData(base, width, height), 0, 0);
  await mkdir(path.join(outputDir, "preview"), { recursive: true });
  await sharp(preview.toBuffer("image/png"))
    .resize({ width: Math.round(width * outputScale) })
    .png()
    .toFile(path.join(outputDir, "preview", "base-check.png"));
  console.log(`Checked ${Object.keys(masks).length} masks; no deployable assets written.`);
  process.exit(0);
}

await mkdir(outputDir, { recursive: true });
await writePngBuffer(
  new ImageData(base, width, height),
  width,
  height,
  path.join(outputDir, "body.webp"),
  outputScale
);

const manifestLayers = [
  {
    id: "head",
    maskId: "head",
    z: 30,
    pivot: { x: 0.54, y: 0.96 },
    motion: "head"
  },
  {
    id: "hair-back",
    maskId: "hairBack",
    z: 20,
    pivot: { x: 0.5, y: 0.82 },
    motion: "hairBack"
  },
  {
    id: "hair-front",
    maskId: "hairFront",
    z: 45,
    pivot: { x: 0.5, y: 0.52 },
    motion: "hairFront"
  },
  {
    id: "brow-left",
    maskId: "browLeft",
    z: 52,
    pivot: { x: 0.5, y: 0.55 },
    motion: "brow"
  },
  {
    id: "brow-right",
    maskId: "browRight",
    z: 52,
    pivot: { x: 0.5, y: 0.55 },
    motion: "brow"
  },
  {
    id: "eye-left",
    maskId: "eyeLeft",
    z: 54,
    pivot: { x: 0.5, y: 0.55 },
    motion: "eye"
  },
  {
    id: "eye-right",
    maskId: "eyeRight",
    z: 54,
    pivot: { x: 0.5, y: 0.55 },
    motion: "eye"
  },
  {
    id: "mouth",
    maskId: "mouth",
    z: 56,
    pivot: { x: 0.5, y: 0.5 },
    motion: "mouth"
  },
  {
    id: "smoke",
    maskId: "smoke",
    z: 82,
    pivot: { x: 0.48, y: 0.82 },
    motion: "smoke"
  },
  {
    id: "jacket-flap",
    maskId: "jacketFlap",
    z: 62,
    pivot: { x: 0.35, y: 0.2 },
    motion: "cloth"
  },
  {
    id: "arm-left-upper",
    maskId: "leftArmUpper",
    z: 68,
    pivot: { x: 0.82, y: 0.18 },
    motion: "leftArmUpper"
  },
  {
    id: "arm-left-lower",
    maskId: "leftArmLower",
    z: 66,
    pivot: { x: 0.78, y: 0.16 },
    motion: "leftArmLower"
  },
  {
    id: "hand-left",
    maskId: "leftHand",
    z: 70,
    pivot: { x: 0.84, y: 0.2 },
    motion: "leftHand"
  },
  {
    id: "arm-right-upper",
    maskId: "rightArmUpper",
    z: 64,
    pivot: { x: 0.18, y: 0.18 },
    motion: "rightArmUpper"
  },
  {
    id: "arm-right-forearm",
    maskId: "rightForearm",
    z: 66,
    pivot: { x: 0.76, y: 0.18 },
    motion: "rightForearm"
  },
  {
    id: "hand-right",
    maskId: "rightHand",
    z: 72,
    pivot: { x: 0.18, y: 0.18 },
    motion: "rightHand"
  },
  {
    id: "leg-left",
    maskId: "leftLeg",
    z: 12,
    pivot: { x: 0.66, y: 0.08 },
    motion: "leg"
  },
  {
    id: "leg-right",
    maskId: "rightLeg",
    z: 14,
    pivot: { x: 0.25, y: 0.06 },
    motion: "leg"
  },
  {
    id: "shoe-left",
    maskId: "leftShoe",
    z: 16,
    pivot: { x: 0.38, y: 0.08 },
    motion: "shoe"
  },
  {
    id: "shoe-right",
    maskId: "rightShoe",
    z: 18,
    pivot: { x: 0.46, y: 0.08 },
    motion: "shoe"
  }
];

const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  source: {
    file: path.basename(psdPath),
    sha256: sourceHash,
    width,
    height
  },
  canvas: {
    width: Math.round(width * outputScale),
    height: Math.round(height * outputScale),
    scale: outputScale
  },
  body: {
    src: "/images/digital-human/body.webp",
    width: Math.round(width * outputScale),
    height: Math.round(height * outputScale)
  },
  layers: []
};

for (const item of manifestLayers) {
  const maskPixels = maskData.get(item.maskId);
  if (!maskPixels) {
    throw new Error(`Missing generated mask: ${item.maskId}`);
  }
  const extracted = extractPart(maskPixels);
  const cropped = cropImageData(
    {
      data: extracted.data,
      width,
      height
    },
    width,
    extracted.left,
    extracted.top,
    extracted.width,
    extracted.height
  );
  const outputWidth = Math.max(1, Math.round(extracted.width * outputScale));
  const outputHeight = Math.max(1, Math.round(extracted.height * outputScale));
  const fileName = `${item.id}.webp`;
  await writePngBuffer(
    cropped,
    extracted.width,
    extracted.height,
    path.join(outputDir, fileName),
    outputScale
  );

  manifest.layers.push({
    id: item.id,
    src: `/images/digital-human/${fileName}`,
    x: Math.round(extracted.left * outputScale),
    y: Math.round(extracted.top * outputScale),
    width: outputWidth,
    height: outputHeight,
    zIndex: item.z,
    pivot: item.pivot,
    motion: item.motion
  });
}

await writeFile(
  path.join(outputDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8"
);
await rm(path.join(outputDir, "source-check.png"), { force: true });

console.log(
  `Generated ${manifest.layers.length} layers at ${manifest.canvas.width}x${manifest.canvas.height}.`
);
