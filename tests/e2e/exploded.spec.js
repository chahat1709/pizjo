const { test, expect } = require('@playwright/test');

test.describe('Exploded view scrub controller', ()=>{
  test('stage changes on scroll progress', async ({ page })=>{
    await page.goto('http://localhost:3000/');
    // This is a functional skeleton; test will check that the page exposes a global controller
    const hasCtrl = await page.evaluate(()=>!!window.PizjoExplodedController);
    expect(hasCtrl).toBeTruthy();
    // More thorough tests require instrumenting the page to setProgress and observe events.
  });
});
