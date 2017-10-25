# electron-push-receiver

A module to bring Web Push support to [Electron](https://github.com/electron/electron) allowing it to receive notifications from Firebase Cloud Messaging (FCM).

## Why ?

[Electron](https://github.com/electron/electron) doesn't include the Web Push Service available in Chrome/Chromium that allows the browser to receive Web Push notifications from Firebase Cloud Messaging (FCM).

The main reason is that electron is based on [Chromium Content](https://www.chromium.org/developers/content-module) using [libchromiumcontent](https://github.com/electron/libchromiumcontent) and not on the whole Chromium browser. [Chromium Content](https://www.chromium.org/developers/content-module) is the minimum part of Chromium needed to create an actual browser but whitout Google APis & services providing a smaller binary.

You can read through https://github.com/electron/electron/issues/6697 for more context.

The most used workaround is to use websocket to send notifications instead but then you to handle the case when the user is disconnected and store the notifications....

But I didn't want that as I was already using FCM to send notifications to mobile apps (Android & iOS) and to web apps.

I think that it's better to use the same great tool (FCM) for all platforms.

## How ?

`electron-push-receiver` is a convenient wrapper around [push-receiver](https://github.com/MatthieuLemoine/push-receiver) so that you don't have to handle registration & credentials storage.

If you are interested in how, the real work is done in [push-receiver](https://github.com/MatthieuLemoine/push-receiver) that allows any node process (e.g Electron main process) to receive Web Push notifications from FCM.

## Install

```
npm i -S electron-push-receiver
```

## Usage

- In `main.js` / in main process :

```javascript
const { setup: setupPushReceiver } = require('electron-push-receiver');

// Call it before 'did-finish-load' with mainWindow a reference to your window
setupPushReceiver(mainWindow.webContents);
```

- In renderer process :

```javascript
import { ipcRenderer } from 'electron';
import {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED,
  NOTIFICATION_SERVICE_ERROR,
  NOTIFICATION_RECEIVED as ON_NOTIFICATION_RECEIVED,
  TOKEN_UPDATED,
} from 'electron-push-receiver';

// Listen for service successfully started
ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, () => // do something);
// Handle notification errors
ipcRenderer.on(NOTIFICATION_SERVICE_ERROR, (_, error) => // do something);
// Send FCM token to backend
ipcRenderer.on(TOKEN_UPDATED, (_, token) => // Send token);
// Display notification
ipcRenderer.on(ON_NOTIFICATION_RECEIVED, (_, notification) => // display notification);
// Start service
ipcRenderer.send(START_NOTIFICATION_SERVICE, senderId);
```
