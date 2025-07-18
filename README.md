# Excel WhatsApp App 📊📤

A cross-platform desktop app that lets you **select an area of a spreadsheet and send it as a PDF to any WhatsApp contact** — all in just a few clicks.

This tool combines the flexibility of Excel-style editing with the power of WhatsApp messaging. Whether you're managing client lists, sending summaries, or broadcasting custom messages — it's built for fast, simple communication.

> ⚠️ This app was mostly vibe-coded over a weekend, so there may be bugs lurking in unexpected corners. Feel free to fix them, add new features, or help reduce the package size — it's quite large right now!

---

## ✨ Features

- 🧮 Spreadsheet-like editor using [Handsontable](https://handsontable.com/)
- ✅ Select a range of rows and columns to send
- 📄 Export selected data as a clean PDF using `jspdf` + `jspdf-autotable`
- 💬 Send the generated PDF directly via WhatsApp to selected contacts
- 🖥️ Built using Electron + Create React App for a native-like desktop experience

---

## ⚠️ Disclaimer

This app uses [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js), a library that controls WhatsApp Web through a headless browser.

> **It is not guaranteed that you will not be blocked** by using this method. WhatsApp does **not allow bots or unofficial clients** on their platform, so this project should be used **at your own risk** and **only for personal or internal use**.

---

## 🛠️ Tech Stack

| Layer              | Library/Framework         |
|--------------------|---------------------------|
| Frontend UI        | React (via Create React App) |
| Spreadsheet Editor | Handsontable              |
| PDF Export         | jspdf + jspdf-autotable   |
| Desktop Runtime    | Electron                  |
| WhatsApp Messaging | whatsapp-web.js           |

---

## 🚀 Getting Started

```bash
# 1. Clone the repository
git clone git@github-personal:milanjain2208/excel-whatsapp-app.git
cd excel-whatsapp-app

# 2. Install dependencies
npm install

# 3. Run the desktop app (this will build React and launch Electron)
npm run desktop
```

---

## 📸 Preview

[Watch demo video](https://github.com/user-attachments/assets/6adbc138-66a6-416b-8741-51a2c00fb379)

---

## 🤝 Contributing

This project is open to contributions!

- 🐛 Found a bug? Fix it.
- 🌟 Want a new feature? Add it.
- 📦 Can you reduce the bloated package size? You're my hero.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
