const fs = require('fs');
const path = require('path');

// Read logo.jpeg
const jpegPath = path.join(__dirname, '..', 'public', 'logo.jpeg');
console.log("JPEG exists:", fs.existsSync(jpegPath));
if (fs.existsSync(jpegPath)) {
  const stats = fs.statSync(jpegPath);
  console.log("JPEG size:", stats.size);
}
