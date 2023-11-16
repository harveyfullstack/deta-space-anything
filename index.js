// Import the needed modules
const { app, BrowserWindow, session } = require('electron')
const path = require('path');

const createWindow = () => {
// Create the browser window.
let mainWindow = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      nativeWindowOpen: true
    }
  });

  // mainWindow.webContents.setZoomFactor(1.10);
  
  const filter = {
    urls: ['*://*/*']
  };

  // Listen for window being closed
  mainWindow.on('closed', () => {
    mainWindow = null;  // Nullify the mainWindow
  });
  
  // * This fixes a quirky issue where the loaded IFrames break the horizon's layout
  mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options) => {
    Object.assign(options, {
      x: -800,
      y: -600
    });
  });

  // Modify incoming headers
  session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
    if (mainWindow && mainWindow.webContents && mainWindow.webContents.getURL()) {
      const currentPageUrlString = mainWindow.webContents.getURL();
      if (currentPageUrlString) {
        const currentPageUrl = new URL(currentPageUrlString);
        if (currentPageUrl.hostname === 'deta.space') {
          if (details.responseHeaders['X-Frame-Options'] || details.responseHeaders['x-frame-options']) {
            delete details.responseHeaders['X-Frame-Options'];
            delete details.responseHeaders['x-frame-options'];
          }
        }
      }
    }

    callback({ cancel: false, responseHeaders: details.responseHeaders });
  });

  mainWindow.loadURL('https://www.deta.space');

};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});