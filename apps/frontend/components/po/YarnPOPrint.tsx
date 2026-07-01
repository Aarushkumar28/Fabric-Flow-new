import type { YarnInward } from '@/types/entities';

// ── Indian number-to-words ────────────────────────────────────────────────────
function numberToIndianWords(n: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const t = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function chunk(num: number): string {
    let s = '';
    if (num >= 100) { s += ones[Math.floor(num / 100)] + ' Hundred '; num %= 100; }
    if (num >= 20)  { s += t[Math.floor(num / 10)] + ' '; num %= 10; if (num) s += ones[num] + ' '; }
    else if (num)   { s += ones[num] + ' '; }
    return s.trim();
  }

  if (!n) return 'Zero Only';
  const parts: string[] = [];
  let r = Math.round(n);
  const crore = Math.floor(r / 10000000); r %= 10000000;
  const lakh  = Math.floor(r / 100000);   r %= 100000;
  const thou  = Math.floor(r / 1000);     r %= 1000;
  if (crore) parts.push(chunk(crore) + ' Crore');
  if (lakh)  parts.push(chunk(lakh)  + ' Lakh');
  if (thou)  parts.push(chunk(thou)  + ' Thousand');
  if (r)     parts.push(chunk(r));
  return 'Rupees ' + parts.join(' ') + ' Only';
}

// ── Types ─────────────────────────────────────────────────────────────────────
type AddressParty = {
  id?: number;
  name: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstin?: string | null;
};

