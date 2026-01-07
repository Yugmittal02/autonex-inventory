import React, { useState } from 'react';

const Converter = ({ cardClass, commonInputClass, isDark }) => {
  const [convInput, setConvInput] = useState({ val: '', type: 'kgToTon' });
  const val = parseFloat(convInput.val) || 0;
  let res = 0;
  let unit = '';
  
  if(convInput.type === 'kgToTon') { res = val / 1000; unit = 'Tons'; }
  else if(convInput.type === 'tonToKg') { res = val * 1000; unit = 'KG'; }
  else if(convInput.type === 'oil') { res = val * 0.91; unit = 'KG (approx)'; } 
  else if(convInput.type === 'feetToM') { res = val * 0.3048; unit = 'Meters'; }

  return (
    <div className={cardClass}>
      <h3 className="font-bold mb-4 text-xl">Pro Converter</h3>
      <select className={commonInputClass} value={convInput.type} onChange={e => setConvInput({...convInput, type: e.target.value})}>
          <option value="kgToTon">KG to Tons</option>
          <option value="tonToKg">Tons to KG</option>
          <option value="oil">Liters to KG (Oil)</option>
          <option value="feetToM">Feet to Meters</option>
      </select>
      <input
        type="text"
        inputMode="decimal"
        placeholder="Enter Value"
        className={commonInputClass}
        value={convInput.val}
        onChange={e => setConvInput({ ...convInput, val: e.target.value })}
      />
      <div className={`p-6 rounded-xl font-mono text-3xl font-bold text-center mt-4 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
          {res.toFixed(3)} <span className="text-sm opacity-50">{unit}</span>
      </div>
    </div>
  );
};
export default Converter;