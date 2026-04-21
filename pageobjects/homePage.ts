import { Page } from '@playwright/test';
import { createLogger } from '../utils/logger';

export const createHomePage = (page: Page) => {
  const log = createLogger('HomePage');
  // Locators
  const logoLink = () => page.getByRole('link', { name: /Practice Software Testing - Toolshop/ });
  const bannerImage = () => page.locator('.img-fluid');
  const allProducts = () => page.locator('a[data-test*="product-"]');
  const searchInput = () => page.locator('input[placeholder="Search"]');
  const searchButton = () => page.locator('button:has-text("Search")');
  const noProductsMessage = () => page.getByText('There are no products found.');
  const searchSectionHeading = () => page.locator('h4:has-text("Search")');
  const selectCategoryCheckbox = (category: string) =>
    page.getByRole('checkbox', { name: category });
  const searchSectionInput = () =>
    page.locator('h4:has-text("Search")').locator('../..').locator('input[type="text"]');

  // Navigation
  const navigateTo = async () => {
    log.step('Navigating to home page');
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  };

  // Actions
  const clickLogo = async () => {
    log.debug('Clicking logo');
    await logoLink().click();
  };

  const selectCategory = async (category: string) => {
    log.debug('Selecting category', { category });

    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/products') && r.url().includes('by_category') && r.status() === 200
      ),
      selectCategoryCheckbox(category).click(),
    ]);
  };
  const search = async (term: string) => {
    log.debug('Searching for product', { term });
    await searchInput().fill(term);
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/products') &&
          r.url().includes(`search?q=${term}`) &&
          r.status() === 200
      ),
      searchButton().click(),
    ]);

    await page.waitForLoadState('load');
  };

  const typeInSearchAndSubmit = async (term: string) => {
    log.debug('Typing and submitting search', { term });
    await searchInput().click();
    await searchInput().fill(term);
    await searchButton().click();
    await page.waitForLoadState('domcontentloaded');
  };

  const clearSearch = async () => {
    await searchInput().press('Delete');
    await searchButton().click();
    await page.waitForLoadState('domcontentloaded');
  };

  const fillSearchInput = async (term: string) => {
    await searchInput().click();
    await searchInput().fill(term);
  };

  const clearSearchInput = async () => {
    await searchInput().fill('');
  };

  const clickSearchInput = async () => {
    await searchInput().click();
  };

  const submitSearch = async () => {
    await searchButton().click();
  };

  // Data getters
  const getTitle = () => page.title();

  const getProductNameAt = async (index: number) => {
    return allProducts().nth(index).locator('h5').textContent();
  };

  const getProductCount = async () => {
    return allProducts().count();
  };

  const getProductNames = async () => {
    const texts = await allProducts().allTextContents();
    return texts.map((text) => text.split('$')[0].trim());
  };

  const getSearchInputValue = async () => {
    return searchInput().inputValue();
  };

  return {
    navigateTo,
    clickLogo,
    search,
    typeInSearchAndSubmit,
    clearSearch,
    fillSearchInput,
    clearSearchInput,
    clickSearchInput,
    submitSearch,
    getTitle,
    getProductNameAt,
    getProductCount,
    getProductNames,
    getSearchInputValue,
    logoLink,
    bannerImage,
    allProducts,
    searchInput,
    searchButton,
    noProductsMessage,
    selectCategory,
    searchSectionHeading,
    searchSectionInput,
  };
};
