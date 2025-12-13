# 🎉 Hello Worga — Weather + Todo PWA（Vue 3 + Quasar）

把「台灣地方氣象」與「每日任務管理」合在一起的 PWA。

📍具備 GPS / IP 自動定位
🌤 可顯示 鄉鎮級天氣預報
✅ 內建 輕量 To-Do List
📱 支援安裝到手機的 PWA

## 🚀 Features

🌍 自動定位天氣（GPS → IP Fallback）

優先採用瀏覽器 navigator.geolocation

若使用者拒絕，改用 IP 定位（ipwho.is）

自動解析為 台灣各縣市名稱

最後依縣市查詢 氣象署 F-D0047 鄉鎮預報

🌤 鄉鎮級天氣資料（氣象署 CWA）

## 使用：

O-A0001-001 自動氣象站資料（備用）

F-D0047-xxx 鄉鎮天氣 3 天預報（主力）

## 顯示資訊包含：

項目 說明
氣溫 目前時段溫度
風速 km/h
相對濕度 %
鄉鎮名稱 台灣最細到市區層級
✅ 每日 To-Do List

新增 / 刪除 / 完成任務

簡潔輕量化設計

適合日常行程追蹤

📱 PWA 支援

可安裝至桌面或手機

自動快取

離線運作（部分功能）

## 🛠 Tech Stack

技術 用途
Vue 3 + Composition API 核心架構
Quasar UI Framework & PWA 支援
TypeScript 型別安全
Axios API 請求
CWA 氣象署 API 天氣資料來源
ipwho.is IP 定位備援

## 📦 Install

```bash
yarn

# or

npm install
```

🧪 Run Dev Server

```bash
quasar dev
```

### 🏗 Build for Production

```bash
quasar build
```

### 🧹 Lint

```bash
yarn lint

# or

npm run lint
```

### 🎨 Format Code

```bash
yarn format

# or

npm run format
```

### ⚙️ Config

Quasar config docs:
參照
(https://v2.quasar.dev/quasar-cli-vite/quasar-config-js)

### 🔐 Environment Variables（非常重要！）

請在專案根目錄建立：

```bash
.env
```

內容：

```bash
VITE*CWA_API_KEY=你的*氣象署\_KEY
```

⚠️ 你必須在 quasar dev 或 quasar build 前已設定 .env 才能生效。
📜 License

MIT — 自由使用，記得幫我帶把傘 ☔
