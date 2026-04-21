import { test, expect } from '../../fixtures/basePage';
import { Tags } from '../../utils/tags';

test.describe('Cart Management', { tag: [Tags.e2e, Tags.smoke, Tags.checkout] }, () => {
  test.setTimeout(40000);
  test('should update cart item quantity', async ({
    checkoutPage,
    productResultsPage,
    productDetailsPage,
  }) => {
    await test.step('Navigate to a product and add to cart', async () => {
      await productResultsPage.navigateToAndWaitForProducts();
      await productResultsPage.clickFirstProduct();
      await productDetailsPage.addToCart();
      await productDetailsPage.goToCart();
    });

    await test.step('Update quantity to 3 and verify', async () => {
      await checkoutPage.updateCartItemQuantity(0, '3');
      await expect(checkoutPage.cartItemQuantityAt(0)).toHaveValue('3');
    });
  });

  test('should remove item from cart', async ({
    productResultsPage,
    productDetailsPage,
    checkoutPage,
    page,
  }) => {
    await test.step('Navigate to a product and add to cart', async () => {
      await productResultsPage.navigateToAndWaitForProducts();
      await productResultsPage.clickFirstProduct();
      await productDetailsPage.addToCart();
      await productDetailsPage.goToCart();
    });

    const initialCount = await test.step('Verify cart has items and record count', async () => {
      await page.waitForLoadState('domcontentloaded');
      await expect(checkoutPage.cartItems()).not.toHaveCount(0);
      const count = await checkoutPage.getCartItemCount();
      return count;
    });

    await test.step('Remove first cart item', async () => {
      await checkoutPage.removeCartItem(0);
    });

    await test.step('Verify item count decreased and cart is empty', async () => {
      await expect(checkoutPage.cartItems()).toHaveCount(initialCount - 1);
      await expect(checkoutPage.emptyCartMessage()).toBeVisible();
    });
  });

  test('should persist cart items across page navigation', async ({
    productResultsPage,
    productDetailsPage,
    checkoutPage,
  }) => {
    await test.step('Navigate to a product and add to cart', async () => {
      await productResultsPage.navigateToAndWaitForProducts();
      await productResultsPage.clickFirstProduct();
      await productDetailsPage.addToCart();
    });

    await test.step('Navigate away and return to checkout', async () => {
      await productResultsPage.navigateToAndWaitForProducts();
      await checkoutPage.navigateTo();
    });

    await test.step('Verify cart still contains items', async () => {
      await expect(checkoutPage.cartItems()).not.toHaveCount(0);
    });
  });
});

test.describe('Checkout Payment | @e2e', () => {
  // Have included some basic cart management tests above, but the main focus
  // here is on the checkout flow and payment processing.
  // The cart management tests are more about ensuring
  // the cart functionality works as expected before proceeding to checkout.
  test('should complete full checkout with credit card payment', async ({
    productResultsPageLoggedIn,
    productDetailsPage,
    checkoutPage,
    billingAddressPage,
    paymentPage,
    page,
  }) => {
    await test.step('Navigate to products and add item to cart', async () => {
      await productResultsPageLoggedIn.navigateToAndWaitForProducts();
      await Promise.all([
        page.waitForURL('/product/**'),
        productResultsPageLoggedIn.clickFirstProduct(),
      ]);
      //await page.waitForLoadState('networkidle');
      await productDetailsPage.addToCart();
    });

    await test.step('Navigate to checkout via cart icon', async () => {
      await Promise.all([
        page.waitForURL('/checkout'),
        page.locator('[data-test="nav-cart"]').click(),
      ]);
      //await page.waitForLoadState('networkidle');
    });

    await test.step('Verify cart has items and proceed', async () => {
      await expect(checkoutPage.cartItems()).not.toHaveCount(0);
      await checkoutPage.proceedFromCart();
    });

    await test.step('Confirm already logged in and proceed to billing', async () => {
      await expect(checkoutPage.loggedInMessage()).toBeVisible();
      await checkoutPage.proceedFromSignIn();
      await billingAddressPage.streetInput().waitFor({ state: 'visible' });
    });

    await test.step('Fill billing address and proceed to payment', async () => {
      await billingAddressPage.fillBillingAddress({
        street: 'Test Street 1',
        city: 'Vienna',
        state: 'Vienna',
        country: 'Austria',
        postalCode: '1010',
        houseNumber: '5',
      });
      await billingAddressPage.proceedFromBilling();
      await paymentPage.paymentMethodSelect().waitFor({ state: 'visible' });
    });

    await test.step('Select credit card payment method and fill details', async () => {
      await paymentPage.selectPaymentMethod('Credit Card');
      await paymentPage.fillCreditCard({
        number: '4111-1111-1111-1111',
        expiry: '12/2026',
        cvv: '123',
        holderName: 'Jane Doe',
      });
      await paymentPage.confirmPayment();
    });

    await test.step('Verify payment success message', async () => {
      await expect(paymentPage.paymentSuccessMessage()).toBeVisible();
      await expect(paymentPage.paymentSuccessMessage()).toContainText('Payment was successful');
    });
  });

  test('should complete full checkout with bank transfer payment', async ({
    productResultsPageLoggedIn,
    productDetailsPage,
    checkoutPage,
    billingAddressPage,
    paymentPage,
    page,
  }) => {
    await test.step('Navigate to products and add item to cart', async () => {
      await productResultsPageLoggedIn.navigateToAndWaitForProducts();
      await productResultsPageLoggedIn.clickFirstProduct();
      await productDetailsPage.addToCart();
    });

    await test.step('Navigate to checkout via cart icon', async () => {
      await Promise.all([
        page.waitForURL('/checkout'),
        page.locator('[data-test="nav-cart"]').click(),
      ]);
      //await page.waitForLoadState('networkidle');
    });

    await test.step('Verify cart has items and proceed', async () => {
      await expect(checkoutPage.cartItems()).not.toHaveCount(0);
      await checkoutPage.proceedFromCart();
    });

    await test.step('Confirm already logged in and proceed to billing', async () => {
      await expect(checkoutPage.loggedInMessage()).toBeVisible();
      await checkoutPage.proceedFromSignIn();
      await billingAddressPage.streetInput().waitFor({ state: 'visible' });
    });

    await test.step('Fill billing address and proceed to payment', async () => {
      await billingAddressPage.fillBillingAddress({
        street: 'Test Street 1',
        city: 'Vienna',
        state: 'Vienna',
        country: 'Austria',
        postalCode: '1010',
        houseNumber: '4',
      });
      await billingAddressPage.proceedFromBilling();
      await paymentPage.paymentMethodSelect().waitFor({ state: 'visible' });
    });

    await test.step('Select bank transfer payment method and fill details', async () => {
      await paymentPage.selectPaymentMethod('Bank Transfer');
      await paymentPage.fillBankTransfer({
        bankName: 'Test Bank',
        accountName: 'Jane Doe',
        accountNumber: '1234567890',
      });
      await paymentPage.confirmPayment();
    });

    await test.step('Verify payment success message', async () => {
      await expect(paymentPage.paymentSuccessMessage()).toBeVisible();
      await expect(paymentPage.paymentSuccessMessage()).toContainText('Payment was successful');
    });
  });
});
