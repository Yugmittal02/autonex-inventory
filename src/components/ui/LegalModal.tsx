import React from 'react';
import { FileText, HelpCircle, X } from 'lucide-react';

type LegalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'faq';
  t: (text: string) => string;
  isDark: boolean;
};

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type, t, isDark }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <div
        className={`w-full max-w-md rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto ${
          isDark ? 'bg-slate-900 text-white' : 'bg-white text-black'
        }`}
      >
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-xl font-bold flex items-center gap-2">
            {type === 'privacy' ? (
              <FileText className="text-blue-500" />
            ) : (
              <HelpCircle className="text-yellow-500" />
            )}
            {type === 'privacy' ? t('Privacy & Policy') : t('FAQ')}
          </h3>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {type === 'privacy' ? (
          <div className="text-sm space-y-2 opacity-80">
            <p className="font-bold text-base mb-2">Autonex Privacy Policy</p>
            <p>Last updated: {new Date().toLocaleDateString()}</p>

            <div className="mt-4">
              <p className="font-bold text-base mb-2">1. Data Collection</p>
              <p>
                Your inventory data, shop details, and bills are stored securely on Google Firebase
                servers with AES-256 encryption.
              </p>
              <p>We do NOT sell, share, or trade your business data with third parties.</p>
            </div>

            <div className="mt-4">
              <p className="font-bold text-base mb-2">2. Data Security</p>
              <p>All data transmission is encrypted using SSL/TLS protocols.</p>
              <p>Password protection and optional biometric lock features are available.</p>
              <p>Regular automated backups ensure data safety.</p>
            </div>

            <div className="mt-4">
              <p className="font-bold text-base mb-2">3. User Rights</p>
              <p>You can export your data anytime from Settings → Backup.</p>
              <p>You can request complete data deletion by contacting support.</p>
              <p>Your data remains yours - we only provide the platform.</p>
            </div>

            <div className="mt-4">
              <p className="font-bold text-base mb-2">4. Third-Party Services</p>
              <p>Google Firebase (Database & Authentication)</p>
              <p>Google Cloud Storage (Bill Images)</p>
              <p>MyMemory API (Translation - no personal data shared)</p>
            </div>

            <div className="mt-4">
              <p className="font-bold text-base mb-2">5. Liability Disclaimer</p>
              <p>
                Autonex is a digital record-keeping tool and is not responsible for physical stock
                discrepancies.
              </p>
              <p>Always verify physical stock counts periodically.</p>
            </div>

            <p className="mt-4 pt-4 border-t text-xs">
              For legal inquiries or data requests, contact: support@autonex.in
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg p-3">
              <p className="font-bold text-blue-500 mb-1">Q: How do I add a new item?</p>
              <p className="text-sm opacity-80">
                A: Navigate to any Page from the Index, tap the (+) button at the bottom right, and
                enter the car/vehicle name along with quantity.
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="font-bold text-blue-500 mb-1">Q: How do I create a new page/category?</p>
              <p className="text-sm opacity-80">
                A: From the Index screen, tap the (+) button and enter the item/category name (e.g.,
                "Brake Pads", "Oil Filters").
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="font-bold text-blue-500 mb-1">Q: How do I delete or rename a page?</p>
              <p className="text-sm opacity-80">
                A: In the Index, tap the Edit (pencil) icon next to any page. You can rename,
                reorder, or delete the page from there.
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="font-bold text-blue-500 mb-1">
                Q: How do I copy items from one page to another?
              </p>
              <p className="text-sm opacity-80">
                A: Open the destination page, tap the Copy icon in the header, select the source
                page, then choose which items to copy.
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="font-bold text-blue-500 mb-1">Q: How do I save my stock changes?</p>
              <p className="text-sm opacity-80">
                A: After updating quantities (+/-), a green "Update" button appears. Tap it and
                enter your password to save all changes to the cloud.
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="font-bold text-blue-500 mb-1">Q: What is the Product Password?</p>
              <p className="text-sm opacity-80">
                A: It's a 4-digit PIN (default: 0000) required to save changes and access settings.
                Change it in Settings → Security.
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="font-bold text-blue-500 mb-1">Q: How do I use voice search?</p>
              <p className="text-sm opacity-80">
                A: Tap the microphone icon in any search bar, or shake your phone (if enabled) to
                activate voice search. Speak in Hindi or English.
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="font-bold text-blue-500 mb-1">Q: Can I use the app offline?</p>
              <p className="text-sm opacity-80">
                A: Yes! Changes made offline are saved locally and automatically sync when you
                reconnect to the internet.
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="font-bold text-blue-500 mb-1">
                Q: How do I install the app on my phone?
              </p>
              <p className="text-sm opacity-80">
                A: Go to Settings → Profile → Install App, or use your browser's "Add to Home
                Screen" option.
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="font-bold text-blue-500 mb-1">Q: I forgot my password. What do I do?</p>
              <p className="text-sm opacity-80">
                A: Contact Autonex support with your Customer ID (found in Settings → Profile) to
                reset your password.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalModal;
