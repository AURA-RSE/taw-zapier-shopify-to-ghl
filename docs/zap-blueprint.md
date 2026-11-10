# Zap Blueprint: Shopify → GHL

Zap name: **TAW | Shopify → GHL Order Sync** (Zapier, Pro features required: multi-step, premium app, Code, AI).
Status: **published (on)**. All 10 steps built and tested. Steps 9–10 are API-equivalent webhook stand-ins for GHL (see below).

| # | App / Action | Purpose |
|---|---|---|
| 1 | Shopify — New Paid Order (instant) | Trigger on every paid order |
| 2 | Code by Zapier — Run JavaScript | Normalise email/phone, total, products, map SKU prefix → category tags |
| 3 | Google Sheets — Lookup Spreadsheet Rows (Advanced) | Find previous orders for this email (`Orders` tab, up to 50, success if none) |
| 4 | Code by Zapier — Run JavaScript | Duplicate check on order ID, buyer type, final tag list |
| 5 | Filter | Continue only if `is_duplicate` is false **and** `has_email` is true |
| 6 | AI by Zapier | Write personalised 2-sentence thank-you (output field: `message`) |
| 7 | Formatter — Text → Default Value | Fallback message if AI output is empty |
| 8 | Google Sheets — Create Spreadsheet Row | Log order to `Orders` tab |
| 9 | Webhooks by Zapier — POST (GHL stand-in: Create/Update Contact) | Sends the contact + custom fields payload GHL would receive |
| 10 | Webhooks by Zapier — POST (GHL stand-in: Add Tags) | Sends email + tag list; in GHL, adding `shopify-customer` starts the workflow |

## Step 2 — normalise (inputs: email, order_id, order_number, first_name, last_name, phone, total, currency, titles, skus)
```js
const email = (inputData.email || '').trim().toLowerCase();
const phone = (inputData.phone || '').replace(/[^\d+]/g, '');
const total = parseFloat(inputData.total || '0') || 0;
const skus = (inputData.skus || '').split(',').map(s => s.trim()).filter(Boolean);
const catMap = {SKIN: 'skincare', APP: 'apparel', ACC: 'accessories'};
const cats = [...new Set(skus.map(s => catMap[s.split('-')[0].toUpperCase()]).filter(Boolean))];
const products = (inputData.titles || '').split(',').map(s => s.trim()).filter(Boolean).join(', ');
return {email, phone, has_email: email.includes('@'), has_phone: phone.length > 6,
  total: total.toFixed(2), currency: inputData.currency || 'USD',
  order_id: inputData.order_id, order_number: inputData.order_number,
  first_name: inputData.first_name || 'there', last_name: inputData.last_name || '',
  products, skus: skus.join(', '), category_tags: cats.map(c => 'cat-' + c).join(','),
  is_high_value: total >= 100};
```
Category comes from the SKU prefix because Shopify line items carry SKU but not product type.

## Step 4 — dedupe + tags (inputs: order_id, prev_ids = step 3 `order_id` column, category_tags, is_high_value)
```js
const orderId = String(inputData.order_id || '');
const prevIds = (inputData.prev_ids || '').split(',').map(s => s.trim()).filter(Boolean);
const isDuplicate = prevIds.includes(orderId);
const prevCount = prevIds.length;
const buyerType = prevCount === 0 ? 'first-time-buyer' : 'repeat-buyer';
const tags = ['shopify-customer', buyerType];
if (String(inputData.is_high_value) === 'true') tags.push('high-value');
(inputData.category_tags || '').split(',').map(s => s.trim()).filter(Boolean).forEach(t => tags.push(t));
return {is_duplicate: isDuplicate, previous_orders: prevCount, total_orders: prevCount + 1, buyer_type: buyerType, tags: tags.join(',')};
```

## Step 6 — AI prompt
> You write short post-purchase messages for an online store. Write a warm 2-sentence thank-you to the customer that mentions what they bought and suggests one related product category to try next. Rules: under 50 words, no discount codes, no emojis, no subject line, plain text only. If the buyer type is repeat-buyer, thank them for coming back. Customer first name: {{2.first_name}}. Items bought: {{2.products}}. Buyer type: {{4.buyer_type}}. Return only the message.

Uses AI by Zapier (OpenAI-backed, no API key needed). Swap for an OpenAI "Send Prompt" step if you have your own key.

## Step 8 — Orders sheet mapping
order_id, order_number, order_date (Shopify Processed At), email, first_name, last_name, phone, total, currency, products, skus, buyer_type, ghl_contact_id (from step 9 once GHL is connected), synced_at (Zapier current time UTC).

## Steps 9–10: GHL stand-in
A GHL account couldn't be created (card blocked), so steps 9–10 POST the exact data the LeadConnector steps would send to a request inspector (webhook.site). The Zap runs end to end and each payload can be inspected.

**Step 9: POST `{GHL_STANDIN_WEBHOOK_URL}/ghl/contacts/upsert`** (JSON)
| Key | Mapped from |
|---|---|
| email | 2. Email |
| phone | 2. Phone |
| firstName | 2. First Name |
| lastName | 2. Last Name |
| source | `Shopify` |
| last_order_id | 2. Order Id |
| last_order_total | 2. Total |
| last_products | 2. Products |
| total_orders | 4. Total Orders |
| post_purchase_message | 7. Output |

**Step 10: POST `{GHL_STANDIN_WEBHOOK_URL}/ghl/contacts/tags`** (JSON): `email` ← 2. Email, `tags` ← 4. Tags.

Recorded payload (test order #1001):
```json
{"email":"ada.test@example.com","firstName":"Ada","lastName":"Okafor","phone":"+12015550101","source":"Shopify",
 "last_order_id":"gid://shopify/Order/19464012202225","last_order_total":"45.00","last_products":"Vitamin C Serum",
 "total_orders":"2","post_purchase_message":"Thanks for coming back, Ada, and choosing our Vitamin C Serum. ..."}
```

**Swapping in real GHL:** replace step 9 with LeadConnector "Create or Update Contact" (same fields; custom fields Last Order ID/Total/Products, Total Orders, Post Purchase Message) and step 10 with LeadConnector "Add Tags to Contact" (contact ID from step 9, tags from step 4). Then map `ghl_contact_id` in step 8 (move step 8 after step 10).

## Error handling
- Duplicates: steps 3–5 (order ID already logged → stop). GHL create/update by email prevents duplicate contacts.
- Empty states: no email → filter stops run; no phone → `has_phone` false (SMS branch skipped in GHL); no category SKU → no `cat-` tag; empty AI output → step 7 fallback.
- Retries: Zapier Autoreplay (Settings → Autoreplay) retries failed steps automatically. It needs a paid Zapier plan and isn't included in the Pro trial, so it's documented here but not switched on in the demo account.
- Alerts: separate Zap **TAW | Zap Error Logger** (published): Zapier Manager "New Zap Error" → Google Sheets `Errors` tab (timestamp, zap name, step, error message, run link). Tested. A Gmail alert step can be added on a paid plan.
