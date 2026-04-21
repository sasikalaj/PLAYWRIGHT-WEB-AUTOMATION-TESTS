import { test, expect } from '../../fixtures/basePage';
import { getAuthSessionContext } from '../../utils/authSession';
import { Tags } from '../../utils/tags';

test(
  'Authenticate using shared auth token in session storage',
  { tag: [Tags.regression, Tags.login] },
  async () => {
    const context = await getAuthSessionContext();
    const page = await context.newPage();

    await page.goto('/');

    await expect(page.getByRole('button', { name: process.env.USER_ID })).toBeVisible();
  }
);

test.describe('Login tests', { tag: [Tags.regression, Tags.login] }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigateTo();
  });
  test(
    'should login successfully when valid credentials are provided',
    { tag: [Tags.smoke] },
    async ({ loginPage, page }) => {
      await loginPage.loginWithCredentials({
        userName: process.env.USERNAME || '',
        password: process.env.PASSWORD || '',
      });
      console.log(
        'Login successful, verifying user menu...userName:',
        process.env.USERNAME,
        'userId:',
        process.env.USER_ID
      );
      await expect(loginPage.userMenu()).toContainText(process.env.USER_ID || 'Jane Doe ');
      await page.screenshot({ path: `LoggedInPage.png` });
    }
  );

  [
    {
      title: 'should return an error message when username is not provided',
      credentials: {
        userName: '',
        password: process.env.PASSWORD || '',
      },
      message: 'Email is required',
    },
    {
      title: 'should return an error message when password is not provided',
      credentials: {
        userName: process.env.USERNAME!,
        password: '',
      },
      message: 'Password is required',
    },
    {
      title: 'should show error for invalid credentials',
      credentials: {
        userName: 'invalid_user@example.com',
        password: 'wrongpassword123',
      },
      message: 'Invalid email or password',
    },
  ].forEach((testData) => {
    test(testData.title, async ({ loginPage }) => {
      await loginPage.loginWithCredentials(testData.credentials);
      await expect(loginPage.errorAlert()).toBeVisible();
      await expect(loginPage.errorAlert()).toContainText(testData.message);
    });
  });
});
