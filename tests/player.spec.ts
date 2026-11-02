import { test, expect } from '@playwright/test';
test('playback, independent expansion, scrubbing, rapid toggles and end/replay',async({page})=>{
 await page.goto('/'); await expect(page.locator('audio')).toHaveJSProperty('duration',24);
 await page.getByRole('button',{name:'Play',exact:true}).click();
 await expect(page.locator('audio')).toHaveJSProperty('paused',false);
 await page.getByRole('button',{name:'Collapse waveform'}).click();
 await expect(page.locator('.apc')).toHaveAttribute('data-expanded','false');
 await expect(page.locator('audio')).toHaveJSProperty('paused',false);
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 await page.getByRole('button',{name:'Expand waveform'}).click();
 const slider=page.getByRole('slider');await slider.focus();await slider.press('Home');await slider.press('ArrowRight');
 await expect.poll(()=>page.locator('audio').evaluate((e:HTMLAudioElement)=>e.currentTime)).toBeCloseTo(5,0);
 for(let i=0;i<8;i++)await page.locator('.apc-toggle').click({force:true});
 await expect(page.locator('.apc')).toHaveAttribute('data-expanded','true');
 await slider.press('End');await page.getByRole('button',{name:'Play',exact:true}).click();
 await expect.poll(()=>page.locator('audio').evaluate((e:HTMLAudioElement)=>e.currentTime)).toBeLessThan(2);
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 await page.screenshot({path:'test-results/desktop.png'});
});
test('mobile, touch seek, resize preference, dark and locked modes',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.goto('/');
 await expect(page.locator('.apc')).toHaveAttribute('data-expanded','false');
 await page.getByRole('button',{name:'Expand waveform'}).click();
 await expect.poll(()=>page.locator('.apc-rim').evaluate(e=>e.getBoundingClientRect().right)).toBeLessThanOrEqual(297);
 await page.getByLabel('Appearance').selectOption('dark');
 await page.getByRole('slider').fill('12');
 await expect.poll(()=>page.locator('audio').evaluate((e:HTMLAudioElement)=>e.currentTime)).toBeCloseTo(12,0);
 await page.screenshot({path:'test-results/mobile-dark.png'});
 await page.setViewportSize({width:1100,height:800});await expect(page.locator('.apc')).toHaveAttribute('data-expanded','true');
 await page.getByLabel('Behaviour').selectOption('compact');await expect(page.locator('.apc-toggle')).toHaveCount(0);await expect(page.locator('.apc')).toHaveAttribute('data-expanded','false');
 await page.getByLabel('Behaviour').selectOption('expanded');await expect(page.locator('.apc')).toHaveAttribute('data-expanded','true');
});
test('reduced motion, source replacement and unavailable media',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await page.getByRole('button',{name:'Collapse waveform'}).click();
 await expect(page.locator('.apc-rim')).toHaveCSS('opacity','0');
 await page.getByRole('button',{name:'Expand waveform'}).click();await expect(page.locator('.apc-rim')).toHaveCSS('width','410px');
 await page.getByLabel('Try an audio file').setInputFiles('public/demo.wav');
 await expect(page.locator('audio')).toHaveJSProperty('duration',24);
 await page.getByLabel('Try an audio file').setInputFiles({name:'invalid.wav',mimeType:'audio/wav',buffer:Buffer.from('invalid')});
 await expect(page.getByRole('alert')).toContainText('Audio unavailable');
});

test('pointer scrubbing, waveform fidelity and no layout growth',async({page})=>{
 await page.goto('/');
 await expect.poll(()=>page.locator('.apc-wave rect').evaluateAll(nodes=>Math.max(...nodes.map(n=>Number(n.getAttribute('height')))))).toBeGreaterThan(20);
 const slider=page.getByRole('slider');const box=(await slider.boundingBox())!;
 await page.mouse.move(box.x+box.width*.2,box.y+box.height/2);await page.mouse.down();
 await page.mouse.move(box.x+box.width*.7,box.y+box.height/2,{steps:8});await page.mouse.up();
 await expect.poll(()=>page.locator('audio').evaluate((e:HTMLAudioElement)=>e.currentTime)).toBeGreaterThan(15);
 const height=await page.locator('.apc-stage').evaluate(e=>e.getBoundingClientRect().height);
 await page.getByRole('button',{name:'Collapse waveform'}).click();
 await expect(page.locator('.apc-stage')).toHaveCSS('height',height+'px');
 await page.getByRole('button',{name:'Expand waveform'}).click();
 await expect(page.locator('.apc-rim')).toHaveCSS('width','410px');
 await page.screenshot({path:'test-results/desktop-final.png'});
});
