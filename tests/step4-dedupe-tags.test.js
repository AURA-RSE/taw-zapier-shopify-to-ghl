// Runs the exact Step 4 code from the Zap against real inputs captured in Zap history.
// Usage: node tests/step4-dedupe-tags.test.js
const assert = require('assert');

function step4(inputData) {
  const orderId = String(inputData.order_id || '');
  const prevIds = (inputData.prev_ids || '').split(',').map(s => s.trim()).filter(Boolean);
  const isDuplicate = prevIds.includes(orderId);
  const prevCount = prevIds.length;
  const buyerType = prevCount === 0 ? 'first-time-buyer' : 'repeat-buyer';
  const tags = ['shopify-customer', buyerType];
  if (String(inputData.is_high_value).toLowerCase() === 'true') tags.push('high-value');
  (inputData.category_tags || '').split(',').map(s => s.trim()).filter(Boolean).forEach(t => tags.push(t));
  return {is_duplicate: isDuplicate, previous_orders: prevCount, total_orders: prevCount + 1, buyer_type: buyerType, tags: tags.join(',')};
}

const cases = [
  ['first-time buyer', {order_id: 'gid://shopify/Order/1002', prev_ids: '', is_high_value: 'False', category_tags: 'cat-skincare'},
    {is_duplicate: false, buyer_type: 'first-time-buyer', tags: 'shopify-customer,first-time-buyer,cat-skincare'}],
  ['repeat buyer', {order_id: 'gid://shopify/Order/1003', prev_ids: 'gid://shopify/Order/1002', is_high_value: 'False', category_tags: 'cat-skincare'},
    {is_duplicate: false, buyer_type: 'repeat-buyer', total_orders: 2, tags: 'shopify-customer,repeat-buyer,cat-skincare'}],
  ['duplicate order (same ID already logged)', {order_id: 'gid://shopify/Order/1002', prev_ids: 'gid://shopify/Order/1002', is_high_value: 'False', category_tags: 'cat-skincare'},
    {is_duplicate: true}],
  ['high value, Zapier passes "True"', {order_id: 'gid://shopify/Order/1005', prev_ids: '', is_high_value: 'True', category_tags: 'cat-skincare'},
    {tags: 'shopify-customer,first-time-buyer,high-value,cat-skincare'}],
  ['high value, lowercase "true"', {order_id: 'x', prev_ids: '', is_high_value: 'true', category_tags: ''},
    {tags: 'shopify-customer,first-time-buyer,high-value'}],
  ['no category SKU', {order_id: 'x', prev_ids: '', is_high_value: 'False', category_tags: ''},
    {tags: 'shopify-customer,first-time-buyer'}],
];

let failed = 0;
for (const [name, input, expected] of cases) {
  const out = step4(input);
  try { for (const k of Object.keys(expected)) assert.deepStrictEqual(out[k], expected[k]); console.log('PASS', name); }
  catch (e) { failed++; console.log('FAIL', name, '\n  ', e.message); }
}
process.exit(failed ? 1 : 0);
