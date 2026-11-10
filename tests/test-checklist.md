# Test Checklist: Main Flow

Live tests used real Shopify test orders on 10 Nov 2026. Each was checked in Zapier Zap history and in the webhook.site inbox (the GHL stand-in for steps 9–10). Logic tests run the exact step 4 code: `node tests/step4-dedupe-tags.test.js`.

## Happy path (live orders)
- [x] **#1002 First-time buyer (Tolu):** run successful; tags `shopify-customer,first-time-buyer,cat-skincare`; Total Orders = 1
- [x] Contact payload has Last Order ID, Total, Products, Total Orders and Post Purchase Message
- [x] Order row logged to the `Orders` sheet (step 8 succeeded in every run)
- [x] AI thank-you message present in the step 9 payload
- [x] **#1003 Repeat buyer (Tolu again):** same email (GHL upserts by email, so no duplicate contact); tag `repeat-buyer`; Total Orders = 2
- [x] **#1005 High value ($180, Kemi):** found a bug. The `high-value` tag was missing because Zapier passes booleans between Code steps as `"True"` and step 4 only matched `"true"`. Fixed in Zap v2 with a case-insensitive check. Covered by the logic test; awaiting one more live order on v2.

## Edge cases / empty states
- [x] **#1004 No phone (Bayo):** contact payload has no `phone` field; run still successful
- [x] No category SKU: no `cat-` tag and the run still succeeds (logic test)
- [ ] Uppercase email stored lowercase: handled in step 2 (`toLowerCase()`), not run as a live order

## Error handling
- [x] Duplicate: an order ID already in `Orders` gives `is_duplicate = true`, so the step 5 filter stops the run (logic test; Zapier replay can't re-run a successful order)
- [x] Error logger Zap: Zapier Manager "New Zap Error" → row in the `Errors` sheet (tested with Zapier's sample error)
- [ ] AI failure → fallback message: step 7 default value is configured, but the failure wasn't forced live
- [ ] Autoreplay retries: needs a paid Zapier plan (not in the trial)

## GHL workflow (needs a GHL account)
- [ ] Review request after wait 1
- [ ] Repeat buyer gets the VIP offer; first-time buyer gets the welcome offer
- [ ] `post-purchase-complete` tag added at end
