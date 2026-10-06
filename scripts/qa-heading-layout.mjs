import assert from 'node:assert/strict';
import {examsByOrder} from '../src/data/lessons.js';

// A heading can fit its box while still breaking ordinary words mid-word.
// Measure each word's line boxes, rather than accepting horizontal fit alone.
export async function checkHeadingWrapping(page, base) {
  const routes = [
    ...['billing-error','billing-inactive','billing-checking','billing-timeout'].map(view => `/tests/fixtures/app-layout.html?view=${view}`),
    ...examsByOrder.map(exam => `/tests/fixtures/assessments.html?kind=exam&id=${encodeURIComponent(exam.id)}`),
  ];
  let cases=0;
  for (const [width,height] of [[320,568],[390,844],[768,1024],[1440,900]]) {
    await page.setViewportSize({width,height});
    for (const size of ['size-2','size-10']) for (const route of routes) {
      await page.goto(`${base}${route}&textSize=${size}`);
      await page.locator('h1').waitFor();
      const broken=await page.locator('h1').evaluate(async heading => {
        await document.fonts.ready;
        const words=[];
        const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT);
        let node;
        while ((node=walker.nextNode())) for (const match of node.textContent.matchAll(/\S+/g)) {
          const range=document.createRange();
          range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
          const lines=new Set([...range.getClientRects()].filter(r=>r.width>0).map(r=>Math.round(r.top)));
          if(lines.size>1)words.push(match[0]);
        }
        return words;
      });
      assert.deepEqual(broken,[],`Whole heading words at ${width} ${size}: ${route}`);
      cases++;
    }
  }
  console.log(`PASS: ${cases} billing and exam headings retain whole words at both text sizes`);
}
