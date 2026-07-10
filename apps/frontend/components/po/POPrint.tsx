import type { YarnInward } from '@/types/entities';

// Simple Indian number-to-words helper (for amount in words)
function numberToIndianWords(n: number): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const big = ['', 'Thousand', 'Lakh', 'Crore'];

  function convertChunk(n: number): string {
    let str = '';
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
      if (n > 0) str += units[n] + ' ';
    } else if (n >= 10) {
      str += teens[n - 10] + ' ';
      n = 0;
    } else if (n > 0) {
      str += units[n] + ' ';
    }
    return str.trim();
  }

  if (n === 0) return 'Zero';
  const parts: string[] = [];
  let i = 0;
  while (n > 0) {
    const chunk = n % 1000;
    if (chunk > 0) {
      parts.unshift(convertChunk(chunk) + (big[i] ? ' ' + big[i] : ''));
    }
    n = Math.floor(n / 1000);
    i++;
  }
  return parts.join(' ') + ' Only';
}

interface POPrintProps {
  data: YarnInward & {
    mill?: { name: string; addressLine1?: string; addressLine2?: string; city?: string; state?: string; pincode?: string; gstin?: string } | null;
    deliveryKnitter?: { name: string; addressLine1?: string; addressLine2?: string; city?: string; state?: string; pincode?: string; gstin?: string } | null;
  };
}

