// generate-icon.js - Generate AstralStream app icon
const fs = require('fs');
const path = require('path');

// Create a stylized app icon for AstralStream
// Dark background with a play button and cosmic elements
const createAppIcon = (size) => {
  const canvas = Buffer.alloc(size * size * 4);
  
  // Fill with dark gradient background
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      
      // Gradient from dark purple to black
      const gradient = y / size;
      canvas[idx] = Math.floor(25 + (15 * (1 - gradient)));     // R
      canvas[idx + 1] = Math.floor(10 + (20 * (1 - gradient))); // G
      canvas[idx + 2] = Math.floor(35 + (25 * (1 - gradient))); // B
      canvas[idx + 3] = 255; // A
    }
  }
  
  // Add cosmic dots (stars)
  const starCount = Math.floor(size / 10);
  for (let i = 0; i < starCount; i++) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    const brightness = Math.floor(150 + Math.random() * 105);
    const idx = (y * size + x) * 4;
    
    canvas[idx] = brightness;
    canvas[idx + 1] = brightness;
    canvas[idx + 2] = brightness;
    canvas[idx + 3] = 255;
  }
  
  // Draw play button triangle
  const centerX = size / 2;
  const centerY = size / 2;
  const triangleSize = size * 0.3;
  
  // Create glowing effect
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      
      // Calculate if point is inside triangle
      const relX = x - centerX;
      const relY = y - centerY;
      
      // Simple triangle check (play button shape)
      if (relX > -triangleSize/2 && relX < triangleSize/2) {
        const triangleWidth = triangleSize * (1 - Math.abs(relY) / (triangleSize * 0.866));
        if (Math.abs(relX) < triangleWidth/2 && relY > -triangleSize*0.433 && relY < triangleSize*0.433) {
          // Inside triangle - make it glow
          const dist = Math.sqrt(relX * relX + relY * relY);
          const glow = Math.max(0, 1 - dist / (triangleSize * 0.7));
          
          canvas[idx] = Math.min(255, 255 * glow + 100);     // R
          canvas[idx + 1] = Math.min(255, 107 * glow + 50);  // G
          canvas[idx + 2] = Math.min(255, 107 * glow + 50);  // B
          canvas[idx + 3] = 255;
        }
      }
    }
  }
  
  // Add app name initial "A" in corner
  const letterSize = size * 0.15;
  const margin = size * 0.1;
  
  // Simple "A" shape
  for (let y = 0; y < letterSize; y++) {
    for (let x = 0; x < letterSize; x++) {
      const relY = y / letterSize;
      const relX = x / letterSize;
      
      // Create "A" shape
      if ((Math.abs(relX - 0.5) < relY * 0.5 && relY > 0.2) || // Sides
          (relY > 0.4 && relY < 0.6 && relX > 0.2 && relX < 0.8)) { // Cross bar
        const idx = ((Math.floor(margin + y)) * size + Math.floor(margin + x)) * 4;
        canvas[idx] = 255;
        canvas[idx + 1] = 107;
        canvas[idx + 2] = 107;
        canvas[idx + 3] = 255;
      }
    }
  }
  
  return canvas;
};

// Create PNG header
const createPNG = (width, height, data) => {
  const crc32 = (buf) => {
    let c;
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      }
      crcTable[n] = c;
    }
    
    c = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xFF];
    }
    return (c ^ (-1)) >>> 0;
  };
  
  const chunks = [];
  
  // PNG signature
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  
  // IHDR chunk
  const ihdr = Buffer.concat([
    Buffer.from('IHDR'),
    Buffer.from([
      (width >> 24) & 0xff, (width >> 16) & 0xff, (width >> 8) & 0xff, width & 0xff,
      (height >> 24) & 0xff, (height >> 16) & 0xff, (height >> 8) & 0xff, height & 0xff,
      8, 6, 0, 0, 0
    ])
  ]);
  
  chunks.push(Buffer.from([0, 0, 0, 13]));
  chunks.push(ihdr);
  chunks.push(Buffer.from([
    (crc32(ihdr) >> 24) & 0xff,
    (crc32(ihdr) >> 16) & 0xff,
    (crc32(ihdr) >> 8) & 0xff,
    crc32(ihdr) & 0xff
  ]));
  
  // IDAT chunk (simplified - uncompressed)
  const pako = require('pako');
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let pos = 0;
  
  for (let y = 0; y < height; y++) {
    rawData[pos++] = 0; // filter type
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      rawData[pos++] = data[idx];     // R
      rawData[pos++] = data[idx + 1]; // G
      rawData[pos++] = data[idx + 2]; // B
      rawData[pos++] = data[idx + 3]; // A
    }
  }
  
  const compressed = Buffer.from(pako.deflate(rawData));
  const idat = Buffer.concat([Buffer.from('IDAT'), compressed]);
  
  chunks.push(Buffer.from([
    (compressed.length >> 24) & 0xff,
    (compressed.length >> 16) & 0xff,
    (compressed.length >> 8) & 0xff,
    compressed.length & 0xff
  ]));
  chunks.push(idat);
  chunks.push(Buffer.from([
    (crc32(idat) >> 24) & 0xff,
    (crc32(idat) >> 16) & 0xff,
    (crc32(idat) >> 8) & 0xff,
    crc32(idat) & 0xff
  ]));
  
  // IEND chunk
  const iend = Buffer.from('IEND');
  chunks.push(Buffer.from([0, 0, 0, 0]));
  chunks.push(iend);
  chunks.push(Buffer.from([
    (crc32(iend) >> 24) & 0xff,
    (crc32(iend) >> 16) & 0xff,
    (crc32(iend) >> 8) & 0xff,
    crc32(iend) & 0xff
  ]));
  
  return Buffer.concat(chunks);
};

// Generate icons
console.log('Generating AstralStream app icons...');

// Install pako if needed
try {
  require('pako');
} catch (e) {
  console.log('Installing pako for PNG compression...');
  require('child_process').execSync('npm install pako', { stdio: 'inherit' });
}

// Generate different sizes
const sizes = [
  { size: 192, name: 'icon.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 1024, name: 'icon-1024.png' }
];

sizes.forEach(({ size, name }) => {
  const iconData = createAppIcon(size);
  const pngData = createPNG(size, size, iconData);
  const outputPath = path.join(__dirname, name);
  
  fs.writeFileSync(outputPath, pngData);
  console.log(`Created ${name} (${size}x${size})`);
});

// Also create adaptive icon for Android
const adaptiveIcon = createAppIcon(512);
const adaptivePng = createPNG(512, 512, adaptiveIcon);
fs.writeFileSync(path.join(__dirname, 'adaptive-icon.png'), adaptivePng);
console.log('Created adaptive-icon.png (512x512)');

console.log('\nApp icons generated successfully!');
console.log('The icons feature:');
console.log('- Dark cosmic gradient background');
console.log('- Glowing play button in center');
console.log('- Subtle star effects');
console.log('- "A" logo mark for AstralStream');