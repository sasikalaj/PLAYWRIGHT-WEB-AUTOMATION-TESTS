import { test, expect } from '../../fixtures/basePage';
import { createLogger } from '../../utils/logger';
import fs from 'fs';
import path from 'path';
import { Tags } from '../../utils/tags';

const log = createLogger('ProductListSpec');

test.describe('Product List Page tests', { tag: [Tags.regression, Tags.productList] }, () => {
  test.beforeEach(async ({ productResultsPage }) => {
    await productResultsPage.navigateToAndWaitForProducts();
  });

  test('Should show the correct product details', async ({ productResultsPage }) => {
    const apiReturnedProductDesc = await test.step('Get products from API response', async () => {
      const desc = productResultsPage.getAPIReturnedProducts();
      log.debug('Products List from API: ' + desc);
      return desc;
    });

    const trimmedUiProductsDesc = await test.step('Get products from UI', async () => {
      const uiProductsList = await productResultsPage.getProductNames();
      const trimmed = uiProductsList.map((name) => name.split('ABCDE')[0].trim());
      log.debug('Products List from UI: ' + trimmed);
      return trimmed;
    });

    await test.step('Verify UI products match API response', async () => {
      expect(trimmedUiProductsDesc).toEqual(apiReturnedProductDesc);
    });
  });

  test(`should sort the products in the Price (High - Low) order `, async ({
    productResultsPage,
  }) => {
    const unsortedProductsText = await test.step('Record current product order', async () => {
      return productResultsPage.getProductNames();
    });

    await test.step('Apply Price (High - Low) sort', async () => {
      await productResultsPage.selectSortOption('Price (High - Low)');
      await productResultsPage.waitForProductsToLoad();
    });

    await test.step('Verify products are in a different order', async () => {
      const sortedProductsText = await productResultsPage.getProductNames();
      await expect(sortedProductsText).not.toEqual(unsortedProductsText);
    });
  });

  test(`should list the products filtered by category`, async ({ productResultsPage }) => {
    await test.step('Select Hammer category filter', async () => {
      await productResultsPage.filterByCategory('Hammer');
      await expect(productResultsPage.categoryFilterCheckbox('Hammer')).toBeChecked();
      await productResultsPage.waitForProductsToLoad();
    });

    await test.step('Verify all results are in the Hammer category', async () => {
      const count = await productResultsPage.getProductCount();
      for (let i = 0; i < count; i++) {
        await expect(productResultsPage.allProducts().nth(i)).toContainText(/Hammer/i);
      }
    });
  });

  test(`should show only the products that was searched`, async ({ productResultsPage }) => {
    await test.step('Search for Saw', async () => {
      await productResultsPage.searchForProduct('Saw');
      await productResultsPage.waitForProductsToLoad();
    });

    await test.step('Verify all results contain Saw', async () => {
      const count = await productResultsPage.getProductCount();
      for (let i = 0; i < count; i++) {
        await expect(productResultsPage.allProducts().nth(i)).toContainText(/Saw/i);
      }
    });
  });

  test('should navigate to page 2 and show different products', async ({ productResultsPage }) => {
    const page1Products = await test.step('Record page 1 product names', async () => {
      return productResultsPage.getProductNames();
    });

    await test.step('Navigate to page 2', async () => {
      await productResultsPage.navigateToPage(2);
    });

    await test.step('Verify page 2 shows different products', async () => {
      const page2Products = await productResultsPage.getProductNames();
      expect(page2Products).not.toEqual(page1Products);
    });
  });
});

test('Should show the correct product details from the intercepted API response', async ({
  page,
  productResultsPage,
}) => {
  const apiReturnedProductDesc = await test.step('Load mock product data', async () => {
    const mockResponse = fs.readFileSync(path.resolve('productsResponse.json'), 'utf-8');
    const apiReturnedProducts = JSON.parse(mockResponse).data;
    return apiReturnedProducts.map((product: { name: string }) => product.name.trim());
  });

  await test.step('Intercept products API and return mock response', async () => {
    const mockResponse = fs.readFileSync(path.resolve('productsResponse.json'), 'utf-8');
    await page.route('**/products?page=1*', async (route) => {
      if (route.request().method() === 'GET' || route.request().postData()?.includes('product')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: mockResponse,
        });
      }
    });
  });

  const trimmedUiProductsDesc =
    await test.step('Navigate and capture UI product names', async () => {
      await productResultsPage.navigateTo();
      await productResultsPage.waitForProductsToLoad({ timeout: 3000 });
      const uiProductsList = await productResultsPage.getProductNames();
      return uiProductsList.map((name) => name.split('Out')[0].trim());
    });

  await test.step('Verify UI matches mocked API response', async () => {
    expect(trimmedUiProductsDesc).toEqual(apiReturnedProductDesc);
  });
});
