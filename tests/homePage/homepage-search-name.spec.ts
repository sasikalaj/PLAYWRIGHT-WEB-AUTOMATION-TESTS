import { test, expect } from '../../fixtures/basePage';
import { Tags } from '../../utils/tags';
import { createLogger } from '../../utils/logger';
const log = createLogger('HomePageSpec');
test.describe('Homepage Search by Name', { tag: [Tags.regression] }, () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.navigateTo();
  });

  test(
    'should have no A11y violation on homepage',
    { tag: ['@a11y'] },
    async ({ createAxeBuilder }, testInfo) => {
      const a11yScanResults = await test.step('Run accessibility scan', async () => {
        return createAxeBuilder().analyze();
      });

      await test.step('Log and attach results', async () => {
        const formatedViolations = a11yScanResults.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          nodes: violation.nodes.length,
        }));
        log.debug('Accessibility Violations:', formatedViolations);
        await testInfo.attach('a11y', {
          body: JSON.stringify(a11yScanResults, null, 2),
          contentType: 'application/json',
        });
      });
    }
  );

  test('should search for a product by name - saw', async ({ homePage }) => {
    await test.step('Verify initial product list is not empty', async () => {
      await expect(homePage.allProducts()).not.toHaveCount(0);
    });

    await test.step('Search for saw', async () => {
      await homePage.search('saw');
    });

    await test.step('Verify all results contain saw', async () => {
      await expect(homePage.allProducts()).not.toHaveCount(0);
      const productCount = await homePage.getProductCount();
      for (let i = 0; i < productCount; i++) {
        await expect(homePage.allProducts().nth(i).locator('h5')).toContainText(/saw/i);
      }
    });
  });

  test('should search for a product selected by category name - Hammer', async ({ homePage }) => {
    await test.step('Search for Hammer', async () => {
      await homePage.selectCategory('Hammer');
    });

    await test.step('Verify all results contain Hammer', async () => {
      await expect(homePage.allProducts()).not.toHaveCount(0);
      const productCount = await homePage.getProductCount();
      for (let i = 0; i < productCount; i++) {
        await expect(homePage.allProducts().nth(i).locator('h5')).toContainText(/Hammer/i);
      }
    });
  });

  test('should return filtered results for partial search term', async ({ homePage }) => {
    await test.step('Search for Saw', async () => {
      await homePage.search('Saw');
    });

    await test.step('Verify all results contain Saw', async () => {
      await expect(homePage.allProducts()).not.toHaveCount(0);
      const productCount = await homePage.getProductCount();
      for (let i = 0; i < productCount; i++) {
        await expect(homePage.allProducts().nth(i).locator('h5')).toContainText(/saw/i);
      }
    });
  });
});
