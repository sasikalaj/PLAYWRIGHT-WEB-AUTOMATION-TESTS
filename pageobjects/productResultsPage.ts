import { Page } from '@playwright/test';
import { createLogger } from '../utils/logger';

export const createProductResultsPage = (page: Page) => {
  const log = createLogger('ProductResultsPage');
  let apiReturnedProducts: { name: string }[] = [];
  let apiResponse: any = {};

  const allProducts = () => page.locator('a[data-test*="product-"]');
  const productSearchBox = () => page.getByRole('textbox', { name: 'Search' });
  const productSearchButton = () => page.getByRole('button', { name: 'Search' });
  const categoryFilterCheckbox = (categoryName: string) =>
    page.getByRole('checkbox', { name: categoryName });
  const paginationLink = (pageNumber: number) =>
    page.locator('.pagination').getByRole('button', { name: String(`Page-${pageNumber}`) });

  const navigateTo = async () => {
    log.step('Navigating to products page');
    await page.goto('/');
  };

  const navigateToAndWaitForProducts = async () => {
    log.step('Navigating and waiting for products API response');
    apiReturnedProducts = [];
    apiResponse = {};
    const [response] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/products?page') &&
          response.status() === 200 &&
          response.request().resourceType() === 'xhr'
      ),
      navigateTo(),
    ]);
    if (!response.ok()) {
      log.error(`Products API responded with ${response.status()}`);
      throw new Error(`Products API responded with ${response.status()}`);
    }
    await allProducts().first().waitFor();
    const json = await response.json();
    apiResponse.data = json;
    apiReturnedProducts.push(...json.data);
    log.debug('Products loaded from API', { count: json.data.length });
  };

  const getAPIResults = () => {
    return apiResponse.data;
  };

  const waitForProductsToLoad = async () => {
    await allProducts().first().waitFor();
  };

  const getAPIReturnedProducts = () => {
    const allProductDescriptions = apiReturnedProducts.map((product: { name: string }) =>
      product.name.trim()
    );
    return allProductDescriptions;
  };

  const getProductCount = async () => {
    return allProducts().count();
  };

  const getProductTexts = async () => {
    return allProducts().allTextContents();
  };

  const getProductNames = async () => {
    const texts = await allProducts().allTextContents();
    return texts.map((text) => text.split('$')[0].trim());
  };

  const getProductHrefAt = async (index: number) => {
    return allProducts().nth(index).getAttribute('href');
  };

  const clickFirstProduct = async () => {
    await allProducts().first().click();
    await page.waitForLoadState('domcontentloaded');
  };

  const clickProductAt = async (index: number) => {
    await allProducts().nth(index).click();
  };

  const clickProductAtWithNavigation = async (index: number) => {
    const productUrl = await allProducts().nth(index).getAttribute('href');
    await Promise.all([page.waitForURL(`${productUrl}`), allProducts().nth(index).click()]);
  };

  const searchForProduct = async (productName: string) => {
    log.debug('Searching for product', { productName });
    await productSearchBox().fill(productName);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/products') && r.status() === 200),
      productSearchButton().click(),
    ]);
  };

  const filterByCategory = async (categoryName: string) => {
    log.debug('Filtering by category', { categoryName });
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/products') && r.status() === 200),
      categoryFilterCheckbox(categoryName).click(),
    ]);
  };

  const selectSortOption = async (sortOption: string) => {
    log.debug('Selecting sort option', { sortOption });
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/products') && r.status() === 200),
      page.locator('.input-group select').selectOption(sortOption),
    ]);
  };

  const navigateToPage = async (pageNumber: number) => {
    log.step(`Navigating to page ${pageNumber}`);
    const [response] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`products?page=${pageNumber}`) &&
          response.status() === 200 &&
          response.request().resourceType() === 'xhr'
      ),
      paginationLink(pageNumber).click(),
    ]);
    if (!response.ok()) {
      log.error(`Products API responded with ${response.status()}`);
      throw new Error(`Products API responded with ${response.status()}`);
    }
    await allProducts().first().waitFor();
  };

  const categoryChecked = async (categoryName: string) => {
    if (await categoryFilterCheckbox(categoryName).isChecked()) {
      return true;
    }
    return false;
  };

  return {
    navigateTo,
    getAPIReturnedProducts,
    getAPIResults,
    waitForProductsToLoad,
    navigateToAndWaitForProducts,
    getProductCount,
    getProductTexts,
    getProductNames,
    getProductHrefAt,
    clickFirstProduct,
    clickProductAt,
    clickProductAtWithNavigation,
    searchForProduct,
    filterByCategory,
    selectSortOption,
    navigateToPage,
    categoryChecked,
    allProducts,
    categoryFilterCheckbox,
  };
};
