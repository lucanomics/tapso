# TAPSO marketing site

## Outcome and non-goals

Build and publish a responsive Korean-first product website for TAPSO under `apps/web`. The public page must explain the narrow bus-companion promise, the Dynamic Island experience, vehicle matching, privacy boundary, and current demo status. It must be deployable to Vercel from the GitHub repository.

This work does not claim live Jeju reliability, collect leads, add user accounts, expose transit credentials, or imply that TestFlight is already available.

## Verified constraints and assumptions

- **VERIFIED:** TAPSO tracks the physical transit vehicle; continuous passenger GPS is not the default.
- **VERIFIED:** The current product demo uses deterministic synthetic transit data.
- **VERIFIED:** The Dynamic Island presents 8-to-0 progress and escalates at two stops, one stop, and arrival.
- **VERIFIED:** The GitHub repository is `lucanomics/tapso` and the authenticated account can push and open pull requests.
- **VERIFIED:** The connected Vercel team is `club-paradiso` on the Hobby plan.
- **DESIGN SPEC:** Four generated section concepts live under `docs/design/marketing/` and use the existing TAPSO screenshots and app icon as references.

## Milestones

1. **Concept and design system** — four readable section concepts, a production character cutout, locked copy, palette, typography, component families, and responsive structure exist in the repository.
2. **Implementation** — `apps/web` builds with React, TypeScript, and Vite; hero, interactive Island story, matching explanation, privacy/status CTA, and footer are complete.
3. **Verification** — production build passes; desktop and mobile browser captures show no clipping, broken assets, inaccessible controls, or misleading claims; the render is compared with the concepts using `view_image`.
4. **Delivery** — branch is pushed, PR CI is green and merged, and a Vercel production deployment is reachable.

## Design decisions

- Use React + Vite because the repo has no existing web framework and the page benefits from a small interactive Dynamic Island demo.
- Keep app UI and site copy code-native; use generated imagery only for the standalone basalt companion and existing iOS screenshots for product proof.
- Alternate true mist-white editorial sections with one volcanic-ink product band instead of repeating card grids.
- Link the primary public development CTA to GitHub while TestFlight remains truthfully labeled as preparing.

## Reproduction and evidence

From `apps/web`:

    npm install
    npm run build
    npm run dev -- --host 127.0.0.1

Verification evidence and deployment URLs are added here as work completes.

### Browser QA

- In-app browser, 1440 × 1024: no horizontal overflow, all eight production images loaded, navigation and hero CTAs visible.
- In-app browser, 390 × 844: no horizontal overflow, hero composition remains readable, and product imagery stays inside the viewport.
- Interactive Island state `준비 2`: the pressed state, warm warning color, two-stop progress marker, and live-region copy all update together.
- Production build: `npm run build` completes with Vite 7 and no dependency vulnerabilities reported by `npm install`.

### Fidelity ledger

1. **Hero hierarchy — match:** the code render preserves the concept's quiet navigation, oversized two-line promise, central iPhone proof, floating Island, and Jeju basalt companion.
2. **Jeju character — match:** the approved tangerine-topped basalt companion is used as a transparent production asset, so it scales cleanly across desktop and mobile.
3. **Dynamic Island story — match:** the dark volcanic band, four journey states, progress rail, mint-to-tangerine escalation, and compact/expanded modes are represented in code.
4. **Product evidence — intentional deviation:** the implementation uses actual TAPSO simulator screenshots rather than shipping the generated concept composite as UI.
5. **Scenery — intentional deviation:** the concept's photographic coast is replaced by code-native mist, wave, and oreum shapes to keep the page responsive and visually subordinate to the product.
6. **Typography — intentional deviation:** a local Korean system stack replaces an external display font, avoiding a render-blocking font request while preserving the heavy editorial rhythm.
7. **Truth labels — improvement:** synthetic-data and TestFlight-preparation labels are more explicit in the implementation than in the visual concepts.

### Above-the-fold copy diff

- Concept: “타고. 앱을 닫고. 제때 내리세요.”
- Implementation: unchanged.
- Supporting sentence: unchanged in meaning; line wrapping is responsive rather than baked into an image.
- CTAs: “데모 둘러보기” and “GitHub에서 보기” remain above the fold on desktop and immediately follow the lead copy on mobile.

## Progress

- [x] Read product, privacy, and Live Activity requirements.
- [x] Generate four coordinated concepts and a transparent character cutout.
- [x] Implement the site.
- [x] Run desktop/mobile visual QA and production build.
- [ ] Push, open PR, pass CI, and merge.
- [ ] Deploy to Vercel production and verify the public URL.

## Risks and next action

The web build job is included in repository CI. The next action is to push the branch, merge the green PR, and deploy the merged site to Vercel.
