// generate-splash.js - Generate AstralStream splash screen
const fs = require('fs');
const path = require('path');

// Create a splash screen with AstralStream branding
const createSplashScreen = (width, height) => {
  const canvas = Buffer.alloc(width * height * 4);
  
  // Create gradient background
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Radial gradient from center
      const centerX = width / 2;
      const centerY = height / 2;
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
      const gradient = Math.min(1, distance / maxDistance);
      
      // Dark purple to black gradient
      canvas[idx] = Math.floor(20 + (10 * (1 - gradient)));     // R
      canvas[idx + 1] = Math.floor(10 + (5 * (1 - gradient)));  // G
      canvas[idx + 2] = Math.floor(30 + (15 * (1 - gradient))); // B
      canvas[idx + 3] = 255; // A
    }
  }
  
  // Add cosmic particles
  const particleCount = Math.floor((width * height) / 5000);
  for (let i = 0; i < particleCount; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const brightness = Math.floor(100 + Math.random() * 155);
    const size = Math.random() > 0.8 ? 2 : 1;
    
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        if (x + dx < width && y + dy < height) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          canvas[idx] = brightness;
          canvas[idx + 1] = brightness;
          canvas[idx + 2] = brightness;
          canvas[idx + 3] = 255;
        }
      }
    }
  }
  
  // Draw AstralStream logo
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Large play button with glow
  const buttonSize = Math.min(width, height) * 0.2;
  const glowRadius = buttonSize * 1.5;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Glow effect
      if (distance < glowRadius) {
        const idx = (y * width + x) * 4;
        const glow = Math.max(0, 1 - distance / glowRadius);
        const glowIntensity = glow * glow * 0.3;
        
        canvas[idx] = Math.min(255, canvas[idx] + 255 * glowIntensity);
        canvas[idx + 1] = Math.min(255, canvas[idx + 1] + 107 * glowIntensity);
        canvas[idx + 2] = Math.min(255, canvas[idx + 2] + 107 * glowIntensity);
      }
      
      // Triangle play button
      const relX = dx / buttonSize;
      const relY = dy / buttonSize;
      
      if (relX > -0.5 && relX < 0.5 && Math.abs(relY) < 0.433) {
        const triangleX = relX + 0.5;
        const triangleWidth = 1 - Math.abs(relY) / 0.433;
        
        if (triangleX < triangleWidth * 0.866) {
          const idx = (y * width + x) * 4;
          canvas[idx] = 255;
          canvas[idx + 1] = 107;
          canvas[idx + 2] = 107;
          canvas[idx + 3] = 255;
        }
      }
    }
  }
  
  // Add "AstralStream" text below logo
  const textY = centerY + buttonSize + 40;
  const letterWidth = 20;
  const letterHeight = 30;
  const spacing = 25;
  const text = "ASTRALSTREAM";
  const textStartX = centerX - (text.length * spacing) / 2;
  
  // Simple letter shapes (simplified for demonstration)
  const letters = {
    'A': [[0.5,0], [0.2,1], [0.8,1], [0.35,0.6], [0.65,0.6]],
    'S': [[0.8,0.2], [0.2,0.2], [0.2,0.5], [0.8,0.5], [0.8,0.8], [0.2,0.8]],
    'T': [[0.5,0], [0.5,1], [0.2,0], [0.8,0]],
    'R': [[0.2,0], [0.2,1], [0.2,0], [0.8,0], [0.8,0.5], [0.2,0.5], [0.8,1]],
    'L': [[0.2,0], [0.2,1], [0.8,1]],
    'E': [[0.2,0], [0.2,1], [0.2,0], [0.8,0], [0.2,0.5], [0.6,0.5], [0.2,1], [0.8,1]],
    'M': [[0.2,1], [0.2,0], [0.5,0.3], [0.8,0], [0.8,1]]
  };
  
  // Draw text (simplified - just blocks for now)
  for (let i = 0; i < text.length; i++) {
    const charX = textStartX + i * spacing;
    
    // Simple block letters
    for (let y = 0; y < letterHeight; y++) {
      for (let x = 0; x < letterWidth; x++) {
        const pixelX = Math.floor(charX + x);
        const pixelY = Math.floor(textY + y);
        
        if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
          // Create simple letter shapes
          const relX = x / letterWidth;
          const relY = y / letterHeight;
          
          let draw = false;
          const letter = text[i];
          
          // Simplified letter drawing
          if (letter === 'A' && ((relX < 0.3 || relX > 0.7) || (relY > 0.4 && relY < 0.6))) draw = true;
          if (letter === 'S' && ((relY < 0.2 || (relY > 0.4 && relY < 0.6) || relY > 0.8))) draw = true;
          if (letter === 'T' && (relY < 0.2 || (relX > 0.4 && relX < 0.6))) draw = true;
          if (letter === 'R' && (relX < 0.3 || (relY < 0.2 || (relY > 0.4 && relY < 0.6)))) draw = true;
          if (letter === 'L' && (relX < 0.3 || relY > 0.8)) draw = true;
          if (letter === 'E' && (relX < 0.3 || relY < 0.2 || (relY > 0.4 && relY < 0.6) || relY > 0.8)) draw = true;
          if (letter === 'M' && (relX < 0.2 || relX > 0.8 || (relX > 0.4 && relX < 0.6 && relY < 0.5))) draw = true;
          
          if (draw) {
            const idx = (pixelY * width + pixelX) * 4;
            canvas[idx] = 200;
            canvas[idx + 1] = 200;
            canvas[idx + 2] = 200;
            canvas[idx + 3] = 255;
          }
        }
      }
    }
  }
  
  return canvas;
};

// Create PNG (reuse function from icon generator)
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
  
  // IDAT chunk
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

// Generate splash screen
console.log('Generating AstralStream splash screen...');

const splashData = createSplashScreen(1242, 2436); // iPhone X dimensions
const pngData = createPNG(1242, 2436, splashData);
const outputPath = path.join(__dirname, 'splash.png');

fs.writeFileSync(outputPath, pngData);
console.log('Created splash.png (1242x2436)');

console.log('\nSplash screen generated successfully!');
console.log('Features:');
console.log('- Radial gradient background');
console.log('- Glowing play button logo');
console.log('- AstralStream text');
console.log('- Cosmic particle effects');