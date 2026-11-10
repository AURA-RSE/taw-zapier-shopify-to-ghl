# Test Checklist: Main Flow

Run each scenario with the sample orders in `sample-data/sample-orders.csv`. Tick when confirmed in Zapier history, the webhook.site inbox (GHL stand-in for steps 9–10) and Sheets.

## Happy path
- [ ] T-1001 First-time buyer: contact payload sent (step 9), tags payload (step 10) includes `shopify-customer`, `first-time-buyer`, `cat-skincare`
- [ ] Custom fields filled (Last Order ID, Total, Date, Products, Total Orders = 1, Post Purchase Message)
- [ ] Order row added to `Orders` sheet
- [ ] post_purchase_message present in the step 9 payload (GHL workflow enrolment is tested once a GHL account is available)
- [ ] T-1002 Repeat buyer: same email in payload (GHL upserts by email, so no duplicate), tag `repeat-buyer`, Total Orders = 2
- [ ] T-1003 High value: tag `high-value`, `cat-apparel`

## Edge cases / empty states
- [ ] T-1003 No phone: contact created with email only, SMS branch skipped
- [ ] T-1004 Uppercase email: stored lowercase, matched correctly
- [ ] T-1005 No product type: no `cat-` tag, Zap still succeeds

## Error handling
- [ ] Duplicate: replay T-1001 trigger → Zap stops at filter, no second row/contact
- [ ] OpenAI failure (use invalid key in a test copy): fallback message used, Zap completes
- [ ] Step failure (e.g. break the step 9 URL temporarily): Zap error → row in `Errors` sheet
- [ ] Autoreplay retries the failed run after reconnection

## Workflow timing (shorten waits to minutes for testing)
- [ ] Review request sent after wait 1
- [ ] Repeat buyer gets VIP offer; first-time buyer gets welcome offer
- [ ] `post-purchase-complete` tag added at end
