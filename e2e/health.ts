import {test as base,expect} from '@playwright/test';
export const test=base.extend<{cleanConsole:void}>({cleanConsole:[async({page,baseURL},use)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(new URL(baseURL!).origin))errors.push(r.status()+' '+r.url())});
 await use();expect(errors,'No JavaScript errors or broken app resources').toEqual([]);
},{auto:true}]});
export {expect};
