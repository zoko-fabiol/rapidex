import {
  CFA_EUR_PEG,
  DEFAULT_COMMISSION_PERCENT,
  computeRawRates,
  computeClientRate,
  computeAllRates,
  calculateQuote,
  formatNumber,
  formatCurrency,
  generateTransactionId,
  MIN_AFRICA_AMOUNT_CFA,
  MIN_RUSSIA_AMOUNT_RUB,
} from './calculator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

function runTests() {
  console.log('\n--- Running Rapidex Mathematical Conversion Tests ---\n');

  // Test 1: Fixed CFA Peg
  assert(CFA_EUR_PEG === 655.957, 'CFA / EUR fixed peg must be exactly 655.957');

  // Test 2: Raw Rate Calculation
  // If EUR/RUB = 100.0,
  // Africa -> Russia = 100.0 / 655.957 ≈ 0.152449017...
  // Russia -> Africa = 655.957 / 100.0 = 6.55957
  const testEurRub = 100.0;
  const raw = computeRawRates(testEurRub);
  assert(
    Math.abs(raw.AFRICA_TO_RUSSIA - 100 / 655.957) < 0.000001,
    'Raw rate Africa -> Russia must equal EUR_RUB / 655.957'
  );
  assert(
    Math.abs(raw.RUSSIA_TO_AFRICA - 655.957 / 100) < 0.000001,
    'Raw rate Russia -> Africa must equal 655.957 / EUR_RUB'
  );

  // Test 3: Commission Application (2%)
  const clientRateAtoR = computeClientRate(raw.AFRICA_TO_RUSSIA, 2.0);
  const expectedAtoR = raw.AFRICA_TO_RUSSIA * 0.98;
  assert(
    Math.abs(clientRateAtoR - expectedAtoR) < 0.000001,
    'Client rate must reflect exact 2% commercial commission reduction'
  );

  const clientRateRtoA = computeClientRate(raw.RUSSIA_TO_AFRICA, 2.0);
  const expectedRtoA = raw.RUSSIA_TO_AFRICA * 0.98;
  assert(
    Math.abs(clientRateRtoA - expectedRtoA) < 0.000001,
    'Russia -> Africa client rate must reflect exact 2% commission'
  );

  // Test 4: computeAllRates bundle
  const all = computeAllRates(100.0, 2.0);
  assert(all.clientRates.AFRICA_TO_RUSSIA < all.rawRates.AFRICA_TO_RUSSIA, 'Client rate is discounted from raw rate');

  // Test 5: Africa -> Russia Quote
  // Sending 50,000 XAF with EUR/RUB = 100
  // Effective rate = (100 / 655.957) * 0.98 ≈ 0.1494
  // Target RUB = 50,000 * 0.1494 = 7470.02
  const quoteAfrica = calculateQuote('AFRICA_TO_RUSSIA', 50000, 100.0, 'XAF', 2.0);
  assert(quoteAfrica.isValid === true, '50,000 XAF must be valid (>= 5,000)');
  assert(quoteAfrica.sourceCurrency === 'XAF', 'Source currency must be XAF');
  assert(quoteAfrica.targetCurrency === 'RUB', 'Target currency must be RUB');
  assert(quoteAfrica.targetAmount > 7000 && quoteAfrica.targetAmount < 8000, 'Calculated target RUB is within correct range');

  // Test 6: No Min Amount Restriction Africa (e.g. 500 XAF is valid)
  const smallAfrica = calculateQuote('AFRICA_TO_RUSSIA', 500, 100.0, 'XAF', 2.0);
  assert(smallAfrica.isValid === true, '500 XAF must be valid (no minimum restriction)');
  assert(!smallAfrica.validationError, 'No validation error for small amount');

  // Test 7: Russia -> Africa Quote
  // Sending 10,000 RUB with EUR/RUB = 100
  // Effective rate = (655.957 / 100) * 0.98 ≈ 6.42837
  // Target CFA = Math.round(10,000 * 6.42837) = 64284 XAF
  const quoteRussia = calculateQuote('RUSSIA_TO_AFRICA', 10000, 100.0, 'XAF', 2.0);
  assert(quoteRussia.isValid === true, '10,000 RUB must be valid');
  assert(quoteRussia.sourceCurrency === 'RUB', 'Source currency must be RUB');
  assert(quoteRussia.targetCurrency === 'XAF', 'Target currency must be XAF');
  assert(quoteRussia.targetAmount > 60000 && quoteRussia.targetAmount < 70000, 'Calculated target CFA is within range');

  // Test 8: No Min Amount Restriction Russia (e.g. 10 RUB is valid)
  const smallRussia = calculateQuote('RUSSIA_TO_AFRICA', 10, 100.0, 'XAF', 2.0);
  assert(smallRussia.isValid === true, '10 RUB must be valid (no minimum restriction)');

  // Test 9: Transaction ID format
  const txId = generateTransactionId();
  assert(/^RP-[A-Z0-9]{2}-[A-Z0-9]{2}$/.test(txId), `Generated ID ${txId} matches expected pattern RP-XX-XX`);

  // Test 10: Currency formatting & decimals rules
  const formattedRub = formatCurrency(12500.5, 'RUB');
  assert(formattedRub.includes('₽'), 'Formatted RUB should contain ₽ symbol');

  // Test 11: Decimals rule: max 2 decimals, only when conversion has decimals
  const intFormatted = formatNumber(100, 2);
  assert(intFormatted === '100', `Whole numbers must have 0 decimals: expected "100", got "${intFormatted}"`);

  const oneDecFormatted = formatNumber(142.5, 2);
  assert(oneDecFormatted === '142,5', `One decimal must display exactly 1 decimal: expected "142,5", got "${oneDecFormatted}"`);

  const twoDecFormatted = formatNumber(142.74, 2);
  assert(twoDecFormatted === '142,74', `Two decimals must display 2 decimals: expected "142,74", got "${twoDecFormatted}"`);

  const threeDecRounded = formatNumber(142.746, 2);
  assert(threeDecRounded === '142,75', `Three decimals must round to max 2 decimals: expected "142,75", got "${threeDecRounded}"`);

  console.log('\n🎉 ALL 11 TESTS PASSED SUCCESSFULLY!\n');
}

runTests();
