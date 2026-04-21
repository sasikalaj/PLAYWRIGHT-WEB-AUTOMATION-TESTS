import { test as base, expect } from '@playwright/test';
import { createLogger } from '../utils/logger';
import { createHomePage } from '../pageobjects/homePage';
import { createLoginPage } from '../pageobjects/loginPage';
import { createProductResultsPage } from '../pageobjects/productResultsPage';
import { createProductDetailsPage } from '../pageobjects/productDetailsPage';
import { createCheckoutPage } from '../pageobjects/checkoutPage';
import { createRegisterPage } from '../pageobjects/registerPage';
import { createContactPage } from '../pageobjects/contactPage';
import { createAccountPage } from '../pageobjects/accountPage';
import { createNavBar } from '../pageobjects/navBar';
import { createBillingAddressPage } from '../pageobjects/billingAddressPage';
import { createPaymentPage } from '../pageobjects/paymentPage';
import { getAuthSessionContext, getAuthToken } from '../utils/authSession';
import AxeBuilder from '@axe-core/playwright';

type Fixtures = {
  navBar: ReturnType<typeof createNavBar>;
  navBarLoggedIn: ReturnType<typeof createNavBar>;
  homePage: ReturnType<typeof createHomePage>;
  billingAddressPage: ReturnType<typeof createBillingAddressPage>;
  loginPage: ReturnType<typeof createLoginPage>;
  productResultsPage: ReturnType<typeof createProductResultsPage>;
  productResultsPageLoggedIn: ReturnType<typeof createProductResultsPage>;
  productDetailsPage: ReturnType<typeof createProductDetailsPage>;
  checkoutPage: ReturnType<typeof createCheckoutPage>;
  paymentPage: ReturnType<typeof createPaymentPage>;
  registerPage: ReturnType<typeof createRegisterPage>;
  contactPage: ReturnType<typeof createContactPage>;
  accountPage: ReturnType<typeof createAccountPage>;
  checkoutPageLoggedIn: ReturnType<typeof createCheckoutPage>;
  accountPageLoggedIn: ReturnType<typeof createAccountPage>;
  createAxeBuilder: () => AxeBuilder;
  screenshotOnFailure: void;
};

const log = createLogger('Fixtures');

export const test = base.extend<Fixtures>({
  /**
   * Auto-fixture: captures a full-page screenshot after every FAILED test and
   * attaches it via testInfo.attach() so allure-playwright always includes it
   * in the Allure report (Playwright's built-in screenshot mechanism writes
   * the file too late for allure-playwright to pick it up automatically).
   */
  screenshotOnFailure: [
    async ({ page }, use, testInfo) => {
      await use();
      if (testInfo.status !== testInfo.expectedStatus) {
        log.warn(`Test failed: ${testInfo.title} — capturing screenshot`);
        const screenshot = await page.screenshot({ fullPage: true }).catch(() => null);
        if (screenshot) {
          await testInfo.attach('screenshot on failure', {
            body: screenshot,
            contentType: 'image/png',
          });
        }
      }
    },
    { auto: true },
  ],

  navBar: async ({ page }, use) => {
    await use(createNavBar(page));
  },

  navBarLoggedIn: async ({ page }, use) => {
    log.debug('Setting up authenticated nav bar');
    const token = await getAuthToken();
    await page.addInitScript((t) => localStorage.setItem('auth-token', t), token);
    await use(createNavBar(page));
  },

  homePage: async ({ page }, use) => {
    await use(createHomePage(page));
  },

  billingAddressPage: async ({ page }, use) => {
    await use(createBillingAddressPage(page));
  },

  paymentPage: async ({ page }, use) => {
    await use(createPaymentPage(page));
  },

  loginPage: async ({ page }, use) => {
    await use(createLoginPage(page));
  },

  productResultsPage: async ({ page }, use) => {
    await use(createProductResultsPage(page));
  },

  productResultsPageLoggedIn: async ({ page }, use) => {
    const token = await getAuthToken();
    await page.addInitScript((t) => localStorage.setItem('auth-token', t), token);
    await use(createProductResultsPage(page));
  },

  productDetailsPage: async ({ page }, use) => {
    await use(createProductDetailsPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(createCheckoutPage(page));
  },

  checkoutPageLoggedIn: async ({}, use) => {
    log.debug('Setting up authenticated checkout page');
    const context = await getAuthSessionContext();
    const page = await context.newPage();
    await use(createCheckoutPage(page));
    await page.close();
    await context.close();
  },

  accountPageLoggedIn: async ({}, use) => {
    log.debug('Setting up authenticated account page');
    const context = await getAuthSessionContext();
    const page = await context.newPage();
    await use(createAccountPage(page));
    await page.close();
    await context.close();
  },

  registerPage: async ({ page }, use) => {
    await use(createRegisterPage(page));
  },

  contactPage: async ({ page }, use) => {
    await use(createContactPage(page));
  },

  accountPage: async ({ page }, use) => {
    await use(createAccountPage(page));
  },

  createAxeBuilder: async ({ page }, use) => {
    const createAxeBuilder = () =>
      new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('#commonly-reused-element-with-known-issue');
    await use(createAxeBuilder);
  },
});

export { expect };
