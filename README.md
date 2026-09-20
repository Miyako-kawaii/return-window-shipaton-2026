# Return Window

A small app for remembering the return dates you enter for your purchases.

This is a work-in-progress student project for Shipaton 2026. The web layer has passed 30 automated tests and browser checks for saving, reloading, resolving and reopening items. Native Android purchase, restore and notification delivery are not yet verified. The repository is not a claim of contest acceptance or a production-ready release.

## Features

- Save an item name, a store-provided return date and optional notes.
- Search, resolve and reopen items, with local persistence.
- Export and import JSON backups.
- Window Plus: one-time unlock implemented through RevenueCat's Test Store adapter, with local notification scheduling.

The Android demo is configured for RevenueCat's Test Store. Its public client key is in `src/public-config.mjs`; if you fork the app, replace it with your own Test Store key. Test purchases cost nothing. The adapter rejects production keys, so this prototype cannot take real payments.

## Try it locally

Run `npm ci --ignore-scripts`, then `npm run build` and `npm run preview`. Open http://127.0.0.1:8766 to try the local list. The preview serves only the built app; purchases and device notifications need Android.

## Build

Requires Node 22+ (tested with 24), JDK 21, Android SDK platform 36 and Build Tools 36.0.0. Install official Android tools and complete any required license acceptance yourself.

```sh
npm ci --ignore-scripts
npm test
npm run build
npm run android:add
npm run android:sync
cd android
./gradlew --no-daemon assembleDebug
```

On Windows use `gradlew.bat`. To rebuild an existing generated Android project, skip `android:add`. Set `ANDROID_HOME` to your SDK location. The generated project uses Capacitor's standard template and does not contain personal signing credentials.

The manual GitHub Actions workflow uses a standard Ubuntu runner, Java 21 and no Actions artifact/cache uploads. Successful debug builds are attached to an explicitly marked GitHub prerelease. A debug APK is intended for testing, not store publication.

## Privacy and limitations

Item titles, dates and notes are stored locally. JSON exports may contain your notes; share them carefully. Uninstalling or clearing app storage can remove the local list, so keep a backup. RevenueCat's SDK communicates with its service for purchases and entitlements; this is not an entirely offline application. No store receipt or email account is connected.

Return dates are entered by the user and do not establish eligibility for a refund. Reminders depend on notification permission, device settings and periodically opening the app to refresh the schedule. Future native testing may require changes to this behavior.

Original project code is MIT-licensed. Third-party copyright and permission notices are in `THIRD_PARTY_NOTICES.txt`; native dependencies retain their own licenses. The calendar icon was drawn for this project using `scripts/make-icon.py` (optional Pillow dependency).
