const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Wait for expo to start
    console.log('Waiting for server...');
    // Increase wait time for server to be fully ready
    await new Promise(r => setTimeout(r, 15000));

    console.log('Navigating to app...');
    // Use a timeout for navigation
    await page.goto('http://localhost:8081', { timeout: 60000 });

    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    await new Promise(r => setTimeout(r, 5000)); // Extra time for React Native Web

    console.log('Taking screenshot of Home/Search Screen...');
    await page.screenshot({ path: 'verification/home_screen.png', fullPage: true });

    // Look for tabs by accessibility labels we added
    // Note: Accessibility labels in RN Web are often 'aria-label'

    const collectionTab = page.locator('[aria-label="Collection Tab"]');
    if (await collectionTab.isVisible()) {
        console.log('Navigating to Collection...');
        await collectionTab.click();
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: 'verification/collection_screen.png', fullPage: true });
    } else {
        console.log('Collection tab not found.');
    }

    const decksTab = page.locator('[aria-label="Decks Tab"]');
    if (await decksTab.isVisible()) {
        console.log('Navigating to Decks...');
        await decksTab.click();
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: 'verification/decks_screen.png', fullPage: true });
    }

  } catch (error) {
    console.error('Error:', error);
    // Take a screenshot of the error state if possible
    try {
        await page.screenshot({ path: 'verification/error_state.png', fullPage: true });
    } catch (e) {}
  } finally {
    await browser.close();
  }
})();
