import { Page } from '@playwright/test';
import { createLogger } from '../utils/logger';

export interface BillingAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  houseNumber: string;
}

export const createBillingAddressPage = (page: Page) => {
  const log = createLogger('BillingAddress');

  const streetInput = () => page.locator('[data-test="street"]');
  const cityInput = () => page.locator('[data-test="city"]');
  const stateInput = () => page.locator('[data-test="state"]');
  const countryInput = () => page.locator('[data-test="country"]');
  const postalCodeInput = () => page.locator('[data-test="postal_code"]');
  const houseNumberInput = () => page.locator('[data-test="house_number"]');
  const step3ProceedButton = () => page.locator('[data-test="proceed-3"]');

  // Used only as a step-transition signal after clicking proceed
  const paymentMethodSelect = () => page.locator('[data-test="payment-method"]');

  const fillBillingAddress = async (address: BillingAddress) => {
    log.debug('Filling billing address', { city: address.city, country: address.country });
    await streetInput().fill(address.street);
    await cityInput().fill(address.city);
    await stateInput().fill(address.state);
    await countryInput().fill(address.country);
    await postalCodeInput().fill(address.postalCode);
    await houseNumberInput().fill(address.houseNumber);
  };

  const proceedFromBilling = async () => {
    await step3ProceedButton().click();
    await paymentMethodSelect().waitFor({ state: 'visible' });
  };

  return {
    streetInput,
    cityInput,
    stateInput,
    countryInput,
    postalCodeInput,
    houseNumberInput,
    step3ProceedButton,
    fillBillingAddress,
    proceedFromBilling,
  };
};
