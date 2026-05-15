import { useEffect, useState, type FormEvent } from 'react';
import {
  DEFAULT_SITE_CONTENT,
  loadSiteContent,
  saveSiteContent,
  type SiteContent,
} from '@/lib/siteContent';
import type { WaivedFee } from '@/data/heroOffer';

export function SiteContentSettingsPage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await loadSiteContent();
        if (!cancelled) setContent(clone(c));
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Could not load site content.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function patch<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setContent((c) => (c ? { ...c, [key]: value } : c));
  }

  function patchFee(i: number, fee: WaivedFee) {
    setContent((c) =>
      c ? { ...c, waivedFees: c.waivedFees.map((f, idx) => (idx === i ? fee : f)) } : c,
    );
  }
  function addFee() {
    setContent((c) => (c ? { ...c, waivedFees: [...c.waivedFees, { label: '', amount: '' }] } : c));
  }
  function removeFee(i: number) {
    setContent((c) =>
      c ? { ...c, waivedFees: c.waivedFees.filter((_, idx) => idx !== i) } : c,
    );
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!content) return;
    setBusy(true);
    setErr(null);
    setToast(null);
    try {
      await saveSiteContent(content);
      setToast('Site content saved. Marketing site will pick up the changes on the next page load.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save site content.');
    } finally {
      setBusy(false);
    }
  }

  function resetDefaults() {
    setContent(clone(DEFAULT_SITE_CONTENT));
    setToast(null);
  }

  return (
    <div>
      <header style={{ marginBottom: '1.75rem' }}>
        <div
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#c9a84c',
            marginBottom: '0.5rem',
          }}
        >
          Settings · Site Content
        </div>
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(1.75rem, 3.4vw, 2.4rem)',
            fontWeight: 300,
          }}
        >
          Promo banner &amp; hero offer
        </h1>
        <p style={{ color: '#8b95a7', fontSize: '0.88rem', marginTop: '0.5rem', lineHeight: 1.7, maxWidth: 640 }}>
          High-churn marketing copy. Saves overlay the static defaults baked into the
          site — leaving a field empty does not delete the default; reset-to-defaults
          restores everything visible on this page.
        </p>
      </header>

      {err && <ErrorBox>{err}</ErrorBox>}
      {toast && <ToastBox>{toast}</ToastBox>}

      {!content ? (
        <Note>Loading…</Note>
      ) : (
        <form onSubmit={onSave} style={{ background: '#0a0f1e', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 2, padding: '1.5rem' }}>
          <Section title="Promo Banner">
            <Field label="Banner active">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d6d2c4', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={content.bannerActive}
                  onChange={(e) => patch('bannerActive', e.target.checked)}
                />
                Show the gold strip above the nav
              </label>
            </Field>
            <Field label="Banner text">
              <input
                value={content.bannerText}
                onChange={(e) => patch('bannerText', e.target.value)}
                style={textField}
              />
            </Field>
            <Field label="Banner CTA label">
              <input
                value={content.bannerCtaLabel}
                onChange={(e) => patch('bannerCtaLabel', e.target.value)}
                style={textField}
              />
            </Field>
          </Section>

          <Section title="Hero Offer Card">
            <Field label="Eyebrow (small uppercase label at top)">
              <input
                value={content.eyebrow}
                onChange={(e) => patch('eyebrow', e.target.value)}
                style={textField}
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
              <Field label="Final price amount">
                <input
                  value={content.finalPriceAmount}
                  onChange={(e) => patch('finalPriceAmount', e.target.value)}
                  placeholder="$139.99"
                  style={textField}
                />
              </Field>
              <Field label="Final price caption">
                <input
                  value={content.finalPriceCaption}
                  onChange={(e) => patch('finalPriceCaption', e.target.value)}
                  placeholder="Stable Standard Pool Service"
                  style={textField}
                />
              </Field>
            </div>
            <Field label="Fine print (legal / terms / deadline)">
              <textarea
                rows={4}
                value={content.finePrint}
                onChange={(e) => patch('finePrint', e.target.value)}
                style={{ ...textField, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </Field>
          </Section>

          <Section title="Waived Fees (the crossed-out lines above the price)">
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.45rem' }}>
              {content.waivedFees.map((f, i) => (
                <li key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem' }}>
                  <input
                    placeholder="Label (e.g. Admin Fee)"
                    value={f.label}
                    onChange={(e) => patchFee(i, { ...f, label: e.target.value })}
                    style={textField}
                  />
                  <input
                    placeholder="Amount (e.g. $24.99/mo)"
                    value={f.amount}
                    onChange={(e) => patchFee(i, { ...f, amount: e.target.value })}
                    style={textField}
                  />
                  <button type="button" onClick={() => removeFee(i)} style={removeBtn} aria-label="Remove">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: '0.5rem' }}>
              <button type="button" onClick={addFee} className="ss-btn-ghost">
                + Add fee
              </button>
            </div>
          </Section>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={resetDefaults} className="ss-btn-ghost">
              Reset to defaults
            </button>
            <button type="submit" disabled={busy} className="ss-btn-primary" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Saving…' : 'Save Site Content'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        marginBottom: '1.5rem',
        paddingBottom: '1.5rem',
        borderBottom: '0.5px solid rgba(201,168,76,0.18)',
      }}
    >
      <div
        style={{
          fontSize: '0.62rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#c9a84c',
          marginBottom: '0.85rem',
        }}
      >
        {title}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: '0.85rem' }}>
      <div
        style={{
          fontSize: '0.62rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#8b95a7',
          marginBottom: '0.3rem',
        }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(220,80,80,0.08)',
        border: '1px solid rgba(220,80,80,0.35)',
        color: '#f0a5a5',
        fontSize: '0.85rem',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        borderRadius: 2,
      }}
    >
      {children}
    </div>
  );
}

function ToastBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(127,203,138,0.08)',
        border: '1px solid rgba(127,203,138,0.35)',
        color: '#7fcb8a',
        fontSize: '0.85rem',
        padding: '0.6rem 0.9rem',
        marginBottom: '1rem',
        borderRadius: 2,
      }}
    >
      {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#0a0f1e',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '2rem',
        textAlign: 'center',
        color: '#8b95a7',
      }}
    >
      {children}
    </div>
  );
}

function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

const textField: React.CSSProperties = {
  width: '100%',
  background: '#0a0f1e',
  border: '1px solid rgba(201,168,76,0.25)',
  color: '#ffffff',
  padding: '0.6rem 0.7rem',
  fontSize: '0.88rem',
  borderRadius: 2,
  outline: 'none',
};

const removeBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(240,165,165,0.35)',
  color: '#f0a5a5',
  padding: '0.4rem 0.55rem',
  borderRadius: 2,
  cursor: 'pointer',
  fontSize: '0.75rem',
};