export interface YarnPOData extends Omit<YarnInward, 'mill' | 'deliveryKnitter'> {
  mill?: AddressParty | null;
  deliveryKnitter?: AddressParty | null;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function YarnPOPrint({ data }: { data: YarnPOData }) {
  const poNumber    = `PO-${String(data.id).padStart(4, '0')}`;
  const receiptDate = data.receiptDate
    ? new Date(data.receiptDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '\u2014';

  const totalWeight   = Number(data.totalWeight ?? 0);
  const ratePerKg     = Number(data.ratePerKg ?? 0);
  const taxableAmount = totalWeight * ratePerKg;
  const cgstAmount    = Number(data.cgstAmount ?? 0);
  const sgstAmount    = Number(data.sgstAmount ?? 0);
  const totalAmount   = Number(data.totalCost ?? (taxableAmount + cgstAmount + sgstAmount));
  const numBags       = Number(data.numBags ?? 0);
  const bagWeight     = Number(data.bagWeight ?? 0);
  const cgstRate      = Number(data.cgstRate ?? 2.5);
  const sgstRate      = Number(data.sgstRate ?? 2.5);

  const fmt = (v: number) =>
    v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const amountInWords = numberToIndianWords(Math.round(totalAmount));

  const BLUE = '#003087';
  const cell  = `border border-[${BLUE}] px-2 py-1 text-[11px]`;
  const hcell = `${cell} bg-[#e8eef7] font-semibold text-center`;

  const mill    = data.mill;
  const knitter = data.deliveryKnitter;

  return (
    <div
      id="po-print"
      style={{ fontFamily: 'Arial, sans-serif', color: '#000', background: '#fff' }}
      className="w-full p-5 text-[12px]"
    >
      <div style={{ border: `2px solid ${BLUE}` }}>

        {/* ── Company header ── */}
        <div style={{ borderBottom: `2px solid ${BLUE}` }} className="text-center py-3">
          <div style={{ color: BLUE }} className="text-[22px] font-extrabold tracking-widest uppercase">
            Chhavi Neetu Textiles LLP
          </div>
          <div className="text-[11px] mt-1">
            No. 789, Kalampalayam, Andipalayam, Tirupur &ndash; 641 601.
          </div>
          <div className="text-[11px]">
            Phone : 96003 20779 &nbsp;&bull;&nbsp; E-mail : chhavineetutextilesllp@gmail.com
            &nbsp;&bull;&nbsp; GSTIN : 33AAFC5466D1ZC
          </div>
        </div>

        {/* ── Title ── */}
        <div
          style={{ borderBottom: `2px solid ${BLUE}`, color: BLUE, backgroundColor: '#f0f4fb' }}
          className="text-center py-2 text-[14px] font-bold tracking-[6px] uppercase"
        >
          Yarn Purchase Order
        </div>

        {/* ── PO Meta row ── */}
        <div
          style={{ borderBottom: `1px solid ${BLUE}`, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}
          className="text-[11px]"
        >
          {[
            { label: 'P.O. Number', value: <strong style={{ color: BLUE }}>{poNumber}</strong> },
            { label: 'HF Code',     value: data.hfBatch || '\u2014' },
            { label: 'Agent',       value: '\u2014' },
            { label: 'Date',        value: <strong>{receiptDate}</strong> },
            { label: 'Exp. Delivery Date', value: '\u2014' },
          ].map((col, i, arr) => (
            <div
              key={col.label}
              className="p-2"
              style={i < arr.length - 1 ? { borderRight: `1px solid ${BLUE}` } : undefined}
            >
              <div className="text-[10px] text-gray-500 uppercase">{col.label}</div>
              <div>{col.value}</div>
            </div>
          ))}
        </div>

        {/* ── Addresses ── */}
        <div style={{ borderBottom: `1px solid ${BLUE}`, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {/* Supplier */}
          <div style={{ borderRight: `1px solid ${BLUE}` }} className="p-3 text-[11px] space-y-[2px]">
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Supplier Address:</div>
            <div style={{ color: BLUE }} className="font-bold text-[12px]">{mill?.name ?? '\u2014'}</div>
            {mill?.addressLine1 && <div>{mill.addressLine1}</div>}
            {mill?.addressLine2 && <div>{mill.addressLine2}</div>}
            {mill?.city && (
              <div>
                {mill.city}
                {mill.state ? `, ${mill.state}` : ''}
                {mill.pincode ? ` \u2013 ${mill.pincode}` : ''}
              </div>
            )}
            {mill?.gstin && <div className="font-semibold">GSTIN : {mill.gstin}</div>}
            <div style={{ color: BLUE }} className="mt-2 italic">Please supply the following items</div>
          </div>
          {/* Delivery */}
          <div className="p-3 text-[11px] space-y-[2px]">
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Delivery Address:</div>
            <div style={{ color: BLUE }} className="font-bold text-[12px]">To : {knitter?.name ?? '\u2014'}</div>
            {knitter?.addressLine1 && <div>{knitter.addressLine1}</div>}
            {knitter?.addressLine2 && <div>{knitter.addressLine2}</div>}
            {knitter?.city && (
              <div>
                {knitter.city}
                {knitter.state ? `, ${knitter.state}` : ''}
              </div>
            )}
            {knitter?.gstin && <div className="font-semibold">GSTIN : {knitter.gstin}</div>}
          </div>
        </div>

        {/* ── Items table ── */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} className="text-[11px]">
            <thead>
              <tr style={{ backgroundColor: '#e8eef7' }}>
                {['S.No.', 'Description / Particulars', 'Count', 'Quality',
                  'No. of Bags', 'Bag Wt. (kg)', 'Total Wt. (kg)',
                  'Rate / Unit (₹)', 'Taxable Amount (₹)',
                  'CGST %', 'CGST Amount (₹)', 'SGST %', 'SGST Amount (₹)', 'Total Amount (₹)'
                ].map(h => (
                  <th key={h} className={hcell}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${cell} text-center`}>1</td>
                <td className={cell}>{data.description || data.yarnQuality || data.remarks || 'Yarn'}</td>
                <td className={`${cell} text-center`}>{data.yarnCount || '\u2014'}</td>
                <td className={`${cell} text-center`}>{data.rlVl || '\u2014'}</td>
                <td className={`${cell} text-right`}>{numBags}</td>
                <td className={`${cell} text-right`}>{fmt(bagWeight)}</td>
                <td className={`${cell} text-right`}>{fmt(totalWeight)}</td>
                <td className={`${cell} text-right`}>{fmt(ratePerKg)}</td>
                <td className={`${cell} text-right font-semibold`}>{fmt(taxableAmount)}</td>
                <td className={`${cell} text-center`}>{cgstRate}%</td>
                <td className={`${cell} text-right`}>{fmt(cgstAmount)}</td>
                <td className={`${cell} text-center`}>{sgstRate}%</td>
                <td className={`${cell} text-right`}>{fmt(sgstAmount)}</td>
                <td className={`${cell} text-right font-bold`}>{fmt(totalAmount)}</td>
              </tr>
              {/* Empty filler rows */}
              {[2, 3, 4].map(row => (
                <tr key={row}>
                  {Array.from({ length: 14 }).map((_, j) => (
                    <td key={j} className={`${cell}`} style={{ height: '28px' }}>&nbsp;</td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f0f4fb', fontWeight: 'bold' }}>
                <td colSpan={8} className={`${cell} text-right tracking-widest`} style={{ color: BLUE }}>
                  GRAND TOTAL
                </td>
                <td className={`${cell} text-right`}>{fmt(taxableAmount)}</td>
                <td className={cell}></td>
                <td className={`${cell} text-right`}>{fmt(cgstAmount)}</td>
                <td className={cell}></td>
                <td className={`${cell} text-right`}>{fmt(sgstAmount)}</td>
                <td className={`${cell} text-right`} style={{ color: BLUE }}>&#8377; {fmt(totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── Summary bar ── */}
        <div style={{ borderTop: `1px solid ${BLUE}` }} className="px-3 py-2 text-[11px] font-semibold">
          Total No. of Bags:&nbsp;<span style={{ color: BLUE }}>{numBags}</span>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          Total Weight:&nbsp;<span style={{ color: BLUE }}>{fmt(totalWeight)} kg</span>
        </div>

        {/* ── Amount in words ── */}
        <div style={{ borderTop: `1px solid ${BLUE}`, backgroundColor: '#f9f9f9' }} className="px-3 py-2 text-[11px] italic">
          Amount in Words:&nbsp;<span className="font-bold not-italic">{amountInWords}</span>
        </div>

        {/* ── Footer ── */}
        <div
          style={{ borderTop: `2px solid ${BLUE}`, display: 'grid', gridTemplateColumns: '1fr 1fr' }}
          className="px-3 py-4 gap-4 text-[11px]"
        >
          <div>
            <div style={{ color: BLUE }} className="font-bold mb-1">TERMS &amp; CONDITIONS</div>
            <div>1. Goods once sold will not be taken back.</div>
            <div>2. Subject to Tirupur jurisdiction.</div>
            <div>3. E&amp;OE.</div>
          </div>
          <div className="text-right">
            <div style={{ color: BLUE }} className="font-bold">For CHHAVI NEETU TEXTILES LLP</div>
            <div
              className="mt-10 pt-1 inline-block"
              style={{ borderTop: '1px solid #000', minWidth: '180px' }}
            >
              Authorised Signatory
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
