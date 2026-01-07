import React, { useState } from 'react';
import { Copy } from 'lucide-react';

const GstCalculator = ({ cardClass, commonInputClass }) => {
  const [gstInput, setGstInput] = useState({ price: '', rate: 18, isReverse: false });
  
  const price = parseFloat(gstInput.price) || 0;
  let gstAmt = 0, finalAmt = 0, baseAmt = 0;
  
  if(gstInput.isReverse) {
    baseAmt = (price * 100) / (100 + gstInput.rate);
    gstAmt = price - baseAmt;
    finalAmt = price;
  } else {
    baseAmt = price;
    gstAmt = (price * gstInput.rate) / 100;
    finalAmt = price + gstAmt;
  }

  return (
    <div className={cardClass}>
      <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xl">GST Calculator</h3>
          <button onClick={() => setGstInput({...gstInput, isReverse: !gstInput.isReverse})} className={`text-xs px-3 py-1 rounded-full border ${gstInput.isReverse ? 'bg-green-100 text-green-700 border-green-500' : 'bg-gray-100 text-gray-600'}`}>
              {gstInput.isReverse ? "Inclusive (Reverse)" : "Exclusive (Add)"}
          </button>
      </div>
      <input
        type="text"
        inputMode="decimal"
        placeholder="Enter Amount (₹)"
        className={commonInputClass}
        value={gstInput.price}
        onChange={e => setGstInput({...gstInput, price: e.target.value})}
      />
      <div className="flex gap-2 mb-4">
        {[5, 12, 18, 28].map(r => (
          <button key={r} onClick={() => setGstInput({...gstInput, rate: r})} className={`flex-1 py-2 rounded-lg font-bold border ${gstInput.rate === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{r}%</button>
        ))}
      </div>
      <div className="bg-blue-50 p-4 rounded-xl text-blue-900 border border-blue-100 mb-4">
        <div className="flex justify-between mb-1 opacity-70 text-sm"><span>Base Amount</span> <span>₹{baseAmt.toFixed(2)}</span></div>
        <div className="flex justify-between mb-1"><span>GST ({gstInput.rate}%)</span> <span>₹{gstAmt.toFixed(2)}</span></div>
        <div className="flex justify-between text-2xl font-bold border-t border-blue-200 pt-2 mt-2"><span>Total</span> <span>₹{finalAmt.toFixed(2)}</span></div>
      </div>
      <button onClick={() => navigator.clipboard.writeText(`Base: ${baseAmt.toFixed(2)}\nGST: ${gstAmt.toFixed(2)}\nTotal: ${finalAmt.toFixed(2)}`)} className="w-full py-3 bg-gray-200 rounded-xl font-bold text-gray-700 flex items-center justify-center gap-2"><Copy size={16}/> Copy Result</button>
    </div>
  );
};
export default GstCalculator;