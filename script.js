// ================= TELEGRAM CONFIG =================
// KEEP THIS FILE PRIVATE!
const TELEGRAM_BOT_TOKEN = "7180890909:AAEmpWcoeg7_oVV5s4C5bxzbY72YNr7vwwE";

// Private chat + channel
const TELEGRAM_CHAT_IDS = [
  "1928349457",
  "-1001580632618"
];

const TELEGRAM_ENABLED = true;
// ===================================================

// ================= FACEBOOK CONFIG =================
const FACEBOOK_ENABLED = true;
const FACEBOOK_API_URL = "http://localhost:3000/api/post";
const FACEBOOK_ALBUM_ID = "1394179355783983"; // Your album ID
// ===================================================


// Elements
const form = document.getElementById("diaryForm");
const formSection = document.getElementById("formSection");
const resultSection = document.getElementById("resultSection");
const diaryImage = document.getElementById("diaryImage");
const loader = document.getElementById("loader");
const backBtn = document.getElementById("backBtn");
const downloadBtn = document.getElementById("downloadBtn");
const teacherInput = document.getElementById("teacher");
const footer = document.getElementById("footer");
const dateInput = document.getElementById("dateInput");
const postFbBtn = document.getElementById("postFbBtn");

// Store current diary data for Facebook posting
let currentDiaryData = null;
let currentDiaryImage = null;

// Set today's date (local, safe)
(function setTodayDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  dateInput.value = `${y}-${m}-${d}`;
})();

// Footer
footer.textContent = `© ${new Date().getFullYear()} Nabila - All Rights Reserved`;

// Teacher autocomplete
let lastTeacher = "Nabila Tabassum";
teacherInput.addEventListener("input", e => {
  if (e.target.value.toLowerCase() === "na") {
    e.target.value = "Nabila Tabassum";
  }
});

// ================= NOTIFICATION SYSTEM =================
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 8px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
// =======================================================

// ================= TELEGRAM SEND =================
async function sendToTelegram(data, imageDataUrl) {
  if (!TELEGRAM_ENABLED) return;

  try {
    const caption = `
📚 *New School Diary Entry*

📅 *Date:* ${data.date}
🏫 *Class:* ${data.cls}
📖 *Subject:* ${data.subject}
👨‍🏫 *Teacher:* ${data.teacher}
    `.trim();

    // Convert image once
    const base64 = imageDataUrl.split(",")[1];
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      arr[i] = bytes.charCodeAt(i);
    }
    const blob = new Blob([arr], { type: "image/png" });

    for (const chatId of TELEGRAM_CHAT_IDS) {
      const fd = new FormData();
      fd.append("chat_id", chatId);
      fd.append("photo", blob, "school_diary.png");
      fd.append("caption", caption);
      fd.append("parse_mode", "Markdown");

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: "POST",
        body: fd
      });
    }

    console.log("✅ Telegram post sent");
    showNotification("✅ Sent to Telegram!", "success");
  } catch (err) {
    console.error("❌ Telegram error:", err);
    showNotification("⚠️ Telegram failed", "error");
  }
}
// =================================================

// ================= FACEBOOK SEND =================
async function sendToFacebook(data, imageDataUrl) {
  if (!FACEBOOK_ENABLED) return;

  try {
    // Create caption for Facebook post
    const postText = `
📚 School Diary

📅 Date: ${data.date}
🏫 Class: ${data.cls}
📖 Subject: ${data.subject}
👨‍🏫 Teacher: ${data.teacher}

📝 Classwork: ${data.cw}
${data.hw ? `📖 Homework: ${data.hw}` : ''}
💬 Remarks: ${data.remark}
    `.trim();

    // Convert base64 image to blob
    const base64 = imageDataUrl.split(",")[1];
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      arr[i] = bytes.charCodeAt(i);
    }
    const blob = new Blob([arr], { type: "image/png" });

    // Create form data
    const formData = new FormData();
    formData.append("postText", postText);
    formData.append("albumId", FACEBOOK_ALBUM_ID);
    formData.append("images", blob, "school_diary.png");

    // Show progress notification
    showNotification("📤 Posting to Facebook...", "info");

    // Send to Facebook via your server
    const response = await fetch(FACEBOOK_API_URL, {
      method: "POST",
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      console.log("✅ Facebook post sent");
      showNotification("✅ Posted to Facebook!", "success");
      return true;
    } else {
      console.error("❌ Facebook post failed:", result.message);
      showNotification(`❌ Facebook failed: ${result.message}`, "error");
      return false;
    }
  } catch (err) {
    console.error("❌ Facebook error:", err);
    showNotification(`❌ Facebook error: ${err.message}`, "error");
    return false;
  }
}
// =================================================


