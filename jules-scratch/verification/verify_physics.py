from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Capture and print console messages
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    # The server is running on port 8080, and the file is at examples/interactive.html
    page.goto("http://127.0.0.1:8080/examples/interactive.html", wait_until="networkidle")

    # Wait for the canvas to be visible, which indicates the engine has loaded
    canvas = page.locator("#roxel-canvas")
    expect(canvas).to_be_visible()

    # Wait for a few seconds to allow the world to generate and render
    page.wait_for_timeout(5000)

    # Take a screenshot of the initial view
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)