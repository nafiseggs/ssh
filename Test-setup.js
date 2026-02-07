// Test script to verify server setup
const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(60));
console.log('📋 SCHOOL DIARY SETUP VERIFICATION');
console.log('='.repeat(60) + '\n');

let allGood = true;

// Check Node.js version
console.log('1. Node.js version:');
console.log(`   ${process.version}`);
if (parseInt(process.version.slice(1)) < 14) {
  console.log('   ⚠️  WARNING: Node.js 14+ recommended');
  allGood = false;
} else {
  console.log('   ✅ Good\n');
}

// Check required files
console.log('2. Required files:');
const requiredFiles = [
  'server.js',
  'script.js',
  'index.html',
  'facebook_album_poster.py',
  'package.json'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING!`);
    allGood = false;
  }
});

// Check optional files
console.log('\n3. Optional files:');
const optionalFiles = [
  { name: 'account.txt', desc: 'Facebook cookies' },
  { name: 'bg.jpg', desc: 'Background image (no homework)' },
  { name: 'bg-v2.jpg', desc: 'Background image (with homework)' }
];

optionalFiles.forEach(file => {
  if (fs.existsSync(file.name)) {
    console.log(`   ✅ ${file.name} - ${file.desc}`);
  } else {
    console.log(`   ⚠️  ${file.name} - ${file.desc} (missing)`);
  }
});

// Check Python
console.log('\n4. Python:');
const { execSync } = require('child_process');
try {
  const pythonVersion = execSync('python --version', { encoding: 'utf-8' }).trim();
  console.log(`   ✅ ${pythonVersion}`);
} catch (e) {
  try {
    const pythonVersion = execSync('python3 --version', { encoding: 'utf-8' }).trim();
    console.log(`   ✅ ${pythonVersion}`);
    console.log(`   ℹ️  Note: Use 'python3' instead of 'python'`);
  } catch (e2) {
    console.log(`   ❌ Python not found in PATH`);
    console.log(`   Please install Python: https://python.org`);
    allGood = false;
  }
}

// Check Selenium
console.log('\n5. Selenium (Python package):');
try {
  execSync('python -c "import selenium; print(selenium.__version__)"', { 
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  console.log(`   ✅ Selenium installed`);
} catch (e) {
  try {
    execSync('python3 -c "import selenium; print(selenium.__version__)"', { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    console.log(`   ✅ Selenium installed`);
  } catch (e2) {
    console.log(`   ❌ Selenium not installed`);
    console.log(`   Run: pip install selenium`);
    allGood = false;
  }
}

// Check Node modules
console.log('\n6. Node modules:');
if (fs.existsSync('node_modules')) {
  console.log('   ✅ node_modules folder exists');
  
  const requiredPackages = ['express', 'multer', 'fs-extra'];
  let missingPackages = [];
  
  requiredPackages.forEach(pkg => {
    if (!fs.existsSync(path.join('node_modules', pkg))) {
      missingPackages.push(pkg);
    }
  });
  
  if (missingPackages.length > 0) {
    console.log(`   ⚠️  Missing packages: ${missingPackages.join(', ')}`);
    console.log(`   Run: npm install`);
    allGood = false;
  } else {
    console.log('   ✅ All required packages installed');
  }
} else {
  console.log('   ❌ node_modules not found');
  console.log('   Run: npm install');
  allGood = false;
}

// Check configuration
console.log('\n7. Configuration:');
if (fs.existsSync('script.js')) {
  const scriptContent = fs.readFileSync('script.js', 'utf-8');
  
  // Check album ID
  const albumMatch = scriptContent.match(/FACEBOOK_ALBUM_ID\s*=\s*"(\d+)"/);
  if (albumMatch && albumMatch[1] !== "1394179355783983") {
    console.log(`   ✅ Album ID configured: ${albumMatch[1]}`);
  } else {
    console.log(`   ⚠️  Album ID not changed (using default)`);
  }
  
  // Check Telegram
  const telegramMatch = scriptContent.match(/TELEGRAM_BOT_TOKEN\s*=\s*"([^"]+)"/);
  if (telegramMatch && telegramMatch[1].length > 20) {
    console.log(`   ✅ Telegram bot token configured`);
  } else {
    console.log(`   ⚠️  Telegram bot token missing`);
  }
}

// Summary
console.log('\n' + '='.repeat(60));
if (allGood) {
  console.log('✅ ALL CHECKS PASSED!');
  console.log('\nYou can now start the server:');
  console.log('   npm start');
} else {
  console.log('⚠️  SOME ISSUES FOUND');
  console.log('\nPlease fix the issues above before starting the server.');
}
console.log('='.repeat(60) + '\n');