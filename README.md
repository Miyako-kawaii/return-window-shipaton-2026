# Return Window

A purchase is easy to forget until the day after its return deadline. Return Window keeps a small list of those dates, with an optional reminder before time runs out.

Enter the deadline the shop gave you, add a note if you need one, and come back when you decide to keep or return the item. You can search the list, mark something done, reopen it, or export a JSON backup. There is no inbox connection or receipt scanning.

This is my student project for Shipaton 2026. The Android debug build runs in an Android 36 emulator. A successful Test Store purchase unlocked Plus; a failed purchase did not. There are also 33 passing automated tests and browser checks for saving and reloading the list.

Restoring the test purchase worked in the same Android installation; restoring on another device has not been tested. Three reminders were confirmed in Android's alarm service. With the app in the background, advancing the dedicated emulator clock past a due time produced the expected notification. That checks the delivery path under simulated time, not overnight reliability on physical phones. The current APK is a development build.

## Try the list

Use Node 22 or newer; development and CI currently use Node 24.

```sh
npm ci --ignore-scripts
npm run build
npm run preview
```

Open http://127.0.0.1:8766. The browser version lets you try the list and backups. Purchases and device reminders need the Android app. To run the tests, use `npm test`.

## Window Plus

The app offers a one-time unlock for local reminders through RevenueCat. For this demo, it uses RevenueCat's **Test Store**, so a test purchase does not charge real money. The billing adapter deliberately rejects production keys.

If you fork the project, replace the public client key in `src/public-config.mjs` with your own Test Store key. The configured offering needs a Lifetime package attached to the `window_plus` entitlement. Keep secret API keys out of the app.

## Build an APK

You need JDK 21, Android SDK platform 36 and Build Tools 36.0.0. Install the official tools, accept the SDK license, and set `ANDROID_HOME` to your SDK directory. After building the web app above:

```sh
npm run android:add
npm run android:sync
cd android
./gradlew --no-daemon assembleDebug
```

On Windows, use `gradlew.bat`. Skip `android:add` if you have already generated the Android project.

You can also start the repository's Android workflow manually. It builds on a standard Ubuntu runner and attaches the APK to a GitHub prerelease. It does not upload Actions caches or artifacts.

These cloud builds use disposable debug signing keys. A newer APK may require uninstalling the previous build, which removes its local data. Export anything you want to keep before changing builds. They are not store releases.

## A few things to know

The item list stays on the device. Uninstalling the app or clearing its storage can erase it; JSON exports are your backup and can include your notes. RevenueCat communicates with its service to check purchases and entitlements, so the app is not entirely offline.

A date in the app is a reminder, not a guarantee that a shop will accept a return. Notification permission and device settings affect reminders. Reminders use approximate alarms, so the app does not need special exact-alarm access. The app currently refreshes its schedule when you use it, so open it periodically to pick up later dates.

Original code is MIT-licensed. See `THIRD_PARTY_NOTICES.txt` for bundled JavaScript notices; native dependencies retain their own licenses. The calendar icon was drawn for this project with `scripts/make-icon.py`, which optionally uses Pillow.
