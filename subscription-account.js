'use strict';

function normalizeIban(value) {
  if (typeof value !== 'string') return null;
  const iban = value.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(iban)) return null;
  let remainder = 0;
  for (const character of iban.slice(4) + iban.slice(0,4)) {
    const digits = /[A-Z]/.test(character) ? String(character.charCodeAt(0) - 55) : character;
    for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1 ? iban : null;
}

function subscriptionAccount(env = process.env) {
  const iban = normalizeIban(env.SUBSCRIPTION_BANK_IBAN);
  const accountHolder = String(env.SUBSCRIPTION_BANK_BENEFICIARY || '').trim();
  const bic = String(env.SUBSCRIPTION_BANK_BIC || '').trim().toUpperCase();
  const configured = Boolean(iban && accountHolder && accountHolder.length <= 200 && /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic));
  return {
    configured,
    scope: 'digital_services',
    is_default: configured,
    payment_processing_active: false,
    account: configured ? { account_holder: accountHolder, iban, bic, currency: 'EUR' } : null
  };
}

module.exports = { normalizeIban, subscriptionAccount };
