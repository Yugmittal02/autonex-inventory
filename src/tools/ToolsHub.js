import React, { useState } from 'react';
import { FileText, Percent, Calculator, ArrowLeft, Pin, Languages } from 'lucide-react';
import InvoiceGenerator from './InvoiceGenerator';
import { convertToHindi } from '../utils/translator';
import { VoiceInput } from '../components/UIComponents';

export default function ToolsHub({ onBack, t, isDark, initialTool, pinnedTools, onTogglePin, shopDetails }) {
  const [activeTool, setActiveTool] = useState(initialTool);
  const [gstInput, setGstInput] = useState({ price: '', rate: 18, isReverse: false });
  const [transInput, setTransInput] = useState('');

  const renderTool = () => {
    switch(activeTool) {
      case 'invoice': return <InvoiceGenerator onBack={() => setActiveTool(null)} shopDetails={shopDetails} isDark={isDark} />;
      case 'translator': return (
        <div className="p-6">
            <button onClick={()=>setActiveTool(null)}><ArrowLeft/></button> <h3 className="font-bold text-xl mb-4">Translator</h3>
            <div className="flex gap-2 mb-2"><input className="w-full p-3 rounded border" placeholder="Type English..." value={transInput} onChange={e => setTransInput(e.target.value)} /><VoiceInput onResult={setTransInput} isDark={isDark} /></div>
            <div className="bg-yellow-50 p-4 border"><p className="text-2xl font-bold text-black">{convertToHindi(transInput)}</p></div>
        </div>
      );
      case 'gst': // Simplified GST for brevity
         return <div className="p-6"><button onClick={()=>setActiveTool(null)}><ArrowLeft/></button> <h3>GST Calculator</h3><p>Use existing logic here...</p></div>;
      default: return <div>Select a tool</div>;
    }
  };

  if (activeTool) return <div className={`fixed inset-0 z-[60] overflow-y-auto ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-black'}`}>{renderTool()}</div>;

  return (
    <div className={`fixed inset-0 z-[60] overflow-y-auto ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-black'}`}>
       <div className="p-4 border-b flex items-center gap-2"><button onClick={onBack}><ArrowLeft/></button> <h1 className="font-bold">Tools</h1></div>
       <div className="grid grid-cols-2 gap-4 p-4">
          <div onClick={() => setActiveTool('invoice')} className="p-6 border rounded-xl flex flex-col items-center gap-2"><FileText size={24}/><span>Invoice</span></div>
          <div onClick={() => setActiveTool('translator')} className="p-6 border rounded-xl flex flex-col items-center gap-2"><Languages size={24}/><span>Translator</span></div>
       </div>
    </div>
  );
}