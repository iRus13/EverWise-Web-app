# EverWise paywall research and design brief

Reviewed September 11, 2026. Scope: web paywall, responsive layout, decision clarity, accessibility, and subscription recovery. This is desk research plus code and local browser testing, not a customer study or evidence of higher conversion. Native purchase behavior and production purchases were not tested.

## Recommendation

Keep EverWise warm, legible, and straightforward. A learner should be able to answer five questions before checkout: What do I get? What can I use for free? What do I pay? When does payment start? How do I cancel?

Retain two plans and the existing monthly default. Present the actual annual charge prominently, rather than replacing it with a monthly equivalent. Keep one primary trial action, a plainly labeled free path, and Terms and Privacy. Use vertical scrolling when necessary instead of compressing financial text. Preserve keyboard selection and a visible focus indicator. These are design judgments for EverWise; they are not claims that one universal layout maximizes revenue.

## Evidence and how it applies

| Evidence | Application to EverWise | Limitation |
| --- | --- | --- |
| [Baymard: subscription service usability](https://baymard.com/blog/new-research-consumables-subscription-services) identifies unclear pricing and difficult preference quizzes as recurring obstacles. | Show price and billing cadence clearly; make onboarding progress, exit, and answer recovery understandable. | Research concerns physical consumable subscriptions. Applying these principles to digital learning is an inference. |
| [NN/g: senior usability](https://www.nngroup.com/articles/usability-seniors-improvements/) describes difficulties with small targets and error recovery. | Keep comfortable text and buttons; use explicit labels and preserve answers through navigation. | Published in 2013; useful behavioral context, not a current numerical benchmark for this audience. |
| [NN/g: testing with older adults](https://www.nngroup.com/articles/usability-testing-older-adults/) addresses research with older participants. | Validate with actual learners with varied device experience, vision, and dexterity. | Our automated checks do not substitute for this research. |
| [WCAG reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) describes preserving information and function at a 320 CSS-pixel width. | Stack the paywall into one column; let it scroll vertically. Inspect controls as well as document overflow. | Passing a viewport test is not complete WCAG conformance. |
| [WCAG resize text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) covers enlargement to 200% without lost information or functionality. | Use relative text sizes; do not shrink billing terms because the viewport is short. | Responsive width checks alone do not verify all browser and text-only zoom behavior. |
| [WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) specifies a 24×24 CSS-pixel minimum with exceptions. | EverWise uses a more comfortable 44-pixel minimum height for paywall buttons. | 44 pixels is our design target, not the wording of this AA requirement. |
| [WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) specifies text contrast thresholds. | Check normal text at 4.5:1 and large text at 3:1, including financial disclosures and errors. | Visual appearance alone does not establish compliance. |
| [RevenueCat: paywall review guidance](https://www.revenuecat.com/docs/tools/paywalls/creating-paywalls/app-review) emphasizes clear offer details and accessible policy links. | Keep full renewal price, trial duration, and policy actions visible. | App review guidance is not a legal opinion about EverWise's web checkout. |
| [RevenueCat: paywall experiments](https://www.revenuecat.com/blog/growth/paywall-tests-grow-app-revenue) presents tests of messaging and visual emphasis. | Give the primary action a clear visual hierarchy; test one substantial hypothesis at a time. | Vendor examples do not prove the same lift for EverWise. |
| [RevenueCat: web versus in-app experiment](https://www.revenuecat.com/blog/growth/iap-vs-web-purchases-conversion-test) illustrates tradeoffs between trial starts, payment conversion, and revenue. | Evaluate paid retention and refunds as well as clicks and trial starts. | Its results are product- and experiment-specific; do not transplant its conversion rates. |

## Problems found in the current implementation

1. Short-screen CSS reduces the financial reassurance to 12px and plan details to 13px. Shrinking terms to fit a single screen is a poor tradeoff for this audience.
2. Only an X exposes the free exit on the available-offer screen. Its accessible label is good, but a visible text alternative is easier to understand.
3. The primary action announces trial length but its description does not include the selected renewal price or cancellation route. People must connect details from different areas.
4. The web benefits promote a suspicious-message checker even though earlier deployment checks reported its provider unconfigured. Lead with the learning content that the subscription unlocks; do not sell an unverified service as an available benefit.
5. Desktop content stretches widely and the hierarchy is weak. A bounded two-column content area and a visible plan heading make the decision easier to scan.
6. At narrow widths, the selection icon consumes price width, causing awkward price wrapping. Move the indicator to the top-right of each card and keep the price across the usable card width.

## Implemented design

- Preserve the existing verified web offers: monthly $7.99/month with 3 trial days; annual $60/year with 7 trial days. No price, trial eligibility, or billing backend change.
- Keep the current fail-closed verification of server offers. Missing, mismatched, or malformed plans still expose unavailable/retry/free states, not guessed checkout prices.
- Use a learning-focused benefit instead of promising the checker on the web paywall.
- Add “Choose your plan” and a selected-plan summary showing the free period, automatic renewal charge, and Settings → Manage subscription cancellation route. The route exists in the Settings source; live portal operation remains unverified.
- Associate this summary and the payment-method disclosure with the checkout button for assistive technology. Announce summary changes when a different plan is selected.
- Add a visible free-lessons exit. Disable it with the other purchase controls during pending checkout to preserve the existing transaction behavior.
- Keep body and financial text at root-relative readable sizes even in short viewports. Reflow and scroll rather than squeezing everything above the fold.
- Apply the new layout to the web paywall only; the native subscription pricing and store flow are separate work.

## Important decisions before a broader redesign

**Paywall timing:** Try a useful sample lesson before asking for eight interview steps or a subscription. Compare the experience after a completed free lesson with the current placement. This is a product hypothesis; do not move the gate until the complete free/premium access rules and account flow have been reviewed.

**Plan comparison:** A small Free / Subscription comparison could help, but every row must match enforced access. Do not invent unlimited checker access, support commitments, certificates, family seats, refund promises, or a reminder email. The present change intentionally avoids unverified benefits.

**Trials:** Keep exact durations synchronized with server offers and Stripe. A trial headline is appropriate only for an eligible customer. Returning subscribers, used trials, and expired access require end-to-end checks before release. Do not add a countdown, scarcity badge, or “most popular” label without real supporting data.

**Policies:** The current Terms and Privacy actions target dexio-games.com. The research fetch could not retrieve them; this is not proof they are broken. Verify the actual pages, business identity, and web subscription wording before enabling production billing. Do not silently substitute invented policies.

**Recovery:** Check cancelled checkout, declined payment, expired session, lost connection, duplicate clicks, an already-active subscription, return-to-app, refund, renewal, cancellation, and resuming after cancellation. Local UI and backend tests are useful but cannot prove hosted Stripe behavior. Production billing was previously reported unavailable; a polished paywall does not fix that configuration.

## Testing and measurement plan

Use phone portrait 320×568, 375×667, 390×844; landscape 667×375; tablet 768×1024 and 1024×768; desktop 1440×900 and 1920×1080. Check price wrapping, full disclosure reachability, footer links, focus indicators, free exit, selected-plan changes, pending state, error recovery, and unavailable offers. Include actual Safari and Firefox, physical phones, browser zoom, and screen-reader testing in the next authenticated staging pass.

For learner sessions, ask participants to explain the total charge, first billing time, renewal frequency, cancellation route, and free alternative before they click. Record misunderstandings and whether they can recover unaided. Ask them to use monthly, annual, free exit, and a simulated checkout failure. Avoid leading them toward the paid option.

For a future experiment, start with the tested readable version as baseline. Compare a concise benefit statement or paywall timing, one at a time. Track eligible impressions → plan selection → checkout opened → checkout completed → trial converted → retained subscriber. Also track cancellations, refunds, support complaints, and lesson completion. Segment new versus returning subscribers and mobile versus desktop. Set duration and a meaningful sample requirement before starting; do not call a winner from a handful of subscriptions. No analytics or new data collection was added in this change.