export default function POPrint({ data }: POPrintProps) {
  const poNumber = `PO-YI-${data.id}`;
  const receiptDate = data.receiptDate ? new Date(data.receiptDate).toLocaleDateString('en-IN') : '';
  const taxableAmount = data.totalWeight * (data.ratePerKg ?? 0);
  const totalAmount = data.totalCost ?? (taxableAmount + (data.cgstAmount ?? 0) + (data.sgstAmount ?? 0));
  const totalBags = data.numBags ?? 0;
  const totalWeight = data.totalWeight;

  const amountInWords = numberToIndianWords(totalAmount);

  // Helper to format number with commas (Indian style)
  const formatINR = (val: number) => val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div id="po-print" className="p-8 bg-white text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Company Header */}
      <div className="text-center font-bold text-lg">CHHAVI NEETU TEXTILES LLP</div>
      <div className="text-center text-sm">No. 789, Kalampalayam, Andipalayam, Tirupur – 641 601.</div>
      <div className="text-center text-sm">Phone : 96003 20779 • E-mail : chhavineetutextilesllp@gmail.com • GSTIN : 33AAFC5466D1ZC</div>
      <hr className="my-1 border-2 border-black" />
      <hr className="my-1 border-2 border-black" />

      {/* Title */}
      <div className="text-center font-bold text-lg my-2">YARN PURCHASE ORDER</div>
      <hr className="my-1 border-2 border-black" />
      <hr className="my-1 border-2 border-black" />

      {/* Meta Data Grid */}
      <div className="grid grid-cols-5 border border-black text-xs mt-2">
        <div className="border-r border-black p-1 font-bold">P.O. NUMBER</div>
        <div className="border-r border-black p-1">{poNumber}</div>
        <div className="border-r border-black p-1 font-bold">HF CODE</div>
        <div className="border-r border-black p-1">{data.hfBatch || '--'}</div>
        <div className="p-1 font-bold">AGENT</div>
        <div className="border-r border-black p-1">--</div>
        <div className="border-r border-black p-1 font-bold">DATE</div>
        <div className="border-r border-black p-1">{receiptDate}</div>
        <div className="p-1 font-bold">EXP. DELIVERY DATE</div>
        <div className="border-r border-black p-1">--</div>
      </div>
      <hr className="my-1 border-2 border-black" />

      {/* Addresses */}
      <div className="grid grid-cols-2 gap-4 text-xs mt-2">
        <div>
          <div className="font-bold">SUPPLIER ADDRESS:</div>
          <div>{data.mill?.name}</div>
          {data.mill?.addressLine1 && <div>{data.mill.addressLine1}</div>}
          {data.mill?.addressLine2 && <div>{data.mill.addressLine2}</div>}
          {data.mill?.city && <div>{data.mill.city}, {data.mill.state} {data.mill.pincode}</div>}
          {data.mill?.gstin && <div>GSTIN : {data.mill.gstin}</div>}
          <div className="mt-1 italic">Please supply the following items</div>
        </div>
        <div>
          <div className="font-bold">DELIVERY ADDRESS:</div>
          <div>To : {data.deliveryKnitter?.name}</div>
          {data.deliveryKnitter?.addressLine1 && <div>{data.deliveryKnitter.addressLine1}</div>}
          {data.deliveryKnitter?.addressLine2 && <div>{data.deliveryKnitter.addressLine2}</div>}
          {data.deliveryKnitter?.city && <div>{data.deliveryKnitter.city}, {data.deliveryKnitter.state} {data.deliveryKnitter.pincode}</div>}
          {data.deliveryKnitter?.gstin && <div>GSTIN : {data.deliveryKnitter.gstin}</div>}
        </div>
      </div>
      <hr className="my-1 border-2 border-black" />

      {/* Main Items Table */}
      <table className="w-full border-collapse border border-black text-xs mt-2">
        <thead>
          <tr className="font-bold underline">
            <th className="border border-black p-1">S.No.</th>
            <th className="border border-black p-1">Description / Particulars</th>
            <th className="border border-black p-1">Count</th>
            <th className="border border-black p-1">Quality</th>
            <th className="border border-black p-1">No. of Bags</th>
            <th className="border border-black p-1">Bag Wt. (kg)</th>
            <th className="border border-black p-1">Total Wt. (kg)</th>
            <th className="border border-black p-1">Rate / Unit (₹)</th>
            <th className="border border-black p-1">Taxable Amount (₹)</th>
            <th className="border border-black p-1">CGST %</th>
            <th className="border border-black p-1">CGST Amount (₹)</th>
            <th className="border border-black p-1">SGST %</th>
            <th className="border border-black p-1">SGST Amount (₹)</th>
            <th className="border border-black p-1">Total Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-1 text-center">1</td>
            <td className="border border-black p-1">{data.yarnQuality || data.remarks || 'Yarn'}</td>
            <td className="border border-black p-1">{data.yarnCount || '--'}</td>
            <td className="border border-black p-1">{data.rlVl || '--'}</td>
            <td className="border border-black p-1 text-right">{totalBags}</td>
            <td className="border border-black p-1 text-right">{formatINR(data.bagWeight ?? 0)}</td>
            <td className="border border-black p-1 text-right">{formatINR(totalWeight)}</td>
            <td className="border border-black p-1 text-right">{formatINR(data.ratePerKg ?? 0)}</td>
            <td className="border border-black p-1 text-right">{formatINR(taxableAmount)}</td>
            <td className="border border-black p-1 text-center">{data.cgstRate}%</td>
            <td className="border border-black p-1 text-right">{formatINR(data.cgstAmount ?? 0)}</td>
            <td className="border border-black p-1 text-center">{data.sgstRate}%</td>
            <td className="border border-black p-1 text-right">{formatINR(data.sgstAmount ?? 0)}</td>
            <td className="border border-black p-1 text-right">{formatINR(totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      {/* Grand Total Row */}
      <div className="flex border border-black text-xs mt-2">
        <div className="border-r border-black p-1 font-bold w-1/4">GRAND TOTAL</div>
        <div className="border-r border-black p-1 flex-1"></div>
        <div className="border-r border-black p-1 text-right font-bold w-1/6">Taxable Amount: {formatINR(taxableAmount)}</div>
        <div className="border-r border-black p-1 text-right font-bold w-1/6">CGST Total: {formatINR(data.cgstAmount ?? 0)}</div>
        <div className="border-r border-black p-1 text-right font-bold w-1/6">SGST Total: {formatINR(data.sgstAmount ?? 0)}</div>
        <div className="p-1 text-right font-bold w-1/6">Total Amount: ₹{formatINR(totalAmount)}</div>
      </div>

      {/* Summary */}
      <div className="text-xs mt-2">
        <div>Total No. of Bags: {totalBags} | Total Weight: {formatINR(totalWeight)} kg</div>
        <div>Amount in Words: Rupees {amountInWords}</div>
      </div>

      {/* Footer */}
      <hr className="my-2 border-2 border-black" />
      <div className="flex justify-between text-xs mt-2">
        <div>
          <div className="font-bold">TERMS & CONDITIONS</div>
          <div>Goods once sold will not be taken back.</div>
          <div>Subject to Tirupur jurisdiction.</div>
          <div>E&OE.</div>
        </div>
        <div className="text-right">
          <div className="font-bold">For CHHAVI NEETU TEXTILES LLP</div>
          <div className="mt-8">________________________</div>
          <div>Authorised Signatory</div>
        </div>
      </div>

      {/* Border around entire PO */}
      <div className="fixed inset-0 border-2 border-black pointer-events-none" style={{ zIndex: -1 }}></div>
    </div>
  );
}
