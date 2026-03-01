const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Navigating to app...');
    // Use a timeout for navigation
    await page.goto('http://localhost:8081', { timeout: 60000 });

    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Extra time for React Native Web

    console.log('Taking screenshot of Search Screen (Default)...');
    await page.screenshot({ path: 'verification/search_screen.png', fullPage: true });

    // Look for tabs by accessibility labels we added
    // Note: Accessibility labels in RN Web are often 'aria-label'

    const collectionTab = page.locator('[aria-label="Collection Tab"]');
    if (await collectionTab.isVisible()) {
        console.log('Navigating to Collection...');
        await collectionTab.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'verification/collection_screen.png', fullPage: true });
    } else {
        console.log('Collection tab not found.');
    }

    const decksTab = page.locator('[aria-label="Decks Tab"]');
    if (await decksTab.isVisible()) {
        console.log('Navigating to Decks...');
        await decksTab.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'verification/decks_screen.png', fullPage: true });
    } else {
        console.log('Decks tab not found.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
