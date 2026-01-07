import React, { useState } from 'react';
import { ArrowLeft, Share2, Plus } from 'lucide-react';

const InvoiceGenerator = ({ onBack, shopDetails, cardClass }) => {
  const [invCust, setInvCust] = useState({ name: '', phone: '' });
  const [invItems, setInvItems] = useState([]);
  const [invCurrentItem, setInvCurrentItem] = useState({ name: '', qty: 1, rate: 0, gst: 0 });

  const addInvItem = () => {
     if(!invCurrentItem.name || !invCurrentItem.rate) return;
     const total = invCurrentItem.qty * invCurrentItem.rate;
     const newItem = { ...invCurrentItem, id: Date.now(), total };
     setInvItems([...invItems, newItem]);
     setInvCurrentItem({ name: '', qty: 1, rate: 0, gst: 0 });
  };
  
  const calculateBillTotal = () => invItems.reduce((acc, curr) => acc + curr.total, 0);

  const shareInvoiceImage = async () => {
      // (HTML2Canvas Logic simplified for brevity - assumes html2canvas is loaded or installed)
      alert("Please ensure html2canvas is installed to use this feature.");
  };

  return (
      <div className={`${cardClass} overflow-y-auto`}>
         <div className="flex justify-between items-center mb-4 border-b pb-2">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100"><ArrowLeft size={20}/></button>
            <h3 className="font-bold text-xl">Invoice Pro</h3>
            <button onClick={shareInvoiceImage} className="p-2 bg-green-600 text-white rounded-lg flex items-center gap-1 text-sm font-bold shadow-md"><Share2 size={16}/> Share</button>
         </div>
         
         <div className="flex justify-center bg-gray-200 p-2 rounded-lg mb-4 overflow-hidden">
            <div className="bg-white text-black p-4 border shadow-xl rounded-sm text-xs w-full max-w-[320px]" id="invoice-area">
                <div className="text-center border-b-2 border-black pb-2 mb-2">
                    <h2 className="text-lg font-black uppercase tracking-wider">{shopDetails.shopName || "My Shop"}</h2>
                    <p className="text-[9px] uppercase">Invoice / Bill of Supply</p>
                </div>
                
                <div className="flex justify-between mb-2 text-[10px]">
                    <div><p><strong>To:</strong> {invCust.name}</p><p>{invCust.phone}</p></div>
                    <div className="text-right"><p>#{Date.now().toString().slice(-4)}</p><p>{new Date().toLocaleDateString()}</p></div>
                </div>

                <table className="w-full text-left mb-2 border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black text-[10px] uppercase">
                            <th className="py-1">Item</th><th className="py-1 text-center">Qty</th><th className="py-1 text-right">Price</th><th className="py-1 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="text-[10px]">
                        {invItems.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100">
                                <td className="py-1">{item.name}</td><td className="py-1 text-center">{item.qty}</td>
                                <td className="py-1 text-right">{item.rate}</td><td className="py-1 text-right">{(item.total).toFixed(0)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="flex justify-end border-t-2 border-black pt-2">
                    <p className="text-base font-bold">TOTAL: ₹ {calculateBillTotal().toFixed(2)}</p>
                </div>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-2 mb-4">
             <input className="p-2 border rounded" placeholder="Customer Name" value={invCust.name} onChange={e=>setInvCust({...invCust, name: e.target.value})} />
             <input className="p-2 border rounded" placeholder="Mobile" value={invCust.phone} onChange={e=>setInvCust({...invCust, phone: e.target.value})} />
         </div>

         <div className="bg-gray-50 p-3 rounded-lg border mb-4 text-black">
             <div className="flex gap-2 mb-2">
                 <input className="flex-[2] p-2 border rounded font-bold" placeholder="Item Name" value={invCurrentItem.name} onChange={e=>setInvCurrentItem({...invCurrentItem, name: e.target.value})} />
                                 <input
                                     type="text"
                                     inputMode="numeric"
                                     pattern="[0-9]*"
                                     className="flex-1 p-2 border rounded font-bold"
                                     placeholder="Qty"
                                     value={invCurrentItem.qty}
                                     onChange={e=>setInvCurrentItem({...invCurrentItem, qty: parseInt(e.target.value)||1})}
                                 />
             </div>
             <div className="flex gap-2 mb-2">
                                 <input
                                     type="text"
                                     inputMode="decimal"
                                     className="flex-1 p-2 border rounded"
                                     placeholder="Rate (₹)"
                                     value={invCurrentItem.rate || ''}
                                     onChange={e=>setInvCurrentItem({...invCurrentItem, rate: parseFloat(e.target.value)})}
                                 />
                 <button onClick={addInvItem} className="flex-1 bg-indigo-600 text-white rounded font-bold flex items-center justify-center gap-2"><Plus size={16}/> Add</button>
             </div>
         </div>
      </div>
  );
};
export default InvoiceGenerator;