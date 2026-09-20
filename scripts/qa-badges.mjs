import assert from "node:assert/strict";

// Synthetic saved awards, rendered in the real Badges screen and AppShell.
// The caller blocks requests outside the local Vite origin.
export async function checkBadgeGallery(page, base) {
  let combinations = 0;
  for (const awards of ["empty", "earned", "honors"]) {
    for (const [width, height] of [[320,568], [667,375], [768,1024], [1440,900]]) {
      for (const textSize of ["size-2", "size-10"]) {
        await page.setViewportSize({width, height});
        await page.goto(`${base}/tests/fixtures/app-layout.html?view=badges&awards=${awards}&textSize=${textSize}`);
        await page.waitForSelector('body[data-geometry-ready="true"]', {state:"attached"});
        const label = `${awards} ${width}x${height} ${textSize}`;
        assert.equal(await page.getByRole("progressbar", {name:"Course badges earned"}).getAttribute("aria-valuenow"), awards === "earned" ? "2" : "0", label);
        assert.equal(await page.getByText("Finish your first lesson to earn your first badge.", {exact:true}).count(), awards === "empty" ? 1 : 0, `${label}: empty hint only for empty collection`);
        const layout = await page.locator(".badges-screen").evaluate(screen => {
          const content = screen.querySelector(".badges-content");
          return {
            firstSection: content.querySelector("section h2")?.textContent,
            contentHeight: content.getBoundingClientRect().height,
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            outside: [...screen.querySelectorAll("p,h1,h2")].filter(el => {
              const rect=el.getBoundingClientRect();
              return rect.left < -1 || rect.right > innerWidth+1 || el.scrollWidth > el.clientWidth+1;
            }).map(el => el.textContent),
          };
        });
        assert.equal(layout.overflow, false, `${label}: document width`);
        assert.deepEqual(layout.outside, [], `${label}: readable award names`);
        assert.ok(layout.contentHeight >= 80, `${label}: gallery remains usable`);
        if (awards !== "empty") {
          assert.equal(layout.firstSection, "Exam honors", `${label}: additional honors precede the catalog`);
          assert.equal(await page.getByText("Communication Master", {exact:true}).count(), 1, `${label}: saved honor appears once`);
        } else {
          assert.equal(await page.getByRole("heading", {name:"Exam honors",exact:true}).count(), 0);
        }
        combinations++;
      }
    }
  }
  console.log(`PASS: ${combinations} empty, earned and honors-only badge layouts; explicit course counter, visible honors and readable award names`);
}
