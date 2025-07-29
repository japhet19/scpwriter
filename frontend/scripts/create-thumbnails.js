#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '../public/images');
const THUMBS_DIR = path.join(__dirname, '../public/images/thumbnails');

// Create thumbnails directory if it doesn't exist
if (!fs.existsSync(THUMBS_DIR)) {
  fs.mkdirSync(THUMBS_DIR, { recursive: true });
}

// Theme images to process
const themes = ['scp', 'fantasy', 'cyberpunk', 'romance', 'noir', 'scifi'];
const imageVariants = [1, 2, 3]; // Most themes have 3 variants

async function createThumbnail(inputFile, outputFile) {
  try {
    await sharp(inputFile)
      .resize(400, 300, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toFile(outputFile);
    
    const inputStats = fs.statSync(inputFile);
    const outputStats = fs.statSync(outputFile);
    const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
    
    console.log(`✓ Created ${path.basename(outputFile)} (${reduction}% size reduction)`);
  } catch (error) {
    console.error(`✗ Error processing ${inputFile}:`, error.message);
  }
}

async function generateAllThumbnails() {
  console.log('Creating theme thumbnails...\n');
  
  for (const theme of themes) {
    for (const variant of imageVariants) {
      const inputFile = path.join(IMAGES_DIR, `${theme}_${variant}.png`);
      const outputFile = path.join(THUMBS_DIR, `${theme}_${variant}_thumb.jpg`);
      
      if (fs.existsSync(inputFile)) {
        await createThumbnail(inputFile, outputFile);
      }
    }
  }
  
  console.log('\nThumbnail generation complete!');
  
  // Show total size savings
  const originalSize = themes.reduce((total, theme) => {
    return total + imageVariants.reduce((themeTotal, variant) => {
      const file = path.join(IMAGES_DIR, `${theme}_${variant}.png`);
      if (fs.existsSync(file)) {
        return themeTotal + fs.statSync(file).size;
      }
      return themeTotal;
    }, 0);
  }, 0);
  
  const thumbSize = themes.reduce((total, theme) => {
    return total + imageVariants.reduce((themeTotal, variant) => {
      const file = path.join(THUMBS_DIR, `${theme}_${variant}_thumb.jpg`);
      if (fs.existsSync(file)) {
        return themeTotal + fs.statSync(file).size;
      }
      return themeTotal;
    }, 0);
  }, 0);
  
  const totalReduction = ((1 - thumbSize / originalSize) * 100).toFixed(1);
  console.log(`\nTotal size reduction: ${totalReduction}%`);
  console.log(`Original: ${(originalSize / 1024 / 1024).toFixed(1)}MB`);
  console.log(`Thumbnails: ${(thumbSize / 1024 / 1024).toFixed(1)}MB`);
}

// Run the script
generateAllThumbnails().catch(console.error);