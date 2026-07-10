'use client';

// ── Indian number-to-words ───────────────────────────────────────────────────
const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convert(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n] + ' ';
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '') + ' ';
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + convert(n % 100);
  if (n < 100_000) return convert(Math.floor(n / 1000)) + 'Thousand ' + convert(n % 1000);
  if (n < 10_000_000) return convert(Math.floor(n / 100_000)) + 'Lakh ' + convert(n % 100_000);
  return convert(Math.floor(n / 10_000_000)) + 'Crore ' + convert(n % 10_000_000);
}

function numberToWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let result = 'Rupees ' + convert(rupees).trim();
  if (paise > 0) result += ' and ' + convert(paise).trim() + ' Paise';
  return result + ' Only';
}

// Indian locale number formatting  e.g. 2,10,000.00
function inr(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Types ────────────────────────────────────────────────────────────────────
interface POItem {
  description: string;
  count: string;
  quality: string;
  bags: number;
  bagWeight: number;
  totalWeight: number;
  rate: number;
  cgst: number;
  sgst: number;
}

interface POData {
  poNumber?: string;
  hfCode?: string;
  agent?: string;
  date?: string;
  deliveryDate?: string;
  supplierName?: string;
  supplierAddress?: string;
  supplierGST?: string;
  deliveryName?: string;
  deliveryAddress?: string;
  deliveryGST?: string;
  items?: POItem[];
  poType?: 'YARN' | 'GREY_FABRIC';
  fabricType?: string;
  fabricColour?: string;
  fabricDia?: string;
  fabricGsm?: string;
  totalFabricWeight?: string | number;
}

// ── Shared style constants ───────────────────────────────────────────────────
const BLUE = '#1a3799';
const BORDER = `2px solid ${BLUE}`;
const BORDER_THIN = `1px solid ${BLUE}`;
const CELL: React.CSSProperties = {
  border: BORDER_THIN,
  padding: '4px 5px',
  textAlign: 'center',
  fontSize: 10,
};
const TH: React.CSSProperties = {
  ...CELL,
  background: BLUE,
  color: '#fff',
  fontWeight: 700,
  textTransform: 'uppercase',
  fontSize: 9,
  letterSpacing: '0.03em',
};

// ── Component ────────────────────────────────────────────────────────────────
const PRINT_STYLE = `
@media print {
  @page { size: A4 landscape; margin: 8mm; }
  body { margin: 0 !important; }
  #po-print {
    width: 277mm !important;
    max-height: 190mm !important;
    overflow: hidden !important;
    padding: 6mm 8mm !important;
    font-size: 9px !important;
  }
  .terms-section {
    page-break-before: avoid !important;
    break-before: avoid !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    font-size: 8px !important;
  }
  table { page-break-inside: avoid !important; break-inside: avoid !important; }
}
`;

export default function PurchaseOrderPrintTemplate({ data, id = 'po-print' }: { data: POData; id?: string }) {
  const items = data.items ?? [];
  const isFabric = data.poType === 'GREY_FABRIC';

  // Totals
  const totalBags = items.reduce((s, i) => s + (Number(i.bags) || 0), 0);
  const totalWeight = items.reduce((s, i) => s + (Number(i.totalWeight) || 0), 0);


  const rows = items.map((item) => {
    const tw = Number(item.totalWeight) || 0;
    const rate = Number(item.rate) || 0;
    const taxable = tw * rate;
    const cgstAmt = taxable * ((Number(item.cgst) || 0) / 100);
    const sgstAmt = taxable * ((Number(item.sgst) || 0) / 100);
    const total = taxable + cgstAmt + sgstAmt;
    return { item, taxable, cgstAmt, sgstAmt, total };
  });

  const { grandTaxable, grandCGST, grandSGST, grandTotal } = rows.reduce(
    (acc, r) => ({
      grandTaxable: acc.grandTaxable + r.taxable,
      grandCGST: acc.grandCGST + r.cgstAmt,
      grandSGST: acc.grandSGST + r.sgstAmt,
      grandTotal: acc.grandTotal + r.total,
    }),
    { grandTaxable: 0, grandCGST: 0, grandSGST: 0, grandTotal: 0 },
  );

  // Blank filler rows (minimum 5 item rows shown)
  const fillerCount = Math.max(0, 5 - rows.length);

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  return (
    <div
      id={id}
      className="po-print-container"
      style={{
        background: '#fff',
        color: '#000',
        width: '297mm',
        minHeight: '210mm',
        margin: '0 auto',
        padding: '10mm 12mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: 11,
        boxSizing: 'border-box',
      }}
    >
      {/* Print stylesheet injected inline so it works inside portals/iframes */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLE }} />
      {/* ── HEADER ── */}
      <div style={{ border: BORDER, textAlign: 'center', padding: '8px 12px 10px' }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: BLUE, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          CHHAVI NEETU TEXTILES LLP
        </div>
        <div style={{ fontSize: 10, marginTop: 3 }}>
          No.789, Kalampalayam, Andipalayam, Tirupur – 641 601,
        </div>
        <div style={{ fontSize: 10 }}>
          Phone&nbsp;: 96003 20779 &nbsp;•&nbsp; E-mail&nbsp;: chhavineetutextilesllp@gmail.com &nbsp;•&nbsp; GSTIN&nbsp;: 33AATFC5468D1ZC
        </div>
      </div>

      {/* ── DOCUMENT TITLE ── */}
      <div
        style={{
          border: BORDER,
          borderTop: 'none',
          textAlign: 'center',
          padding: '5px 0',
          fontWeight: 900,
          fontSize: 13,
          color: BLUE,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}
      >
        {isFabric ? 'FABRIC PURCHASE ORDER' : 'YARN PURCHASE ORDER'}
      </div>

      {/* ── METADATA TABLE ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: BORDER, borderTop: 'none' }}>
        <thead>
          <tr>
            {['P.O. NUMBER', 'HF CODE', 'AGENT', 'DATE', 'EXP. DELIVERY DATE'].map((h, i, arr) => (
              <th
                key={h}
                style={{ ...TH, borderTop: BORDER_THIN, borderRight: i < arr.length - 1 ? BORDER_THIN : 'none', borderLeft: 'none', borderBottom: BORDER_THIN, width: '20%' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {[data.poNumber || '—', data.hfCode || '—', data.agent || '—', fmtDate(data.date), fmtDate(data.deliveryDate)].map((v, i, arr) => (
              <td
                key={i}
                style={{ ...CELL, fontWeight: 600, borderLeft: 'none', borderRight: i < arr.length - 1 ? BORDER_THIN : 'none', borderTop: 'none', borderBottom: 'none' }}
              >
                {v}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* ── ADDRESS SECTION ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: BORDER, borderTop: 'none' }}>
        {/* Supplier */}
        <div style={{ borderRight: BORDER_THIN, padding: '6px 8px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
            SUPPLIER ADDRESS:
          </div>
          <div style={{ fontWeight: 800, fontSize: 11, color: BLUE }}>{data.supplierName || '—'}</div>
          <div style={{ fontSize: 10, whiteSpace: 'pre-wrap', lineHeight: 1.5, color: '#333', marginTop: 2 }}>{data.supplierAddress || '—'}</div>
          <div style={{ fontWeight: 700, fontSize: 10, marginTop: 4 }}>GSTIN : {data.supplierGST || '—'}</div>
        </div>
        {/* Delivery */}
        <div style={{ padding: '6px 8px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
            DELIVERY ADDRESS:
          </div>
          <div style={{ fontWeight: 800, fontSize: 11 }}>To : {data.deliveryName || '—'}</div>
          <div style={{ fontSize: 10, whiteSpace: 'pre-wrap', lineHeight: 1.5, color: '#333', marginTop: 2 }}>{data.deliveryAddress || '—'}</div>
          <div style={{ fontWeight: 700, fontSize: 10, marginTop: 4 }}>GSTIN : {data.deliveryGST || '—'}</div>
        </div>
      </div>

      {/* ── FABRIC SPECIFICATIONS (Grey Fabric only) ── */}
      {isFabric && (data.fabricType || data.fabricDia || data.fabricGsm) && (
        <div style={{ border: BORDER, borderTop: 'none', padding: '5px 8px', fontSize: 10 }}>
          <span style={{ fontWeight: 700, textDecoration: 'underline', marginRight: 12 }}>Fabric Specifications:</span>
          {data.fabricType && <span style={{ marginRight: 12 }}><b>Type:</b> {data.fabricType}</span>}
          {data.fabricColour && <span style={{ marginRight: 12 }}><b>Colour:</b> {data.fabricColour}</span>}
          {data.fabricDia && <span style={{ marginRight: 12 }}><b>Dia:</b> {data.fabricDia}</span>}
          {data.fabricGsm && <span><b>GSM:</b> {data.fabricGsm}</span>}
        </div>
      )}

      {/* ── "Please supply…" label ── */}
      <div style={{ border: BORDER, borderTop: 'none', padding: '4px 8px', fontSize: 10, fontStyle: 'italic' }}>
        Please supply the following items
      </div>

      {/* ── ITEMS TABLE ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: BORDER, borderTop: 'none', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '3.5%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '5.5%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '9.5%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '8.5%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '8.5%' }} />
          <col style={{ width: '9%' }} />
        </colgroup>
        <thead>
          <tr>
            {[
              'S.No.',
              'Description / Particulars',
              isFabric ? 'Fabric Type' : 'Count',
              isFabric ? 'Colour' : 'Quality',
              isFabric ? 'Rolls' : 'No. of Bags',
              isFabric ? 'Wt/Roll (kg)' : 'Bag Wt. (kg)',
              'Total Wt. (kg)',
              'Rate / Unit (₹)',
              'Taxable Amount (₹)',
              'CGST %',
              'CGST Amount (₹)',
              'SGST %',
              'SGST Amount (₹)',
              'Total Amount (₹)',
            ].map((h, i, arr) => (
              <th
                key={i}
                style={{
                  ...TH,
                  borderLeft: 'none',
                  borderTop: 'none',
                  borderRight: i < arr.length - 1 ? BORDER_THIN : 'none',
                  borderBottom: BORDER_THIN,
                  textAlign: i === 1 ? 'left' : 'center',
                  padding: '4px 3px',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Item rows */}
          {rows.map(({ item, taxable, cgstAmt, sgstAmt, total }, idx) => (
            <tr key={idx}>
              {[
                idx + 1,
                item.description || '—',
                item.count || '—',
                item.quality || '—',
                item.bags || 0,
                inr(Number(item.bagWeight)),
                inr(Number(item.totalWeight)),
                inr(Number(item.rate)),
                inr(taxable),
                `${item.cgst}%`,
                inr(cgstAmt),
                `${item.sgst}%`,
                inr(sgstAmt),
                inr(total),
              ].map((v, i, arr) => (
                <td
                  key={i}
                  style={{
                    ...CELL,
                    borderLeft: 'none',
                    borderRight: i < arr.length - 1 ? BORDER_THIN : 'none',
                    borderTop: 'none',
                    textAlign: i === 1 ? 'left' : 'center',
                    fontWeight: i === 1 || i === 13 ? 700 : 500,
                    fontSize: 10,
                  }}
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}

          {/* Filler rows */}
          {Array.from({ length: fillerCount }).map((_, idx) => (
            <tr key={`filler-${idx}`}>
              {Array.from({ length: 14 }).map((__, c, arr) => (
                <td
                  key={c}
                  style={{
                    ...CELL,
                    borderLeft: 'none',
                    borderRight: c < arr.length - 1 ? BORDER_THIN : 'none',
                    borderTop: 'none',
                    height: 24,
                  }}
                >
                  &nbsp;
                </td>
              ))}
            </tr>
          ))}

          {/* Grand Total row */}
          <tr style={{ background: '#eef2ff' }}>
            <td
              colSpan={8}
              style={{
                ...CELL,
                borderLeft: 'none',
                borderRight: BORDER_THIN,
                borderTop: BORDER_THIN,
                textAlign: 'right',
                fontWeight: 800,
                fontSize: 10,
                letterSpacing: '0.05em',
              }}
            >
              GRAND TOTAL
            </td>
            <td style={{ ...CELL, borderLeft: 'none', borderRight: BORDER_THIN, borderTop: BORDER_THIN, fontWeight: 800 }}>{inr(grandTaxable)}</td>
            <td style={{ ...CELL, borderLeft: 'none', borderRight: BORDER_THIN, borderTop: BORDER_THIN }}>&nbsp;</td>
            <td style={{ ...CELL, borderLeft: 'none', borderRight: BORDER_THIN, borderTop: BORDER_THIN, fontWeight: 800 }}>{inr(grandCGST)}</td>
            <td style={{ ...CELL, borderLeft: 'none', borderRight: BORDER_THIN, borderTop: BORDER_THIN }}>&nbsp;</td>
            <td style={{ ...CELL, borderLeft: 'none', borderRight: BORDER_THIN, borderTop: BORDER_THIN, fontWeight: 800 }}>{inr(grandSGST)}</td>
            <td style={{ ...CELL, borderLeft: 'none', borderRight: 'none', borderTop: BORDER_THIN, fontWeight: 800 }}>₹ {inr(grandTotal)}</td>
          </tr>
        </tbody>
      </table>

      {/* ── TOTAL BAGS / WEIGHT ── */}
      <div
        style={{
          border: BORDER,
          borderTop: 'none',
          padding: '5px 10px',
          fontWeight: 700,
          fontSize: 10,
          display: 'flex',
          gap: 32,
        }}
      >
        <span>Total No. of {isFabric ? 'Rolls' : 'Bags'}: {totalBags}</span>
        <span>|</span>
        <span>Total Weight: {inr(totalWeight)} kg</span>
      </div>

      {/* ── AMOUNT IN WORDS ── */}
      <div style={{ border: BORDER, borderTop: 'none', padding: '5px 10px', fontSize: 10 }}>
        <span style={{ fontWeight: 700, fontStyle: 'italic' }}>Amount in Words: </span>
        <span style={{ fontStyle: 'italic' }}>{numberToWords(grandTotal)}</span>
      </div>

      {/* ── TERMS & SIGNATURE ── */}
      <div className="terms-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: 10, fontSize: 10 }}>
        <div>
          <div style={{ fontWeight: 700, textDecoration: 'underline', textTransform: 'uppercase', marginBottom: 5 }}>
            Terms &amp; Conditions
          </div>
          <div>1. Goods once sold will not be taken back.</div>
          <div>2. Subject to Tirupur jurisdiction.</div>
          <div>3. E.&amp;O.E.</div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', paddingRight: 8, minHeight: 80 }}>
          <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>For CHHAVI NEETU TEXTILES LLP</div>
          <div>
            <div style={{ width: 160, borderBottom: '1px solid #000', marginBottom: 3 }} />
            <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 10 }}>Authorised Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}
