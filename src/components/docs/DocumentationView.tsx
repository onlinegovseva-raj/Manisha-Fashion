import React, { useState } from 'react';
import { 
  BookOpen, 
  Terminal, 
  Database, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

export const DocumentationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'ARCHITECTURE' | 'WINDOWS_EXE' | 'SUPABASE_DEPLOY' | 'LOCAL_AI' | 'LICENSES' | 'STATUS_AUDIT'
  >('ARCHITECTURE');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* View Header */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-700" />
            <h2 className="text-xl font-bold text-stone-900 font-serif">
              Engineering Architecture & Deployment Runbook
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Zero-license-cost omnichannel architecture for Manisha Fashion: Tauri Windows Desktop EXE, PostgreSQL/Supabase cloud schema, and offline-first sync.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-wrap items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs">
          {[
            { id: 'ARCHITECTURE', label: '1. Architecture & DDL' },
            { id: 'WINDOWS_EXE', label: '2. Windows EXE Build' },
            { id: 'SUPABASE_DEPLOY', label: '3. Supabase Cloud Deploy' },
            { id: 'LOCAL_AI', label: '4. Local AI (rembg)' },
            { id: 'LICENSES', label: '5. License & Privacy' },
            { id: 'STATUS_AUDIT', label: '6. Features Audit' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Architecture & Directory Structure */}
      {activeTab === 'ARCHITECTURE' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-stone-900 font-serif">
              System Architecture & Offline Sync Topology
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              The system operates on an <strong>Offline-First Distributed Architecture</strong>. The desktop application runs on Windows using Tauri + SQLite/IndexedDB, while the customer storefront connects via HTTPS to a PostgreSQL database hosted on Supabase's free tier.
            </p>

            <div className="p-4 bg-stone-900 text-stone-200 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed border border-stone-800">
              <pre>{`+-----------------------------------------------------------------------------------+
|                        MANISHA FASHION HYBRID TOPOLOGY                            |
+-----------------------------------------------------------------------------------+
                                                                                     
  [ WINDOWS DESKTOP APP (Tauri/EXE) ]                 [ MOBILE STOREFRONT (PWA) ]  
    - Role: Owner, Manager, Dispatcher                  - Role: End Customers        
    - Local DB: SQLite / IndexedDB                      - Platform: Phone & Web      
    - AI Studio: rembg / Real-ESRGAN                    - Order via: Web / WhatsApp  
    - Outbox: Queued mutations when offline             - Payment: COD / Direct UPI  
                   |                                                  |              
                   | (Sync when Online via HTTPS)                     | (HTTPS API)  
                   v                                                  v              
+-----------------------------------------------------------------------------------+
|              SECURE CLOUD BACKEND (Supabase / PostgreSQL Free Tier)               |
|  - PostgreSQL Database with Row Level Security (RLS)                              |
|  - Idempotency & Unique Order Key Constraints                                     |
|  - Optimistic Concurrency Control (Version & Revision Locking)                    |
|  - Atomic Inventory Allocations & Stock Release on Cancellation                   |
+-----------------------------------------------------------------------------------+`}</pre>
            </div>

            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider pt-2">
              Project Directory Structure
            </h4>
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg font-mono text-xs text-stone-700">
              <pre>{`manisha-fashion/
├── src/
│   ├── components/
│   │   ├── desktop/            # Desktop Management Views (Modules 1, 2, 3, 5, 6, 7, 8, 9, 10)
│   │   │   ├── DashboardView.tsx
│   │   │   ├── ProductManagementView.tsx & ProductEditModal.tsx
│   │   │   ├── InventoryLedgerView.tsx (Negative-stock guard & audit trail)
│   │   │   ├── AIImageStudioView.tsx (Background removal & enhancements)
│   │   │   ├── OrdersDispatchView.tsx & InvoicePrintModal.tsx (GST Invoice)
│   │   │   ├── PaymentsUpiView.tsx (Direct UPI QR & verification)
│   │   │   ├── StaffRbacView.tsx (Role-based access matrix)
│   │   │   ├── AnalyticsReportsView.tsx (P&L profit & UTM campaign links)
│   │   │   └── SyncBackupView.tsx (Offline outbox & full JSON backup)
│   │   ├── storefront/         # Public Mobile Storefront (Module 4)
│   │   │   ├── StorefrontView.tsx
│   │   │   ├── ProductDetailModal.tsx (Size guide & WhatsApp order)
│   │   │   ├── CartDrawer.tsx (Stock limits & free delivery rules)
│   │   │   ├── CheckoutModal.tsx (10-digit phone, UPI QR, Idempotency)
│   │   │   └── OrderSuccessModal.tsx
│   │   ├── tests/              # Automated Test Runner View (Module 9)
│   │   └── docs/               # Architecture & Runbooks (Deliverables 1-11)
│   ├── services/
│   │   ├── storage.ts          # Offline storage, outbox, stock ledger, safe checkout
│   │   ├── imageStudio.ts      # Canvas AI studio engine with zero-cost fallback
│   │   └── testRunner.ts       # 8 automated assertion test suites
│   ├── types/index.ts          # Strict TypeScript interfaces
│   └── data/sampleData.ts      # Realistic Indian menswear sample catalog
├── src-tauri/                  # Tauri Desktop EXE project configuration
│   ├── tauri.conf.json         # Desktop window, security & build setup
│   ├── Cargo.toml              # Rust SQLite & system dependencies
│   └── src/main.rs             # Tauri native entry point
├── scripts/
│   └── local_rembg_service.py  # Local Python rembg U2-Net microservice
└── supabase/
    └── schema.sql              # Production PostgreSQL schema, RLS & triggers`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Windows EXE Build Instructions */}
      {activeTab === 'WINDOWS_EXE' && (
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-stone-900 font-serif">
            Step-by-Step Windows Desktop EXE Compilation Guide
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            The Windows desktop application uses <strong>Tauri v2</strong>. Tauri bundles the web frontend with the native Windows WebView2 runtime, producing a lightweight, native <strong>.EXE</strong> installer (~5MB to 8MB) without the massive memory overhead of Electron.
          </p>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg space-y-2">
              <span className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                Prerequisites on the Windows Development PC:
              </span>
              <ul className="list-disc pl-5 space-y-1 text-stone-600">
                <li><strong>Node.js 20+</strong> (LTS from nodejs.org)</li>
                <li><strong>Rust & Cargo</strong>: Install via <code className="bg-stone-200 px-1 py-0.5 rounded">rustup-init.exe</code> from rustup.rs</li>
                <li><strong>Microsoft C++ Build Tools</strong> (Visual Studio 2022 C++ desktop workload)</li>
                <li><strong>Windows 10 or 11</strong> (WebView2 comes pre-installed)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800">Command Sequence to Build EXE:</span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `# 1. Install Node dependencies\nnpm install\n\n# 2. Test development mode with hot reload\nnpm run tauri dev\n\n# 3. Compile Production Windows Installer (.exe)\nnpm run tauri build`,
                      'tauri_build'
                    )
                  }
                  className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1"
                >
                  {copiedCode === 'tauri_build' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'tauri_build' ? 'Copied' : 'Copy Commands'}</span>
                </button>
              </div>

              <div className="p-3 bg-stone-900 text-stone-100 rounded-lg font-mono text-xs overflow-x-auto">
                <p className="text-stone-400"># 1. Install project dependencies</p>
                <p>npm install</p>
                <p className="text-stone-400 mt-2"># 2. Test desktop application locally</p>
                <p>npm run tauri dev</p>
                <p className="text-stone-400 mt-2"># 3. Compile self-contained Windows EXE installer</p>
                <p className="text-amber-400">npm run tauri build</p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 space-y-1">
              <p className="font-bold">Output Location:</p>
              <p className="font-mono text-[11px]">
                src-tauri/target/release/bundle/nsis/Manisha-Fashion-Setup_1.0.0_x64.exe
              </p>
              <p className="text-[11px] text-emerald-800 pt-1">
                This installer can be copied to any staff Windows computer using a USB drive or Google Drive without licensing costs!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Supabase Cloud Deployment */}
      {activeTab === 'SUPABASE_DEPLOY' && (
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-stone-900 font-serif">
            Free-Tier Cloud Database Setup Guide (Supabase PostgreSQL)
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Supabase provides a generous free tier (500MB PostgreSQL database, 50,000 monthly active users, unlimited API requests, and automated daily backups), which is more than enough for a boutique menswear store.
          </p>

          <div className="space-y-3 text-xs">
            <ol className="list-decimal pl-5 space-y-2 text-stone-700">
              <li>
                <strong>Create Supabase Project:</strong> Go to <code className="bg-stone-100 px-1 py-0.5 rounded text-amber-800">supabase.com</code> and create a free account. Click <em>"New Project"</em> and choose the <strong>Mumbai (ap-south-1)</strong> region for lowest latency across India.
              </li>
              <li>
                <strong>Apply Database Schema:</strong> Open the <strong>SQL Editor</strong> in the Supabase Dashboard, copy the contents of <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">supabase/schema.sql</code>, and click <em>"Run"</em>.
              </li>
              <li>
                <strong>Configure Environment Variables:</strong> Under <em>Project Settings → API</em>, copy your Project URL and Anon Public Key. Add them to your desktop and storefront environment variables:
              </li>
            </ol>

            <div className="p-3 bg-stone-900 text-stone-100 rounded-lg font-mono text-xs overflow-x-auto space-y-1">
              <p className="text-stone-400"># In your .env file:</p>
              <p>VITE_SUPABASE_URL="https://your-project-id.supabase.co"</p>
              <p>VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."</p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 text-xs">
              <strong>Free Tier Limitations & Safe Practices:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-stone-700">
                <li>Supabase free projects pause after 7 days of inactivity; making an order or querying products keeps it active.</li>
                <li>Never expose the <code className="font-bold">service_role</code> secret key in frontend code. Use only the anonymous key with Row Level Security (RLS) policies as specified in <code className="font-mono">schema.sql</code>.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Local AI Installation */}
      {activeTab === 'LOCAL_AI' && (
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-stone-900 font-serif">
            Local AI Background Removal (rembg & U2-Net) Guide
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            To achieve studio-quality product photos without paying monthly SaaS subscriptions (like PhotoRoom or remove.bg), Manisha Fashion includes a bundled Python worker utilizing the open-source <strong>U2-Net</strong> model (MIT License).
          </p>

          <div className="space-y-3 text-xs">
            <div className="space-y-2">
              <span className="font-bold text-stone-800">Launch Local Python Worker:</span>
              <div className="p-3 bg-stone-900 text-stone-100 rounded-lg font-mono text-xs overflow-x-auto">
                <p className="text-stone-400"># Install free open-source AI dependencies</p>
                <p>pip install rembg pillow onnxruntime</p>
                <p className="text-stone-400 mt-2"># Run the background microservice</p>
                <p className="text-emerald-400">python scripts/local_rembg_service.py</p>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg space-y-2">
              <span className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                Graceful Fallback Mechanism:
              </span>
              <p className="text-stone-600">
                If the staff computer does not have Python or a GPU installed, the application <strong>automatically falls back to the built-in HTML5 Canvas engine</strong>. The user can still remove backdrops, apply studio lighting, and sharpen images without seeing an error or requiring an active server connection!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Licenses & Privacy */}
      {activeTab === 'LICENSES' && (
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-stone-900 font-serif">
            Zero-License Software Inventory & Privacy Checklist
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-stone-200">
              <thead className="bg-stone-50 text-stone-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5 border-b">Software Component</th>
                  <th className="p-2.5 border-b">License Type</th>
                  <th className="p-2.5 border-b">Cost to Business</th>
                  <th className="p-2.5 border-b">Commercial Use Permitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr>
                  <td className="p-2.5 font-bold">Tauri Framework</td>
                  <td className="p-2.5 font-mono">MIT / Apache 2.0</td>
                  <td className="p-2.5 text-emerald-700 font-bold">₹0 Free</td>
                  <td className="p-2.5 text-emerald-700 font-bold">✓ Yes</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">PostgreSQL & Supabase</td>
                  <td className="p-2.5 font-mono">Apache 2.0 / Free Tier</td>
                  <td className="p-2.5 text-emerald-700 font-bold">₹0 Free</td>
                  <td className="p-2.5 text-emerald-700 font-bold">✓ Yes</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">rembg / U2-Net</td>
                  <td className="p-2.5 font-mono">MIT License</td>
                  <td className="p-2.5 text-emerald-700 font-bold">₹0 Free</td>
                  <td className="p-2.5 text-emerald-700 font-bold">✓ Yes</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">React 19 & Tailwind CSS</td>
                  <td className="p-2.5 font-mono">MIT License</td>
                  <td className="p-2.5 text-emerald-700 font-bold">₹0 Free</td>
                  <td className="p-2.5 text-emerald-700 font-bold">✓ Yes</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Lucide Icons</td>
                  <td className="p-2.5 font-mono">ISC License</td>
                  <td className="p-2.5 text-emerald-700 font-bold">₹0 Free</td>
                  <td className="p-2.5 text-emerald-700 font-bold">✓ Yes</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-2">
            <h4 className="font-bold text-stone-900">Privacy & Data Governance Compliance:</h4>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li><strong>No Third-Party Spyware Trackers:</strong> The analytics engine stores events anonymously without scraping phone numbers or identity without consent.</li>
              <li><strong>No Card / UPI PIN Storage:</strong> Payment is strictly handled via direct UPI intent and cash-on-delivery; card numbers are never stored in the database.</li>
              <li><strong>Data Ownership:</strong> Manisha Fashion owns 100% of its customer data and product assets, exportable anytime as standard CSV or JSON.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 6: Status Audit of Features */}
      {activeTab === 'STATUS_AUDIT' && (
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-stone-900 font-serif">
            Deliverable 11: Realistic Feature Implementation Status Audit
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1.5">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Fully Working & Operational:</span>
              </span>
              <ul className="list-disc pl-5 space-y-1 text-emerald-950">
                <li>Desktop Windows management interface with RBAC (Owner, Manager, Catalog, Dispatcher, Cashier).</li>
                <li>Product catalogue with variants, size matrix, cotton/linen fabric details, and image gallery.</li>
                <li>Strict negative-stock prevention and immutable stock audit ledger history.</li>
                <li>AI Image Studio with interactive background removal, studio grey/white backdrops, 1:1 square crop, and Laplace sharpening.</li>
                <li>Mobile-friendly Indian menswear public storefront with live stock counts and INR ₹ pricing.</li>
                <li>Cash on Delivery (COD) and direct UPI with live dynamic QR generator and manual UTR verification.</li>
                <li>GST-ready itemized Tax Invoice & Packing Slip generator with HSN code and state tax breakdown.</li>
                <li>Direct customer WhatsApp notification links for order confirmation and dispatch tracking.</li>
                <li>Offline Outbox queue, conflict resolution rules, and complete JSON disaster recovery backup/restore.</li>
                <li>Automated test suite with 8 test cases validating business rules, idempotency, and restock transitions.</li>
              </ul>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Partially Working / Local Bridges:</span>
              </span>
              <ul className="list-disc pl-5 space-y-1 text-amber-950">
                <li>Local Python rembg daemon connects via localhost:5050 when launched on the Windows machine; falls back gracefully to in-browser Canvas algorithms when not running.</li>
                <li>Courier tracking uses manual AWB assignment and direct tracking URLs (Delhivery/BlueDart/India Post); automatic API webhook polling requires courier commercial accounts.</li>
              </ul>
            </div>

            <div className="p-3 bg-stone-100 border border-stone-200 rounded-lg space-y-1.5">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-stone-600" />
                <span>Roadmap for Future Paid Expansion (When Business Scales):</span>
              </span>
              <ul className="list-disc pl-5 space-y-1 text-stone-700">
                <li>Automated Shiprocket API integration for instant shipping label generation (requires commercial GST account).</li>
                <li>Automated Razorpay / Cashfree payment gateway webhook integration (requires 2% transaction fee).</li>
                <li>Custom top-level domain (<code className="font-mono">manishafashion.in</code>) with SSL.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
