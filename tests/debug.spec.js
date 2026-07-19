import { test, expect } from '@playwright/test';
import fs from 'fs';

test('capture console logs', async ({ page }) => {
    let logs = '';
    
    page.on('console', msg => logs += 'LOG: ' + msg.text() + '\n');
    page.on('pageerror', err => logs += 'ERR: ' + err.message + '\n');
    
    await page.goto('http://localhost:8000/');
    await page.waitForTimeout(4000);
    
    fs.writeFileSync('C:\\Users\\chaha\\.gemini\\antigravity-ide\\brain\\c8b5cf9a-f3a0-44d2-898a-7ff2f29b5468\\scratch\\browser_logs.txt', logs);
});
