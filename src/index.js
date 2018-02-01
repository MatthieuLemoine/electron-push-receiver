const { register, listen } = require('push-receiver');
const { ipcMain } = require('electron');
const Config = require('electron-config');
const {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED,
  NOTIFICATION_SERVICE_ERROR,
  NOTIFICATION_RECEIVED,
  TOKEN_UPDATED,
} = require('./constants');

const config = new Config();

module.exports = {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED,
  NOTIFICATION_SERVICE_ERROR,
  NOTIFICATION_RECEIVED,
  TOKEN_UPDATED,
  setup,
};

// To be sure that start is called only once
let starting = false;
let started = false;
let webContentses = [];

// To be call from the main process
function setup(webContents) {
  addWebConents(webContents)

  // Will be called by the renderer process
  ipcMain.on(START_NOTIFICATION_SERVICE, async (_, senderId) => {
    // Retrieve saved credentials
    let credentials = config.get('credentials');
    // Retrieve saved senderId
    const savedSenderId = config.get('senderId');
    if (started) {
      try {
        webContents.send(NOTIFICATION_SERVICE_STARTED, (credentials.fcm || {}).token);
      } catch (e) {
        console.error('PUSH_RECEIVER:::Error while sending to webContents', e);
      }
      return;
    }
    if (starting) {
      return
    }
    starting = true;
    try {
      // Retrieve saved persistentId : avoid receiving all already received notifications on start
      const persistentIds = config.get('persistentIds') || [];
      // Register if no credentials or if senderId has changed
      if (!credentials || savedSenderId !== senderId) {
        credentials = await register(senderId);
        // Save credentials for later use
        config.set('credentials', credentials);
        // Save senderId
        config.set('senderId', senderId);
        // Notify the renderer processes that the FCM token has changed
        send(TOKEN_UPDATED, credentials.fcm.token);
      }
      // Listen for GCM/FCM notifications
      await listen(Object.assign({}, credentials, { persistentIds }), onNotification(webContents));
      // Notify the renderer processes that we are listening for notifications
      send(NOTIFICATION_SERVICE_STARTED, credentials.fcm.token);
      started = true;
    } catch (e) {
      console.error('PUSH_RECEIVER:::Error while starting the service', e);
      // Forward error to the renderer processes
      send(NOTIFICATION_SERVICE_ERROR, e.message);
      starting = false;
      started = false;
    }
  });
}

function addWebConents(webContents) {
  webContentses.push(webContents)
  webContents.on('destroyed', () => {
    removeWebContents(webContents)
  })
}

function removeWebContents(webContents) {
  let i = webContentses.indexOf(webContents)
  if (i > -1) {
    webContentses.splice(i, 1)
  }
}

function send(channel, arg1) {
  webContentses.forEach((webContents) => {
    try {
      webContents.send(channel, arg1)
    } catch (e) {
      console.error('PUSH_RECEIVER:::Error while sending to webContents', e);
    }
  })
}

// Will be called on new notification
function onNotification() {
  return ({ notification, persistentId }) => {
    const persistentIds = config.get('persistentIds') || [];
    // Update persistentId
    config.set('persistentIds', [...persistentIds, persistentId]);
    // Notify the renderer processes that a new notification has been received
    send(NOTIFICATION_RECEIVED, notification);
  };
}
