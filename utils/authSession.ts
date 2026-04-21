import { chromium, BrowserContext, request, APIRequestContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from './logger';

const log = createLogger('AuthSession');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE_PATH = path.resolve(__dirname, '../storage/authState.json');
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.practicesoftwaretesting.com';

interface Credentials {
  username: string;
  password: string;
  userId: string;
}

const credentials: Credentials = {
  username: process.env.USERNAME || '',
  password: process.env.PASSWORD || '',
  userId: process.env.USER_ID || '',
};

const createNewAuthSessionWithApi = async (
  context: BrowserContext,
  apiRequest: APIRequestContext
) => {
  const response = await apiRequest.post(`${API_BASE_URL}/users/login`, {
    data: {
      email: credentials.username,
      password: credentials.password,
    },
  });

  const { access_token } = await response.json();

  await context.addInitScript((token) => {
    window.localStorage.setItem('auth-token', token);
  }, access_token);
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createNewAuthSessionWithUI = async (context: BrowserContext) => {
  // This is not used anywhere in the current codebase,
  // but can be helpful if you want to ensure the session is created through
  // the actual login flow, which may set additional cookies or
  // local storage items beyond just the auth token.

  const page = await context.newPage();

  await page.goto('/auth/login');
  await page.getByRole('textbox', { name: /Email address/ }).fill(credentials.username);
  await page.getByRole('textbox', { name: /Password/ }).fill(credentials.password);
  await page.getByRole('button', { name: 'Login' }).click();

  await Promise.all([
    page.waitForResponse((res) => res.url().includes('/users/me') && res.status() === 200),
    page.waitForURL('/account'),
  ]);

  await page.waitForLoadState();
  await page.close();
};

const is_valid_session = async (context: BrowserContext): Promise<boolean> => {
  const page = await context.newPage();
  try {
    await page.goto('/');
    const isValid = await page.evaluate(async (apiBaseUrl) => {
      const token = localStorage.getItem('auth-token');
      if (!token) return false;
      const res = await fetch(`${apiBaseUrl}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    }, API_BASE_URL);

    if (!isValid) {
      throw new Error('Auth token is missing, invalid, or expired');
    }

    await page.close();
    return true;
  } catch (error) {
    log.warn((error as Error).message);
    await page.close();
    return false;
  }
};

export const getAuthToken = async (): Promise<string> => {
  if (fs.existsSync(AUTH_FILE_PATH)) {
    const state = JSON.parse(fs.readFileSync(AUTH_FILE_PATH, 'utf-8'));
    const origin = state.origins?.find(
      (o: { origin: string }) => o.origin === 'https://practicesoftwaretesting.com'
    );
    const entry = origin?.localStorage?.find((e: { name: string }) => e.name === 'auth-token');
    if (entry?.value) {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${entry.value}` },
      });
      if (res.ok) return entry.value;
    }
  }

  const apiRequest = await request.newContext();
  const response = await apiRequest.post(`${API_BASE_URL}/users/login`, {
    data: { email: credentials.username, password: credentials.password },
  });
  const { access_token } = await response.json();
  return access_token;
};

export const getAuthSessionContext = async (): Promise<BrowserContext> => {
  const browser = await chromium.launch();

  const wrapContext = (context: BrowserContext): BrowserContext => {
    context.once('close', () => browser.close());
    return context;
  };

  if (fs.existsSync(AUTH_FILE_PATH)) {
    const context = await browser.newContext({ storageState: AUTH_FILE_PATH });
    if (await is_valid_session(context)) {
      log.info('Using existing auth session from ' + AUTH_FILE_PATH);
      return wrapContext(context);
    }
    await context.close();
  }

  const context = await browser.newContext();
  await createNewAuthSessionWithApi(context, await request.newContext());
  // Use UI-based login to ensure all session data is properly set, including cookies and local storage
  // await createNewAuthSessionWithUI(context);

  if (!(await is_valid_session(context))) {
    await context.close();
    await browser.close();
    const msg =
      'Failed to establish a valid auth session after login. Check credentials and login flow.';
    log.error(msg);
    throw new Error(msg);
  }

  await context.storageState({ path: AUTH_FILE_PATH });
  log.info('Created new auth session and saved to ' + AUTH_FILE_PATH);
  return wrapContext(context);
};
