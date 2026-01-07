import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Bold,
  Calculator,
  Calendar,
  ChevronRight,
  Circle as CircleIcon,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  Eraser,
  FileText,
  Highlighter,
  Italic,
  Languages,
  Minus,
  Package,
  PenTool,
  Percent,
  Phone,
  Pin,
  Plus,
  RefreshCcw,
  Search,
  Share2,
  StickyNote,
  Store,
  Trash2,
  Type,
  Underline,
  X,
  Zap,
} from 'lucide-react';

import { VoiceInput } from '../features/voice/VoiceInput';
import { convertToHindiFallback, translateWithAPI, transliterateWithGoogle } from '../utils/translationService';

type ToolsHubProps = {
  onBack: () => void;
  t: (key: string) => string;
  isDark: boolean;
  initialTool?: string | null;
  pinnedTools: string[];
  onTogglePin: (toolId: string) => void;
  shopDetails: any;
  pages: any[];
};

const ToolsHub = ({
  onBack,
  t,
  isDark,
  initialTool = null,
  pinnedTools,
  onTogglePin,
  shopDetails,
  pages,
}: ToolsHubProps) => {
  const [activeTool, setActiveTool] = useState(initialTool);
  const [invoiceNumber] = useState(() => Date.now().toString().slice(-4));
  const [gstInput, setGstInput] = useState({ price: '', rate: 18, isReverse: false });
  const [marginInput, setMarginInput] = useState({ cost: '', sell: '', discount: 0, mode: 'profit', markup: '' });
  const [convInput, setConvInput] = useState({ val: '', type: 'kgToTon' });
  const [transInput, setTransInput] = useState('');
  const [transOutput, setTransOutput] = useState('');
  const [transLoading, setTransLoading] = useState(false);
  const [transLang, setTransLang] = useState({ from: 'en', to: 'hi' });
  const [transHistory, setTransHistory] = useState<any[]>([]);

  // ?? INVOICE GENERATOR STATE (ENHANCED)
  const [invCust, setInvCust] = useState({ name: '', phone: '', address: '', gstNo: '' });
  const [invItems, setInvItems] = useState<any[]>([]);
  const [invCurrentItem, setInvCurrentItem] = useState({
    name: '',
    qty: 1,
    rate: 0,
    gst: 18,
    unit: 'pcs',
  });
  const [invSettings, setInvSettings] = useState({
    showGst: true,
    invoiceType: 'retail', // retail, gst, estimate
    paymentMode: 'cash',
    notes: '',
    discount: 0,
    discountType: 'flat', // flat, percent
  });

  // ?? EMI CALCULATOR STATE
  const [emiInput, setEmiInput] = useState({ principal: '', rate: '', tenure: '', tenureType: 'months' });

  // ?? NOTEPAD STATE (RICH TEXT UPGRADE)
  const [notesView, setNotesView] = useState('list');
  const [notes, setNotes] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('proNotes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });
  const [currentNote, setCurrentNote] = useState<any>({
    id: null,
    title: '',
    body: '',
    date: '',
    sketch: null,
    category: 'general',
  });
  const [noteSearch, setNoteSearch] = useState('');
  const [noteCategory] = useState('all');

  const [noteMode, setNoteMode] = useState('text');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contentEditableRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushType, setBrushType] = useState('pencil');
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // ?? STOCK VALUE CALCULATOR
  const [stockCalc, setStockCalc] = useState<any>({ items: [], newItem: { name: '', qty: 0, rate: 0 } });

  // PHONE-STYLE CALCULATOR
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcStored, setCalcStored] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<'+' | '-' | '*' | '/' | null>(null);
  const [calcWaiting, setCalcWaiting] = useState(false);

  useEffect(() => {
    localStorage.setItem('proNotes', JSON.stringify(notes));
  }, [notes]);

  // (noteCategory currently unused but preserved for parity with inline version)
  void noteCategory;

  const tools = [
    {
      id: 'invoice',
      name: 'Bill Generator',
      icon: <FileText size={24} />,
      color: 'bg-indigo-100 text-indigo-600',
      desc: 'GST & Retail Bills',
    },
    {
      id: 'gst',
      name: 'GST Pro',
      icon: <Percent size={24} />,
      color: 'bg-blue-100 text-blue-600',
      desc: 'Calculate GST',
    },
    {
      id: 'margin',
      name: 'Profit Analyzer',
      icon: <Calculator size={24} />,
      color: 'bg-purple-100 text-purple-600',
      desc: 'Margin & Markup',
    },
    {
      id: 'calculator',
      name: 'Calculator',
      icon: <Calculator size={24} />,
      color: 'bg-slate-100 text-slate-700',
      desc: 'Basic Phone Calc',
    },
    {
      id: 'emi',
      name: 'EMI Calculator',
      icon: <DollarSign size={24} />,
      color: 'bg-emerald-100 text-emerald-600',
      desc: 'Loan EMI Calc',
    },
    {
      id: 'converter',
      name: 'Unit Convert',
      icon: <RefreshCcw size={24} />,
      color: 'bg-green-100 text-green-600',
      desc: 'KG, Tons, Feet',
    },
    {
      id: 'stockvalue',
      name: 'Stock Value',
      icon: <Activity size={24} />,
      color: 'bg-cyan-100 text-cyan-600',
      desc: 'Inventory Worth',
    },
    {
      id: 'card',
      name: 'Digital Card',
      icon: <CreditCard size={24} />,
      color: 'bg-orange-100 text-orange-600',
      desc: 'Business Card',
    },
    {
      id: 'notes',
      name: 'Note Master',
      icon: <StickyNote size={24} />,
      color: 'bg-yellow-100 text-yellow-600',
      desc: 'Smart Notes',
    },
    {
      id: 'translator',
      name: 'AI Translator',
      icon: <Languages size={24} />,
      color: 'bg-pink-100 text-pink-600',
      desc: 'Multi-Language',
    },
  ];

  const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'mr', name: 'Marathi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'bn', name: 'Bengali' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'ur', name: 'Urdu' },
    { code: 'ar', name: 'Arabic' },
  ];

  // ?? API TRANSLATION / TRANSLITERATION HANDLER
  const handleTranslate = async () => {
    if (!transInput.trim()) return;
    setTransLoading(true);

    try {
      let result = '';

      // Hindi output: users typically expect translation (not only transliteration).
      // Flow: translate -> transliterate -> offline fallback.
      if (transLang.to === 'hi') {
        result = await translateWithAPI(transInput, transLang.from, transLang.to);
        if (!result || result.trim().toLowerCase() === transInput.trim().toLowerCase()) {
          const translit = await transliterateWithGoogle(transInput);
          result = translit && translit.trim() !== transInput.trim() ? translit : convertToHindiFallback(transInput);
        }
      } else {
        result = await translateWithAPI(transInput, transLang.from, transLang.to);
      }

      setTransOutput(result);
      setTransHistory(prev => [{ input: transInput, output: result, from: transLang.from, to: transLang.to }, ...prev.slice(0, 9)]);
    } catch {
      setTransOutput('Translation failed. Please try again.');
    }
    setTransLoading(false);
  };

  const swapLanguages = () => {
    setTransLang({ from: transLang.to, to: transLang.from });
    setTransInput(transOutput);
    setTransOutput('');
  };

  // --- INVOICE FUNCTIONS (ENHANCED) ---
  const addInvItem = () => {
    if (!invCurrentItem.name || !invCurrentItem.rate) return;
    const baseTotal = invCurrentItem.qty * invCurrentItem.rate;
    const gstAmt = invSettings.showGst ? (baseTotal * invCurrentItem.gst) / 100 : 0;
    const newItem = {
      ...invCurrentItem,
      id: Date.now(),
      baseTotal,
      gstAmt,
      total: baseTotal + gstAmt,
    };
    setInvItems([...invItems, newItem]);
    setInvCurrentItem({ name: '', qty: 1, rate: 0, gst: 18, unit: 'pcs' });
  };

  const calcInputDigit = (digit: string) => {
    setCalcDisplay((prev) => {
      if (prev === 'Error') {
        setCalcWaiting(false);
        return digit;
      }
      if (calcWaiting) {
        setCalcWaiting(false);
        return digit;
      }
      if (prev === '0') return digit;
      // simple length guard for mobile
      if (prev.replace('-', '').replace('.', '').length >= 14) return prev;
      return prev + digit;
    });
  };

  const calcInputDot = () => {
    setCalcDisplay((prev) => {
      if (calcWaiting) {
        setCalcWaiting(false);
        return '0.';
      }
      if (prev.includes('.')) return prev;
      return prev + '.';
    });
  };

  const calcClear = () => {
    setCalcDisplay('0');
    setCalcStored(null);
    setCalcOp(null);
    setCalcWaiting(false);
  };

  const calcBackspace = () => {
    setCalcDisplay((prev) => {
      if (calcWaiting) return prev;
      if (prev === 'Error') return '0';
      if (prev.length <= 1) return '0';
      const next = prev.slice(0, -1);
      if (next === '-' || next === '') return '0';
      return next;
    });
  };

  const calcToggleSign = () => {
    setCalcDisplay((prev) => {
      if (prev === '0') return prev;
      return prev.startsWith('-') ? prev.slice(1) : `-${prev}`;
    });
  };

  const calcPercent = () => {
    const value = parseFloat(calcDisplay);
    if (Number.isNaN(value)) return;

    // Phone-style: if there's a stored value + pending operator, treat current as percent of stored.
    const base = calcStored !== null && calcOp ? calcStored : null;
    const result = base !== null ? (base * value) / 100 : value / 100;
    setCalcDisplay(formatCalcNumber(result));
  };

  const formatCalcNumber = (n: number) => {
    if (!Number.isFinite(n)) return 'Error';
    // Keep display readable on mobile; avoid long floating tails.
    const abs = Math.abs(n);
    let s = abs >= 1e12 ? n.toExponential(6) : n.toString();

    // Round typical float noise (e.g. 0.30000000000000004)
    if (!s.includes('e')) {
      const rounded = Math.round(n * 1e10) / 1e10;
      s = rounded.toString();
    }

    // Trim trailing zeros
    if (s.includes('.')) s = s.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    return s;
  };

  const calcCompute = (a: number, b: number, op: NonNullable<typeof calcOp>) => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        return b === 0 ? NaN : a / b;
    }
  };

  const calcSetOperator = (op: NonNullable<typeof calcOp>) => {
    const inputValue = parseFloat(calcDisplay);
    if (Number.isNaN(inputValue)) return;

    // If user taps another operator while waiting for next number, just change operator.
    if (calcWaiting && calcStored !== null) {
      setCalcOp(op);
      return;
    }

    if (calcStored === null) {
      setCalcStored(inputValue);
      setCalcOp(op);
      setCalcWaiting(true);
      return;
    }

    if (calcOp) {
      const result = calcCompute(calcStored, inputValue, calcOp);
      const next = Number.isFinite(result) ? result : NaN;
      const formatted = formatCalcNumber(next);
      setCalcDisplay(formatted);
      setCalcStored(formatted === 'Error' ? null : (parseFloat(formatted) as any));
    }

    setCalcOp(op);
    setCalcWaiting(true);
  };

  const calcEquals = () => {
    const inputValue = parseFloat(calcDisplay);
    if (calcStored === null || !calcOp || Number.isNaN(inputValue)) return;
    const result = calcCompute(calcStored, inputValue, calcOp);
    const formatted = formatCalcNumber(Number.isFinite(result) ? result : NaN);
    setCalcDisplay(formatted);
    setCalcStored(null);
    setCalcOp(null);
    setCalcWaiting(true);
  };

  const deleteInvItem = (id: number) => setInvItems(invItems.filter(i => i.id !== id));

  const calculateBillTotals = () => {
    const subtotal = invItems.reduce((acc, curr) => acc + curr.baseTotal, 0);
    const totalGst = invItems.reduce((acc, curr) => acc + curr.gstAmt, 0);
    const discountAmt =
      invSettings.discountType === 'percent' ? (subtotal * invSettings.discount) / 100 : invSettings.discount;
    const grandTotal = subtotal + totalGst - discountAmt;
    return { subtotal, totalGst, discountAmt, grandTotal };
  };

  const calculateBillTotal = () => calculateBillTotals().grandTotal;
  void calculateBillTotal;

  const shareInvoiceImage = async () => {
    if (!window.html2canvas) {
      const script = document.createElement('script');
      script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
      document.head.appendChild(script);
      await new Promise(resolve => (script.onload = resolve as any));
    }

    const element = document.getElementById('invoice-area');
    if (!element) return;

    setTimeout(async () => {
      try {
        const canvas = await window.html2canvas!(element, { backgroundColor: '#ffffff', scale: 2 });
        canvas.toBlob(
          async blob => {
            if (!blob) return alert('Error creating image');
            const file = new File([blob], `invoice_${Date.now()}.png`, { type: 'image/png' });

            if (navigator.share) {
              try {
                await navigator.share({
                  files: [file],
                  title: 'Invoice',
                  text: `Invoice from ${shopDetails.shopName}`,
                });
              } catch (err) {
                console.warn('Share API failed, falling back to download', err);
                const link = document.createElement('a');
                link.href = canvas.toDataURL();
                link.download = `Invoice_${Date.now()}.png`;
                link.click();
              }
            } else {
              const link = document.createElement('a');
              link.href = canvas.toDataURL();
              link.download = `Invoice_${Date.now()}.png`;
              link.click();
              alert('Invoice Image Downloaded!');
            }
          },
          'image/png'
        );
      } catch (error) {
        console.error(error);
        alert('Failed to generate image.');
      }
    }, 100);
  };

  // --- NOTEPAD FUNCTIONS ---
  const sanitizeNoteHtml = (rawHtml: unknown): string => {
    const html = rawHtml === null || rawHtml === undefined ? '' : String(rawHtml);
    if (!html) return '';

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Remove dangerous nodes completely
      doc
        .querySelectorAll(
          'script, iframe, object, embed, link, meta, style, svg, math, form, input, textarea, select, option, button'
        )
        .forEach(n => n.remove());

      const allowedTags = new Set([
        'div',
        'p',
        'br',
        'span',
        'b',
        'strong',
        'i',
        'em',
        'u',
        'ul',
        'ol',
        'li',
        'blockquote',
        'pre',
        'code',
        'a',
        'img',
      ]);

      const unwrapElement = (el: Element) => {
        const parent = el.parentNode;
        if (!parent) return;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      };

      const allowedStyleProps = new Set(['background-color', 'color', 'font-weight', 'font-style', 'text-decoration']);

      const all = Array.from(doc.body.querySelectorAll('*'));
      all.forEach(el => {
        const tag = el.tagName.toLowerCase();

        const originalHref = el.getAttribute('href') || '';
        const originalSrc = el.getAttribute('src') || '';
        const originalAlt = el.getAttribute('alt') || '';

        // Allowlist tags; unwrap unknown tags to preserve text/children
        if (!allowedTags.has(tag)) {
          unwrapElement(el);
          return;
        }

        // Drop inline event handlers + risky URLs
        [...el.attributes].forEach(attr => {
          const name = attr.name.toLowerCase();

          if (name.startsWith('on')) {
            el.removeAttribute(attr.name);
            return;
          }

          // Remove all attributes by default; add back safe ones below
          if (name !== 'style') el.removeAttribute(attr.name);
        });

        // Tag-specific safe attributes
        if (tag === 'a') {
          const href = originalHref.trim();
          const hrefLower = href.toLowerCase();
          const ok =
            hrefLower.startsWith('https://') ||
            hrefLower.startsWith('http://') ||
            hrefLower.startsWith('mailto:') ||
            hrefLower.startsWith('tel:') ||
            hrefLower.startsWith('#');
          if (ok && !hrefLower.startsWith('javascript:')) {
            el.setAttribute('href', href);
          } else {
            el.removeAttribute('href');
          }
        }

        if (tag === 'img') {
          const src = originalSrc.trim();
          const srcLower = src.toLowerCase();
          const ok = srcLower.startsWith('data:image/') || srcLower.startsWith('https://') || srcLower.startsWith('http://');
          if (!ok) {
            el.remove();
            return;
          }
          el.setAttribute('src', src);
          const alt = originalAlt.trim();
          if (alt) el.setAttribute('alt', alt);
        }

        // Restrict style to a small safe subset
        const style = el.getAttribute('style');
        if (style) {
          const safeParts: string[] = [];
          style
            .split(';')
            .map(s => s.trim())
            .filter(Boolean)
            .forEach(decl => {
              const idx = decl.indexOf(':');
              if (idx === -1) return;
              const prop = decl.slice(0, idx).trim().toLowerCase();
              const val = decl.slice(idx + 1).trim();
              if (!allowedStyleProps.has(prop)) return;
              if (/url\(/i.test(val)) return;
              safeParts.push(`${prop}: ${val}`);
            });

          if (safeParts.length) el.setAttribute('style', safeParts.join('; '));
          else el.removeAttribute('style');
        }

        // Prevent accidental contentEditable paste from introducing huge inline blobs
        if (tag === 'img') {
          const src = (el.getAttribute('src') || '').trim();
          if (src.toLowerCase().startsWith('data:image/') && src.length > 2_000_000) {
            el.remove();
          }
        }
      });

      return doc.body.innerHTML;
    } catch {
      // Fallback: strip tags
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || '';
    }
  };

  // Rich Text Formatting Helper
  const execFormat = (command: string, value: string | null = null) => {
    document.execCommand(command, false, value);
    if (contentEditableRef.current) contentEditableRef.current.focus();
  };

  const saveCurrentNote = () => {
    // Get HTML from contentEditable for text mode
    let bodyContent = currentNote.body;
    if (noteMode === 'text' && contentEditableRef.current) {
      bodyContent = sanitizeNoteHtml(contentEditableRef.current.innerHTML);
    }

    if (!currentNote.title && !bodyContent && !currentNote.sketch) {
      setNotesView('list');
      return;
    }

    let sketchData = currentNote.sketch;
    if (canvasRef.current && noteMode === 'draw') {
      sketchData = canvasRef.current.toDataURL();
    }
    const now = new Date().toLocaleString();
    const finalNote = { ...currentNote, body: sanitizeNoteHtml(bodyContent), date: now, sketch: sketchData };
    if (currentNote.id) {
      setNotes(notes.map(n => (n.id === currentNote.id ? finalNote : n)));
    } else {
      setNotes([{ ...finalNote, id: Date.now() }, ...notes]);
    }
    setNotesView('list');
    setNoteMode('text');
  };

  const deleteNote = (id: number) => {
    if (window.confirm('Delete note?')) {
      setNotes(notes.filter(n => n.id !== id));
      if (currentNote.id === id) setNotesView('list');
    }
  };

  // --- CANVAS LOGIC ---
  useEffect(() => {
    if (noteMode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      if (currentNote.sketch) {
        const img = new Image();
        img.src = currentNote.sketch;
        img.onload = () => ctx.drawImage(img, 0, 0);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [noteMode, currentNote.sketch]);

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const pos = getPos(e);
    setStartPos(pos);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    if (brushType === 'circle' || brushType === 'line') return;
    ctx.lineCap = 'round';
    if (brushType === 'pencil') {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1;
    } else if (brushType === 'highlight') {
      ctx.strokeStyle = 'yellow';
      ctx.lineWidth = 15;
      ctx.globalAlpha = 0.3;
    } else if (brushType === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 20;
      ctx.globalAlpha = 1;
    }
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = (e: any) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    if (brushType === 'circle') {
      const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (brushType === 'line') {
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const renderToolContent = () => {
    const commonInputClass = `w-full p-3 rounded-xl border font-bold text-lg mb-4 ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-black'}`;
    const cardClass = `p-6 rounded-2xl shadow-lg border h-full flex flex-col ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`;
    const totals = calculateBillTotals();

    switch (activeTool) {
      case 'invoice':
        return (
          <div className={`${cardClass} overflow-y-auto`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="text-indigo-500" size={24} />
                <div>
                  <h3 className="font-bold text-lg">Invoice Pro</h3>
                  <p className="text-xs text-gray-500">#{invoiceNumber}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={shareInvoiceImage}
                  className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl flex items-center gap-1 text-sm font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  <Share2 size={16} /> Share
                </button>
              </div>
            </div>

            {/* Invoice Type Selection */}
            <div className="flex gap-2 mb-4 bg-indigo-50 p-1.5 rounded-xl">
              {[
                { id: 'retail', label: 'Retail', desc: 'Simple Bill' },
                { id: 'gst', label: 'GST Invoice', desc: 'With Tax' },
                { id: 'estimate', label: 'Estimate', desc: 'Quotation' },
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setInvSettings({ ...invSettings, invoiceType: type.id, showGst: type.id === 'gst' })}
                  className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                    invSettings.invoiceType === type.id ? 'bg-white shadow-md text-indigo-600' : 'text-gray-500 hover:text-indigo-400'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* PREVIEW AREA */}
            <div className="flex justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-3 rounded-xl mb-4 overflow-hidden">
              <div className="bg-white text-black p-4 border shadow-2xl rounded-lg text-xs w-full max-w-[320px]" id="invoice-area">
                {/* Shop Header */}
                <div className="text-center border-b-2 border-indigo-600 pb-2 mb-3">
                  <h2 className="text-lg font-black uppercase tracking-wider text-indigo-700">{shopDetails.shopName || 'My Shop'}</h2>
                  <p className="text-[8px] uppercase text-gray-500 tracking-widest">
                    {invSettings.invoiceType === 'gst'
                      ? 'TAX INVOICE'
                      : invSettings.invoiceType === 'estimate'
                        ? 'ESTIMATE / QUOTATION'
                        : 'RETAIL INVOICE'}
                  </p>
                </div>

                {/* Customer & Invoice Info */}
                <div className="flex justify-between mb-3 text-[10px] bg-gray-50 p-2 rounded">
                  <div>
                    <p className="text-gray-500 text-[8px]">BILL TO:</p>
                    <p className="font-bold">{invCust.name || 'Walk-in Customer'}</p>
                    <p>{invCust.phone}</p>
                    {invCust.gstNo && <p className="text-[8px] text-gray-500">GSTIN: {invCust.gstNo}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600">#{invoiceNumber}</p>
                    <p>{new Date().toLocaleDateString('en-IN')}</p>
                    <p className="text-[8px] text-gray-500">{invSettings.paymentMode.toUpperCase()}</p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left mb-3 border-collapse">
                  <thead>
                    <tr className="bg-indigo-600 text-white text-[9px] uppercase">
                      <th className="py-1.5 px-1 rounded-tl">Item</th>
                      <th className="py-1.5 text-center">Qty</th>
                      <th className="py-1.5 text-right">Rate</th>
                      {invSettings.showGst && <th className="py-1.5 text-right">GST</th>}
                      <th className="py-1.5 text-right rounded-tr pr-1">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="text-[10px]">
                    {invItems.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="py-1.5 px-1">
                          <span className="font-medium">{item.name}</span>
                        </td>
                        <td className="py-1.5 text-center">
                          {item.qty} {item.unit}
                        </td>
                        <td className="py-1.5 text-right">₹{item.rate}</td>
                        {invSettings.showGst && <td className="py-1.5 text-right">{item.gst}%</td>}
                        <td className="py-1.5 text-right pr-1">₹{Number(item.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                    {invItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-gray-400">
                          No items added
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="border-t-2 border-gray-300 pt-2 space-y-1 text-[10px]">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  {invSettings.showGst && (
                    <div className="flex justify-between text-indigo-600">
                      <span>GST</span>
                      <span>₹{totals.totalGst.toFixed(2)}</span>
                    </div>
                  )}
                  {invSettings.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{totals.discountAmt.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black border-t-2 border-indigo-600 pt-2 mt-2">
                    <span>TOTAL</span>
                    <span className="text-indigo-700">₹{totals.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {invSettings.notes && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded text-[8px] text-yellow-800">
                    <strong>Note:</strong> {invSettings.notes}
                  </div>
                )}
                <div className="mt-3 text-center text-[8px] text-gray-400 border-t pt-2">Thank you for your business!</div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input
                className="p-2.5 border-2 rounded-xl text-sm font-medium focus:border-indigo-400 outline-none"
                placeholder="Customer Name"
                value={invCust.name}
                onChange={e => setInvCust({ ...invCust, name: e.target.value })}
              />
              <input
                className="p-2.5 border-2 rounded-xl text-sm focus:border-indigo-400 outline-none"
                placeholder="Mobile Number"
                value={invCust.phone}
                onChange={e => setInvCust({ ...invCust, phone: e.target.value })}
              />
            </div>

            {invSettings.invoiceType === 'gst' && (
              <input
                className="w-full p-2.5 border-2 rounded-xl text-sm mb-3 focus:border-indigo-400 outline-none"
                placeholder="Customer GSTIN (Optional)"
                value={invCust.gstNo}
                onChange={e => setInvCust({ ...invCust, gstNo: e.target.value })}
              />
            )}

            {/* Add Item Form */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border-2 border-indigo-100 mb-4">
              <p className="text-xs font-bold text-indigo-600 mb-2">ADD ITEM</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select
                  className="col-span-2 p-2.5 border-2 rounded-xl font-semibold text-sm bg-white"
                  value=""
                  onChange={e => {
                    const pageId = (e.target as HTMLSelectElement).value;
                    const selected = pages.find(p => String(p.id) === String(pageId));
                    if (selected?.itemName) setInvCurrentItem({ ...invCurrentItem, name: selected.itemName });
                  }}
                >
                  <option value="">Select from Pages (optional) ▼</option>
                  {(pages || []).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.pageNo}. {p.itemName}
                    </option>
                  ))}
                </select>
                <input
                  className="col-span-2 p-2.5 border-2 rounded-xl font-bold text-sm"
                  placeholder="Item Name *"
                  value={invCurrentItem.name}
                  onChange={e => setInvCurrentItem({ ...invCurrentItem, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <input
                  type="number"
                  className="p-2 border-2 rounded-lg text-sm font-bold"
                  placeholder="Qty"
                  value={invCurrentItem.qty}
                  onChange={e => setInvCurrentItem({ ...invCurrentItem, qty: parseInt(e.target.value) || 1 })}
                />
                <input
                  type="number"
                  className="p-2 border-2 rounded-lg text-sm"
                  placeholder="Rate ₹"
                  value={invCurrentItem.rate || ''}
                  onChange={e => setInvCurrentItem({ ...invCurrentItem, rate: parseFloat(e.target.value) })}
                />
                {invSettings.showGst && (
                  <select
                    className="p-2 border-2 rounded-lg text-sm"
                    value={invCurrentItem.gst}
                    onChange={e => setInvCurrentItem({ ...invCurrentItem, gst: parseInt(e.target.value) })}
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                )}
                <button
                  onClick={addInvItem}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Extra Settings */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <select
                className="p-2 border-2 rounded-xl text-sm"
                value={invSettings.paymentMode}
                onChange={e => setInvSettings({ ...invSettings, paymentMode: (e.target as HTMLSelectElement).value })}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="credit">Credit</option>
              </select>
              <div className="flex">
                <input
                  type="number"
                  className="flex-1 p-2 border-2 rounded-l-xl text-sm"
                  placeholder="Discount"
                  value={invSettings.discount || ''}
                  onChange={e => setInvSettings({ ...invSettings, discount: parseFloat(e.target.value) || 0 })}
                />
                <select
                  className="p-2 border-2 border-l-0 rounded-r-xl text-sm"
                  value={invSettings.discountType}
                  onChange={e => setInvSettings({ ...invSettings, discountType: (e.target as HTMLSelectElement).value })}
                >
                  <option value="flat">₹</option>
                  <option value="percent">%</option>
                </select>
              </div>
            </div>

            {/* Items List with Delete */}
            {invItems.length > 0 && (
              <div className="mb-3 space-y-1">
                {invItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <span className="font-medium">{item.name}   {item.qty}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">₹{item.total.toFixed(0)}</span>
                      <button
                        onClick={() => deleteInvItem(item.id)}
                        className="text-red-500 p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {invItems.length > 0 && (
              <button
                onClick={() => setInvItems([])}
                className="text-red-500 text-xs text-center w-full bg-red-50 p-2 rounded-xl font-bold"
              >
                Clear All Items
              </button>
            )}
          </div>
        );

      case 'translator':
        return (
          <div className={`${cardClass} overflow-hidden`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Languages className="text-pink-500" size={24} />
                AI Translator
              </h3>
              <span className="text-xs bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 py-1 rounded-full">
                Powered by API
              </span>
            </div>

            {/* Language Selection */}
            <div className="flex items-center gap-2 mb-4 bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-xl border border-pink-100">
              <select
                value={transLang.from}
                onChange={e => setTransLang({ ...transLang, from: e.target.value })}
                className="flex-1 p-2 rounded-lg border-2 border-pink-200 font-bold text-sm bg-white focus:border-pink-500 outline-none"
              >
                {languageOptions.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <button
                onClick={swapLanguages}
                className="p-2 bg-white border-2 border-pink-200 rounded-lg hover:bg-pink-100 transition-all active:scale-95"
              >
                <RefreshCcw size={20} className="text-pink-500" />
              </button>
              <select
                value={transLang.to}
                onChange={e => setTransLang({ ...transLang, to: e.target.value })}
                className="flex-1 p-2 rounded-lg border-2 border-purple-200 font-bold text-sm bg-white focus:border-purple-500 outline-none"
              >
                {languageOptions.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Area */}
            <div className="relative mb-4">
              <textarea
                className={`w-full p-4 rounded-xl border-2 font-medium text-lg resize-none h-28 ${
                  isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-pink-200 text-black focus:border-pink-400'
                }`}
                placeholder={`Type in ${languageOptions.find(l => l.code === transLang.from)?.name || 'source language'}...`}
                value={transInput}
                onChange={e => setTransInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleTranslate()}
              />
              <div className="absolute bottom-3 right-3 flex gap-2">
                <VoiceInput onResult={setTransInput} isDark={isDark} lang={transLang.from === 'hi' ? 'hi-IN' : 'en-IN'} />
                <button onClick={() => setTransInput('')} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Translate Button */}
            <button
              onClick={handleTranslate}
              disabled={transLoading || !transInput.trim()}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all mb-4 ${
                transLoading
                  ? 'bg-gray-400 cursor-wait'
                  : !transInput.trim()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {transLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Translating...
                </>
              ) : (
                <>
                  <Languages size={20} />
                  Translate Now
                </>
              )}
            </button>

            {/* Output Area */}
            <div
              className={`flex-1 rounded-xl p-4 border-2 min-h-28 ${
                isDark ? 'bg-slate-700 border-slate-600' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-purple-600 font-bold uppercase tracking-wide">
                  {languageOptions.find(l => l.code === transLang.to)?.name || 'Translation'} Output:
                </p>
                {transOutput && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(transOutput);
                      alert('Copied!');
                    }}
                    className="p-1.5 bg-purple-100 rounded-lg hover:bg-purple-200 transition-all"
                  >
                    <Copy size={14} className="text-purple-600" />
                  </button>
                )}
              </div>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {transOutput || <span className="opacity-40 text-base">Translation will appear here...</span>}
              </p>
            </div>

            {/* Instant Fallback Preview */}
            {transInput && transLang.to === 'hi' && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                <p className="text-xs text-yellow-700 font-bold mb-1 flex items-center gap-1">
                  <Zap size={12} /> Instant Preview (Offline):
                </p>
                <p className="text-sm text-yellow-900">{convertToHindiFallback(transInput)}</p>
              </div>
            )}

            {/* Translation History */}
            {transHistory.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                  <Clock size={12} /> Recent Translations
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {transHistory.slice(0, 5).map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setTransInput(item.input);
                        setTransOutput(item.output);
                        setTransLang({ from: item.from, to: item.to });
                      }}
                      className="p-2 bg-gray-50 rounded-lg text-xs cursor-pointer hover:bg-gray-100 transition-all border"
                    >
                      <span className="text-gray-600">{item.input.substring(0, 30)}...</span>
                      <span className="text-gray-400 mx-1">?</span>
                      <span className="text-purple-600 font-medium">{item.output.substring(0, 30)}...</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'gst': {
        const price = parseFloat(gstInput.price) || 0;
        let gstAmt = 0,
          finalAmt = 0,
          baseAmt = 0,
          cgst = 0,
          sgst = 0,
          igst = 0;
        if (gstInput.isReverse) {
          baseAmt = (price * 100) / (100 + gstInput.rate);
          gstAmt = price - baseAmt;
          finalAmt = price;
        } else {
          baseAmt = price;
          gstAmt = (price * gstInput.rate) / 100;
          finalAmt = price + gstAmt;
        }
        cgst = sgst = gstAmt / 2;
        igst = gstAmt;
        return (
          <div className={cardClass}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Percent className="text-blue-500" size={24} />
                GST Pro Calculator
              </h3>
            </div>

            {/* GST Mode Toggle */}
            <div className="flex gap-2 mb-4 bg-blue-50 p-1 rounded-xl">
              <button
                onClick={() => setGstInput({ ...gstInput, isReverse: false })}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                  !gstInput.isReverse ? 'bg-blue-600 text-white shadow' : 'text-blue-600 hover:bg-blue-100'
                }`}
              >
                Add GST
              </button>
              <button
                onClick={() => setGstInput({ ...gstInput, isReverse: true })}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                  gstInput.isReverse ? 'bg-green-600 text-white shadow' : 'text-green-600 hover:bg-green-100'
                }`}
              >
                Reverse GST
              </button>
            </div>

            <input
              type="number"
              placeholder={gstInput.isReverse ? 'Enter GST Inclusive Amount (?)' : 'Enter Base Amount (?)'}
              className={`${commonInputClass} text-center text-2xl`}
              value={gstInput.price}
              onChange={e => setGstInput({ ...gstInput, price: e.target.value })}
            />

            {/* GST Rate Selection */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[5, 12, 18, 28, 'custom'].map(r => (
                <button
                  key={r}
                  onClick={() => r !== 'custom' && setGstInput({ ...gstInput, rate: Number(r) })}
                  className={`py-3 rounded-xl font-bold border-2 transition-all ${
                    gstInput.rate === r
                      ? 'bg-blue-600 text-white border-blue-600 scale-105'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {r === 'custom' ? t('Custom') : `${r}%`}
                </button>
              ))}
            </div>

            {/* Results Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border-2 border-blue-100 mb-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-blue-100">
                  <span className="text-gray-600">Base Amount</span>
                  <span className="font-bold">₹{baseAmt.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-blue-100">
                  <span className="text-gray-600">GST ({gstInput.rate}%)</span>
                  <span className="font-bold text-blue-600">₹{gstAmt.toFixed(2)}</span>
                </div>

                {/* CGST/SGST Breakdown */}
                <div className="bg-white/50 rounded-xl p-3 my-2">
                  <p className="text-xs text-gray-500 font-bold mb-2">TAX BREAKDOWN (Intra-State)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-blue-100/50 rounded-lg">
                      <p className="text-xs text-blue-600">CGST ({gstInput.rate / 2}%)</p>
                      <p className="font-bold text-blue-800">₹{cgst.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-2 bg-indigo-100/50 rounded-lg">
                      <p className="text-xs text-indigo-600">SGST ({gstInput.rate / 2}%)</p>
                      <p className="font-bold text-indigo-800">₹{sgst.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-center p-2 bg-purple-100/50 rounded-lg">
                    <p className="text-xs text-purple-600">IGST (Inter-State) ({gstInput.rate}%)</p>
                    <p className="font-bold text-purple-800">₹{igst.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex justify-between text-2xl font-bold pt-2">
                  <span>Final Amount</span>
                  <span className="text-green-600">₹{finalAmt.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  `GST Calculation\n----------------\nBase: ₹${baseAmt.toFixed(2)}\nGST @${gstInput.rate}%: ₹${gstAmt.toFixed(
                    2
                  )}\n  CGST: ₹${cgst.toFixed(2)}\n  SGST: ₹${sgst.toFixed(2)}\n----------------\nTotal: ₹${finalAmt.toFixed(2)}`
                )
              }
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Copy size={16} /> Copy Full Breakdown
            </button>
          </div>
        );
      }

      case 'margin': {
        const cost = parseFloat(marginInput.cost) || 0;
        const sell = parseFloat(marginInput.sell) || 0;
        const markup = parseFloat(marginInput.markup) || 0;
        const profit = sell - cost;
        const marginPercent = sell > 0 ? (profit / sell) * 100 : 0;
        const markupPercent = cost > 0 ? (profit / cost) * 100 : 0;
        const sellFromMarkup = cost + (cost * markup) / 100;
        const breakEvenQty = cost > 0 && profit > 0 ? Math.ceil(cost / profit) : 0;

        return (
          <div className={cardClass}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Calculator className="text-purple-500" size={24} />
                Profit Analyzer Pro
              </h3>
              <button
                onClick={() => setMarginInput({ cost: '', sell: '', discount: 0, mode: marginInput.mode, markup: '' })}
                className="text-xs text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full"
              >
                RESET
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-2 mb-4 bg-purple-50 p-1.5 rounded-xl">
              <button
                onClick={() => setMarginInput({ ...marginInput, mode: 'profit' })}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                  marginInput.mode === 'profit' ? 'bg-white shadow-md text-purple-600' : 'text-gray-500 hover:text-purple-400'
                }`}
              >
                Profit Analysis
              </button>
              <button
                onClick={() => setMarginInput({ ...marginInput, mode: 'markup' })}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                  marginInput.mode === 'markup' ? 'bg-white shadow-md text-purple-600' : 'text-gray-500 hover:text-purple-400'
                }`}
              >
                Markup Pricing
              </button>
              <button
                onClick={() => setMarginInput({ ...marginInput, mode: 'discount' })}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                  marginInput.mode === 'discount' ? 'bg-white shadow-md text-purple-600' : 'text-gray-500 hover:text-purple-400'
                }`}
              >
                Discount
              </button>
            </div>

            {marginInput.mode === 'profit' ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">BUYING COST</label>
                    <input
                      type="number"
                      placeholder="₹0"
                      className={`${commonInputClass} mb-0 text-center text-xl`}
                      value={marginInput.cost}
                      onChange={e => setMarginInput({ ...marginInput, cost: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">SELLING PRICE</label>
                    <input
                      type="number"
                      placeholder="₹0"
                      className={`${commonInputClass} mb-0 text-center text-xl`}
                      value={marginInput.sell}
                      onChange={e => setMarginInput({ ...marginInput, sell: e.target.value })}
                    />
                  </div>
                </div>

                {cost > 0 && sell > 0 && (
                  <div
                    className={`p-4 rounded-2xl border-2 ${
                      profit >= 0
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                        : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
                    }`}
                  >
                    {/* Main Profit Display */}
                    <div className="text-center mb-4">
                      <p className={`text-xs font-bold mb-1 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profit >= 0 ? 'PROFIT' : 'LOSS'}
                      </p>
                      <p className={`text-4xl font-black ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{Math.abs(profit).toFixed(2)}
                      </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-white/60 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500 font-medium">Profit Margin</p>
                        <p className={`text-2xl font-bold ${marginPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {marginPercent.toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-white/60 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500 font-medium">Markup %</p>
                        <p className={`text-2xl font-bold ${markupPercent >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                          {markupPercent.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Break-even Analysis */}
                    {profit > 0 && (
                      <div className="bg-blue-100/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-blue-600 font-medium">Break-even Quantity</p>
                        <p className="text-lg font-bold text-blue-800">Sell {breakEvenQty} units to recover cost</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : marginInput.mode === 'markup' ? (
              <>
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 mb-1 block">BUYING COST</label>
                  <input
                    type="number"
                    placeholder="₹0"
                    className={`${commonInputClass} mb-0 text-center text-xl`}
                    value={marginInput.cost}
                    onChange={e => setMarginInput({ ...marginInput, cost: e.target.value })}
                  />
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 mb-2 block">SELECT MARKUP %</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 15, 20, 25, 30, 40, 50, 100].map(m => (
                      <button
                        key={m}
                        onClick={() => setMarginInput({ ...marginInput, markup: m.toString() })}
                        className={`py-2 rounded-lg font-bold text-sm transition-all ${
                          parseFloat(marginInput.markup) === m ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-purple-100'
                        }`}
                      >
                        {m}%
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    placeholder="Or enter custom markup %"
                    className={`${commonInputClass} mb-0 mt-3`}
                    value={marginInput.markup}
                    onChange={e => setMarginInput({ ...marginInput, markup: e.target.value })}
                  />
                </div>

                {cost > 0 && markup > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-2xl border-2 border-purple-200">
                    <div className="text-center">
                      <p className="text-xs font-bold text-purple-600 mb-1">RECOMMENDED SELLING PRICE</p>
                      <p className="text-4xl font-black text-purple-700">₹{sellFromMarkup.toFixed(2)}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Profit per unit: <span className="font-bold text-green-600">₹{(sellFromMarkup - cost).toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 mb-1 block">ORIGINAL PRICE (MRP)</label>
                  <input
                    type="number"
                    placeholder="₹0"
                    className={`${commonInputClass} mb-0 text-center text-xl`}
                    value={marginInput.cost}
                    onChange={e => setMarginInput({ ...marginInput, cost: e.target.value })}
                  />
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 mb-2 block">DISCOUNT %</label>
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {[5, 10, 15, 20, 25].map(d => (
                      <button
                        key={d}
                        onClick={() => setMarginInput({ ...marginInput, discount: d })}
                        className={`py-2 rounded-lg font-bold text-sm transition-all ${
                          marginInput.discount === d ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-orange-100'
                        }`}
                      >
                        {d}%
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    placeholder="Or enter custom discount %"
                    className={commonInputClass}
                    value={marginInput.discount || ''}
                    onChange={e => setMarginInput({ ...marginInput, discount: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-2xl border-2 border-orange-200">
                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-orange-200">
                    <span className="text-gray-600">You Save</span>
                    <span className="text-xl font-bold text-orange-600">₹{((cost * marginInput.discount) / 100).toFixed(2)}</span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-green-600 mb-1">FINAL PAYABLE AMOUNT</p>
                    <p className="text-4xl font-black text-green-700">₹{(cost - (cost * marginInput.discount) / 100).toFixed(2)}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      }

      case 'converter': {
        const val = parseFloat(convInput.val) || 0;
        const conversions: any = {
          kgToTon: { factor: 1 / 1000, unit: 'Tons', formula: '  1000' },
          tonToKg: { factor: 1000, unit: 'KG', formula: '  1000' },
          kgToQuintal: { factor: 1 / 100, unit: 'Quintals', formula: '  100' },
          quintalToKg: { factor: 100, unit: 'KG', formula: '  100' },
          oil: { factor: 0.91, unit: 'KG', formula: '  0.91 (density)' },
          ghee: { factor: 0.93, unit: 'KG', formula: '  0.93' },
          feetToM: { factor: 0.3048, unit: 'Meters', formula: '  0.3048' },
          mToFeet: { factor: 3.28084, unit: 'Feet', formula: '  3.281' },
          inchToCm: { factor: 2.54, unit: 'CM', formula: '  2.54' },
          cmToInch: { factor: 0.3937, unit: 'Inches', formula: '  0.394' },
          sqftToSqm: { factor: 0.0929, unit: 'Sq.Meter', formula: '  0.093' },
          sqmToSqft: { factor: 10.764, unit: 'Sq.Feet', formula: '  10.76' },
          gajaToSqft: { factor: 9, unit: 'Sq.Feet', formula: '  9' },
          bighaToSqft: { factor: 27225, unit: 'Sq.Feet', formula: '  27225' },
        };
        const conv = conversions[convInput.type] || { factor: 1, unit: '', formula: '' };
        const result = val * conv.factor;

        const categories: any = {
          weight: ['kgToTon', 'tonToKg', 'kgToQuintal', 'quintalToKg'],
          liquid: ['oil', 'ghee'],
          length: ['feetToM', 'mToFeet', 'inchToCm', 'cmToInch'],
          area: ['sqftToSqm', 'sqmToSqft', 'gajaToSqft', 'bighaToSqft'],
        };

        const convLabels: any = {
          kgToTon: 'KG → Tons',
          tonToKg: 'Tons → KG',
          kgToQuintal: 'KG → Quintals',
          quintalToKg: 'Quintals → KG',
          oil: 'Liters → KG (Oil)',
          ghee: 'Liters → KG (Ghee)',
          feetToM: 'Feet → Meters',
          mToFeet: 'Meters → Feet',
          inchToCm: 'Inch → CM',
          cmToInch: 'CM → Inch',
          sqftToSqm: 'Sq.ft → Sq.m',
          sqmToSqft: 'Sq.m → Sq.ft',
          gajaToSqft: 'Gaja → Sq.ft',
          bighaToSqft: 'Bigha → Sq.ft',
        };

        return (
          <div className={cardClass}>
            <h3 className="font-bold mb-4 text-xl flex items-center gap-2">
              <RefreshCcw className="text-green-500" size={24} />
              Pro Unit Converter
            </h3>

            {/* Category Tabs */}
            <div className="flex gap-1 mb-3 overflow-x-auto pb-2">
              {Object.entries({ weight: 'Weight', liquid: 'Liquid', length: 'Length', area: 'Area' }).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setConvInput({ ...convInput, type: categories[key][0] })}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    categories[key].includes(convInput.type) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                  }`}
                >
                  {label as any}
                </button>
              ))}
            </div>

            {/* Conversion Type Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(() => {
                const activeGroup =
                  (Object.entries(categories).find(([_k, v]) => (v as any[]).includes(convInput.type))?.[1] as any[]) || [];
                return Object.entries(convLabels)
                  .filter(([key]) => activeGroup.includes(key))
                  .map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setConvInput({ ...convInput, type: key })}
                    className={`py-2 px-3 rounded-xl text-sm font-bold transition-all ${
                      convInput.type === key ? 'bg-green-600 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                    }`}
                  >
                    {label as any}
                  </button>
                  ));
              })()}
            </div>

            {/* Input */}
            <div className="relative mb-4">
              <input
                type="number"
                placeholder="Enter Value"
                className={`${commonInputClass} text-center text-2xl mb-0 pr-16`}
                value={convInput.val}
                onChange={e => setConvInput({ ...convInput, val: e.target.value })}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">
                {convLabels[convInput.type]?.split('?')[0]?.trim()}
              </span>
            </div>

            {/* Formula Display */}
            <div className="text-center text-xs text-gray-500 mb-3 font-mono">Formula: {conv.formula}</div>

            {/* Result */}
            <div
              className={`p-6 rounded-2xl font-mono text-center ${
                isDark ? 'bg-gradient-to-br from-slate-700 to-slate-800' : 'bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200'
              }`}
            >
              <p className="text-xs text-green-600 font-bold mb-2">RESULT</p>
              <p className={`text-4xl font-black ${isDark ? 'text-white' : 'text-green-700'}`}>{result.toFixed(4)}</p>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-green-600'}`}>{conv.unit}</p>
            </div>

            {/* Quick Reference */}
            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs font-bold text-gray-500 mb-2">Quick Reference</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-gray-600">1 Quintal = 100 KG</div>
                <div className="text-gray-600">1 Ton = 1000 KG</div>
                <div className="text-gray-600">1 Feet = 12 Inch</div>
                <div className="text-gray-600">1 Gaja = 9 Sq.ft</div>
              </div>
            </div>
          </div>
        );
      }

      case 'card':
        return (
          <div className={cardClass}>
            <h3 className="font-bold mb-4 text-xl flex items-center gap-2">
              <CreditCard className="text-orange-500" size={24} />
              Digital Business Card
            </h3>

            {/* Premium Card Design */}
            <div
              className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-2xl mb-4 relative overflow-hidden"
              id="digital-card-area"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-bl-full"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-yellow-500/10 to-transparent rounded-tr-full"></div>
              <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl"></div>

              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <Store size={24} className="text-white" />
              </div>

              <h2 className="text-2xl font-black text-yellow-400 mb-1 tracking-tight">{shopDetails.shopName || 'MY SHOP'}</h2>
              <p className="text-xs text-gray-400 mb-6 uppercase tracking-widest">
                {shopDetails.gstNumber ? `GST: ${shopDetails.gstNumber}` : 'Auto Parts & Accessories'}
              </p>

              <div className="space-y-3 relative z-10">
                {shopDetails.shopPhone && (
                  <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg backdrop-blur-sm">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Phone size={14} className="text-yellow-400" />
                    </div>
                    <span className="text-sm">{shopDetails.shopPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg backdrop-blur-sm">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Store size={14} className="text-yellow-400" />
                  </div>
                  <span className="text-sm">
                    {[shopDetails.shopAddress, shopDetails.shopCity, shopDetails.shopPincode].filter(Boolean).join(', ') || 'Set address in Settings'}
                  </span>
                </div>
              </div>

            </div>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!window.html2canvas) {
                    const script = document.createElement('script');
                    script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
                    document.head.appendChild(script);
                    await new Promise(resolve => (script.onload = resolve as any));
                  }
                  const element = document.getElementById('digital-card-area');
                  if (!element) return;
                  const canvas = await window.html2canvas!(element, { backgroundColor: null, scale: 2 });
                  const link = document.createElement('a');
                  link.href = canvas.toDataURL();
                  link.download = `BusinessCard_${shopDetails.shopName || 'Shop'}_${Date.now()}.png`;
                  link.click();
                }}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Download size={18} /> Download Card
              </button>
              <button
                onClick={() => {
                  const addressLine = [shopDetails.shopAddress, shopDetails.shopCity, shopDetails.shopPincode].filter(Boolean).join(', ');
                  const text = `${shopDetails.shopName || 'My Shop'}${shopDetails.shopPhone ? `\n📞 ${shopDetails.shopPhone}` : ''}${addressLine ? `\n📍 ${addressLine}` : ''}`;
                  navigator.share ? navigator.share({ text, title: shopDetails.shopName || 'My Shop' }) : navigator.clipboard.writeText(text);
                }}
                className={`p-3 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}
              >
                <Share2 size={20} className={isDark ? 'text-gray-200' : 'text-gray-600'} />
              </button>
            </div>
            <p className="text-center text-xs opacity-50 mt-3">Update in Settings → Profile</p>
          </div>
        );

      case 'calculator':
        return (
          <div className={cardClass}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Calculator className="text-slate-600" size={24} />
                Calculator
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={calcBackspace} className={`text-xs font-bold px-3 py-1 rounded-full ${isDark ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  ⌫
                </button>
                <button onClick={calcClear} className="text-xs text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full">
                  CLEAR
                </button>
              </div>
            </div>

            <div className={`w-full rounded-2xl p-4 mb-4 border-2 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className={`text-right font-black text-4xl leading-none break-words ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {calcDisplay}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <button onClick={calcClear} className={`py-4 rounded-2xl font-black ${isDark ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-800'}`}>C</button>
              <button onClick={calcToggleSign} className={`py-4 rounded-2xl font-black ${isDark ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-800'}`}>±</button>
              <button onClick={calcPercent} className={`py-4 rounded-2xl font-black ${isDark ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-800'}`}>%</button>
              <button onClick={() => calcSetOperator('/')} className="py-4 rounded-2xl font-black bg-indigo-600 text-white">÷</button>

              {['7','8','9'].map((d) => (
                <button key={d} onClick={() => calcInputDigit(d)} className={`py-4 rounded-2xl font-black ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}>{d}</button>
              ))}
              <button onClick={() => calcSetOperator('*')} className="py-4 rounded-2xl font-black bg-indigo-600 text-white">×</button>

              {['4','5','6'].map((d) => (
                <button key={d} onClick={() => calcInputDigit(d)} className={`py-4 rounded-2xl font-black ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}>{d}</button>
              ))}
              <button onClick={() => calcSetOperator('-')} className="py-4 rounded-2xl font-black bg-indigo-600 text-white">−</button>

              {['1','2','3'].map((d) => (
                <button key={d} onClick={() => calcInputDigit(d)} className={`py-4 rounded-2xl font-black ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}>{d}</button>
              ))}
              <button onClick={() => calcSetOperator('+')} className="py-4 rounded-2xl font-black bg-indigo-600 text-white">+</button>

              <button
                onClick={() => calcInputDigit('0')}
                className={`col-span-2 py-4 rounded-2xl font-black ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}
              >
                0
              </button>
              <button onClick={calcInputDot} className={`py-4 rounded-2xl font-black ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}>.</button>
              <button onClick={calcEquals} className="py-4 rounded-2xl font-black bg-green-600 text-white">=</button>
            </div>
          </div>
        );

      case 'emi': {
        const P = parseFloat(emiInput.principal) || 0;
        const annualRate = parseFloat(emiInput.rate) || 0;
        const tenureRaw = parseFloat(emiInput.tenure) || 0;
        const n = emiInput.tenureType === 'years' ? tenureRaw * 12 : tenureRaw;
        const r = annualRate > 0 ? annualRate / 12 / 100 : 0;
        const emi = P > 0 && n > 0 ? (r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)) : 0;
        const totalPayment = emi * n;
        const totalInterest = totalPayment - P;

        return (
          <div className={cardClass}>
            <h3 className="font-bold mb-4 text-xl flex items-center gap-2">
              <DollarSign className="text-emerald-500" size={24} />
              EMI Calculator
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">LOAN AMOUNT</label>
                <input
                  type="number"
                  placeholder="Enter principal amount"
                  className={`${commonInputClass} mb-0 text-center text-xl`}
                  value={emiInput.principal}
                  onChange={e => setEmiInput({ ...emiInput, principal: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">INTEREST RATE (% per annum)</label>
                <input
                  type="number"
                  placeholder="e.g., 12"
                  className={`${commonInputClass} mb-0`}
                  value={emiInput.rate}
                  onChange={e => setEmiInput({ ...emiInput, rate: e.target.value })}
                />
                <div className="flex gap-2 mt-2">
                  {[8, 10, 12, 15, 18].map(rate => (
                    <button
                      key={rate}
                      onClick={() => setEmiInput({ ...emiInput, rate: rate.toString() })}
                      className={`flex-1 py-1 rounded text-xs font-bold ${parseFloat(emiInput.rate) === rate ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">LOAN TENURE</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Duration"
                    className={`${commonInputClass} mb-0 flex-1`}
                    value={emiInput.tenure}
                    onChange={e => setEmiInput({ ...emiInput, tenure: e.target.value })}
                  />
                  <select
                    className={`${commonInputClass} mb-0 w-28`}
                    value={emiInput.tenureType}
                    onChange={e => setEmiInput({ ...emiInput, tenureType: (e.target as HTMLSelectElement).value })}
                  >
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>
            </div>

            {P > 0 && emi > 0 && (
              <div className="mt-6 bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-2xl border-2 border-emerald-200">
                <div className="text-center mb-4">
                  <p className="text-xs font-bold text-emerald-600 mb-1">MONTHLY EMI</p>
                  <p className="text-4xl font-black text-emerald-700">₹{emi.toFixed(0)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/60 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Total Interest</p>
                    <p className="text-lg font-bold text-red-600">₹{totalInterest.toFixed(0)}</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Total Payment</p>
                    <p className="text-lg font-bold text-emerald-600">₹{totalPayment.toFixed(0)}</p>
                  </div>
                </div>

                <div className="mt-3 h-4 rounded-full overflow-hidden bg-gray-200 flex">
                  <div className="bg-emerald-500 h-full" style={{ width: `${(P / totalPayment) * 100}%` }}></div>
                  <div className="bg-red-400 h-full" style={{ width: `${(totalInterest / totalPayment) * 100}%` }}></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Principal ({((P / totalPayment) * 100).toFixed(0)}%)</span>
                  <span>Interest ({((totalInterest / totalPayment) * 100).toFixed(0)}%)</span>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'stockvalue': {
        const totalValue = stockCalc.items.reduce((sum: number, item: any) => sum + item.qty * item.rate, 0);
        const totalItems = stockCalc.items.reduce((sum: number, item: any) => sum + item.qty, 0);

        return (
          <div className={cardClass}>
            <h3 className="font-bold mb-4 text-xl flex items-center gap-2">
              <Activity className="text-cyan-500" size={24} />
              Stock Value Calculator
            </h3>

            {/* Add Item Form */}
            <div className="bg-cyan-50 p-3 rounded-xl border border-cyan-200 mb-4">
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input
                  placeholder="Item Name"
                  className="col-span-3 p-2 rounded-lg border text-sm font-bold"
                  value={stockCalc.newItem.name}
                  onChange={e => setStockCalc({ ...stockCalc, newItem: { ...stockCalc.newItem, name: e.target.value } })}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  className="p-2 rounded-lg border text-sm"
                  value={stockCalc.newItem.qty || ''}
                  onChange={e =>
                    setStockCalc({ ...stockCalc, newItem: { ...stockCalc.newItem, qty: parseInt(e.target.value) || 0 } })
                  }
                />
                <input
                  type="number"
                  placeholder="Rate ₹"
                  className="p-2 rounded-lg border text-sm"
                  value={stockCalc.newItem.rate || ''}
                  onChange={e =>
                    setStockCalc({ ...stockCalc, newItem: { ...stockCalc.newItem, rate: parseFloat(e.target.value) || 0 } })
                  }
                />
                <button
                  onClick={() => {
                    if (stockCalc.newItem.name && stockCalc.newItem.qty && stockCalc.newItem.rate) {
                      setStockCalc({
                        items: [...stockCalc.items, { ...stockCalc.newItem, id: Date.now() }],
                        newItem: { name: '', qty: 0, rate: 0 },
                      });
                    }
                  }}
                  className="bg-cyan-600 text-white rounded-lg font-bold"
                >
                  <Plus size={20} className="mx-auto" />
                </button>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {stockCalc.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.qty}   ₹{item.rate}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-cyan-600">₹{(item.qty * item.rate).toFixed(0)}</span>
                    <button
                      onClick={() => setStockCalc({ ...stockCalc, items: stockCalc.items.filter((i: any) => i.id !== item.id) })}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {stockCalc.items.length === 0 && (
                <div className="text-center py-6 text-gray-400">
                  <Package size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Add items to calculate stock value</p>
                </div>
              )}
            </div>

            {/* Total Summary */}
            {stockCalc.items.length > 0 && (
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-2xl border-2 border-cyan-200">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total Items</p>
                    <p className="text-2xl font-bold text-gray-700">{totalItems}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">SKU Count</p>
                    <p className="text-2xl font-bold text-gray-700">{stockCalc.items.length}</p>
                  </div>
                </div>
                <div className="text-center pt-3 border-t border-cyan-200">
                  <p className="text-xs font-bold text-cyan-600 mb-1">TOTAL STOCK VALUE</p>
                  <p className="text-4xl font-black text-cyan-700">₹{totalValue.toLocaleString()}</p>
                </div>
              </div>
            )}

            {stockCalc.items.length > 0 && (
              <button
                onClick={() => setStockCalc({ items: [], newItem: { name: '', qty: 0, rate: 0 } })}
                className="w-full mt-3 py-2 text-red-500 bg-red-50 rounded-xl text-sm font-bold"
              >
                Clear All Items
              </button>
            )}
          </div>
        );
      }

      case 'notes':
        // ?? UPDATED NOTEPAD UI
        if (notesView === 'list') {
          const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(noteSearch.toLowerCase()));
          return (
            <div className={`h-[80vh] flex flex-col ${cardClass} p-0 overflow-hidden`}>
              <div className="p-4 border-b flex gap-2 items-center bg-yellow-50/50">
                <Search size={18} className="text-yellow-600" />
                <input
                  className="bg-transparent w-full outline-none text-sm font-bold"
                  placeholder="Search notes..."
                  value={noteSearch}
                  onChange={e => setNoteSearch(e.target.value)}
                />
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredNotes.length === 0 && (
                  <div className="text-center mt-10 opacity-40 font-bold">
                    No notes found.<br />Tap + to create.
                  </div>
                )}
                {filteredNotes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => {
                      setCurrentNote(note);
                      setNotesView('editor');
                      setNoteMode(note.sketch ? 'draw' : 'text');
                    }}
                    className="p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all cursor-pointer relative group"
                  >
                    <h4 className="font-bold text-lg mb-1 truncate pr-8">{note.title || 'Untitled Note'}</h4>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {note.body ? note.body.replace(/<[^>]*>?/gm, '') : note.sketch ? 'Contains Drawing' : 'No text'}
                    </p>
                    {note.sketch && (
                      <div className="mt-2 h-10 w-full bg-gray-100 rounded overflow-hidden">
                        <img src={note.sketch} className="h-full object-contain opacity-50" />
                      </div>
                    )}
                    <span className="text-[10px] text-gray-400 mt-2 block flex items-center gap-1">
                      <Calendar size={10} /> {note.date}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="absolute top-2 right-2 p-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setCurrentNote({ id: null, title: '', body: '', date: '', sketch: null, category: 'general' });
                  setNotesView('editor');
                  setNoteMode('text');
                }}
                className="absolute bottom-6 right-6 bg-yellow-500 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-transform"
              >
                <Plus size={24} />
              </button>
            </div>
          );
        } else {
          // RICH EDITOR
          return (
            <div className={`h-[80vh] flex flex-col ${cardClass} p-0 overflow-hidden`}>
              <div className="p-3 border-b flex justify-between items-center bg-yellow-50">
                <button onClick={saveCurrentNote} className="flex items-center gap-1 text-sm font-bold text-gray-600">
                  <ChevronRight className="rotate-180" size={16} /> Back
                </button>
                <div className="flex bg-white rounded-lg p-1 border">
                  <button
                    onClick={() => setNoteMode('text')}
                    className={`p-1 px-3 rounded text-xs font-bold ${noteMode === 'text' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-400'}`}
                  >
                    <Type size={14} />
                  </button>
                  <button
                    onClick={() => setNoteMode('draw')}
                    className={`p-1 px-3 rounded text-xs font-bold ${noteMode === 'draw' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-400'}`}
                  >
                    <PenTool size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={saveCurrentNote} className="text-yellow-600 font-bold text-sm">
                    Save
                  </button>
                </div>
              </div>
              <input
                className="p-4 text-xl font-bold outline-none bg-transparent border-b"
                placeholder="Title"
                value={currentNote.title}
                onChange={e => setCurrentNote({ ...currentNote, title: e.target.value })}
              />

              {noteMode === 'text' ? (
                <>
                  {/* UPDATED: RICH TEXT TOOLBAR */}
                  <div className="flex gap-1 p-2 bg-gray-50 border-b overflow-x-auto">
                    <button
                      className="p-2 hover:bg-gray-200 rounded"
                      onMouseDown={e => {
                        e.preventDefault();
                        execFormat('bold');
                      }}
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      className="p-2 hover:bg-gray-200 rounded"
                      onMouseDown={e => {
                        e.preventDefault();
                        execFormat('italic');
                      }}
                    >
                      <Italic size={16} />
                    </button>
                    <button
                      className="p-2 hover:bg-gray-200 rounded"
                      onMouseDown={e => {
                        e.preventDefault();
                        execFormat('underline');
                      }}
                    >
                      <Underline size={16} />
                    </button>
                    <button
                      className="p-2 hover:bg-gray-200 rounded bg-yellow-100"
                      onMouseDown={e => {
                        e.preventDefault();
                        execFormat('hiliteColor', 'yellow');
                      }}
                    >
                      <Highlighter size={16} className="text-yellow-600" />
                    </button>
                  </div>
                  <div
                    ref={contentEditableRef}
                    className="flex-1 p-4 resize-none outline-none text-base leading-relaxed bg-transparent overflow-y-auto"
                    contentEditable={true}
                    dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(currentNote.body || '') }}
                  ></div>
                </>
              ) : (
                <div className="flex-1 relative bg-white overflow-hidden touch-none">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white shadow-lg border rounded-full p-1 flex gap-2 z-10">
                    <button
                      onClick={() => setBrushType('pencil')}
                      className={`p-2 rounded-full ${brushType === 'pencil' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
                    >
                      <PenTool size={16} />
                    </button>
                    <button
                      onClick={() => setBrushType('highlight')}
                      className={`p-2 rounded-full ${brushType === 'highlight' ? 'bg-yellow-300 text-yellow-900' : 'hover:bg-gray-100'}`}
                    >
                      <Highlighter size={16} />
                    </button>
                    <button
                      onClick={() => setBrushType('circle')}
                      className={`p-2 rounded-full ${brushType === 'circle' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}
                    >
                      <CircleIcon size={16} />
                    </button>
                    <button
                      onClick={() => setBrushType('line')}
                      className={`p-2 rounded-full ${brushType === 'line' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                    >
                      <Minus size={16} />
                    </button>
                    <button
                      onClick={() => setBrushType('eraser')}
                      className={`p-2 rounded-full ${brushType === 'eraser' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                    >
                      <Eraser size={16} />
                    </button>
                  </div>
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-crosshair touch-none"
                    width={window.innerWidth > 400 ? 400 : window.innerWidth}
                    height={600}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
              )}
            </div>
          );
        }

      default:
        return null;
    }
  };

  return (
    <div className={`fixed inset-0 z-[60] overflow-y-auto ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-black'}`}>
      <div className={`sticky top-0 p-4 border-b flex items-center gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        {activeTool ? (
          <button
            onClick={() => {
              if (notesView === 'editor') saveCurrentNote();
              setActiveTool(null);
            }}
            className="p-2 rounded-full hover:bg-gray-100/10"
          >
            <ArrowLeft size={24} />
          </button>
        ) : (
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100/10">
            <ArrowLeft size={24} />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold">{activeTool ? tools.find(toolItem => toolItem.id === activeTool)?.name : t('Business Tools')}</h1>
          {!activeTool && <p className="text-xs text-gray-500">Industry-ready business utilities</p>}
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto min-h-screen">
        {!activeTool && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {tools.map(tool => {
              const isPinned = pinnedTools.includes(tool.id);
              return (
                <div
                  key={tool.id}
                  className={`relative p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                      : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-lg shadow-sm'
                  }`}
                  onClick={() => {
                    setActiveTool(tool.id);
                    setNotesView('list');
                  }}
                >
                  <div className={`p-3 rounded-2xl ${tool.color} shadow-sm`}>{tool.icon}</div>
                  <span className="font-bold text-sm text-center">{t(tool.name)}</span>
                  <span className="text-[10px] text-gray-500 text-center">{tool.desc}</span>
                  {/* Pin Button */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onTogglePin(tool.id);
                    }}
                    className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${
                      isPinned ? 'text-blue-500 bg-blue-100' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {isPinned ? <Pin size={14} fill="currentColor" /> : <Pin size={14} />}
                  </button>
                </div>
              );
            })}
            <div className="col-span-2 text-center text-xs opacity-50 mt-4 flex items-center justify-center gap-1">
              <Pin size={10} /> Pin tools to Home Screen for quick access
            </div>
          </div>
        )}
        {activeTool && <div className="animate-in slide-in-from-right duration-300 mt-4 h-full">{renderToolContent()}</div>}
      </div>
    </div>
  );
};

export default ToolsHub;