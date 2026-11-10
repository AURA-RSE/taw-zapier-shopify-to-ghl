# GHL Workflow: Post-Purchase Flow

Name: **TAW | Shopify Post-Purchase**

## Trigger
Contact Tag → tag added = `shopify-customer`
Allow re-entry: **ON** (so repeat buyers re-enrol on every order).

## Actions
1. **Remove from workflow** (any other active run of this workflow) — prevents overlapping sequences for repeat buyers.
2. **Send Email — Thank you** (immediately)
   - Subject: `Thanks for your order, {{contact.first_name}}!`
   - Body: `{{contact.post_purchase_message}}`
3. **If/Else — has phone?** → yes: **Send SMS** (short thank-you, test numbers only).
4. **Wait 3 days**
5. **Send Email — Review request** with a review link placeholder.
6. **Wait 4 days** (day 7 total)
7. **If/Else — Contact has tag `repeat-buyer`?**
   - **Yes:** Send loyalty email (early access / VIP offer). Add tag `vip-offer-sent`.
   - **No:** Send first-time offer email (e.g. `WELCOME10` sample code). Add tag `welcome-offer-sent`.
8. **Add tag** `post-purchase-complete`.

## Notes
- Use a test sub-account and only test/opted-in contacts.
- Offer codes are sample values; create them as test discounts in the Shopify dev store.
