from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    try:
        page.goto("http://localhost:8080/examples/basic.html", wait_until="networkidle")

        canvas = page.locator("#roxel-canvas")
        expect(canvas).to_be_visible()

        # Give the world time to generate
        page.wait_for_timeout(3000)

        # Click the canvas to focus it
        canvas.click()

        # Simulate movement
        page.keyboard.down("KeyW")
        page.wait_for_timeout(1500)
        page.keyboard.up("KeyW")

        page.keyboard.down("KeyA")
        page.wait_for_timeout(1000)
        page.keyboard.up("KeyA")

        page.keyboard.down("KeyS")
        page.wait_for_timeout(1500)
        page.keyboard.up("KeyS")

        page.keyboard.down("KeyD")
        page.wait_for_timeout(1000)
        page.keyboard.up("KeyD")

        page.keyboard.down("Space")
        page.wait_for_timeout(500)
        page.keyboard.up("Space")

        # Take a screenshot to verify the floor is still there
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)