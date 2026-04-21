# Playwright E2E Test Suite — Practice Software Testing (Toolshop)

End-to-end test suite for [practicesoftwaretesting.com](https://practicesoftwaretesting.com), built with Playwright and TypeScript. Covers authentication, product browsing, cart, checkout, account management, and accessibility.

---

## Tech Stack

| Layer         | Tool                                                              |
| ------------- | ----------------------------------------------------------------- |
| Test runner   | [Playwright Test](https://playwright.dev) `^1.57`                 |
| Language      | TypeScript (ESM, `"type": "module"`)                              |
| Fake data     | [@faker-js/faker](https://fakerjs.dev)                            |
| Accessibility | [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm) |
| Reporting     | [Allure](https://allurereport.org) + Playwright HTML              |
| Linting       | ESLint + eslint-plugin-playwright                                 |
| Formatting    | Prettier                                                          |
| Git hooks     | Husky + lint-staged                                               |
| Metrics       | Grafana (via `scripts/push-test-metrics.ts`)                      |
| CI            | GitHub Actions (self-hosted runner)                               |

---

## Project Structure

```
├── fixtures/
│   └── basePage.ts               # Custom test fixtures extending Playwright base
├── pageobjects/
│   ├── homePage.ts
│   ├── loginPage.ts
│   ├── registerPage.ts
│   ├── accountPage.ts
│   ├── productResultsPage.ts
│   ├── productDetailsPage.ts
│   ├── checkoutPage.ts
│   ├── billingAddressPage.ts
│   ├── paymentPage.ts
│   ├── contactPage.ts
│   └── navBar.ts
├── tests/
│   ├── homePage/
│   ├── loginPage/
│   ├── registerPage/
│   ├── productResultsPage/
│   ├── productDetailsPage/
│   ├── checkoutPage/
│   ├── contactPage/
│   └── accountPage/
├── data/fakerUtils.ts            # Faker-based test data builders
├── utils/
│   ├── authSession.ts            # Shared auth context / token management
│   ├── logger.ts                 # Structured levelled logger
│   └── tags.ts                   # Tag constants for suite filtering
├── storage/authState.json        # Cached browser storage state (auth)
├── scripts/push-test-metrics.ts  # Pushes pass/fail metrics to Grafana
├── .github/workflows/
│   ├── playwright.yml            # Main CI pipeline
│   └── _publish-reports.yml     # Reusable report-publish workflow
├── playwright.config.ts
└── .env                          # Local credentials (not committed)
```

---

## Design Pattern — Page Object Model (Factory Functions)

Page objects use a **factory function pattern** — each file in `pageobjects/` exports a `create<PageName>(page: Page)` function returning a plain object of locators and async actions.

- Locators are arrow functions `() => page.locator(...)` — always re-evaluated, never stale
- Actions are `async` functions; assertions live in test files only
- No `this` binding issues; easier to compose than class inheritance

All tests import `test` and `expect` from `fixtures/basePage.ts`, not directly from `@playwright/test`.

---

## Selector Strategy

Priority order:

1. **ARIA roles** — `page.getByRole('button', { name: 'Login' })`
2. **`data-test` attributes** — `page.locator('[data-test="email"]')`
3. **Labels** — `page.getByLabel('Email')`
4. **Text content** — `page.getByText('Add to cart')`
5. **CSS selectors** — last resort only

---

## Custom Fixtures

| Fixture                                                                                                                     | Auth                                       |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `homePage, loginPage, registerPage, productResultsPage, checkoutPage, productDetailsPage, contactPage, accountPage, navBar` | No auth                                    |
| `checkoutPageLoggedIn, productResultsPageLoggedIn`                                                                          | Full auth session                          |
| `accountPageLoggedIn`                                                                                                       | Auth token injected                        |
| `createAxeBuilder`                                                                                                          | Pre-configured axe-core for WCAG 2.x scans |

An auto-fixture `screenshotOnFailure` captures full-page screenshots on failure and attaches them to both HTML and Allure reports.

---

## Authentication

Two strategies in `utils/authSession.ts`, chosen based on what the test needs:

**`getAuthToken()`** — reads the cached JWT from `storage/authState.json` and validates it against `GET /users/me`. If expired or missing, fetches a fresh token via `POST /users/login`. Injected via `page.addInitScript` — suitable for most authenticated tests.

**`getAuthSessionContext()`** — launches a browser context pre-loaded with `storageState`. Does not re-inject tokens on navigation, making it the correct choice for logout flows and full post-auth journeys (e.g. `accountPageLoggedIn`, `checkoutPageLoggedIn`).

---

## Test Tagging

Tags are centralised in `utils/tags.ts`:

`@smoke, @regression, @e2e, @a11y, @login, @registration, @homePage, @search, @productDetails, @productList, @checkout, @cart, @contact, @accountDetails, @navigation`

---

## Test Suites

| Suite           | File                                              | What it covers                                              |
| --------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| Login           | `tests/loginPage/login.spec.ts`                   | Valid login, invalid credentials, empty field validation    |
| Registration    | `tests/registerPage/register.spec.ts`             | New user, duplicate email, field validation                 |
| Home / Search   | `tests/homePage/homepage-search-name.spec.ts`     | Search by name, category filter, accessibility scan         |
| Product List    | `tests/productResultsPage/productList.spec.ts`    | Listing, filtering, sorting, pagination                     |
| Product Details | `tests/productDetailsPage/productDetails.spec.ts` | Product display, add to cart, out-of-stock handling         |
| Cart / Checkout | `tests/checkoutPage/cart-management.spec.ts`      | Add/remove items, quantity updates, checkout flow           |
| Account         | `tests/accountPage/account.spec.ts`               | View profile, update name, logout, unauthenticated redirect |
| Contact         | `tests/contactPage/contact.spec.ts`               | Contact form submission and validation                      |

---

## API Response Mocking

Two complementary patterns in the product list suite:

- **Live interception** — `page.waitForResponse` captures the real API response and asserts the UI matches it exactly (contract check, no hardcoded expectations).
- **Mock fixture** — `page.route` returns `productsResponse.json` for deterministic testing without a live backend. The file mirrors the real API shape, making it easy to inject edge-case data.

---

## Logging

Controlled by `LOG_LEVEL` env var (default: `info`):

| `LOG_LEVEL` | Output                   |
| ----------- | ------------------------ |
| `debug`     | Everything               |
| `info`      | info, warn, error        |
| `warn`      | warn, error              |
| `error`     | Errors only (CI default) |

---

## Reporting

| Reporter            | Output                      | Used in    |
| ------------------- | --------------------------- | ---------- |
| `list`              | Console                     | Local + CI |
| `html`              | `playwright-report/`        | Local + CI |
| `allure-playwright` | `allure-results/`           | Local + CI |
| `junit`             | `test-results/junit.xml`    | CI only    |
| `json`              | `test-results/results.json` | CI only    |

```bash
npm run report          # generate + open Allure report
npx playwright show-report  # open Playwright HTML report
```

CI artifacts are retained 14 days via the `_publish-reports.yml` workflow.

---

## Environment Setup

Copy `.env.example` to `.env`:

```env
BASE_URL=https://practicesoftwaretesting.com
USERNAME=customer@practicesoftwaretesting.com
PASSWORD=<password>
USER_ID=<display-name>
API_BASE_URL=https://api.practicesoftwaretesting.com
```

---

## Running Tests

```bash
npm ci && npx playwright install --with-deps

npx playwright test                                        # all tests
npm run smoke / regression / a11y                         # by tag
npx playwright test tests/loginPage/login.spec.ts         # single file
npx playwright test --grep "@login"                       # by tag
npx playwright test --headed / --ui / --debug             # browser modes
npx playwright test --update-snapshots                    # refresh baselines
npm run clean                                             # remove artefacts
```

---

## CI Integration — GitHub Actions

| Event               | Job          | Tag filter    | Workers |
| ------------------- | ------------ | ------------- | ------- |
| PR / push to `main` | `regression` | `@regression` | 5       |
| Push to `main`      | `smoke`      | `@smoke`      | 2       |
| `workflow_dispatch` | `manual`     | User-selected | 1–4     |

Manual dispatch inputs (from the **Actions** tab):

- **tags** — any registered tag (`@smoke`, `@login`, `@checkout`, etc.)
- **browser** — `chromium`, `firefox`, or `webkit`
- **workers** — 1–4 parallel workers
- **environment** — `qa` or `prod`
- **update_snapshots** — rebuild visual regression baselines

Each workflow group cancels in-progress runs when a new commit is pushed, preventing queue build-up on active PRs. After every job, `scripts/push-test-metrics.ts` pushes pass/fail/duration to Grafana via the Prometheus remote-write endpoint.

### Required secrets and variables

| Name                               | Type     | Purpose                    |
| ---------------------------------- | -------- | -------------------------- |
| `USERNAME`                         | Secret   | Test account email         |
| `PASSWORD`                         | Secret   | Test account password      |
| `USER_ID`                          | Secret   | Display name for assertion |
| `GRAFANA_PROM_URL` / `GRAFANA_LOKI_URL`                 | Secret   | Metrics and log push endpoints      |
| `GRAFANA_USER` / `GRAFANA_LOKI_USER` / `GRAFANA_API_KEY`| Secret   | Grafana auth               |
| `BASE_URL`                         | Variable | Target app URL             |
| `API_BASE_URL`                     | Variable | REST API base URL          |

---

## Code Quality

Pre-commit hooks (Husky + lint-staged) run ESLint and Prettier on every commit, preventing style issues from reaching CI.

```bash
npm run lint          # lint all .ts files
npm run lint:fix      # auto-fix lint issues
npm run format        # format with Prettier
npm run format:check  # check formatting without writing
```

ESLint is configured with `eslint-plugin-playwright` to enforce Playwright-specific rules (no hardcoded waits, no focused tests in CI, etc.).

Prettier configuration is shared across the repo and applied to all `.ts` and config files.
