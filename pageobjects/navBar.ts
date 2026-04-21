import { Page } from '@playwright/test';
import { createLogger } from '../utils/logger';

export const createNavBar = (page: Page) => {
  const log = createLogger('NavBar');

  // ── Top-level nav items ────────────────────────────────────────────────────
  const logoLink = () => page.getByRole('link', { name: /Practice Software Testing - Toolshop/ });
  const homeLink = () => page.getByRole('navigation').getByRole('link', { name: 'Home' });
  const categoriesButton = () => page.locator('[data-test="nav-categories"]');
  const contactLink = () => page.getByRole('navigation').getByRole('link', { name: 'Contact' });
  const signInLink = () => page.locator('[data-test="nav-sign-in"]');
  const userMenuButton = () => page.locator('[data-test="nav-menu"]');

  // ── Categories dropdown ────────────────────────────────────────────────────
  const categoriesDropdownList = () => page.getByRole('list', { name: 'nav-categories' });
  const categoryDropdownLink = (name: string) =>
    categoriesDropdownList().getByRole('link', { name });

  // ── User menu dropdown ─────────────────────────────────────────────────────
  const myAccountLink = () => page.getByRole('link', { name: 'My account' });
  const myFavoritesLink = () => page.getByRole('link', { name: 'My favorites' });
  const myProfileLink = () => page.getByRole('link', { name: 'My profile' });
  const myInvoicesLink = () => page.getByRole('link', { name: 'My invoices' });
  const myMessagesLink = () => page.getByRole('link', { name: 'My messages' });
  const signOutItem = () => page.locator('[data-test="nav-sign-out"]');

  // ── Actions ────────────────────────────────────────────────────────────────
  const openCategoriesDropdown = async () => {
    log.debug('Opening categories dropdown');
    await categoriesButton().click();
  };

  const openUserMenu = async () => {
    log.debug('Opening user menu');
    await userMenuButton().click();
  };

  const signOut = async () => {
    log.step('Signing out via nav');
    await userMenuButton().click();
    await signOutItem().click();
  };

  return {
    logoLink,
    homeLink,
    categoriesButton,
    contactLink,
    signInLink,
    userMenuButton,
    categoriesDropdownList,
    categoryDropdownLink,
    myAccountLink,
    myFavoritesLink,
    myProfileLink,
    myInvoicesLink,
    myMessagesLink,
    signOutItem,
    openCategoriesDropdown,
    openUserMenu,
    signOut,
  };
};
