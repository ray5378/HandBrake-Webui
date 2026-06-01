import { test, expect } from '@playwright/test';

test('mobile swipe navigates to parent directory', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          user: { id: '1', username: 'test' },
          token: 'test-token',
          isAuthenticated: true
        },
        version: 0
      })
    );
  });

  await page.route('**/api/**', async route => {
    const url = route.request().url();
    if (url.includes('/api/auth/me')) {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: { id: '1', username: 'test' }
        })
      });
      return;
    }
    if (url.includes('/api/files') && !url.includes('/api/files/search') && !url.includes('/api/files/stream') && !url.includes('/api/files/thumbnails')) {
      const searchParams = new URL(url).searchParams;
      const directory = searchParams.get('directory') || '/drive';
      if (directory === '/drive') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              files: [
                { name: 'movie.mp4', path: '/drive/movie.mp4', size: 1024000, extension: 'mp4', modified: '2024-01-01' },
                { name: 'show.mkv', path: '/drive/show.mkv', size: 2048000, extension: 'mkv', modified: '2024-01-02' }
              ],
              directories: [
                { name: 'Videos', path: '/drive/Videos' },
                { name: 'Movies', path: '/drive/Movies' }
              ]
            }
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              files: [
                { name: 'test.mp4', path: `${directory}/test.mp4`, size: 512000, extension: 'mp4', modified: '2024-01-01' }
              ],
              directories: []
            }
          })
        });
      }
      return;
    }
    if (url.includes('/api/files/thumbnails')) {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, thumbnails: [] })
      });
      return;
    }
    await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: {} }) });
  });

  await page.goto('/files');

  await page.waitForSelector('text=Videos', { timeout: 10000 });

  await page.click('text=Videos');
  await page.waitForSelector('text=test.mp4', { timeout: 10000 });

  expect(page.url()).toContain('/files');

  const container = page.locator('.space-y-6').first();

  const box = await container.boundingBox();
  expect(box).not.toBeNull();

  const startX = box!.x + box!.width * 0.8;
  const startY = box!.y + box!.height * 0.5;
  const endX = box!.x + box!.width * 0.1;
  const endY = startY;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 10 });
  await page.mouse.up();

  await page.waitForTimeout(500);

  const videoDirButton = page.locator('button').filter({ hasText: 'Videos' });
  await expect(videoDirButton.first()).toBeVisible({ timeout: 5000 });
});