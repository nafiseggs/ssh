# 📚 School Diary - Auto Post to Facebook

## 🚀 Quick Start

1. Install dependencies:
```bash
npm install
```

2. Setup Facebook credentials:
```bash
cp account.txt.example account.txt
# Edit account.txt and paste your Facebook c3c appstate
```

3. Start the server:
```bash
npm start
```

4. Open `index.html` in your browser

5. Generate diary → Auto-posts to Facebook! ✨

## ⚙️ Configuration

Edit `script.js`:

```javascript
// Facebook
const FACEBOOK_ENABLED = true;
const FACEBOOK_GROUP_ID = "1459562232403858";

// Telegram  
const TELEGRAM_ENABLED = true;
const TELEGRAM_BOT_TOKEN = "your_token";
```

## 📋 Files

- `index.html` - Diary form (open this!)
- `script.js` - Diary generator + FB auto-post
- `server.js` - Facebook posting backend
- `bg.jpg`, `bg-v2.jpg` - Background images
- `viewers/` - Viewer pages

That's it! Simple and clean. 🎯
