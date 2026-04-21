import { test, expect } from '../../fixtures/basePage';
import { buildRegistrationDetails } from '../../data/fakerUtils';
import { Tags } from '../../utils/tags';

test.describe('Registration', { tag: [Tags.regression, Tags.registration] }, () => {
  test.describe.configure({ mode: 'parallel' });

  test.beforeEach(async ({ registerPage }) => {
    await registerPage.navigateTo();
  });

  test('should register a new user with valid details', async ({ registerPage, page }) => {
    await test.step('Fill and submit registration form', async () => {
      await registerPage.registerWithDetails(buildRegistrationDetails());
    });

    await test.step('Verify redirect to login or account page', async () => {
      await expect(page).toHaveURL(/login|account/);
    });
  });

  test('should show required field errors when form is submitted empty', async ({
    registerPage,
  }) => {
    await test.step('Submit empty registration form', async () => {
      await registerPage.clickRegister();
    });

    await test.step('Verify required field errors appear', async () => {
      await expect(registerPage.fieldError('first-name')).toBeVisible();
      await expect(registerPage.fieldError('last-name')).toBeVisible();
      await expect(registerPage.fieldError('email')).toBeVisible();
      await expect(registerPage.fieldError('password')).toBeVisible();
    });
  });

  test('should show error for invalid email format', async ({ registerPage }) => {
    await test.step('Enter invalid email format and submit', async () => {
      await registerPage.fillEmail('notanemail');
      await registerPage.clickRegister();
    });

    await test.step('Verify email validation error is displayed', async () => {
      await expect(registerPage.fieldError('email')).toBeVisible();
    });
  });

  test('should show error for password that is too short', async ({ registerPage }) => {
    await test.step('Enter a too-short password and submit', async () => {
      await registerPage.fillPassword('123');
      await registerPage.clickRegister();
    });

    await test.step('Verify password validation error is displayed', async () => {
      await expect(registerPage.fieldError('password')).toBeVisible();
    });
  });

  test('should have no A11y violations on register page', async ({
    createAxeBuilder,
  }, testInfo) => {
    const a11yScanResults = await test.step('Run accessibility scan', async () => {
      // Exclude password visibility toggle — unlabelled button is a known application-side issue
      return createAxeBuilder().exclude('.btn-outline-secondary').analyze();
    });

    await test.step('Attach results and verify no critical violations', async () => {
      await testInfo.attach('a11y-register', {
        body: JSON.stringify(a11yScanResults, null, 2),
        contentType: 'application/json',
      });
      expect(a11yScanResults.violations.filter((v) => v.impact === 'critical')).toHaveLength(0);
    });
  });
});
