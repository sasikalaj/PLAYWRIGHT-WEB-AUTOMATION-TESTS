import { Page } from '@playwright/test';
import { createLogger } from '../utils/logger';

export const createContactPage = (page: Page) => {
  const log = createLogger('ContactPage');
  const firstNameInput = () => page.locator('[data-test="first-name"]');
  const lastNameInput = () => page.locator('[data-test="last-name"]');
  const emailInput = () => page.locator('[data-test="email"]');
  const subjectSelect = () => page.locator('[data-test="subject"]');
  const messageTextarea = () => page.locator('[data-test="message"]');
  const submitButton = () => page.locator('[data-test="contact-submit"]');
  const successMessage = () => page.locator('.alert-success');
  const validationErrors = () => page.locator('.alert-danger, .help-block');
  const emailError = () => page.locator('[data-test="email-error"], .invalid-feedback');

  const navigateTo = async () => {
    log.step('Navigating to contact page');
    await page.goto('/contact');
  };

  const submitContactForm = async ({
    firstName,
    lastName,
    email,
    subject,
    message,
  }: {
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
    message: string;
  }) => {
    log.step('Submitting contact form');
    log.debug('Contact form details', { firstName, lastName, email, subject });
    await firstNameInput().fill(firstName);
    await lastNameInput().fill(lastName);
    await emailInput().fill(email);
    await subjectSelect().focus();
    await subjectSelect().selectOption(subject);
    await page.keyboard.press('Tab');
    await messageTextarea().fill(message);
    await submitButton().click();
  };

  const submit = async () => {
    await submitButton().click();
  };

  return {
    navigateTo,
    submitContactForm,
    submit,
    firstNameInput,
    lastNameInput,
    emailInput,
    subjectSelect,
    messageTextarea,
    submitButton,
    successMessage,
    validationErrors,
    emailError,
  };
};
