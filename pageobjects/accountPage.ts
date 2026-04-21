import { Page } from '@playwright/test';
import { createLogger } from '../utils/logger';

export const createAccountPage = (page: Page) => {
  const log = createLogger('AccountPage');
  const firstNameInput = () => page.locator('[data-test="first-name"]');
  const emailInput = () => page.locator('[data-test="email"]');
  const profileForm = () => page.locator('[data-test="nav-profile"]');
  const saveButton = () => page.locator('[data-test="update-profile-submit"]');
  const successMessage = () => page.locator('.alert-success');
  const navUserMenu = () => page.locator('[data-test="nav-menu"]');
  const logoutMenuItem = () => page.locator('[data-test="nav-sign-out"]');
  const signInLink = () => page.locator('[data-test="nav-sign-in"]');

  const navigateTo = async () => {
    log.step('Navigating to account page');
    await page.goto('/account');
  };

  const logout = async () => {
    log.step('Logging out');
    await navUserMenu().click();
    await logoutMenuItem().click();
  };

  const getFirstName = async () => {
    return firstNameInput().inputValue();
  };

  const getEmail = async () => {
    return emailInput().inputValue();
  };

  const updateFirstName = async (value: string) => {
    log.debug('Updating first name', { value });
    await firstNameInput().fill(value);

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/users') && r.status() === 200 && r.request().method() !== 'GET'
      ),
      saveButton().click(),
    ]);
  };

  const gotoProfilePage = async () => {
    log.step('Navigating to profile page');
    await profileForm().click();
  };

  return {
    navigateTo,
    logout,
    getFirstName,
    gotoProfilePage,
    getEmail,
    updateFirstName,
    firstNameInput,
    emailInput,
    successMessage,
    signInLink,
  };
};
