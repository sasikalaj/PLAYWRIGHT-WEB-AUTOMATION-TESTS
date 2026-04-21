import { Page } from '@playwright/test';
import { createLogger } from '../utils/logger';

export const createRegisterPage = (page: Page) => {
  const log = createLogger('RegisterPage');
  const firstNameInput = () => page.getByRole('textbox', { name: 'First name' });
  const lastNameInput = () => page.getByRole('textbox', { name: 'Last name' });
  const dobInput = () => page.locator('[data-test="dob"]');
  const streetInput = () => page.getByRole('textbox', { name: 'Street' });
  const houseNumberInput = () => page.getByRole('textbox', { name: 'House number' });
  const cityInput = () => page.getByRole('textbox', { name: 'City' });
  const stateInput = () => page.getByRole('textbox', { name: 'State' });
  const countrySelect = () => page.getByRole('combobox', { name: 'Country' });
  const postcodeInput = () => page.getByRole('textbox', { name: 'Postal code' });
  const phoneInput = () => page.getByRole('textbox', { name: 'Phone' });
  const emailInput = () => page.getByRole('textbox', { name: 'Email address' });
  const passwordInput = () => page.locator('[data-test="password"]');
  const registerButton = () => page.getByRole('button', { name: 'Register' });
  const errorAlert = () => page.locator('[data-test="register-error"]');

  const navigateTo = async () => {
    log.step('Navigating to register page');
    await page.goto('/auth/register');
  };

  const registerWithDetails = async ({
    firstName,
    lastName,
    dob,
    address,
    houseNumber,
    city,
    state,
    country,
    postcode,
    phone,
    email,
    password,
  }: {
    firstName: string;
    lastName: string;
    dob: string;
    address: string;
    houseNumber: string;
    city: string;
    state: string;
    country: string;
    postcode: string;
    phone: string;
    email: string;
    password: string;
  }) => {
    log.step('Registering with details');
    log.debug('Registering user', { email });
    await firstNameInput().fill(firstName);
    await lastNameInput().fill(lastName);
    await dobInput().fill(dob);
    await streetInput().fill(address);
    await houseNumberInput().fill(houseNumber);
    await cityInput().fill(city);
    await stateInput().fill(state);
    await countrySelect().focus();
    await countrySelect().selectOption({ label: country });
    await page.keyboard.press('Tab');
    await postcodeInput().fill(postcode);
    await phoneInput().fill(phone);
    await emailInput().fill(email);
    await passwordInput().fill(password);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/users/register') && r.status() === 201),
      page.waitForURL('**/auth/login'),
      registerButton().click(),
    ]);
  };

  const clickRegister = async () => {
    await registerButton().click();
  };

  const fillEmail = async (value: string) => {
    await emailInput().fill(value);
  };

  const fillPassword = async (value: string) => {
    await passwordInput().fill(value);
  };

  const fieldError = (field: string) => page.locator(`[data-test="${field}-error"]`);

  return {
    navigateTo,
    registerWithDetails,
    clickRegister,
    fillEmail,
    fillPassword,
    errorAlert,
    fieldError,
  };
};