// Form submit
form.addEventListener("submit", e => {
  e.preventDefault();
  loader.style.display = "flex";

  const teacherName = teacherInput.value || "Nabila Tabassum";
  lastTeacher = teacherName;

  const d = new Date(dateInput.value + "T00:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const dayName = d.toLocaleString("en-US", { weekday: "long" });

  const data = {
    cls: document.getElementById("class").value,
    subject: document.getElementById("subject").value,
    teacher: teacherName,
    cw: document.getElementById("classwork").value,
    hw: document.getElementById("homework").value,
    remark: document.getElementById("remarks").value,
    date: `${day}.${month}.${year} (${dayName})`
  };

  setTimeout(() => generateDiary(data), 100);
});

// Generate diary image
async function generateDiary(data) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const bg = new Image();
  bg.crossOrigin = "anonymous";

  const dateText = `Date: ${data.date}`;

  function wrapText(ctx, text, x, y, maxW, lh) {
    text.split("\n").forEach(line => {
      let words = line.split(" ");
      let current = "";
      for (let w of words) {
        let test = current + w + " ";
        if (ctx.measureText(test).width > maxW && current) {
          ctx.fillText(current, x, y);
          current = w + " ";
          y += lh;
        } else current = test;
      }
      ctx.fillText(current, x, y);
      y += lh;
    });
  }

  try {
    const hasHW = data.hw && data.hw.trim() !== "";
    bg.src = hasHW ? "bg-v2.jpg" : "bg.jpg";

    await new Promise((res, rej) => {
      bg.onload = res;
      bg.onerror = rej;
    });

    canvas.width = bg.width;
    canvas.height = bg.height;
    ctx.drawImage(bg, 0, 0);

    ctx.font = "63px Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "start";

    if (hasHW) {
      ctx.fillText(data.cls, 375, 762);
      ctx.fillText(data.subject, 425, 892);
      ctx.fillText(data.teacher, 695, 1018);
      wrapText(ctx, data.cw, 181, 1240, 2000, 70);
      wrapText(ctx, data.hw, 181, 1668, 2000, 70);
      wrapText(ctx, data.remark, 181, 2100, 2000, 70);
      ctx.textAlign = "center";
      ctx.fillText(dateText, bg.width - 800, 763);
    } else {
      ctx.fillText(data.cls, 372, 772);
      ctx.fillText(data.subject, 422, 902);
      ctx.fillText(data.teacher, 692, 1029);
      wrapText(ctx, data.cw, 179, 1227, 2000, 70);
      ctx.textAlign = "center";
      ctx.fillText(dateText, bg.width - 838, 775);
    }

    const imgUrl = canvas.toDataURL("image/png");
    diaryImage.src = imgUrl;

    // Store data for Facebook posting later
    currentDiaryData = data;
    currentDiaryImage = imgUrl;

    // Only send to Telegram automatically
    await sendToTelegram(data, imgUrl);

    loader.style.display = "none";
    formSection.classList.add("hidden");
    resultSection.classList.remove("hidden");
    
    showNotification("✅ Diary generated!", "success");
  } catch (e) {
    alert("Background image missing (bg.jpg / bg-v2.jpg)");
    loader.style.display = "none";
  }
}

// Back button
backBtn.addEventListener("click", () => {
  resultSection.classList.add("hidden");
  formSection.classList.remove("hidden");
  document.getElementById("classwork").value = "";
  document.getElementById("homework").value = "";
  document.getElementById("remarks").value = "N/A";
  teacherInput.value = lastTeacher;
});

// Download
downloadBtn.addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = diaryImage.src;
  a.download = "school_diary.png";
  a.click();
  showNotification("📥 Download started", "success");
});

// Post to Facebook button
postFbBtn.addEventListener("click", async () => {
  if (!currentDiaryData || !currentDiaryImage) {
    showNotification("❌ No diary data available", "error");
    return;
  }

  // Disable button and show loading state
  postFbBtn.disabled = true;
  const originalText = postFbBtn.textContent;
  postFbBtn.textContent = "Posting...";
  postFbBtn.style.opacity = "0.7";
  
  try {
    const success = await sendToFacebook(currentDiaryData, currentDiaryImage);
    
    if (success) {
      postFbBtn.textContent = "✓ Posted!";
      postFbBtn.style.background = "#10b981";
      
      // Reset button after 3 seconds
      setTimeout(() => {
        postFbBtn.textContent = originalText;
        postFbBtn.disabled = false;
        postFbBtn.style.background = "";
        postFbBtn.style.opacity = "";
      }, 3000);
    } else {
      postFbBtn.textContent = "Failed - Retry?";
      postFbBtn.style.background = "#ef4444";
      
      setTimeout(() => {
        postFbBtn.textContent = originalText;
        postFbBtn.disabled = false;
        postFbBtn.style.background = "";
        postFbBtn.style.opacity = "";
      }, 3000);
    }
  } catch (error) {
    console.error("Error:", error);
    postFbBtn.textContent = "Error - Retry?";
    postFbBtn.disabled = false;
    postFbBtn.style.background = "#ef4444";
    
    setTimeout(() => {
      postFbBtn.textContent = originalText;
      postFbBtn.style.background = "";
      postFbBtn.style.opacity = "";
    }, 3000);
  }
});