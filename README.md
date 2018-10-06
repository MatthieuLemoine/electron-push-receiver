# electron-fcm-push-receiver

A module to bring Web Push support to [Electron](https://github.com/electron/electron) allowing it to receive notifications from Firebase Cloud Messaging (FCM).

## Why and how ?

See [this blog post](https://medium.com/@MatthieuLemoine/my-journey-to-bring-web-push-support-to-node-and-electron-ce70eea1c0b0).

## Install

```
npm i -S electron-fcm-push-receiver
```

## Usage

- In `main.js` / in main process :

```javascript
const { setup: setupPushReceiver } = require('electron-fcm-push-receiver');

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
} from 'electron-fcm-push-receiver/src/constants';

// Listen for service successfully started
ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_, token) => // do something);
// Handle notification errors
ipcRenderer.on(NOTIFICATION_SERVICE_ERROR, (_, error) => // do something);
// Send FCM token to backend
ipcRenderer.on(TOKEN_UPDATED, (_, token) => // Send token);
// Display notification
ipcRenderer.on(ON_NOTIFICATION_RECEIVED, (_, notification) => // display notification);
// Start service
ipcRenderer.send(START_NOTIFICATION_SERVICE, senderId);
```
### Reseting the Push Receiver
There are cases where you may need to reset the push receiver to a state where it retrieves a new notification token from FCM. For instance,if your app is designed to support a sign in screen and you only want push notifications for the person who signs in, you will need to have the push receiver delete the notification token when a different person signs in, otherwise it is possible that the new sign in receives notifications that are only private to the person who signed in previously.

One solution is to simply delete the cache and restart the app using Electron's API. But this is not always desirable. If you want to avoid clearing your app's cache and don't want to restart the app, you can call the reset method on the push receiver. This will have to be called from the renderer process back into the main prcoess. Here is an example of how to setup a callback in the main process:

```javascript
ipcRenderer.on('resetPushReceiver', (event, arg) => {
    pushReceiver.reset();
})
```
Then in your renderer process:

```javascript
 const {ipcRenderer} = require('electron');
 ipcRenderer.send('resetPushReceiver', null);
```

If you don't plan on restarting your app, you will have to call the setupPushReceiver method again from our renderer process. So in your main process, you would need to setup another callback first:

```javascript
ipcRenderer.on('startPushReceiver', (event, arg) => {
    pushReceiver.setup(mMainWindow.webContents);
})
```

And then call it from your renderer process:

```javascript
const {ipcRenderer} = require('electron');
 ipcRenderer.send('startPushReceiver', null);
```
## Example

Thanks to [CydeSwype](https://github.com/CydeSwype), you can find an example project [here](https://github.com/CydeSwype/electron-fcm-demo).
