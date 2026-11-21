import { expect, test } from "@playwright/test";

test("View projects in the top bar reaches the project list", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });
  await nav.getByRole("link", { name: "View projects" }).click();
  await expect(page).toHaveURL(/#projects$/);
  await expect(page.getByRole("heading", { name: "Projects", level: 2 })).toBeInViewport();
});

test("a project row expands in place and collapses again", async ({ page }) => {
  await page.goto("/#projects");
  const toggle = page.getByRole("button", { name: /SubspaceAD/ }).first();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const panel = page.getByRole("region", { name: "SubspaceAD details" });
  await expect(panel.getByRole("link", { name: "Live demo" })).toBeVisible();
  await expect(page).toHaveURL(/#p-subspacead$/);

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("only one row is open at a time", async ({ page }) => {
  await page.goto("/#projects");
  await page
    .getByRole("button", { name: /^ShopCrew/ })
    .first()
    .click();
  await page
    .getByRole("button", { name: /^PaintOps/ })
    .first()
    .click();
  await expect(page.getByRole("button", { name: /^ShopCrew/ }).first()).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(page.getByRole("button", { name: /^PaintOps/ }).first()).toHaveAttribute(
    "aria-expanded",
    "true",
  );
});

test("a #p-<slug> link opens that project", async ({ page }) => {
  await page.goto("/#p-german-air");
  const toggle = page.getByRole("button", { name: /^German Air/ }).first();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(toggle).toBeInViewport();
});

test("project links point at the real repositories", async ({ page }) => {
  await page.goto("/work");
  const panel = page.getByRole("region", { name: "SubspaceAD details" });
  await expect(panel.getByRole("link", { name: "Code" })).toHaveAttribute(
    "href",
    "https://github.com/Chinmoy-04/Subspacead",
  );
});

test("/work shows every project open", async ({ page }) => {
  await page.goto("/work");
  await expect(page.getByRole("heading", { name: "Chinmoy Jyoti Bora", level: 1 })).toBeVisible();
  const regions = page.getByRole("region", { name: / details$/ });
  await expect(regions).toHaveCount(7);
  for (const region of await regions.all()) {
    await expect(region).toHaveAttribute("data-open", "true");
  }
});

test("no page scrolls sideways", async ({ page }) => {
  for (const path of ["/", "/work"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${path} overflows horizontally`).toBeLessThanOrEqual(0);
  }
});

test("the hero has one chapter per project, each linking to its row", async ({ page }) => {
  await page.goto("/");
  const hero = page.getByRole("region", { name: "Introduction" });
  const links = hero.getByRole("link", { name: "Read the project" });
  await expect(links).toHaveCount(7);
  await expect(links.first()).toHaveAttribute("href", "#p-subspacead");
  await expect(links.last()).toHaveAttribute("href", "#p-german-air");
});

test("?intro= picks the opening, and the counter clears by its cap", async ({ page }) => {
  await page.goto("/?intro=none");
  await expect(page.locator("html")).toHaveAttribute("data-intro", "none");
  await expect(page.locator(".intro-counter")).toBeHidden();

  await page.goto("/?intro=counter&enter=none");
  await expect(page.locator("html")).toHaveAttribute("data-intro", "counter");
  // The cap is 3 s; the CSS fallback adds 0.3 s and a 0.5 s fade.
  await expect(page.locator(".intro-counter")).toBeHidden({ timeout: 4500 });
  await expect(page.getByRole("heading", { name: "Chinmoy Jyoti Bora", level: 1 })).toBeVisible();
});

test("without WebGL the hero is just the name, then the project list", async ({ page }) => {
  await page.goto("/?webgl=0");
  await expect(page.locator("html")).not.toHaveAttribute("data-hero", "live");
  await expect(page.locator("html")).toHaveAttribute("data-intro", "none");
  await expect(page.getByRole("heading", { name: "Chinmoy Jyoti Bora", level: 1 })).toBeVisible();
  const hero = page.getByRole("region", { name: "Introduction" });
  await expect(hero.locator("canvas")).toBeHidden();
  await expect(hero.getByRole("article")).toHaveCount(0);
  // The project list starts right after the first screen.
  const projectsTop = await page
    .getByRole("heading", { name: "Projects", level: 2 })
    .evaluate((el) => el.getBoundingClientRect().top / window.innerHeight);
  expect(projectsTop).toBeLessThan(1.5);
});

test("the Enter button holds the counter until pressed", async ({ page }) => {
  for (const enter of ["before", "after"]) {
    await page.goto(`/?intro=counter&enter=${enter}`);
    const button = page.getByRole("button", { name: "Enter", exact: true });
    await expect(button).toBeVisible({ timeout: 12_000 });
    // Past the cap, the counter is still waiting.
    await page.waitForTimeout(3500);
    await expect(page.locator(".intro-counter")).toBeVisible();
    await button.click();
    await expect(page.locator(".intro-counter")).toBeHidden({ timeout: 8000 });
    await expect(page.getByRole("heading", { name: "Chinmoy Jyoti Bora", level: 1 })).toBeVisible();
  }
});

test("Skip to projects moves keyboard focus to the project list", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard path");
  await page.goto("/?intro=none");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to projects" })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: /^SubspaceAD/ }).first()).toBeFocused();
});

test("the Enter button comes right after the top bar in tab order", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard path");
  await page.goto("/?intro=counter&enter=before");
  const enter = page.getByRole("button", { name: "Enter", exact: true });
  await expect(enter).toBeVisible({ timeout: 12_000 });
  // Skip link, name, Sound, CV, View projects, then Enter.
  await page.keyboard.press("Tab", { delay: 0 });
  for (let i = 0; i < 5; i++) await page.keyboard.press("Tab");
  await expect(enter).toBeFocused();
});

test("every project has a heading and a distinct hero link", async ({ page }) => {
  await page.goto("/work");
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(7);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Chinmoy Jyoti Bora", exact: true, level: 1 }),
  ).toBeAttached();
  await expect(page.getByRole("link", { name: "Read the project: German Air" })).toHaveCount(1);
});
