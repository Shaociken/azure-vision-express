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

    const result = response.data;
    const caption = result.description?.captions?.[0]?.text || "無法產生說明";
    const tags = result.description?.tags?.join(", ") || "無標籤";
    const colors = result.color?.dominantColors?.join(", ") || "未知";

    res.send(`
      <!DOCTYPE html>
      <html lang="zh-Hant">
      <head>
        <meta charset="UTF-8">
        <title>分析結果</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      </head>
      <body class="bg-light">
        <div class="container mt-5">
          <h3 class="mb-4">🧾 分析結果</h3>
          <div class="card p-4 shadow">
            <p><strong>📋 自動說明：</strong> ${caption}</p>
            <p><strong>🏷️ 標籤：</strong> ${tags}</p>
            <p><strong>🎨 主要顏色：</strong> ${colors}</p>
            <a href="/" class="btn btn-secondary mt-3">🔙 回首頁</a>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("❌ 分析失敗：" + (err.response?.data?.error?.message || err.message));
  } finally {
    fs.unlinkSync(imagePath);
  }
});

// 根路由顯示上傳表單（加入 Bootstrap 美化）
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Azure Vision API Demo</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body class="bg-light">
      <div class="container mt-5">
        <h2 class="mb-4">🧠 Azure Vision 圖片分析服務</h2>
        <form action="/analyze" method="post" enctype="multipart/form-data" class="p-4 border rounded bg-white shadow">
          <div class="mb-3">
            <label for="image" class="form-label">選擇一張圖片：</label>
            <input class="form-control" type="file" name="image" accept="image/*" required />
          </div>
          <button type="submit" class="btn btn-primary">📤 上傳並分析</button>
        </form>
        <p class="mt-3 text-muted">結果會顯示在新頁面（HTML 格式）</p>
      </div>
    </body>
    </html>
  `);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
