import { test, expect } from '../../fixtures/basePage';
import { getAuthSessionContext } from '../../utils/authSession';
import { createProductResultsPage } from '../../pageobjects/productResultsPage';
import { createProductDetailsPage } from '../../pageobjects/productDetailsPage';
import { createCheckoutPage } from '../../pageobjects/checkoutPage';
import { Tags } from '../../utils/tags';

test.describe(`Checkout`, { tag: [Tags.regression, Tags.productDetails] }, () => {
  test('should add the selected products to cart when added', async () => {
    const context = await getAuthSessionContext();
    const page = await context.newPage();
    test.setTimeout(60000);

    const productResultsPage = createProductResultsPage(page);
    const productDetailsPage = createProductDetailsPage(page);
    const checkoutPage = createCheckoutPage(page);

    const productTexts =
      await test.step('Navigate to products and capture product list', async () => {
        await productResultsPage.navigateTo();
        await productResultsPage.waitForProductsToLoad();
        return productResultsPage.getProductTexts();
      });

    await test.step('Add first 2 products to cart', async () => {
      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toBe('Product added to shopping cart');
        await dialog.accept();
      });

      for (let i = 0; i < 2; i++) {
        await productResultsPage.clickProductAtWithNavigation(i);
        await productDetailsPage.addToCart();
        await expect(productDetailsPage.cartQuantityBadge()).toContainText(String(i + 1));
        await Promise.all([page.waitForURL('/'), page.goBack()]);
      }
    });

    await test.step('Navigate to cart', async () => {
      await productDetailsPage.goToCart();
      await expect(page.getByRole('button', { name: 'Proceed to Checkout' })).toBeVisible();
    });

    await test.step('Verify cart contains the 2 added products', async () => {
      await expect(checkoutPage.cartItems()).toHaveCount(2);
      const cartItemCount = await checkoutPage.getCartItemCount();

      for (let i = 0; i < cartItemCount; i++) {
        expect(productTexts[i]).toContain((await checkoutPage.getCartItemTitle(i)).trim());
        await expect(checkoutPage.cartItemQuantityAt(i)).toHaveValue('1');
      }
    });

    await test.step('Proceed to checkout and verify logged-in state', async () => {
      await checkoutPage.clickProceedToCheckout();
      await expect(
        page.getByText('you are already logged in. You can proceed to checkout.')
      ).toBeVisible();
    });
  });
});
