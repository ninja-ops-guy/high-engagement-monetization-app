import {test,expect} from './health';
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('cratefall_seen_welcome','1'));});
test('open crate, claim daily, simulate purchase and retain progress',async({page})=>{
 await page.goto('');await page.getByRole('button',{name:'Open · 1 ⚡',exact:true}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await expect(page.getByRole('button',{name:/⚡\s*19/})).toBeVisible();
 await page.getByRole('button',{name:'Claim',exact:true}).first().click();await expect(page.getByText('1-day streak').first()).toBeVisible();
 await page.getByRole('button',{name:/Store/,exact:false}).click();await page.getByRole('button',{name:'$0.99',exact:true}).click();
 await page.getByRole('button',{name:/Receipt/,exact:false}).click();await expect(page.locator('body')).toContainText('0.99');
 await page.reload();await expect(page.getByText('1-day streak').first()).toBeVisible();
 await page.getByRole('button',{name:/Receipt/}).click();await expect(page.locator('body')).toContainText('0.99');
});
test('collection, pass and mobile layout render without failures',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('');
 await page.getByRole('button',{name:/Collection/}).click();await expect(page.locator('body')).toContainText('Goblin Hoard');
 await page.getByRole('button',{name:/Pass/,exact:false}).first().click();await expect(page.locator('body')).toContainText('Pass');
 await page.screenshot({path:'test-results/mobile.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
