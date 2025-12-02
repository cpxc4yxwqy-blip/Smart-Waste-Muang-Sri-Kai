import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple waste icon with green background
const createWasteIcon = async () => {
  const sizes = [192, 512, 1024];
  const publicDir = path.join(__dirname, '..', 'public', 'icons');
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Create SVG icon
  const svg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <rect width="1024" height="1024" fill="#10b981" rx="180"/>
      <g transform="translate(512, 512)">
        <!-- Trash bin icon -->
        <rect x="-200" y="-100" width="400" height="450" fill="white" rx="20"/>
        <rect x="-250" y="-150" width="500" height="50" fill="white" rx="10"/>
        <rect x="-150" y="-120" width="80" height="30" fill="#10b981" rx="5"/>
        <!-- Recycling symbol lines -->
        <path d="M -80,-20 L -80,200" stroke="#10b981" stroke-width="40" stroke-linecap="round"/>
        <path d="M 0,-20 L 0,200" stroke="#10b981" stroke-width="40" stroke-linecap="round"/>
        <path d="M 80,-20 L 80,200" stroke="#10b981" stroke-width="40" stroke-linecap="round"/>
      </g>
    </svg>
  `;

  // Generate PNG icons
  for (const size of sizes) {
    const buffer = Buffer.from(svg);
    await sharp(buffer)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `icon-${size}.png`));
    
    console.log(`✓ Created icon-${size}.png`);
  }

  console.log('\n✅ All icons created successfully!');
};

createWasteIcon().catch(console.error);
