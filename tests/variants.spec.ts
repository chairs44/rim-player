import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const playing = (group: Locator) => group.locator('audio').evaluate((el: HTMLAudioElement) => !el.paused);
const position = (group: Locator) => group.locator('audio').evaluate((el: HTMLAudioElement) => el.currentTime);
const media = (group: Locator) => group.locator('audio').evaluate((el: HTMLAudioElement) => el.currentSrc);

async function openDemo(page: Page) {
  await page.goto('/variants/?set=demo');
  await expect(page.getByRole('heading', { name: 'Rim Player variants' })).toBeVisible();
}

test('all five playable transports are independent, seekable and fit a narrow embed', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await openDemo(page);
  const groups = page.locator('[data-rim-variant]');
  await expect(groups).toHaveCount(5);
  for (const group of await groups.all()) {
    const seek = group.getByRole('slider');
    await expect(seek).toBeEnabled();
    await group.getByRole('button', { name: /^Play / }).first().click();
    await expect.poll(() => playing(group)).toBe(true);
    await expect.poll(() => page.locator('audio').evaluateAll(nodes => nodes.filter(el => !(el as HTMLAudioElement).paused).length)).toBe(1);
    await group.getByRole('button', { name: /^Pause / }).first().click();
    await seek.focus();
    await seek.press('Home');
    await seek.press('ArrowRight');
    await expect.poll(() => position(group)).toBeCloseTo(5, 0);
    await expect(seek).toHaveAttribute('aria-valuetext', /of/);
  }
  const wave = page.locator('[data-rim-variant="waveform"]');
  await expect(wave.locator('svg[data-waveform] path').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  const a11y = await new AxeBuilder({ page }).include('.rim-variants').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(a11y.violations).toEqual([]);
});

test('inline editions select a different recording, expose the active scrubber and follow the time setting', async ({ page }) => {
  await openDemo(page);
  for (const name of ['inline', 'inline-no-time']) {
    const group = page.locator('[data-rim-variant="' + name + '"]');
    await group.getByRole('button', { name: 'Play Low register' }).click();
    await expect.poll(() => playing(group)).toBe(true);
    const oldSrc = await media(group);
    await group.getByRole('button', { name: 'Play Quick steps' }).click();
    await expect.poll(() => media(group)).not.toBe(oldSrc);
    await expect(group.getByRole('button', { name: 'Pause Quick steps' })).toBeVisible();
    await expect(group.getByRole('slider')).toHaveAccessibleName('Seek Quick steps');
    await expect(group.locator('time')).toHaveCount(name === 'inline' ? 3 : 0);
    if (name === 'inline') await expect(group.locator('time').last()).toContainText('−');
  }
});

test('shared transport navigates, auto-advances and stops at the end of its queue', async ({ page }) => {
  await openDemo(page);
  const group = page.locator('[data-rim-variant="shared"]');
  await group.getByRole('button', { name: 'Play Low register' }).first().click();
  await expect.poll(() => playing(group)).toBe(true);
  await group.getByRole('button', { name: 'Previous track' }).click();
  await expect(group.getByRole('slider')).toHaveAccessibleName('Seek Quiet sequence');
  await expect(group.getByRole('button', { name: 'Previous track' })).toBeDisabled();
  await group.getByRole('button', { name: 'Next track' }).click();
  await expect(group.getByRole('slider')).toHaveAccessibleName('Seek Low register');
  await expect(group.getByRole('slider')).toBeEnabled();
  await expect.poll(() => playing(group)).toBe(true);
  await group.locator('audio').evaluate((el: HTMLAudioElement) => { el.currentTime = el.duration - 0.15; });
  await expect(group.getByRole('slider')).toHaveAccessibleName('Seek Quick steps');
  await expect.poll(() => playing(group)).toBe(true);
  await expect(group.getByRole('button', { name: 'Next track' })).toBeDisabled();
  await expect(group.getByRole('slider')).toBeEnabled();
  await group.locator('audio').evaluate((el: HTMLAudioElement) => { el.currentTime = el.duration - 0.15; });
  await expect.poll(() => playing(group)).toBe(false);
  await group.getByRole('button', { name: 'Play Quick steps', exact: true }).first().click();
  await expect.poll(() => position(group)).toBeLessThan(2);
});

test('a new audition pauses the previous player and dragging the waveform seeks the audio', async ({ page }) => {
  await openDemo(page);
  const inline = page.locator('[data-rim-variant="inline"]');
  const wave = page.locator('[data-rim-variant="waveform"]');
  await inline.getByRole('button', { name: 'Play Quick steps' }).click();
  await expect.poll(() => playing(inline)).toBe(true);
  await wave.getByRole('button', { name: 'Play Quiet sequence' }).click();
  await expect.poll(() => playing(inline)).toBe(false);
  await wave.getByRole('button', { name: 'Pause Quiet sequence' }).click();
  const seek = wave.getByRole('slider');
  const box = (await seek.boundingBox())!;
  await page.mouse.move(box.x + 6, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => position(wave)).toBeGreaterThan(16);
});

test('seeking to the end of a paused track keeps its queue paused', async ({ page }) => {
  await openDemo(page);
  const group = page.locator('[data-rim-variant="shared"]');
  const seek = group.getByRole('slider', { name: 'Seek Low register' });
  await expect(seek).toBeEnabled();
  await seek.press('End');
  await expect.poll(() => group.locator('audio').evaluate((el: HTMLAudioElement) =>
    el.paused && Math.abs(el.currentTime - el.duration) < 0.1
  )).toBe(true);
  await expect(seek).toBeEnabled();
});

test('a failed waveform falls back to a rail and a failed recording can be retried', async ({ page }) => {
  await page.route('**/demo.wav', route => route.request().resourceType() === 'fetch' ? route.abort() : route.continue());
  await page.route('**/samples/low-register.mp3', route => route.fulfill({ status: 404, headers: { 'cache-control':'no-store' }, body: '' }));
  await openDemo(page);
  const wave = page.locator('[data-rim-variant="waveform"]');
  await expect(wave.getByRole('status')).toContainText('Waveform unavailable');
  await expect(wave.getByRole('slider')).toBeEnabled();
  const shared = page.locator('[data-rim-variant="shared"]');
  await shared.getByRole('button', { name: 'Play Low register', exact: true }).first().click();
  await expect(shared.getByRole('alert')).toContainText('Audio unavailable');
  await page.unroute('**/samples/low-register.mp3');
  await shared.getByRole('button', { name: 'Play Low register', exact: true }).first().click();
  await expect.poll(() => playing(shared)).toBe(true);
  await expect(shared.getByRole('alert')).toHaveCount(0);
});
