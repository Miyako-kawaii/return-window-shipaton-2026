import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Apply original artwork to the generated Capacitor project after cap sync.
const root = fileURLToPath(new URL('../', import.meta.url));
const main = path.join(root, 'android/app/src/main');
const manifestPath = path.join(main, 'AndroidManifest.xml');
const stylesPath = path.join(main, 'res/values/styles.xml');
let manifest = await readFile(manifestPath, 'utf8');
let styles = await readFile(stylesPath, 'utf8');
if (!manifest.includes('android:icon=') || !styles.includes('name="AppTheme.NoActionBarLaunch"')) {
  throw new Error('Unexpected Android template; review before applying resources.');
}
const xml = '<?xml version="1.0" encoding="utf-8"?>\n';
for (const folder of ['drawable-nodpi', 'drawable', 'drawable-v26']) {
  await mkdir(path.join(main, 'res', folder), { recursive: true });
}
await copyFile(path.join(root, 'assets/return-window-icon-1024.png'), path.join(main, 'res/drawable-nodpi/rw_art.png'));
await writeFile(path.join(main, 'res/drawable/rw_launcher.xml'), xml +
  '<bitmap xmlns:android="http://schemas.android.com/apk/res/android" android:src="@drawable/rw_art" android:gravity="fill" />\n');
await writeFile(path.join(main, 'res/values/rw_colors.xml'), xml + '<resources><color name="rw_green">#164c40</color></resources>\n');
// The foreground references artwork directly to avoid a qualifier-dependent cycle.
await writeFile(path.join(main, 'res/drawable-v26/rw_launcher.xml'), xml +
  '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n' +
  '  <background android:drawable="@color/rw_green" />\n' +
  '  <foreground><inset android:inset="16.67%"><bitmap android:src="@drawable/rw_art" android:gravity="fill" /></inset></foreground>\n' +
  '</adaptive-icon>\n');
manifest = manifest.replace(/android:icon="[^"]+"/, 'android:icon="@drawable/rw_launcher"')
  .replace(/android:roundIcon="[^"]+"/, 'android:roundIcon="@drawable/rw_launcher"');
styles = styles.replace(/<style name="AppTheme.NoActionBarLaunch"[\s\S]*?<\/style>/,
  '<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">\n' +
  '        <item name="windowSplashScreenBackground">#164c40</item>\n' +
  '        <item name="windowSplashScreenAnimatedIcon">@drawable/rw_launcher</item>\n' +
  '        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>\n' +
  '    </style>');
await writeFile(manifestPath, manifest);
await writeFile(stylesPath, styles);
console.log('Android launcher and splash artwork configured.');