// UPDATED SERVER - Uses Python Selenium Script
// This is more reliable than Puppeteer for Facebook

const express = require("express");
const multer = require("multer");
const fs = require("fs-extra");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = 8080;

// Configure multer to save files with original extension
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check if Python script exists
const PYTHON_SCRIPT = path.join(__dirname, 'facebook_album_poster.py');

// Health check endpoint
app.get("/api/status", (req, res) => {
  const pythonExists = fs.existsSync(PYTHON_SCRIPT);
  const accountExists = fs.existsSync('account.txt');
  
  res.json({ 
    server: "running",
    pythonScript: pythonExists,
    accountFile: accountExists,
    ready: pythonExists && accountExists
  });
});

// Post to Facebook album
app.post("/api/post", upload.array("images", 10), async (req, res) => {
  try {
    const { postText, albumId } = req.body;
    
    // Validate inputs
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded"
      });
    }

    if (!albumId) {
      return res.status(400).json({
        success: false,
        message: "No album ID provided"
      });
    }

    const imagePath = req.files[0].path;
    const imageFullPath = path.resolve(imagePath);
    
    console.log(`\n📸 New Facebook post request:`);
    console.log(`   Album ID: ${albumId}`);
    console.log(`   Image: ${imageFullPath}`);
    console.log(`   Caption length: ${postText?.length || 0} chars`);
    
    // Call Python script
    const result = await runPythonScript(albumId, imageFullPath, postText || "");
    
    // Clean up uploaded file
    try {
      fs.unlinkSync(imagePath);
      console.log(`🗑️  Cleaned up temporary file`);
    } catch (err) {
      console.error(`⚠️  Could not delete temp file: ${err.message}`);
    }
    
    if (result.success) {
      return res.json({
        success: true,
        message: "Posted to Facebook album successfully!",
        output: result.output
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.error || "Failed to post to album",
        output: result.output
      });
    }
    
  } catch (error) {
    console.error("❌ Server Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Run Python script
function runPythonScript(albumId, imagePath, caption) {
  return new Promise((resolve, reject) => {
    console.log(`\n🐍 Launching Python script...`);
    
    // Prepare arguments - escape caption properly
    const args = [
      PYTHON_SCRIPT,
      '--album-id', albumId,
      '--image-path', imagePath,
      '--caption', caption || ''
    ];
    
    // Spawn Python process (try python3 first, fallback to python)
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    console.log(`\n📝 Full command: ${pythonCommand} ${args.join(' ')}\n`);
    
    const pythonProcess = spawn(pythonCommand, args);
    
    let output = '';
    let errorOutput = '';
    
    // Capture stdout
    pythonProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text); // Echo to console
    });
    
    // Capture stderr
    pythonProcess.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text); // Echo to console
    });
    
    // Handle process exit
    pythonProcess.on('close', (code) => {
      console.log(`\n🐍 Python process exited with code ${code}`);
      
      if (code === 0) {
        resolve({
          success: true,
          output: output,
          error: null
        });
      } else {
        resolve({
          success: false,
          output: output,
          error: errorOutput || `Process exited with code ${code}`
        });
      }
    });
    
    // Handle errors
    pythonProcess.on('error', (err) => {
      console.error('❌ Failed to start Python process:', err);
      resolve({
        success: false,
        output: output,
        error: err.message
      });
    });
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 School Diary Server`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\n📍 Server running at http://localhost:${PORT}`);
  console.log(`\n📋 Status:`);
  
  // Check dependencies
  const pythonExists = fs.existsSync(PYTHON_SCRIPT);
  const accountExists = fs.existsSync('account.txt');
  
  console.log(`   Python script: ${pythonExists ? '✅' : '❌'} ${PYTHON_SCRIPT}`);
  console.log(`   Account file:  ${accountExists ? '✅' : '❌'} account.txt`);
  
  if (!pythonExists) {
    console.log(`\n⚠️  WARNING: facebook_album_poster.py not found!`);
    console.log(`   Please ensure the Python script is in the same directory.`);
  }
  
  if (!accountExists) {
    console.log(`\n⚠️  WARNING: account.txt not found!`);
    console.log(`   Please create account.txt with Facebook cookies.`);
  }
  
  if (pythonExists && accountExists) {
    console.log(`\n✅ All systems ready!`);
  }
  
  console.log(`\n${'='.repeat(60)}\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down server...');
  process.exit(0);
});
