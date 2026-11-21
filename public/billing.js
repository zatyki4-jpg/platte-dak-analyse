'use strict';
(() => {
  const copy = {
    NL: { title: 'Facturatie digitale diensten', detail: 'Voor overeengekomen abonnementen en digitale diensten. Automatische betalingen zijn nog niet actief.', holder: 'Begunstigde', unavailable: 'Facturatiegegevens zijn momenteel niet beschikbaar.' },
    PL: { title: 'Rozliczenia usług cyfrowych', detail: 'Konto do uzgodnionych abonamentów i usług cyfrowych. Automatyczne płatności nie są jeszcze aktywne.', holder: 'Odbiorca', unavailable: 'Dane do rozliczeń są obecnie niedostępne.' },
    EN: { title: 'Digital service billing', detail: 'For agreed subscriptions and digital services. Automatic payments are not active yet.', holder: 'Beneficiary', unavailable: 'Billing details are currently unavailable.' }
  };
  let profile = null;
  const section = document.createElement('details');
  section.id = 'digital-billing';
  section.style.cssText = 'margin-top:28px;padding:16px;border:1px solid var(--border);border-radius:10px;font-size:14px;line-height:1.6;overflow-wrap:anywhere';
  section.className = 'digital-billing';
  const summary = document.createElement('summary');
  summary.style.cssText = 'cursor:pointer;font-size:16px;min-height:44px;align-content:center';
  const body = document.createElement('div');
  body.setAttribute('aria-live', 'polite');
  section.append(summary, body);
  document.body.append(section);
  function render() {
    const language = document.querySelector('.global-lang button.active')?.id?.replace('btn-', '') || 'NL';
    const text = copy[language] || copy.NL;
    summary.textContent = text.title;
    body.replaceChildren();
    const note = document.createElement('p');
    note.textContent = profile?.configured ? text.detail : text.unavailable;
    body.append(note);
    if (!profile?.configured || !profile.account) return;
    for (const [label, value] of [[text.holder, profile.account.account_holder], ['IBAN', profile.account.iban], ['BIC/SWIFT', profile.account.bic], ['EUR', profile.account.currency]]) {
      const row = document.createElement('p');
      const title = document.createElement('strong');
      title.textContent = label + ': ';
      row.append(title, document.createTextNode(value));
      body.append(row);
    }
  }
  document.querySelector('.global-lang')?.addEventListener('click', render);
  render();
  fetch('/api/billing/profile', { cache: 'no-store' })
    .then(response => { if (!response.ok) throw Error('Billing unavailable'); return response.json(); })
    .then(value => { profile = value; render(); })
    .catch(() => { profile = null; render(); });
})();
