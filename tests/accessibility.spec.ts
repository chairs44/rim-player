import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('player has no automated WCAG A/AA violations across modes and themes',async({page})=>{
 await page.goto('/');await expect(page.locator('audio')).toHaveJSProperty('duration',24);
 for(const theme of ['light','dark']){
  await page.getByLabel('Appearance').selectOption(theme);
  for(const mode of ['toggle','compact','expanded']){
   await page.getByLabel('Behaviour').selectOption(mode);await page.waitForTimeout(700);
   const result=await new AxeBuilder({page}).include('.apc').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
   expect(result.violations,`${theme}/${mode}`).toEqual([]);
  }
 }
});
