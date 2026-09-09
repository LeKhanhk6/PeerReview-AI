import { chromium } from '@playwright/test';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set a good viewport size for charts
  await page.setViewportSize({ width: 1200, height: 800 });
  
  console.log('Navigating to http://localhost:5174/screenshot...');
  // Note: App might be routing /screenshot to ScreenshotTest.tsx
  await page.goto('http://localhost:5174/screenshot');

  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  await wait(2000); // wait for render and recharts animation

  const brainDir = 'C:\\Users\\admin\\.gemini\\antigravity-ide\\brain\\0f2863f2-e0a9-489f-9577-a1c57dbe21ba';

  // State 0: Teacher Analytics
  await page.click('#btn-0');
  await wait(1000); // Wait for chart animation
  await page.screenshot({ path: path.join(brainDir, 'teacher_analytics_radar.png') });
  console.log('Saved teacher_analytics_radar.png');

  // State 1: Student Analytics
  await page.click('#btn-1');
  await wait(1000);
  await page.screenshot({ path: path.join(brainDir, 'student_analytics_radar.png') });
  console.log('Saved student_analytics_radar.png');

  // State 2: Student Empty State (403)
  await page.click('#btn-2');
  await wait(500);
  await page.screenshot({ path: path.join(brainDir, 'student_empty_403.png') });
  console.log('Saved student_empty_403.png');

  await browser.close();
  console.log('Done.');
})();
