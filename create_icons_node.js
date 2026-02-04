const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, size, size);
  
  // Draw background circle (Jira blue: #0052CC)
  const margin = size / 10;
  ctx.fillStyle = '#0052CC';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - margin, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw ticket (white rectangle)
  const ticketMargin = size / 4;
  const ticketWidth = size - 2 * ticketMargin;
  const ticketHeight = size - 2 * ticketMargin;
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(ticketMargin, ticketMargin, ticketWidth, ticketHeight);
  
  // Draw perforated edge (dots on left)
  ctx.fillStyle = '#0052CC';
  const dotSize = Math.max(1, size / 16);
  const dotSpacing = size / 8;
  const numDots = Math.floor(ticketHeight / dotSpacing);
  for (let i = 0; i < numDots; i++) {
    const y = ticketMargin + i * dotSpacing + dotSpacing / 2;
    if (y < ticketMargin + ticketHeight) {
      ctx.beginPath();
      ctx.arc(ticketMargin, y, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Draw lines on ticket (representing text)
  ctx.fillStyle = '#C8C8C8';
  const lineY = ticketMargin + ticketHeight / 3;
  const lineWidth = ticketWidth - 2 * (size / 8);
  ctx.fillRect(ticketMargin + size / 8, lineY, lineWidth, Math.max(1, size / 32));
  
  const lineY2 = ticketMargin + ticketHeight / 2;
  ctx.fillRect(ticketMargin + size / 8, lineY2, lineWidth * 0.7, Math.max(1, size / 32));
  
  return canvas;
}

// Create icons directory
if (!fs.existsSync('icons')) {
  fs.mkdirSync('icons');
}

// Generate icons
[16, 48, 128].forEach(size => {
  const canvas = createIcon(size);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icons/icon${size}.png`, buffer);
  console.log(`Created icons/icon${size}.png`);
});

