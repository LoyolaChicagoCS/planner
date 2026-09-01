import { test, expect, type Page } from '@playwright/test';

/**
 * Regression coverage for Core-requirement propagation into the Roadmap.
 *
 * Reproduction (reported against https://advising.cs.luc.edu/):
 *   1. Open the Computer Science program.
 *   2. Roadmap → Year 2 Spring: "CORE: Scientific Knowledge Tier 1" is unchecked.
 *   3. Core subtab → Scientific Knowledge and Inquiry → Tier I → select ENVS 101.
 *   4. Back on the Roadmap, the Year 2 Spring Tier 1 row is STILL unchecked,
 *      even though the URL now carries `?d=CORE_ENVS101`.
 *
 * Root cause: the roadmap Core rows are label-only `isElective` placeholders
 * with no `ref` to the `CORE_SCI1` requirement, so a concrete Core selection
 * (`CORE_ENVS101`, which maps to `CORE_SCI1`) can never satisfy them.
 *
 * The Courses-tab "University Core" list DOES reflect the selection, because
 * those rows are bound to the real `CORE_SCI1` requirement id — so this is
 * specifically a roadmap-linkage defect.
 */

async function openCsProgram(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Computer Science/ }).first().click();
}

function coreEnvs101Row(page: Page) {
  return page.getByRole('button', { name: /ENVS 101/ });
}

function roadmapScienceTier1Row(page: Page) {
  // Scope to the Roadmap slide (it owns the "Search roadmap" search box).
  const roadmapSlide = page
    .locator('.swiper-slide')
    .filter({ has: page.getByPlaceholder('Search roadmap') });
  return roadmapSlide.getByRole('button', { name: /Scientific Knowledge Tier 1/ }).first();
}

function coursesTabCoreTier1Row(page: Page) {
  // University Core list lives on the Courses slide (has "Major Requirements").
  const coursesSlide = page
    .locator('.swiper-slide')
    .filter({ has: page.getByRole('heading', { name: 'Major Requirements' }) });
  return coursesSlide.getByRole('button', { name: /Scientific Knowledge Tier 1/ }).first();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await openCsProgram(page);
});

test('selecting a concrete Core course reflects in the Courses tab (sanity)', async ({ page }) => {
  await page.getByRole('button', { name: 'Core', exact: true }).click();
  await coreEnvs101Row(page).click();
  await expect(coreEnvs101Row(page)).toContainText('✓');

  // The University Core list on the Courses tab is bound to CORE_SCI1 and
  // should show the requirement satisfied by the selected alternate.
  await page.getByRole('button', { name: 'Courses', exact: true }).click();
  await expect(coursesTabCoreTier1Row(page)).toContainText('✓');
});

test('selecting a concrete Core course marks the matching Roadmap requirement', async ({ page }) => {
  // Roadmap starts with the Tier 1 requirement unchecked.
  await page.getByRole('button', { name: 'Roadmap', exact: true }).click();
  await expect(roadmapScienceTier1Row(page)).not.toContainText('✓');

  // Select ENVS 101 in the Core subtab.
  await page.getByRole('button', { name: 'Core', exact: true }).click();
  await coreEnvs101Row(page).click();
  await expect(coreEnvs101Row(page)).toContainText('✓');

  // Back on the Roadmap, Year 2 Spring Tier 1 should now read as satisfied.
  // This currently FAILS: the roadmap row is an unlinked elective placeholder.
  await page.getByRole('button', { name: 'Roadmap', exact: true }).click();
  await expect(roadmapScienceTier1Row(page)).toContainText('✓');
});
