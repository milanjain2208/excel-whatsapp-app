// public/electron.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
// const puppeteer = require('puppeteer');
// const chromePath = puppeteer.executablePath();
const { Client, LocalAuth, MessageMedia, NoAuth } = require("whatsapp-web.js");
const fs = require('fs');
const os = require('os');
let win;
let whatsappClient;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile(path.join(__dirname, "../build/index.html"));

  // Optional: Open DevTools
//   win.webContents.openDevTools();

  // Initialize WhatsApp after window is ready
  win.webContents.once('dom-ready', async () => {
    await initWhatsApp();
  });
}

async function initWhatsApp() {
  try {
    console.log('🔄 Initializing WhatsApp client...');
    console.log('Platform:', process.platform);
    console.log('Is packaged:', app.isPackaged);

    // const userDataPath = app.getPath('userData');
    // const authDir = path.join(userDataPath, 'wwebjs_auth');
    // const cacheDir = path.join(userDataPath, 'wwebjs_cache');
    // console.log('Auth directory:', authDir);

    // [authDir, cacheDir].forEach(dir => {
    //     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    // });
    
    // // Platform-specific Chrome paths
    const getChromePaths = () => {
      switch (process.platform) {
        case 'win32':
          return [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Users\\' + os.userInfo().username + '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
          ];
        case 'darwin':
          return [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
            '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
          ];
        case 'linux':
          return [
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
            '/usr/bin/google-chrome-stable'
          ];
        default:
          return [];
      }
    };
    
    let executablePath;
    const possibleChromePaths = getChromePaths();
    
    // Try to find system Chrome
    for (const chromePath of possibleChromePaths) {
      if (fs.existsSync(chromePath)) {
        executablePath = chromePath;
        console.log(`✅ Found Chrome at: ${executablePath}`);
        break;
      }
    }

    // console.log('🔄 Puppeteer executable path:', chromePath);
    const puppeteerConfig = {
      // executablePath: chromePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
    //   cacheDirectory: cacheDir
    };

    // Use system Chrome if found
    if (executablePath) {
      puppeteerConfig.executablePath = executablePath;
      console.log(`🌐 Using system Chrome at: ${executablePath}`);
      win.webContents.send("whatsapp-status-message", `Using system Chrome at: ${executablePath}`);
    } else {
      console.log(`⚠️ No system Chrome found, using Puppeteer's built-in Chromium`);
      win.webContents.send("whatsapp-status-message", `No system Chrome found, using Puppeteer's built-in Chromium`);
    }

    whatsappClient = new Client({
      authStrategy: new NoAuth(),
      puppeteer: puppeteerConfig
    });

    whatsappClient.on("qr", (qr) => {
      console.log("🔑 QR Received, sending to renderer");
      win.webContents.send("whatsapp-qr", qr);
    });

    whatsappClient.on("ready", async () => {
      console.log("✅ WhatsApp client is ready!");
      win.webContents.send("whatsapp-status", "ready");
      
      // Fetch contacts when ready
      try {
        const contacts = await whatsappClient.getContacts();
        win.webContents.send("whatsapp-status-message", `Found ${contacts?.length} contacts`);
        const filteredContacts = contacts
          .filter(contact => {
            // Filter: Must be a contact (not group), have a name, and phone number starting with 91 and length 12
            const hasValidNumber = contact.number 
            // && 
            //   contact.number.startsWith('91') && 
            //   contact.number.length === 12;
            return contact.isMyContact && 
              contact.name && 
              !contact.isGroup && 
              hasValidNumber;
          });

        win.webContents.send("whatsapp-status-message", `Found ${filteredContacts?.length} filtered contacts`);

        // Get profile pictures for each contact
        const contactList = await Promise.all(
          filteredContacts.map(async (contact) => {
            let profilePicUrl = null;
            try {
              profilePicUrl = await contact.getProfilePicUrl();
            } catch (error) {
              // If no profile pic, will remain null
              console.log(`No profile pic for ${contact.name}`);
            }

            return {
              id: contact.id._serialized,
              name: contact.name,
              number: contact.number,
              isGroup: contact.isGroup,
              profilePicUrl: profilePicUrl
            };
          })
        );

        const sortedContactList = contactList.sort((a, b) => a.name.localeCompare(b.name));
        
        console.log(`📱 Found ${sortedContactList.length} Indian contacts`);
        win.webContents.send("whatsapp-contacts", sortedContactList);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        win.webContents.send("whatsapp-status-message", error.message);
      }
    });

    whatsappClient.on("authenticated", () => {
      console.log("🔐 WhatsApp authenticated!");
      win.webContents.send("whatsapp-status", "authenticated");
    });

    whatsappClient.on("auth_failure", () => {
      console.log("❌ WhatsApp authentication failed");
      win.webContents.send("whatsapp-status", "auth_failure");
    });

    whatsappClient.on("disconnected", (reason) => {
      console.log("🔌 WhatsApp disconnected:", reason);
      win.webContents.send("whatsapp-status", "disconnected");
    });

    console.log('🚀 Starting WhatsApp client initialization...');
    console.log('Puppeteer config:', JSON.stringify(puppeteerConfig, null, 2));
    
    
    // process.env.DEBUG = 'puppeteer:*';
    whatsappClient.initialize().catch(error => {
      console.error("❌ Failed to initialize WhatsApp client:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      win.webContents.send("whatsapp-status", "error");
      win.webContents.send("whatsapp-status-message", error.message);
    });

  } catch (error) {
    console.error("Error setting up WhatsApp client:", error);w
    win.webContents.send("whatsapp-status", "error");
    win.webContents.send("whatsapp-status-message", error.message);
  }
}

// Handle PDF sending
ipcMain.handle('send-pdf', async (event, { contactId, pdfBuffer, fileName }) => {
  try {
    if (!whatsappClient) {
      throw new Error('WhatsApp client not initialized');
    }

    // Convert buffer array to base64 string
    const uint8Array = new Uint8Array(pdfBuffer);
    const base64String = Buffer.from(uint8Array).toString('base64');
    
    // Create media from base64 string
    const media = new MessageMedia('application/pdf', base64String, fileName);
    
    // Send the PDF
    await whatsappClient.sendMessage(contactId, media);
    
    console.log(`📄 PDF sent to ${contactId}`);
    return { success: true, message: 'PDF sent successfully!' };
  } catch (error) {
    console.error('Error sending PDF:', error);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
