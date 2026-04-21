import { Page } from '@playwright/test';
import { createLogger } from '../utils/logger';

export interface CreditCardDetails {
  number: string;
  expiry: string;
  cvv: string;
  holderName: string;
}

export interface BankTransferDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export const createPaymentPage = (page: Page) => {
  const log = createLogger('PaymentPage');
  // ── Payment (Step 4) ───────────────────────────────────────────────────────
  const paymentMethodSelect = () => page.locator('[data-test="payment-method"]');
  const creditCardNumberInput = () => page.locator('[data-test="credit_card_number"]');
  const expirationDateInput = () => page.locator('[data-test="expiration_date"]');
  const cvvInput = () => page.locator('[data-test="cvv"]');
  const cardHolderNameInput = () => page.locator('[data-test="card_holder_name"]');
  const bankNameInput = () => page.locator('[data-test="bank_name"]');
  const accountNameInput = () => page.locator('[data-test="account_name"]');
  const accountNumberInput = () => page.locator('[data-test="account_number"]');
  const confirmButton = () => page.locator('[data-test="finish"]');
  const paymentSuccessMessage = () => page.locator('[data-test="payment-success-message"]');

  const selectPaymentMethod = async (method: string) => {
    log.debug('Selecting payment method', { method });
    await paymentMethodSelect().selectOption(method);
  };

  const fillCreditCard = async (details: CreditCardDetails) => {
    await creditCardNumberInput().fill(details.number);
    await expirationDateInput().fill(details.expiry);
    await cvvInput().fill(details.cvv);
    await cardHolderNameInput().fill(details.holderName);
  };

  const fillBankTransfer = async (details: BankTransferDetails) => {
    await bankNameInput().fill(details.bankName);
    await accountNameInput().fill(details.accountName);
    await accountNumberInput().fill(details.accountNumber);
  };

  const confirmPayment = async () => {
    log.step('Confirming payment');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/payment/check') && r.request().method() === 'POST'
      ),
      confirmButton().click(),
    ]);
  };
  return {
    paymentMethodSelect,
    creditCardNumberInput,
    expirationDateInput,
    cvvInput,
    cardHolderNameInput,
    bankNameInput,
    selectPaymentMethod,
    fillCreditCard,
    fillBankTransfer,
    accountNameInput,
    accountNumberInput,
    confirmButton,
    paymentSuccessMessage,
    confirmPayment,
  };
};
