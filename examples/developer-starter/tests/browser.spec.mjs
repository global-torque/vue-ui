// Run against the built starter's explicit `npm run demo` server.
// Playwright and Axe are verification tools, never starter runtime dependencies.
// STARTER_BROWSER_TOOLS may point to a package.json with those tools installed.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(process.env.STARTER_BROWSER_TOOLS || import.meta.url);
const { chromium, expect } = require('@playwright/test');
const { default: AxeBuilder } = await import(require.resolve('@axe-core/playwright'));
const base = process.env.STARTER_BROWSER_URL || 'http://127.0.0.1:4300';
const output = path.resolve(process.env.STARTER_BROWSER_EVIDENCE || '.browser-evidence');
await fs.mkdir(output, { recursive: true });
const results = [];
const browser = await chromium.launch();
let failure;

try {
  for (const theme of ['light', 'dark']) {
    for (const [viewportName, viewport] of Object.entries({ desktop: { width: 1280, height: 800 }, mobile: { width: 390, height: 844 } })) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: 'light', locale: 'en-US' });
      const page = await context.newPage();
      const errors = [];
      const responses = [];
      page.on('pageerror', (error) => errors.push({ kind: 'page', message: error.message }));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push({ kind: 'console', message: message.text(), url: message.location().url });
      });
      page.on('response', (response) => responses.push({ url: response.url(), status: response.status() }));
      const response = await page.goto(base);
      assert.equal(response.status(), 200);
      await expect(page.getByText('Demonstration data.', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'View offer', exact: true })).toHaveCount(2);
      const themeButton = page.getByRole('button', { name: /^(Dark|Light) theme$/ });
      // Traverse the real tab order from the first focusable element.
      await page.getByRole('link', { name: 'Investment explorer', exact: true }).focus();
      await page.keyboard.press('Tab');
      await expect(themeButton).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(themeButton).toHaveAttribute('aria-pressed', 'true');
      if (theme === 'light') await page.keyboard.press('Space');
      await expect(themeButton).toHaveAttribute('aria-pressed', String(theme === 'dark'));
      await page.keyboard.press('Tab');
      await expect(page.getByLabel('Preview state')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: /^Personal workspace/ })).toBeFocused();

      const scenario = page.getByLabel('Preview state');
      const offers = page.getByRole('button', { name: 'View offer', exact: true });
      let errorCursor = 0;
      let responseCursor = 0;
      async function capture(state, profile, { transient = false } = {}) {
        if (!transient) {
          for (const img of await page.locator('img').all()) {
            await img.scrollIntoViewIfNeeded();
            await expect.poll(() => img.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
          }
        }
        await page.evaluate(() => scrollTo(0, 0));
        const file = `${theme}--${viewportName}--${profile}--${state}.png`;
        const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
        const screenshot = path.join(output, file);
        await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled', caret: 'hide' });
        const axe = transient ? null : (await new AxeBuilder({ page }).analyze()).violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
        const currentErrors = errors.slice(errorCursor);
        errorCursor = errors.length;
        const currentResponses = responses.slice(responseCursor);
        responseCursor = responses.length;
        const isExpectedResponse = ({ url, status }) => new URL(url).pathname.startsWith('/api/offers') && [401, 502].includes(status);
        const expectedFailures = currentResponses.filter(isExpectedResponse);
        const unexpectedErrors = currentErrors.filter((error) => !(error.kind === 'console' && /Failed to load resource/.test(error.message) && expectedFailures.some((entry) => entry.url === error.url)));
        const unexpectedResponses = currentResponses.filter((entry) => entry.status >= 400 && !isExpectedResponse(entry));
        const issues = [];
        if (dimensions.document > dimensions.viewport) issues.push('horizontal overflow');
        if (unexpectedErrors.length) issues.push('unexpected browser errors');
        if (unexpectedResponses.length) issues.push('unexpected HTTP failures');
        if (axe?.some(({ impact }) => ['serious', 'critical'].includes(impact))) issues.push('serious/critical Axe violation');
        results.push({ state, profile, theme, viewport, route: '/', localUrl: base, referenceUrl: null, referenceReason: 'New standalone demo; no deployed reference exists.', status: response.status(), finalUrl: page.url(), title: await page.title(), screenshot, dimensions, consoleAndPageErrors: currentErrors, expectedFixtureFailures: expectedFailures, unexpectedErrors, unexpectedResponses, responses: currentResponses, axe, axeNote: transient ? 'Transient loading screenshot; accessibility is checked again after completion.' : undefined, issues, verdict: issues.length ? 'FAIL' : 'PASS' });
        await fs.writeFile(path.join(output, 'manifest.json'), `${JSON.stringify(results, null, 2)}\n`);
        console.log(`${issues.length ? 'FAIL' : 'PASS'} ${theme}/${viewportName}/${profile}/${state}${issues.length ? `: ${issues.join(', ')}` : ''}`);
      }
      async function selectScenario(value) {
        await scenario.selectOption(value);
      }

      for (const profile of ['personal', 'team']) {
        const selectedProfile = page.getByRole('button', { name: profile === 'personal' ? /^Personal workspace/ : /^Team workspace/ });
        await selectedProfile.focus();
        await page.keyboard.press(profile === 'personal' ? 'Space' : 'Enter');
        await expect(selectedProfile).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('.profile-selector button[aria-pressed="true"]')).toHaveCount(1);
        await selectScenario('success');
        await expect(offers).toHaveCount(2);
        await capture('list', profile);

        for (const [index, title] of ['Community energy', 'Neighborhood workspaces'].entries()) {
          await offers.nth(index).focus();
          await page.keyboard.press('Enter');
          await expect(page.getByRole('heading', { name: 'Offer details', exact: true })).toBeVisible();
          await expect(page.getByRole('heading', { name: 'Offer details', exact: true })).toBeFocused();
          await expect(page.getByRole('heading', { name: title, exact: true })).toHaveCount(1);
          await capture(`detail-${index + 1}`, profile);
          const back = page.getByRole('button', { name: 'Back to offers', exact: true }).nth(index);
          await back.focus();
          await page.keyboard.press('Space');
          await expect(offers).toHaveCount(2);
          await expect(page.getByRole('heading', { name: 'Available offers', exact: true })).toBeFocused();
        }

        await selectScenario('empty');
        await expect(page.getByRole('heading', { name: 'No offers available' })).toBeVisible();
        await capture('empty', profile);
        await page.getByRole('button', { name: 'Refresh offers' }).focus();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('heading', { name: 'No offers available' })).toBeVisible();
        await capture('empty-refreshed', profile);

        await selectScenario('slow');
        await expect(page.locator('.offer-card[aria-busy="true"]')).toHaveCount(2);
        await capture('loading', profile, { transient: true });
        await expect(offers).toHaveCount(2);
        await capture('loading-completed', profile);
        // A newer command must win over an in-flight slow request.
        await selectScenario('success');
        await expect(offers).toHaveCount(2);
        await selectScenario('slow');
        await expect(page.locator('.offer-card[aria-busy="true"]')).toHaveCount(2);
        await selectScenario('empty');
        await expect(page.getByRole('heading', { name: 'No offers available' })).toBeVisible();
        await page.waitForTimeout(1400);
        await expect(offers).toHaveCount(0);
        await capture('cancelled-loading-remains-empty', profile);

        for (const [value, text] of [['error', 'Offers are temporarily unavailable. Please retry.'], ['auth-error', 'Sandbox access was rejected. Check your access configuration.']]) {
          await selectScenario(value);
          await expect(page.getByRole('alert')).toContainText(text);
          await capture(value, profile);
          const retryResponse = page.waitForResponse((entry) => entry.url().includes(`/api/offers?scenario=${value}`));
          await page.getByRole('button', { name: 'Retry', exact: true }).focus();
          await page.keyboard.press('Enter');
          assert.equal((await retryResponse).status(), value === 'auth-error' ? 401 : 502);
          await expect(page.getByRole('alert')).toContainText(text);
          await capture(`${value}-retried`, profile);
        }
        await selectScenario('success');
        await expect(offers).toHaveCount(2);
        await expect(page.getByRole('alert')).toHaveCount(0);
        await expect(selectedProfile).toHaveAttribute('aria-pressed', 'true');
        await capture('recovered', profile);
      }
      await context.close();
    }
  }
  assert.equal(results.length, 104);
  assert.equal(results.filter(({ verdict }) => verdict === 'FAIL').length, 0, 'See manifest.json for browser findings.');
} catch (error) {
  failure = error;
} finally {
  await browser.close();
  await fs.writeFile(path.join(output, 'result.json'), `${JSON.stringify({ captures: results.length, failures: results.filter(({ verdict }) => verdict === 'FAIL').length, error: failure?.stack || null }, null, 2)}\n`);
}
if (failure) throw failure;
console.log(`PASS ${results.length} captures: 26 states at desktop/mobile in light/dark themes.`);
