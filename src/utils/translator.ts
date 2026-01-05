const translationCache = new Map<string, string>();
const CACHE_MAX = 500;

const cacheSet = (key: string, value: string) => {
  if (translationCache.size >= CACHE_MAX && !translationCache.has(key)) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) translationCache.delete(firstKey);
  }
  translationCache.set(key, value);
};

const exactDictionary: Record<string, string> = {
  "brake": "ब्रेक", "pads": "पैड्स", "shoe": "शू", "oil": "तेल", "filter": "फिल्टर",
  "light": "लाइट", "headlight": "हेडलाइट", "bumper": "बम्पर", "cover": "कवर",
  "seat": "सीट", "mat": "मैट", "guard": "गार्ड", "horn": "हॉर्न", "mirror": "शीशा",
  "glass": "कांच", "clutch": "क्लच", "wire": "तार", "battery": "बैटरी", "tyre": "टायर",
  "tube": "ट्यूब", "alloy": "अलॉय", "wheel": "व्हील", "cap": "कैप", "door": "दरवाजा",
  "handle": "हैंडल", "lock": "लॉक", "key": "चाबी", "sensor": "सेंसर", "screen": "स्क्रीन",
  "kit": "किट", "rod": "रॉड", "bush": "बुश", "arm": "आर्म", "wiper": "वाइपर",
  "motor": "मोटर", "pump": "पम्प", "coolant": "कूलेंट", "chain": "चैन", "belt": "बेल्ट",
  "swift": "स्विफ्ट", "thar": "थार", "creta": "क्रेटा", "alto": "आल्टो", "scorpio": "स्कॉर्पियो",
  "bolero": "बोलेरो", "city": "सिटी", "verna": "वर्ना", "wagonr": "वैगन-आर", "baleno": "बलेनो",
  "dzire": "डिजायर", "innova": "इनोवा", "fortuner": "फॉर्च्यूनर", "brezza": "ब्रेजा",
  "page": "पेज", "qty": "मात्रा", "car": "गाड़ी", "search": "खोजें",
  "index": "विषय सूची", "settings": "सेटिंग्स", "pages": "पेज लिस्ट",
  "total": "कुल", "delete": "हटाएं", "confirm": "पुष्टि करें", "update": "अपडेट",
  "save changes": "बदलाव सेव करें", "pending": "पेंडिंग", "online": "ऑनलाइन", "offline": "ऑफलाइन",
  "item name": "आइटम का नाम", "edit entry": "एंट्री बदलें", "new page": "नया पेज",
  "cancel": "रद्द करें", "add": "जोड़ें", "save": "सेव करें", "new entry": "नया माल",
  "quantity": "मात्रा", "install app": "ऐप इंस्टॉल करें", "notifications": "नोटिफिकेशन",
  "theme": "थीम", "logout shop": "दुकान बंद करें", "alerts": "चेतावनी",
  "unknown item": "अनजान आइटम", "go to page": "पेज पर जाएं", "low stock": "कम माल",
  "stock full": "माल पूरा है", "security check": "सुरक्षा जाँच", "unlock settings": "सेटिंग्स खोलें",
  "import items": "आइटम कॉपी करें", "select page to copy from": "किस पेज से कॉपी करना है?", "copy": "कॉपी करें",
  "your customer id (support)": "आपकी कस्टमर आईडी (सपोर्ट)", "share this for help": "मदद के लिए इसे शेयर करें", "id copied": "आईडी कॉपी हो गई!",
  "manage page": "पेज मैनेज करें", "rename": "नाम बदलें", "move up": "ऊपर करें", "move down": "नीचे करें", "shop name": "दुकान का नाम",
  "enter password": "पासवर्ड डालें", "success": "सफल", "error": "त्रुटि", "wrong password": "गलत पासवर्ड",
  "are you sure": "क्या आप सुनिश्चित हैं?", "delete warning": "यह हमेशा के लिए हट जाएगा", "yes delete": "हाँ, हटाओ", "no cancel": "नहीं, रहने दो",
  "privacy policy": "गोपनीयता नीति", "legal": "कानूनी", "support": "सहायता", "faq": "अक्सर पूछे जाने वाले सवाल", "feedback": "सुझाव / संपर्क",
  "app info": "ऐप की जानकारी", "secured by": "सुरक्षित", "parent company": "मूल कंपनी", "load more": "और देखें", "showing": "दिख रहे हैं", "of": "में से",
  "tools": "टूल्स", "business tools": "बिज़नेस टूल्स", "gst calc": "GST कैलकुलेटर", "margin": "मार्जिन", "converter": "कन्वर्टर", "visiting card": "विजिटिंग कार्ड", "quick notes": "नोट्स",
  "bills": "बिल्स", "my bills": "मेरे बिल", "upload bill": "बिल जोड़ें", "camera": "कैमरा", "delete bill": "बिल हटाएं",
  "translator": "अनुवादक", "type here": "यहाँ लिखें", "translate": "अनुवाद करें", "invoice": "बिल जनरेटर",
};

const soundMap: Record<string, string> = {
  'a': 'ा', 'i': 'ि', 'u': 'ु', 'e': 'े', 'o': 'ो',
  'aa': 'ा', 'ee': 'ी', 'oo': 'ू', 'ai': 'ै', 'au': 'ौ',
  'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ',
  'ch': 'च', 'chh': 'छ', 'j': 'ज', 'jh': 'झ',
  't': 'ट', 'th': 'थ', 'd': 'ड', 'dh': 'ढ', 'n': 'न',
  'p': 'प', 'f': 'फ', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
  'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'w': 'व',
  's': 'स', 'sh': 'श', 'h': 'ह', 'z': 'ज़', 'x': 'क्स',
};

export const convertToHindi = (text: string): string => {
  if (!text) return "";
  const strText = text.toString();
  if (translationCache.has(strText)) return translationCache.get(strText)!;

  try {
    const lowerText = strText.toLowerCase().trim();
    if (exactDictionary[lowerText]) {
      cacheSet(strText, exactDictionary[lowerText]);
      return exactDictionary[lowerText];
    }

    const translated = strText
      .split(' ')
      .map((word) => {
        const cleanWord = word.replace(/[^a-zA-Z0-9]/g, "");
        if (!cleanWord) return word;

        const lowerWord = cleanWord.toLowerCase();
        if (exactDictionary[lowerWord]) return exactDictionary[lowerWord];
        if (!isNaN(Number(cleanWord))) return word;

        let hindiWord = "";
        let i = 0;
        while (i < cleanWord.length) {
          const char = lowerWord[i];
          const next = lowerWord[i + 1] || "";
          const double = char + next;

          if (soundMap[double] && !['a', 'e', 'i', 'o', 'u'].includes(char)) {
            hindiWord += soundMap[double];
            i += 2;
          } else if (soundMap[char]) {
            if (i === 0 && ['a', 'e', 'i', 'o', 'u'].includes(char)) {
              if (char === 'a') hindiWord += 'अ';
              else if (char === 'e') hindiWord += 'ए';
              else if (char === 'i') hindiWord += 'इ';
              else if (char === 'o') hindiWord += 'ओ';
              else if (char === 'u') hindiWord += 'उ';
            } else {
              hindiWord += soundMap[char];
            }
            i++;
          } else {
            hindiWord += char;
            i++;
          }
        }
        return hindiWord || word;
      })
      .join(' ');

    cacheSet(strText, translated);
    return translated;
  } catch {
    return text;
  }
};
