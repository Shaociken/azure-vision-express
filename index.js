// 引入需要的套件
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// 設定 Multer 上傳目錄
const upload = multer({ dest: "uploads/" });

// Azure Vision API 資訊（建議用環境變數）
const endpoint = process.env.VISION_ENDPOINT;
const key = process.env.VISION_KEY;

// POST 上傳圖片並分析
app.post("/analyze", upload.single("image"), async (req, res) => {
  const imagePath = req.file.path;
  const imageData = fs.readFileSync(imagePath);

  try {
    const response = await axios.post(
      `${endpoint}vision/v3.2/analyze?visualFeatures=Categories,Description,Color`,
      imageData,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Content-Type": "application/octet-stream",
        },
      }
    );

    res.json({ result: response.data });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  } finally {
    // 清除暫存檔案
    fs.unlinkSync(imagePath);
  }
});

// 根路由顯示上傳表單
app.get("/", (req, res) => {
  res.send(`
    <h2>Azure Vision API Demo</h2>
    <form action="/analyze" method="post" enctype="multipart/form-data">
      <input type="file" name="image" accept="image/*" required />
      <button type="submit">上傳並分析</button>
    </form>
  `);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
