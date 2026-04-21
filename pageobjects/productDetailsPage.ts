import { Page } from '@playwright/test';
import { createLogger } from '../utils/logger';

export const createProductDetailsPage = (page: Page) => {
  const log = createLogger('ProductDetailsPage');
  const productTitle = () => page.locator('h1[data-test="product-name"]');
  const productDescription = () => page.locator('[data-test="product-description"]');
  const productPrice = () => page.locator('.price-section');
  const productImage = (title: string) => page.locator(`.figure img[alt="${title}"]`);
  const addToCartButton = () => page.getByRole('button', { name: 'Add to cart' });
  const cartQuantityBadge = () => page.getByRole('link', { name: 'cart' }).locator('span');
  const cartButton = () => page.getByRole('link', { name: 'cart' });

  const addToCart = async () => {
    log.step('Adding product to cart');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/carts') && r.request().method() === 'POST' && r.status() === 200
      ),
      addToCartButton().click(),
    ]);
  };

  const goToCart = async () => {
    log.step('Navigating to cart');
    await Promise.all([page.waitForURL('/checkout'), cartButton().click()]);
  };

  const getProductTitle = () => productTitle();

  const getProductDescription = () => productDescription();

  const getProductPrice = () => productPrice();

  const getProductImage = (title: string) => productImage(title);

  const getCartCount = async () => {
    return cartQuantityBadge().textContent();
  };

  const getAddToCartButton = () => addToCartButton();

  const getCartQuantityBadge = () => cartQuantityBadge();

  return {
    addToCart,
    goToCart,
    getProductTitle,
    getProductDescription,
    getProductPrice,
    getCartCount,
    getProductImage,
    getAddToCartButton,
    getCartQuantityBadge,
    cartQuantityBadge,
  };
};
