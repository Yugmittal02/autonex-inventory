import React, { useState } from 'react';

const MarginCalculator = ({ cardClass, commonInputClass }) => {
  const [marginInput, setMarginInput] = useState({ cost: '', sell: '', discount: 0, mode: 'profit' });

  return (
    <div className={cardClass}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xl">Profit & Margin</h3>
          <button onClick={() => setMarginInput({cost: '', sell: '', discount: 0, mode: marginInput.mode})} className="text-xs text-red-500 font-bold">RESET</button>
        </div>
        <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
           <button onClick={() => setMarginInput({...marginInput, mode: 'profit'})} className={`flex-1 py-2 rounded-md font-bold text-sm ${marginInput.mode === 'profit' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}>Profit Analysis</button>
           <button onClick={() => setMarginInput({...marginInput, mode: 'discount'})} className={`flex-1 py-2 rounded-md font-bold text-sm ${marginInput.mode === 'discount' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}>Discount Calc</button>
        </div>
        {marginInput.mode === 'profit' ? (
           <>
               <input type="number" placeholder="Buying Cost (₹)" className={commonInputClass} value={marginInput.cost} onChange={e => setMarginInput({...marginInput, cost: e.target.value})} />
               <input type="number" placeholder="Selling Price (₹)" className={commonInputClass} value={marginInput.sell} onChange={e => setMarginInput({...marginInput, sell: e.target.value})} />
               {marginInput.cost && marginInput.sell && (
                   <div className={`p-4 rounded-xl border mt-2 ${parseFloat(marginInput.sell) >= parseFloat(marginInput.cost) ? 'bg-green-50 text-green-900 border-green-200' : 'bg-red-50 text-red-900 border-red-200'}`}>
                      <div className="flex justify-between text-lg font-bold">
                         <span>Profit/Loss</span>
                         <span>₹{(parseFloat(marginInput.sell) - parseFloat(marginInput.cost)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1 opacity-80">
                         <span>Margin</span>
                         <span>{(((parseFloat(marginInput.sell) - parseFloat(marginInput.cost)) / parseFloat(marginInput.sell)) * 100).toFixed(2)}%</span>
                      </div>
                   </div>
               )}
           </>
        ) : (
           <>
               <input type="number" placeholder="Original Price (₹)" className={commonInputClass} value={marginInput.cost} onChange={e => setMarginInput({...marginInput, cost: e.target.value})} />
               <input type="number" placeholder="Discount %" className={commonInputClass} value={marginInput.discount} onChange={e => setMarginInput({...marginInput, discount: Number(e.target.value)})} />
               <div className="bg-purple-50 p-4 rounded-xl text-purple-900 border border-purple-100">
                  <div className="flex justify-between mb-1"><span>You Save</span> <span>₹{((parseFloat(marginInput.cost) * marginInput.discount) / 100 || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between text-xl font-bold border-t border-purple-200 pt-2 mt-2"><span>Payable</span> <span>₹{(parseFloat(marginInput.cost) - ((parseFloat(marginInput.cost) * marginInput.discount) / 100) || 0).toFixed(2)}</span></div>
               </div>
           </>
        )}
    </div>
  );
};
export default MarginCalculator;