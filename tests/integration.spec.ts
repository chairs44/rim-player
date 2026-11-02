import { test, expect } from '@playwright/test';
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';

test('multiple embedded players keep unique SVG and control IDs and independent audio', async ({page}) => {
 await page.goto('/tests/fixture.html');
 const first=page.getByRole('group',{name:'First',exact:true}), second=page.getByRole('group',{name:'Second',exact:true});
 await expect(first.locator('audio')).toHaveJSProperty('duration',24);
 const ids=await page.locator('.apc [id]').evaluateAll(nodes=>nodes.map(n=>n.id));expect(new Set(ids).size).toBe(ids.length);
 await first.getByRole('button',{name:'Play',exact:true}).click();
 await expect(first.locator('audio')).toHaveJSProperty('paused',false);await expect(second.locator('audio')).toHaveJSProperty('paused',true);
 await first.getByRole('button',{name:'Collapse waveform'}).click();await expect(second).toHaveAttribute('data-expanded','true');
 await expect(first.getByRole('slider')).toHaveCount(0);
});

test('server markup hydrates without mismatches on desktop and adopts viewport preference',async({page})=>{
 const server=await createServer({server:{middlewareMode:true},appType:'custom'});
 let markup='';
 try {const {AudioPlayer}=await server.ssrLoadModule('/src/AudioPlayer.tsx');markup=renderToString([React.createElement(AudioPlayer,{src:'/demo.wav',label:'SSR',key:0})]);}finally{await server.close();}
 const errors:string[]=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('pageerror',e=>errors.push(e.message));
 // Seed the exact server-rendered DOM before the fixture calls hydrateRoot.
 // Avoid a mocked navigation, which Chrome treats as public address space.
 await page.addInitScript(markup=>{
   Object.assign(window,{fixtureProps:[{src:'/demo.wav',label:'SSR'}],fixtureMarkup:markup});
 },markup);
 await page.goto('/tests/fixture.html');await expect(page.locator('audio')).toHaveJSProperty('duration',24);
 await expect(page.locator('.apc')).toHaveAttribute('data-expanded','true');expect(errors).toEqual([]);
});

test('touch input activates controls and seeks with a tap on a narrow viewport',async({browser,browserName})=>{
 test.skip(browserName==='firefox','Playwright Firefox does not support touch emulation');
 const context=await browser.newContext({viewport:{width:320,height:740},hasTouch:true});const page=await context.newPage();
 await page.goto('http://127.0.0.1:5178');await expect(page.locator('audio')).toHaveJSProperty('duration',24);
 await page.getByRole('button',{name:'Expand waveform'}).tap();await page.waitForTimeout(800);
 await page.getByRole('button',{name:'Play',exact:true}).tap();await expect(page.locator('audio')).toHaveJSProperty('paused',false);
 await page.getByRole('button',{name:'Pause',exact:true}).tap();const box=(await page.getByRole('slider').boundingBox())!;
 await page.touchscreen.tap(box.x+box.width*.7,box.y+box.height/2);await expect.poll(()=>page.locator('audio').evaluate((e:HTMLAudioElement)=>e.currentTime)).toBeGreaterThan(12);
 await context.close();
});

test('minimum-width embeds do not create horizontal overflow',async({page})=>{
 await page.setViewportSize({width:144,height:400});await page.goto('/tests/fixture.html');await page.addStyleTag({content:'body{margin:0}'});
 await expect(page.locator('.apc')).toHaveCount(2);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(144);
 await page.getByRole('group',{name:'First',exact:true}).getByRole('button',{name:'Expand waveform'}).click();await page.waitForTimeout(900);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(144);
});

test('waveform decoding failure leaves playback and keyboard seeking available',async({page})=>{
 await page.route('**/demo.wav',route=>route.request().resourceType()==='fetch'?route.abort():route.continue());
 await page.goto('/');await expect(page.getByText('Waveform unavailable.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Play',exact:true}).click();await expect(page.locator('audio')).toHaveJSProperty('paused',false);
 await page.getByRole('slider').press('Home');await page.getByRole('slider').press('ArrowRight');await expect.poll(()=>page.locator('audio').evaluate((e:HTMLAudioElement)=>e.currentTime)).toBeGreaterThanOrEqual(5);
});


test('responsive collapse moves keyboard focus out of the hidden waveform',async({page})=>{
 await page.goto('/');await expect(page.getByRole('slider')).toBeEnabled();await page.getByRole('slider').focus();await expect(page.getByRole('slider')).toBeFocused();
 await page.setViewportSize({width:320,height:740});
 await expect(page.getByRole('button',{name:'Expand waveform'})).toBeFocused();
 expect(await page.evaluate(()=>!!document.activeElement?.closest('[aria-hidden=true]'))).toBe(false);
 await page.keyboard.press('Enter');await expect(page.getByRole('slider')).toBeVisible();
});
