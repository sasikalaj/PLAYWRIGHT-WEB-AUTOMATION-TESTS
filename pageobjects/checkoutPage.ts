import { Page } from '@playwright/test';
import { createLogger } from '../utils/logger';

export const createCheckoutPage = (page: Page) => {
  const log = createLogger('CheckoutPage');
  // ── Cart (Step 1) ──────────────────────────────────────────────────────────
  const cartItems = () => page.locator('app-cart div table tbody tr');
  const cartItemTitleAt = (index: number) =>
    cartItems().nth(index).locator('td span.product-title');
  const cartItemQuantityAt = (index: number) =>
    cartItems().nth(index).locator('input[data-test=product-quantity]');
  const removeItemButtonAt = (index: number) => cartItems().nth(index).locator('.btn.btn-danger');
  const emptyCartMessage = () => page.getByText('The cart is empty. Nothing to display.');
  const cartTotal = () => page.locator('[data-test="cart-total"]');
  const step1ProceedButton = () => page.locator('[data-test="proceed-1"]');

  // ── Sign-in (Step 2) ───────────────────────────────────────────────────────
  const step2ProceedButton = () => page.locator('[data-test="proceed-2"]');
  const loggedInMessage = () => page.getByText('you are already logged in');

  // ── Page navigation ────────────────────────────────────────────────────────
  const navigateTo = async () => {
    log.step('Navigating to checkout page');
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
  };

  // ── Cart actions ───────────────────────────────────────────────────────────
  const getCartItemCount = async () => cartItems().count();

  const getCartItemTitle = async (index: number) => cartItemTitleAt(index).innerText();

  const getCartItemQuantity = async (index: number) => cartItemQuantityAt(index).inputValue();

  const updateCartItemQuantity = async (index: number, quantity: string) => {
    const input = cartItemQuantityAt(index);
    await input.fill(quantity);
    await input.press('Tab');
  };

  const removeCartItem = async (index: number) => {
    const row = cartItems().nth(index);
    await removeItemButtonAt(index).click();
    await row.waitFor({ state: 'detached' });
  };

  const getCartItems = async () => cartItems();

  const getCartItemQuantityAt = async (index: number) => cartItemQuantityAt(index);

  const clickProceedToCheckout = async () => {
    await step1ProceedButton().click();
  };

  // ── Step-by-step checkout actions ─────────────────────────────────────────
  const proceedFromCart = async () => {
    await step1ProceedButton().click();
    await step2ProceedButton().waitFor({ state: 'visible' });
  };

  const proceedFromSignIn = async () => {
    await step2ProceedButton().click();
  };

  return {
    // Locators
    cartItems,
    cartItemQuantityAt,
    emptyCartMessage,
    cartTotal,
    step1ProceedButton,
    step2ProceedButton,
    loggedInMessage,
    // Actions
    navigateTo,
    clickProceedToCheckout,
    getCartItemCount,
    getCartItemTitle,
    getCartItemQuantity,
    updateCartItemQuantity,
    removeCartItem,
    getCartItems,
    getCartItemQuantityAt,
    proceedFromCart,
    proceedFromSignIn,
  };
};
