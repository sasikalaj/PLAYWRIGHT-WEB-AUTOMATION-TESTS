export const Tags = {
  smoke: '@smoke',
  e2e: '@e2e',
  regression: '@regression',
  a11y: '@a11y',
  accountDetails: '@accountDetails',
  checkout: '@checkout',
  contact: '@contact',
  homePage: '@homePage',
  login: '@login',
  navigation: '@navigation',
  productDetails: '@productDetails',
  productList: '@productList',
  registration: '@registration',
  search: '@search',
  cart: '@cart',
} as const;

export type Tag = (typeof Tags)[keyof typeof Tags];
