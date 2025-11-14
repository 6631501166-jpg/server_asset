const fs = require('fs');
const path = require('path');

// Create simple SVG placeholder images for categories
const categories = ['macbook', 'ipad', 'playstation', 'vr'];
const colors = ['#4A90E2', '#7ED321', '#F5A623', '#BD10E0'];

categories.forEach((name, index) => {
  const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="${colors[index]}"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="20">${name.toUpperCase()}</text>
</svg>`;

  const filePath = path.join(__dirname, 'public', 'images', 'categories', `${name}.png`);
  
  // For now, create as SVG (you can replace with actual PNG files later)
  const svgPath = filePath.replace('.png', '.svg');
  fs.writeFileSync(svgPath, svg);
  console.log(`✅ Created: ${svgPath}`);
});

console.log('\n📝 Note: SVG files created. For actual PNG files, please add them to:');
console.log('   public/images/categories/');
console.log('\n💡 The API will still reference .png files in the database.');
console.log('   You can either:');
console.log('   1. Rename .svg to .png');
console.log('   2. Update database to use .svg extension');
console.log('   3. Replace with actual PNG images');
