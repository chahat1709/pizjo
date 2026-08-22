const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { _electron: electron } = require('playwright');

async function run() {
  const root = path.join(__dirname, '..');
  const executablePath = path.join(root, 'release', 'win-unpacked', 'Pizjo Admin.exe');
  if (!fs.existsSync(executablePath)) throw new Error('Run npm run dist before the desktop UI test.');
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'pizjo-desktop-ui-'));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    const externalRequests = [];
    page.on('request', request => { if (/^https?:/i.test(request.url())) externalRequests.push(request.url()); });
    await page.waitForSelector('form#auth-form');
    await page.locator('[name="displayName"]').fill('Pizjo Owner');
    await page.locator('[name="username"]').fill('owner');
    await page.locator('[name="password"]').fill('safe-local-password');
    await page.locator('form#auth-form button[type="submit"]').click();
    await page.getByRole('heading', { name: 'Dashboard' }).waitFor();

    await page.getByRole('button', { name: 'Inventory', exact: true }).click();
    const stockForm = page.locator('form[data-form="stock"]');
    const itemId = await stockForm.locator('select[name="id"]').inputValue();
    await stockForm.locator('[name="change"]').fill('5');
    await stockForm.locator('[name="threshold"]').fill('1');
    await stockForm.getByRole('button', { name: 'Save local stock' }).click();

    await page.getByRole('button', { name: 'Orders', exact: true }).click();
    const orderForm = page.locator('form[data-form="order"]');
    await orderForm.locator('[name="items"]').selectOption([itemId]);
    await orderForm.locator('[name="qty"]').fill('1');
    await orderForm.getByRole('button', { name: 'Create order' }).click();
    const orderStatus = page.locator('[data-order-status]').first();
    await orderStatus.waitFor();
    await orderStatus.selectOption('delivered');

    await page.getByRole('button', { name: 'Billing', exact: true }).click();
    const billingForm = page.locator('form[data-form="invoice"]');
    await billingForm.getByRole('button', { name: 'Create invoice' }).click();
    await page.getByText('PZ-00001').waitFor();

    await page.getByRole('button', { name: 'Offers', exact: true }).click();
    const offerForm = page.locator('form[data-form="offer"]');
    await offerForm.locator('[name="title"]').fill('Counter deal');
    await offerForm.locator('[name="value"]').fill('10');
    await offerForm.getByRole('button', { name: 'Save local offer' }).click();
    await page.getByText('Counter deal').waitFor();

    await page.getByRole('button', { name: 'Team', exact: true }).click();
    const staffForm = page.locator('form[data-form="staff"]');
    await staffForm.locator('[name="displayName"]').fill('Counter Staff');
    await staffForm.locator('[name="username"]').fill('counter');
    await staffForm.locator('[name="password"]').fill('safe-local-password');
    await staffForm.getByRole('button', { name: 'Create local account' }).click();
    await page.getByText('Counter Staff').waitFor();

    await page.getByRole('button', { name: 'Social', exact: true }).click();
    const socialForm = page.locator('form[data-form="social"]');
    await socialForm.locator('[name="platform"]').fill('Instagram');
    await socialForm.locator('[name="handle"]').fill('@pizjo');
    await socialForm.getByRole('button', { name: 'Save local account' }).click();
    await page.getByText('@pizjo').waitFor();

    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.locator('[name="username"]').fill('counter');
    await page.locator('[name="password"]').fill('safe-local-password');
    await page.locator('form#auth-form button[type="submit"]').click();
    await page.waitForTimeout(400);
    const signInError = page.locator('.notice.error');
    if (await signInError.count()) throw new Error(`Staff sign-in failed: ${await signInError.innerText()}`);
    await page.waitForTimeout(800);
    const dashboard = page.getByRole('heading', { name: 'Dashboard' });
    if (await dashboard.count() !== 1) throw new Error(`Staff sign-in did not reach Dashboard. Current screen: ${(await page.locator('#root').innerText()).slice(0, 800)}`);
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    assert.equal(await page.locator('form[data-form="menu"]').count(), 0, 'Staff must not receive menu-admin controls.');
    await page.getByRole('button', { name: 'Inventory', exact: true }).click();
    assert.equal(await page.locator('[data-availability]').count(), 0, 'Staff must not receive availability controls.');
    await page.getByRole('button', { name: 'Offers', exact: true }).click();
    assert.equal(await page.locator('form[data-form="offer"]').count(), 0, 'Staff must not receive offer-management controls.');
    assert.equal(await page.locator('[data-offer]').count(), 0, 'Staff must not receive offer activation controls.');
    await page.getByRole('button', { name: 'Team', exact: true }).click();
    assert.equal(await page.locator('form[data-form="staff"]').count(), 0, 'Staff must not receive team-account controls.');
    assert.equal(await page.locator('[data-staff]').count(), 0, 'Staff must not receive staff activation controls.');
    await page.getByRole('button', { name: 'Social', exact: true }).click();
    assert.equal(await page.locator('form[data-form="social"]').count(), 0, 'Staff must not receive social-account controls.');
    const postForm = page.locator('form[data-form="post"]');
    await postForm.locator('[name="caption"]').fill('Fresh local social planning record');
    await postForm.getByRole('button', { name: 'Save idea' }).click();
    await page.getByText('Fresh local social planning record').waitFor();

    assert.deepEqual(externalRequests, [], 'The desktop workflow must not issue external network requests.');
    console.log('Desktop end-to-end workflow passed.');
  } finally {
    await app.close();
    fs.rmSync(userData, { recursive: true, force: true });
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
