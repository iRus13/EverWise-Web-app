import assert from "node:assert/strict";

// Exercise the real App admin route. All reports/tokens/rotation responses are
// synthetic, and the caller must block requests outside its local Vite origin.
export async function checkPartnerDashboard(page, base) {
  const token = "Q".repeat(43);
  const report = {
    partnerId: "qa-partner", name: "QA Community Partner",
    branding: { name: "QA Community Partner", logoPath: null, accent: "#B0512F" },
    status: "active", invitation: { status: "active" },
    seats: { limit: 500, claimed: 6, available: 494 },
    research: {
      consentedCount: 5, consentedPercentage: 83.3, suppressed: false,
      distributions: Object.fromEntries([
        "accessibilityNeeds", "ageBand", "aiExperience", "bankSafetyCategory",
        "concerns", "confidence", "internetUse", "primaryDevice", "scamFrequency",
      ].map(key => [key, { "QA group": 5 }])),
    },
    updatedAt: "2026-09-20T00:00:00.000Z",
  };
  let state = "ready", rotations = 0, combinations = 0;
  const pattern = `${base}/api/partner/admin/**`;
  const route = async request => {
    const path = new URL(request.request().url()).pathname;
    if (path === "/api/partner/admin/report") {
      if (state === "invalid") return request.fulfill({ status: 401, json: { code: "INVALID_ADMIN" } });
      return request.fulfill({ json: state === "suppressed" ? {
        ...report, research: { consentedCount: 4, consentedPercentage: 66.7, suppressed: true, distributions: null },
      } : report });
    }
    if (path === "/api/partner/admin/rotate-invite") {
      rotations++;
      return request.fulfill({ json: { partnerId: report.partnerId, inviteToken: "R".repeat(43) } });
    }
    throw new Error(`Unexpected partner QA request: ${path}`);
  };
  await page.route(pattern, route);
  try {
    for (state of ["ready", "suppressed", "invalid"]) {
      for (const [width, height] of [[320,568], [667,375], [768,1024], [1440,900]]) {
        for (const textSize of ["size-2", "size-10"]) {
          await page.setViewportSize({ width, height });
          // A fresh document is required: App captures and scrubs the token once.
          await page.goto(`${base}/?qaPartner=${combinations}#partner-admin=${token}`);
          await page.getByRole("heading", { name: state === "invalid" ? "Everwise partner reporting" : "Partner overview", exact: true }).waitFor();
          await page.evaluate(async size => {
            document.documentElement.dataset.textSize = size;
            await document.fonts.ready;
          }, textSize);
          assert.equal(new URL(page.url()).hash, "", "Admin token must be removed from the address bar");
          const overflow = await page.locator("main").evaluate(main => ({
            width: main.clientWidth, scrollWidth: main.scrollWidth,
            outside: [...main.querySelectorAll("button,input,table")].filter(el => {
              const rect=el.getBoundingClientRect();
              return rect.left < -1 || rect.right > innerWidth+1;
            }).map(el => el.tagName),
          }));
          assert.ok(overflow.scrollWidth <= overflow.width+1, `${state} ${width} ${textSize}: horizontal overflow`);
          assert.deepEqual(overflow.outside, [], `${state} ${width} ${textSize}: clipped content`);
          if (state !== "invalid") {
            assert.equal(await page.getByRole("table").count(), state === "ready" ? 9 : 0);
            // Use actual wheel input. Locator scrolling can move overflow:hidden
            // ancestors and would conceal the original inaccessible dashboard.
            await page.mouse.move(width/2, height/2);
            // Use several wheel events, as a user would, and allow the
            // browser to settle asynchronous scrolling between them.
            // Never use scrollIntoView or mutate scrollTop to make this pass.
            let reached=false, scrollEvidence;
            for (let attempt=0; attempt<24 && !reached; attempt++) {
              await page.mouse.wheel(0, Math.max(1000, height*2));
              await page.waitForTimeout(150);
              scrollEvidence=await page.locator("main").evaluate(main => {
                const action=[...main.querySelectorAll("button")].find(el => el.textContent === "Replace learner link");
                const rect=action?.getBoundingClientRect();
                return { top:rect?.top, bottom:rect?.bottom, viewport:innerHeight,
                  scrollTop:main.scrollTop, height:main.clientHeight, scrollHeight:main.scrollHeight };
              });
              reached=scrollEvidence.top >= 0 && scrollEvidence.bottom <= height+1;
            }
            assert.ok(reached, `${state} ${width}x${height} ${textSize}: wheel scrolling must expose invitation actions: ${JSON.stringify(scrollEvidence)}`);
            const before = rotations;
            await page.getByRole("button", { name: "Replace learner link", exact: true }).click();
            assert.equal(rotations, before, "Opening confirmation must preserve the invitation");
            await page.getByRole("button", { name: "Cancel", exact: true }).click();
            assert.equal(rotations, before, "Cancel must preserve the invitation");
          } else {
            const headingTop=await page.getByRole("heading", {level:1}).evaluate(el => el.getBoundingClientRect().top);
            assert.ok(headingTop >= -1, `Invalid admin heading must not be clipped at ${width} ${textSize}: ${headingTop}`);
            assert.equal(await page.getByRole("button").count(), 0);
            assert.equal(await page.getByRole("table").count(), 0);
          }
          combinations++;
        }
      }
    }
  } finally {
    await page.unroute(pattern, route);
  }
  console.log(`PASS: ${combinations} real App partner dashboard layouts; phone scrolling and invitation cancellation`);
}
