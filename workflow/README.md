# Workflow export, definition & recorded run
- `zap-export.json`: Zapier's own export of both Zaps (Order Sync + Error Logger). Account IDs, the Google Sheet ID and the webhook URL are replaced with placeholders.
- `zap-definition.json`: all 10 steps of the live Zap (and the error-logger Zap) with their field mappings.
- `recorded-run-contact.json`: payload Zapier sent from step 9 (GHL stand-in: Create/Update Contact) on a test run of order #1001.
- `recorded-run-tags.json`: payload from step 10 (GHL stand-in: Add Tags) on the same run.
- Screenshots of the Zap and the captured payloads are in [`/screenshots`](../screenshots).
