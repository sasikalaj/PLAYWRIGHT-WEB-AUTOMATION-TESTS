import { Page } from '@playwright/test';
import { createLogger } from '../utils/logger';

export const createLoginPage = (page: Page) => {
  const log = createLogger('LoginPage');
  const inputEmail = () => page.locator('[data-test="email"]');
  const inputPassword = () => page.locator('[data-test="password"]');
  const loginButton = () => page.locator('[data-test="login-submit"]');
  const errorAlert = () => page.locator('.alert-danger');
  const userMenu = () => page.locator('[data-test="nav-menu"]');

  const navigateTo = async () => {
    log.step('Navigating to login page');
    await page.goto('/auth/login');
  };

  const loginWithCredentials = async ({
    userName,
    password,
  }: {
    userName: string;
    password: string;
  }) => {
    log.step('Logging in');
    log.debug('Login credentials', { userName });
    await page.goto('/auth/login');
    await inputEmail().fill(userName);
    await inputPassword().fill(password);
    await loginButton().click();
  };

  return {
    navigateTo,
    loginWithCredentials,
    errorAlert,
    userMenu,
  };
};
