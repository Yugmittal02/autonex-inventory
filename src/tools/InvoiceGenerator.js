import React, { useState } from 'react';
import { ArrowLeft, Share2, Plus } from 'lucide-react';

export default function InvoiceGenerator({ onBack, shopDetails, isDark }) {
  const [invCust, setInvCust] = useState({ name: '', phone: '', address: '' });
  const [invItems, setInvItems] = useState([]);
  const [invCurrentItem, setInvCurrentItem] = useState({ name: '', qty: 1, rate: 0, gst: 0 });

  const shareInvoiceImage = async () => {
    if (!window.html2canvas) {
        const script = document.createElement('script');
        script.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js";
        document.head.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
    }
    const element = document.getElementById('invoice-area');
    if (!element) return;
    setTimeout(async () => {
        try {
            const canvas = await window.html2canvas(element, { backgroundColor: '#ffffff', scale: 2 });
            canvas.toBlob(async (blob) => {
                if (!blob) return alert("Error creating image");
                const file = new File([blob], `invoice_${Date.now()}.png`, { type: "image/png" });
                if (navigator.share) {
                    try { await navigator.share({ files: [file], title: 'Invoice' }); } catch (err) { const link = document.createElement('a'); link.href = canvas.toDataURL(); link.download = `Invoice_${Date.now()}.png`; link.click(); }
                } else {
                    const link = document.createElement('a'); link.href = canvas.toDataURL(); link.download = `Invoice_${Date.now()}.png`; link.click();
                }
            }, 'image/png');
        } catch (error) { alert("Failed to generate image."); }
    }, 100);
  };

  const calculateBillTotal = () => invItems.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className={`p-6 rounded-2xl shadow-lg border h-full flex flex-col ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
       <div className="flex justify-between items-center mb-4 border-b pb-2">
          <button onClick={onBack}><ArrowLeft size={20}/></button>
          <h3 className="font-bold text-xl">Invoice Pro</h3>
          <button onClick={shareInvoiceImage} className="p-2 bg-green-600 text-white rounded"><Share2 size={16}/></button>
       </div>
       <div className="flex justify-center bg-gray-200 p-2 rounded-lg mb-4 overflow-hidden">
          <div className="bg-white text-black p-4 border shadow-xl rounded-sm text-xs w-full max-w-[320px]" id="invoice-area">
              <div className="text-center border-b-2 border-black pb-2 mb-2"><h2 className="text-lg font-black uppercase tracking-wider">{shopDetails.shopName || "My Shop"}</h2><p className="text-[9px] uppercase">Invoice</p></div>
              <div className="flex justify-between mb-2 text-[10px]"><div><p><strong>To:</strong> {invCust.name}</p><p>{invCust.phone}</p></div><div className="text-right"><p>#{Date.now().toString().slice(-4)}</p></div></div>
              <table className="w-full text-left mb-2 border-collapse"><thead><tr className="border-b-2 border-black text-[10px] uppercase"><th className="py-1">Item</th><th className="py-1 text-center">Qty</th><th className="py-1 text-right">Price</th><th className="py-1 text-right">Total</th></tr></thead><tbody className="text-[10px]">{invItems.map((item) => (<tr key={item.id} className="border-b border-gray-100"><td className="py-1">{item.name}</td><td className="py-1 text-center">{item.qty}</td><td className="py-1 text-right">{item.rate}</td><td className="py-1 text-right">{(item.total).toFixed(0)}</td></tr>))}</tbody></table>
              <div className="flex justify-end border-t-2 border-black pt-2"><div className="text-right"><p className="text-base font-bold">TOTAL: ₹ {calculateBillTotal().toFixed(2)}</p></div></div>
          </div>
       </div>
       <div className="grid grid-cols-2 gap-2 mb-4"><input className="p-2 border rounded" placeholder="Customer Name" value={invCust.name} onChange={e=>setInvCust({...invCust, name: e.target.value})} /><input className="p-2 border rounded" placeholder="Mobile" value={invCust.phone} onChange={e=>setInvCust({...invCust, phone: e.target.value})} /></div>
       <div className="bg-gray-50 p-3 rounded-lg border mb-4 text-black">
           <div className="flex gap-2 mb-2"><input className="flex-[2] p-2 border rounded font-bold" placeholder="Item Name" value={invCurrentItem.name} onChange={e=>setInvCurrentItem({...invCurrentItem, name: e.target.value})} /><input type="number" className="flex-1 p-2 border rounded font-bold" placeholder="Qty" value={invCurrentItem.qty} onChange={e=>setInvCurrentItem({...invCurrentItem, qty: parseInt(e.target.value)||1})} /></div>
           <div className="flex gap-2 mb-2"><input type="number" className="flex-1 p-2 border rounded" placeholder="Rate (₹)" value={invCurrentItem.rate || ''} onChange={e=>setInvCurrentItem({...invCurrentItem, rate: parseFloat(e.target.value)})} /><button onClick={() => { if(!invCurrentItem.name || !invCurrentItem.rate) return; const t = invCurrentItem.qty*invCurrentItem.rate; setInvItems([...invItems, {...invCurrentItem, id: Date.now(), total: t}]); setInvCurrentItem({name:'', qty:1, rate:0, gst:0}); }} className="flex-1 bg-indigo-600 text-white rounded font-bold flex items-center justify-center gap-2"><Plus size={16}/> Add</button></div>
       </div>
    </div>
  );
}