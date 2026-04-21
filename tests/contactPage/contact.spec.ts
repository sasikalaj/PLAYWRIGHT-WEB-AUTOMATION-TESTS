import { test, expect } from '../../fixtures/basePage';
import { Tags } from '../../utils/tags';

test.describe('Contact Page', { tag: [Tags.regression, Tags.contact] }, () => {
  test.describe.configure({ mode: 'parallel' });

  test.beforeEach(async ({ contactPage }) => {
    await contactPage.navigateTo();
  });

  test('should submit the contact form successfully', async ({ contactPage }) => {
    await test.step('Fill and submit contact form', async () => {
      await contactPage.submitContactForm({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        subject: 'Customer service',
        message: 'This is a test message sent from an automated test.',
      });
    });

    await test.step('Verify success message is displayed', async () => {
      await expect(contactPage.successMessage()).toBeVisible();
    });
  });

  test('should show required field validation errors when form is submitted empty', async ({
    contactPage,
  }) => {
    await test.step('Submit form without filling any fields', async () => {
      await contactPage.submit();
    });

    await test.step('Verify validation errors appear', async () => {
      await expect(contactPage.validationErrors().first()).toBeVisible();
    });
  });

  test('should show error for invalid email format', async ({ contactPage }) => {
    await test.step('Fill form with invalid email and submit', async () => {
      await contactPage.submitContactForm({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'invalid-email',
        subject: 'Customer service',
        message: 'Test message',
      });
    });

    await test.step('Verify email validation error is displayed', async () => {
      await expect(contactPage.emailError()).toBeVisible();
    });
  });

  test(
    'should have no A11y violations on contact page',
    { tag: [Tags.a11y] },
    async ({ createAxeBuilder }, testInfo) => {
      const a11yScanResults = await test.step('Run accessibility scan', async () => {
        return createAxeBuilder().analyze();
      });

      await test.step('Attach results and check for critical violations', async () => {
        await testInfo.attach('a11y-contact', {
          body: JSON.stringify(a11yScanResults, null, 2),
          contentType: 'application/json',
        });
        const criticalViolations = a11yScanResults.violations.filter(
          (v) => v.impact === 'critical'
        );
        expect(criticalViolations).toHaveLength(0);
      });
    }
  );
});
