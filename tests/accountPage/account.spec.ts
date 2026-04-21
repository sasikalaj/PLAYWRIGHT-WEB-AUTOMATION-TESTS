import { test, expect } from '../../fixtures/basePage';
import { Tags } from '../../utils/tags';
import { buildRegistrationDetails } from '../../data/fakerUtils';

test.describe('Account Management', { tag: [Tags.accountDetails] }, () => {
  test('should display account page for authenticated user', async ({ accountPageLoggedIn }) => {
    await test.step('Navigate to account and go to profile page', async () => {
      await accountPageLoggedIn.navigateTo();
      await accountPageLoggedIn.gotoProfilePage();
    });

    await test.step('Verify profile form fields are visible', async () => {
      await expect(accountPageLoggedIn.firstNameInput()).toBeVisible();
      await expect(accountPageLoggedIn.emailInput()).toBeVisible();
    });
  });

  test('should update profile first name successfully', async ({
    accountPage,
    registerPage,
    loginPage,
    page,
  }) => {
    const registrationDetails = buildRegistrationDetails();

    await test.step('Register a new user', async () => {
      await registerPage.navigateTo();
      await registerPage.registerWithDetails(registrationDetails);
    });

    await test.step('Login with new user credentials', async () => {
      await loginPage.loginWithCredentials({
        userName: registrationDetails.email,
        password: registrationDetails.password,
      });
      await expect(loginPage.userMenu()).toContainText(registrationDetails.firstName);
    });

    await test.step('Navigate to profile page and record original name', async () => {
      await accountPage.navigateTo();
      await accountPage.gotoProfilePage();
      await page.waitForLoadState('networkidle');
    });

    await test.step('Update first name to UpdatedName', async () => {
      await accountPage.updateFirstName('UpdatedName');
      await expect(accountPage.successMessage()).toBeVisible();
    });

    await test.step('Verify updated name persists after re-navigation', async () => {
      await accountPage.navigateTo();
      await accountPage.gotoProfilePage();
      await expect(accountPage.firstNameInput()).toHaveValue('UpdatedName');
    });
  });

  test('should redirect unauthenticated user away from account page', async ({
    accountPage,
    page,
  }) => {
    await test.step('Navigate to account page without authentication', async () => {
      await accountPage.navigateTo();
    });

    await test.step('Verify redirect to login page', async () => {
      await expect(page).toHaveURL(/login|auth/);
    });
  });

  test('should log out successfully', async ({ accountPageLoggedIn }) => {
    await test.step('Navigate to account page and log out', async () => {
      await accountPageLoggedIn.navigateTo();
      await accountPageLoggedIn.logout();
    });

    await test.step('Verify sign-in link is visible after logout', async () => {
      await expect(accountPageLoggedIn.signInLink()).toBeVisible();
    });
  });
});
