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

  await page.goto("/?intro=counter");
  await expect(page.locator("html")).toHaveAttribute("data-intro", "counter");
  // The cap is 3 s; the CSS fallback adds 0.3 s and a 0.5 s fade.
  await expect(page.locator(".intro-counter")).toBeHidden({ timeout: 4500 });
  await expect(page.getByRole("heading", { name: "Chinmoy Jyoti Bora", level: 1 })).toBeVisible();
});
