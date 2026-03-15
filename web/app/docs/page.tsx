'use client';

import { useEffect, useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Header } from '@/components/header';
import { ChevronRight, Menu, X, ExternalLink } from 'lucide-react';

// Documentation sections
const sections = [
  {
    id: 'introduction',
    title: 'Introduction',
    subsections: [
      { id: 'overview', title: 'Overview' },
      { id: 'why-accessfi', title: 'Why AccessFi?' },
      { id: 'key-features', title: 'Key Features' },
    ],
  },
  {
    id: 'how-it-works',
    title: 'How It Works',
    subsections: [
      { id: 'architecture', title: 'Architecture' },
      { id: 'data-pools', title: 'Data Pools' },
      { id: 'proof-system', title: 'Proof System' },
      { id: 'payment-flow', title: 'Payment Flow' },
      { id: 'fees', title: 'Fees' },
    ],
  },
  {
    id: 'buyers-guide',
    title: 'Buyers Guide',
    subsections: [
      { id: 'creating-pools', title: 'Creating Pools' },
      { id: 'pool-settings', title: 'Pool Settings' },
      { id: 'managing-data', title: 'Managing Data' },
    ],
  },
  {
    id: 'sellers-guide',
    title: 'Sellers Guide',
    subsections: [
      { id: 'joining-pools', title: 'Joining Pools' },
      { id: 'submitting-proofs', title: 'Submitting Proofs' },
      { id: 'getting-paid', title: 'Getting Paid' },
    ],
  },
  {
    id: 'technical',
    title: 'Technical',
    subsections: [
      { id: 'smart-contracts', title: 'Smart Contracts' },
      { id: 'zkemail', title: 'zkEmail Integration' },
      { id: 'zkverify', title: 'zkVerify' },
      { id: 'security', title: 'Security Model' },
    ],
  },
  {
    id: 'api',
    title: 'API Reference',
    subsections: [
      { id: 'api-overview', title: 'Overview' },
      { id: 'endpoints', title: 'Endpoints' },
    ],
  },
  {
    id: 'faq',
    title: 'FAQ',
    subsections: [
      { id: 'buyers-faq', title: 'Buyers' },
      { id: 'sellers-faq', title: 'Sellers' },
      { id: 'security-faq', title: 'Security' },
    ],
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['introduction']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleSubsectionClick = (subsectionId: string, parentId: string) => {
    setActiveSection(subsectionId);
    if (!expandedSections.includes(parentId)) {
      setExpandedSections((prev) => [...prev, parentId]);
    }
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Header />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center border-2 border-primary bg-primary text-primary-foreground lg:hidden"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r-2 border-border bg-card pt-20 transition-transform duration-300 lg:relative lg:translate-x-0 lg:pt-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full overflow-y-auto p-6">
            <div className="mb-6">
              <h2 className="font-mono text-xs font-bold uppercase text-muted-foreground">
                DOCUMENTATION
              </h2>
            </div>

            <nav className="space-y-2">
              {sections.map((section) => (
                <div key={section.id}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="flex w-full items-center justify-between py-2 font-mono text-sm font-bold uppercase transition-colors hover:text-primary"
                  >
                    <span>{section.title}</span>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        expandedSections.includes(section.id) ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedSections.includes(section.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 border-l-2 border-border pl-4">
                          {section.subsections.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => handleSubsectionClick(sub.id, section.id)}
                              className={`block w-full py-2 text-left font-mono text-xs transition-colors ${
                                activeSection === sub.id
                                  ? 'text-primary font-bold'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {sub.title}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* External links */}
            <div className="mt-8 border-t-2 border-border pt-6">
              <h3 className="mb-4 font-mono text-xs font-bold uppercase text-muted-foreground">
                RESOURCES
              </h3>
              <div className="space-y-2">
                <a
                  href="https://github.com/accessfi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  <span>GitHub</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="https://twitter.com/accessfi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  <span>Twitter</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-12">
          <div className="mx-auto max-w-4xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeSection === 'overview' && <OverviewSection />}
                {activeSection === 'why-accessfi' && <WhyAccessFiSection />}
                {activeSection === 'key-features' && <KeyFeaturesSection />}
                {activeSection === 'architecture' && <ArchitectureSection />}
                {activeSection === 'data-pools' && <DataPoolsSection />}
                {activeSection === 'proof-system' && <ProofSystemSection />}
                {activeSection === 'payment-flow' && <PaymentFlowSection />}
                {activeSection === 'fees' && <FeesSection />}
                {activeSection === 'creating-pools' && <CreatingPoolsSection />}
                {activeSection === 'pool-settings' && <PoolSettingsSection />}
                {activeSection === 'managing-data' && <ManagingDataSection />}
                {activeSection === 'joining-pools' && <JoiningPoolsSection />}
                {activeSection === 'submitting-proofs' && <SubmittingProofsSection />}
                {activeSection === 'getting-paid' && <GettingPaidSection />}
                {activeSection === 'smart-contracts' && <SmartContractsSection />}
                {activeSection === 'zkemail' && <ZkEmailSection />}
                {activeSection === 'zkverify' && <ZkVerifySection />}
                {activeSection === 'security' && <SecuritySection />}
                {activeSection === 'api-overview' && <ApiOverviewSection />}
                {activeSection === 'endpoints' && <EndpointsSection />}
                {activeSection === 'buyers-faq' && <BuyersFaqSection />}
                {activeSection === 'sellers-faq' && <SellersFaqSection />}
                {activeSection === 'security-faq' && <SecurityFaqSection />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

// ============================================================
//                    SECTION COMPONENTS
// ============================================================

function DocSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="prose prose-invert max-w-none">
      <h1 className="mb-8 font-mono text-4xl font-black uppercase">{title}</h1>
      {children}
    </div>
  );
}

function DocSubsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-4 font-mono text-xl font-bold uppercase text-primary">{title}</h2>
      {children}
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mb-6 overflow-x-auto border-2 border-border bg-card p-4 font-mono text-xs">
      <code>{children}</code>
    </pre>
  );
}

function MermaidBlock({ children }: { children: string }) {
  const [svg, setSvg] = useState<string>('');
  const mermaidId = useId();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'strict',
      });
      const { svg } = await mermaid.render(`mermaid-${mermaidId}`, children.trim());
      if (!cancelled) {
        setSvg(svg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [children, mermaidId]);

  return (
    <div className="mb-6 overflow-x-auto border-2 border-border bg-card p-4">
      {svg ? (
        <div className="mermaid" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="font-mono text-xs text-muted-foreground">Rendering diagram…</div>
      )}
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 border-2 border-primary/30 bg-primary/5 p-4">
      <div className="flex gap-3">
        <span className="text-primary">ℹ</span>
        <div className="font-mono text-sm">{children}</div>
      </div>
    </div>
  );
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 border-2 border-yellow-500/30 bg-yellow-500/5 p-4">
      <div className="flex gap-3">
        <span className="text-yellow-500">⚠</span>
        <div className="font-mono text-sm">{children}</div>
      </div>
    </div>
  );
}

// ============================================================
//                    INTRODUCTION SECTIONS
// ============================================================

function OverviewSection() {
  return (
    <DocSection title="Overview">
      <p className="mb-6 text-lg text-muted-foreground">
        AccessFi is a privacy-first verified data network where buyers purchase asset access and sellers
        get paid instantly. Sellers prove ownership of data (like an email) using zero-knowledge proofs,
        while the raw content stays private and only minimal data is revealed.
      </p>

      <DocSubsection title="What is AccessFi?">
        <p className="mb-4 text-muted-foreground">
          AccessFi enables a new paradigm for data trading where:
        </p>
        <ul className="mb-6 space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">◆</span>
            <span>Sellers prove authenticity with zkEmail without exposing raw email content</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">◆</span>
            <span>Buyers receive cryptographically verified asset access</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">◆</span>
            <span>Payments and access rights are enforced on-chain</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">◆</span>
            <span>Encrypted data stored in TEE, decryptable only by the buyer</span>
          </li>
        </ul>
      </DocSubsection>

      <DocSubsection title="Quick Start">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border-2 border-border bg-card p-6">
            <h3 className="mb-2 font-mono text-sm font-bold uppercase text-primary">FOR BUYERS</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Browse verified inventory first, then create pools when data is missing.
            </p>
            <Link
              href="/pools"
              className="font-mono text-xs text-primary underline"
            >
              Explore Pools →
            </Link>
          </div>
          <div className="border-2 border-border bg-card p-6">
            <h3 className="mb-2 font-mono text-sm font-bold uppercase text-primary">FOR SELLERS</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Submit your verified data to earn rewards instantly.
            </p>
            <Link
              href="/pools"
              className="font-mono text-xs text-primary underline"
            >
              Find Pools →
            </Link>
          </div>
        </div>
      </DocSubsection>

      <DocSubsection title="System Overview Diagram">
        <MermaidBlock>{`
graph TD
  A["Seller (.eml)"] --> B["Browser: zkEmail proof"]
  B --> C["zkVerify (Horizen)"]
  C --> D["AccessFi Pool"]
  A --> E["TEE Encrypt (Phala CVM)"]
  E --> D
  D --> F["Seller Paid"]
  D --> G["Data Token to Buyer"]
  G --> H["Buyer Decrypts via TEE"]
        `}</MermaidBlock>
      </DocSubsection>
    </DocSection>
  );
}

function WhyAccessFiSection() {
  return (
    <DocSection title="Why AccessFi?">
      <p className="mb-6 text-lg text-muted-foreground">
        Traditional data exchanges require trust in centralized intermediaries and expose
        sensitive information. AccessFi solves this with zero-knowledge technology.
      </p>

      <DocSubsection title="The Problem">
        <div className="mb-6 space-y-4">
          <div className="flex items-start gap-4 border-2 border-destructive/30 bg-destructive/5 p-4">
            <span className="text-destructive">✗</span>
            <div>
              <h4 className="font-mono text-sm font-bold">Privacy Risks</h4>
              <p className="text-sm text-muted-foreground">
                Traditional markets require sharing raw data, exposing sensitive information
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 border-2 border-destructive/30 bg-destructive/5 p-4">
            <span className="text-destructive">✗</span>
            <div>
              <h4 className="font-mono text-sm font-bold">Trust Issues</h4>
              <p className="text-sm text-muted-foreground">
                No way to verify data authenticity without trusted third parties
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 border-2 border-destructive/30 bg-destructive/5 p-4">
            <span className="text-destructive">✗</span>
            <div>
              <h4 className="font-mono text-sm font-bold">Fraud Potential</h4>
              <p className="text-sm text-muted-foreground">
                Easy to submit fake or manipulated data
              </p>
            </div>
          </div>
        </div>
      </DocSubsection>

      <DocSubsection title="Our Solution">
        <div className="mb-6 space-y-4">
          <div className="flex items-start gap-4 border-2 border-primary/30 bg-primary/5 p-4">
            <span className="text-primary">✓</span>
            <div>
              <h4 className="font-mono text-sm font-bold">Zero-Knowledge Proofs</h4>
              <p className="text-sm text-muted-foreground">
                Prove data authenticity without revealing content using zkEmail
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 border-2 border-primary/30 bg-primary/5 p-4">
            <span className="text-primary">✓</span>
            <div>
              <h4 className="font-mono text-sm font-bold">On-Chain Verification</h4>
              <p className="text-sm text-muted-foreground">
                All proofs verified on-chain via zkVerify for trustless verification
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 border-2 border-primary/30 bg-primary/5 p-4">
            <span className="text-primary">✓</span>
            <div>
              <h4 className="font-mono text-sm font-bold">Hardware Encryption</h4>
              <p className="text-sm text-muted-foreground">
                Data encrypted with Phala TEE for hardware-backed security
              </p>
            </div>
          </div>
        </div>
      </DocSubsection>
    </DocSection>
  );
}

function KeyFeaturesSection() {
  return (
    <DocSection title="Key Features">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="border-2 border-border bg-card p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-primary text-2xl">
            🔒
          </div>
          <h3 className="mb-2 font-mono text-sm font-bold uppercase">Privacy Preserving</h3>
          <p className="text-sm text-muted-foreground">
            Your raw data never leaves your device. Only cryptographic proofs are submitted.
          </p>
        </div>

        <div className="border-2 border-border bg-card p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-primary text-2xl">
            ⚡
          </div>
          <h3 className="mb-2 font-mono text-sm font-bold uppercase">Instant Payments</h3>
          <p className="text-sm text-muted-foreground">
            Sellers receive ETH immediately upon successful proof verification.
          </p>
        </div>

        <div className="border-2 border-border bg-card p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-primary text-2xl">
            ✓
          </div>
          <h3 className="mb-2 font-mono text-sm font-bold uppercase">Verified Data</h3>
          <p className="text-sm text-muted-foreground">
            All data is cryptographically verified using DKIM signatures and ZK proofs.
          </p>
        </div>

        <div className="border-2 border-border bg-card p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-primary text-2xl">
            🌐
          </div>
          <h3 className="mb-2 font-mono text-sm font-bold uppercase">Fully On-Chain</h3>
          <p className="text-sm text-muted-foreground">
            No centralized servers. Everything runs on smart contracts.
          </p>
        </div>

        <div className="border-2 border-border bg-card p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-primary text-2xl">
            🎫
          </div>
          <h3 className="mb-2 font-mono text-sm font-bold uppercase">Asset Access</h3>
          <p className="text-sm text-muted-foreground">
            Each verified submission becomes a reusable asset with on-chain access rights.
          </p>
        </div>

        <div className="border-2 border-border bg-card p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-primary text-2xl">
            🔐
          </div>
          <h3 className="mb-2 font-mono text-sm font-bold uppercase">TEE Encryption</h3>
          <p className="text-sm text-muted-foreground">
            Optional hardware-backed encryption with Phala Network TEE.
          </p>
        </div>
      </div>
    </DocSection>
  );
}

// ============================================================
//                    HOW IT WORKS SECTIONS
// ============================================================

function ArchitectureSection() {
  return (
    <DocSection title="Architecture">
      <p className="mb-6 text-muted-foreground">
        AccessFi combines ZK proofs, on-chain verification, and confidential compute to create a
        trustless, privacy-preserving verified data network.
      </p>

      <DocSubsection title="System Components">
        <div className="mb-6 border-2 border-border bg-card p-6">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-primary bg-primary font-mono text-sm font-bold text-primary-foreground">
                1
              </div>
              <div>
                <h4 className="font-mono text-sm font-bold">Smart Contracts (Horizen Testnet)</h4>
                <p className="text-sm text-muted-foreground">
                  Core contracts handle pool creation, proof verification, asset registration, and access settlement.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-primary bg-primary font-mono text-sm font-bold text-primary-foreground">
                2
              </div>
              <div>
                <h4 className="font-mono text-sm font-bold">zkEmail (Client-Side)</h4>
                <p className="text-sm text-muted-foreground">
                  Generates zero-knowledge proofs from email DKIM signatures locally in browser.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-primary bg-primary font-mono text-sm font-bold text-primary-foreground">
                3
              </div>
              <div>
                <h4 className="font-mono text-sm font-bold">zkVerify (Horizen)</h4>
                <p className="text-sm text-muted-foreground">
                  Aggregates and verifies proofs on-chain with domain aggregation for gas efficiency.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-primary bg-primary font-mono text-sm font-bold text-primary-foreground">
                4
              </div>
              <div>
                <h4 className="font-mono text-sm font-bold">Phala TEE (CVM)</h4>
                <p className="text-sm text-muted-foreground">
                  Hardware-secured encryption for recipient data storage and controlled decryption.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DocSubsection>

      <DocSubsection title="Data Flow">
        <MermaidBlock>{`
sequenceDiagram
  participant U as Buyer
  participant C as AccessFi Pool
  participant S as Seller
  participant B as Browser
  participant T as Phala TEE
  participant Z as zkVerify
  U->>C: Create & fund pool (proof requirements)
  S->>B: Upload .eml
  B->>B: Extract recipient + generate zkEmail proof
  B->>T: Encrypt recipient (returns encryptedCID)
  B->>Z: Submit proof
  Z->>C: Verification result
  C->>C: Register asset + grant buyer access
  C->>S: Pay seller
  C->>U: Grant buyer access to the verified asset
  U->>T: Sign + decrypt
        `}</MermaidBlock>
      </DocSubsection>
    </DocSection>
  );
}

function DataPoolsSection() {
  return (
    <DocSection title="Data Pools">
      <p className="mb-6 text-muted-foreground">
        Data pools are the core primitive of AccessFi. Buyers create pools to collect specific
        types of verified data from sellers.
      </p>

      <DocSubsection title="Pool Structure">
        <CodeBlock>{`
struct Pool {
    string name;           // Pool display name
    string dataType;       // Type of data requested
    uint256 pricePerData;  // Payment per verified submission
    uint256 totalBudget;   // Maximum pool budget
    uint256 deadline;      // Pool expiration timestamp
    address creator;       // Pool creator (buyer)
    bytes32[] proofs;      // Required proof type IDs
    bool isActive;         // Pool status
}
        `}</CodeBlock>
      </DocSubsection>

      <DocSubsection title="Pool Lifecycle">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center border-2 border-primary font-mono text-xs font-bold">
              1
            </div>
            <span className="text-muted-foreground">Buyer creates pool and funds budget</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center border-2 border-primary font-mono text-xs font-bold">
              2
            </div>
            <span className="text-muted-foreground">Sellers join and submit proofs</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center border-2 border-primary font-mono text-xs font-bold">
              3
            </div>
            <span className="text-muted-foreground">Verified sellers are paid instantly</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center border-2 border-primary font-mono text-xs font-bold">
              4
            </div>
            <span className="text-muted-foreground">Buyer receives asset access</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center border-2 border-primary font-mono text-xs font-bold">
              5
            </div>
            <span className="text-muted-foreground">Pool closes at deadline or budget exhaustion</span>
          </div>
        </div>
      </DocSubsection>
    </DocSection>
  );
}

function ProofSystemSection() {
  return (
    <DocSection title="Proof System">
      <p className="mb-6 text-muted-foreground">
        AccessFi uses zero-knowledge proofs to verify data authenticity without revealing content.
      </p>

      <DocSubsection title="Supported Proof Types">
        <div className="space-y-4">
          <div className="border-2 border-border bg-card p-4">
            <h4 className="font-mono text-sm font-bold text-primary">EMAIL_VERIFICATION</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Proves ownership of an email using DKIM signature verification via zkEmail.
            </p>
          </div>
          <div className="border-2 border-border bg-card p-4 opacity-50">
            <h4 className="font-mono text-sm font-bold">AGE_VERIFICATION</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Coming soon - Prove you are above a certain age without revealing birthdate.
            </p>
          </div>
          <div className="border-2 border-border bg-card p-4 opacity-50">
            <h4 className="font-mono text-sm font-bold">NATIONALITY</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Coming soon - Prove nationality without revealing passport details.
            </p>
          </div>
        </div>
      </DocSubsection>

      <DocSubsection title="How zkEmail Works">
        <InfoBox>
          zkEmail leverages the existing DKIM (DomainKeys Identified Mail) infrastructure that email
          providers already use to cryptographically sign outgoing emails.
        </InfoBox>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>1. Email provider signs email with their private key (DKIM)</li>
          <li>2. User exports email as .eml file</li>
          <li>3. zkEmail circuit verifies DKIM signature</li>
          <li>4. Generates ZK proof that email is authentic</li>
          <li>5. Proof can be verified without revealing email content</li>
        </ol>
      </DocSubsection>

      <DocSubsection title="What Gets Stored">
        <InfoBox>
          Only the recipient email is encrypted and stored in the TEE. The on-chain metadata stores
          an encryptedCID plus a per-pool data hash.
        </InfoBox>
      </DocSubsection>
    </DocSection>
  );
}

function PaymentFlowSection() {
  return (
    <DocSection title="Payment Flow">
      <p className="mb-6 text-muted-foreground">
        Payments are handled entirely on-chain with instant settlement upon proof verification.
      </p>

      <DocSubsection title="For Sellers">
        <div className="border-2 border-primary/30 bg-primary/5 p-6">
          <ol className="space-y-3 font-mono text-sm">
            <li className="flex items-start gap-3">
              <span className="text-primary">1.</span>
              <span>Submit verified proof to pool</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary">2.</span>
              <span>Contract verifies proof on-chain</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary">3.</span>
              <span>Verified asset is registered on-chain</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary">4.</span>
              <span>ETH transferred instantly to your wallet</span>
            </li>
          </ol>
        </div>
      </DocSubsection>

      <DocSubsection title="For Buyers">
        <div className="border-2 border-border bg-card p-6">
          <ol className="space-y-3 font-mono text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="text-foreground">1.</span>
              <span>Create pool with ETH budget</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-foreground">2.</span>
              <span>Funds locked in smart contract</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-foreground">3.</span>
              <span>Sellers submit verified data</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-foreground">4.</span>
              <span>Receive asset access automatically</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-foreground">5.</span>
              <span>Withdraw remaining budget after deadline</span>
            </li>
          </ol>
        </div>
      </DocSubsection>
    </DocSection>
  );
}

function FeesSection() {
  return (
    <DocSection title="Fees">
      <p className="mb-6 text-muted-foreground">
        AccessFi charges a small platform fee on pool funding. Seller payments are automatic and
        transparent.
      </p>

      <DocSubsection title="Platform Fee">
        <div className="border-2 border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            A 5% platform fee is deducted when a buyer funds a pool. The remaining amount becomes the
            pool budget used to pay sellers. This fee is taken only once per funding action.
          </p>
        </div>
      </DocSubsection>

      <DocSubsection title="Seller Payouts">
        <InfoBox>
          Sellers receive the full “price per data” amount set by the pool after proof verification.
          The platform fee is paid by the buyer when funding the pool.
        </InfoBox>
      </DocSubsection>
    </DocSection>
  );
}

// ============================================================
//                    BUYERS GUIDE SECTIONS
// ============================================================

function CreatingPoolsSection() {
  return (
    <DocSection title="Creating Pools">
      <p className="mb-6 text-muted-foreground">
        As a buyer, you create data pools to collect verified data from sellers.
      </p>

      <DocSubsection title="Step-by-Step Guide">
        <ol className="space-y-4">
          <li className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-primary bg-primary font-mono text-sm font-bold text-primary-foreground">
              1
            </div>
            <div>
              <h4 className="font-mono text-sm font-bold">Connect Wallet</h4>
              <p className="text-sm text-muted-foreground">
                Connect your wallet (MetaMask, WalletConnect, etc.)
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-primary bg-primary font-mono text-sm font-bold text-primary-foreground">
              2
            </div>
            <div>
              <h4 className="font-mono text-sm font-bold">Complete Profile</h4>
              <p className="text-sm text-muted-foreground">
                Set up your AccessFi profile (one-time setup)
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-primary bg-primary font-mono text-sm font-bold text-primary-foreground">
              3
            </div>
            <div>
              <h4 className="font-mono text-sm font-bold">Click &quot;Create Pool&quot;</h4>
              <p className="text-sm text-muted-foreground">
                Found on the home page or pools page
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-primary bg-primary font-mono text-sm font-bold text-primary-foreground">
              4
            </div>
            <div>
              <h4 className="font-mono text-sm font-bold">Configure Pool</h4>
              <p className="text-sm text-muted-foreground">
                Set name, data type, price per submission, budget, and deadline
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-primary bg-primary font-mono text-sm font-bold text-primary-foreground">
              5
            </div>
            <div>
              <h4 className="font-mono text-sm font-bold">Fund Pool</h4>
              <p className="text-sm text-muted-foreground">
                Deposit ETH to cover seller payments
              </p>
            </div>
          </li>
        </ol>
      </DocSubsection>

      <WarningBox>
        Make sure you have enough ETH for both the pool budget AND gas fees.
      </WarningBox>
    </DocSection>
  );
}

function PoolSettingsSection() {
  return (
    <DocSection title="Pool Settings">
      <p className="mb-6 text-muted-foreground">
        Configure your pool settings to attract the right sellers.
      </p>

      <DocSubsection title="Configuration Options">
        <div className="space-y-4">
          <div className="border-2 border-border bg-card p-4">
            <h4 className="font-mono text-sm font-bold">Pool Name</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              A descriptive name for your pool (e.g., &quot;Netflix Subscribers Q1 2025&quot;)
            </p>
          </div>
          <div className="border-2 border-border bg-card p-4">
            <h4 className="font-mono text-sm font-bold">Data Type</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              The category of data you&apos;re collecting (e.g., &quot;Email&quot;, &quot;Identity&quot;, &quot;Social&quot;)
            </p>
          </div>
          <div className="border-2 border-border bg-card p-4">
            <h4 className="font-mono text-sm font-bold">Price Per Data</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              How much ETH each verified submission earns (e.g., 0.001 ETH)
            </p>
          </div>
          <div className="border-2 border-border bg-card p-4">
            <h4 className="font-mono text-sm font-bold">Total Budget</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Maximum ETH to spend on this pool
            </p>
          </div>
          <div className="border-2 border-border bg-card p-4">
            <h4 className="font-mono text-sm font-bold">Deadline</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              When the pool stops accepting submissions
            </p>
          </div>
        </div>
      </DocSubsection>
    </DocSection>
  );
}

function ManagingDataSection() {
  return (
    <DocSection title="Managing Data">
      <p className="mb-6 text-muted-foreground">
        Once sellers submit verified data, you can access it through your dashboard and decrypt it
        securely when needed.
      </p>

      <DocSubsection title="Accessing Your Data">
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li>1. Go to Dashboard → Purchases tab</li>
          <li>2. Your pools are displayed as cards showing data count</li>
          <li>3. Click &quot;View All Data&quot; to see individual submissions</li>
          <li>4. Click on any submission to view the full data</li>
        </ol>
      </DocSubsection>

      <DocSubsection title="Asset Access">
        <InfoBox>
          Each verified submission becomes a registered asset. Buyers receive on-chain access rights,
          and sellers can allow future resale through the inventory flow.
        </InfoBox>
      </DocSubsection>

      <DocSubsection title="Secure Decryption">
        <p className="mb-4 text-sm text-muted-foreground">
          Recipient data is encrypted and stored in a TEE (Phala CVM). To view the data:
        </p>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>1. Click “View” on an asset</li>
          <li>2. Click “Decrypt”</li>
          <li>3. Sign the wallet message to prove ownership</li>
          <li>4. The data is decrypted inside the TEE and returned securely</li>
        </ol>
      </DocSubsection>

      <DocSubsection title="API Access (Coming Soon)">
        <div className="border-2 border-border bg-card p-6">
          <div className="mb-4 inline-flex items-center gap-2 border border-yellow-500 bg-yellow-500/10 px-3 py-1">
            <span className="font-mono text-xs text-yellow-500">COMING SOON</span>
          </div>
          <p className="text-sm text-muted-foreground">
            We&apos;re building API access so you can programmatically retrieve purchased assets and pool results.
            This will support direct integrations with your applications.
          </p>
        </div>
      </DocSubsection>
    </DocSection>
  );
}

// ============================================================
//                    SELLERS GUIDE SECTIONS
// ============================================================

function JoiningPoolsSection() {
  return (
    <DocSection title="Joining Pools">
      <p className="mb-6 text-muted-foreground">
        As a seller, you can earn ETH by submitting verified data to pools.
      </p>

      <DocSubsection title="Finding Pools">
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li>1. Browse the Pools page to see available pools</li>
          <li>2. Check the reward amount (Price Per Data)</li>
          <li>3. Verify you have the required data type</li>
          <li>4. Ensure the pool is active and has budget remaining</li>
        </ol>
      </DocSubsection>

      <DocSubsection title="Requirements">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">◆</span>
            <span>Connected wallet with some ETH for gas</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">◆</span>
            <span>AccessFi profile set up</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">◆</span>
            <span>Email file (.eml) for email verification pools</span>
          </li>
        </ul>
      </DocSubsection>
    </DocSection>
  );
}

function SubmittingProofsSection() {
  return (
    <DocSection title="Submitting Proofs">
      <p className="mb-6 text-muted-foreground">
        Submit zero-knowledge proofs to earn rewards from data pools.
      </p>

      <DocSubsection title="Email Proof Submission">
        <ol className="space-y-4">
          <li className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-primary bg-primary font-mono text-sm font-bold text-primary-foreground">
              1
            </div>
            <div>
              <h4 className="font-mono text-sm font-bold">Export Email</h4>
              <p className="text-sm text-muted-foreground">
                Download the email as a .eml file from your email client
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-primary bg-primary font-mono text-sm font-bold text-primary-foreground">
              2
            </div>
            <div>
              <h4 className="font-mono text-sm font-bold">Upload File</h4>
              <p className="text-sm text-muted-foreground">
                Click &quot;Join Pool&quot; and drag/drop your .eml file
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-primary bg-primary font-mono text-sm font-bold text-primary-foreground">
              3
            </div>
            <div>
              <h4 className="font-mono text-sm font-bold">Generate Proof</h4>
              <p className="text-sm text-muted-foreground">
                The proof is generated locally in your browser (30-60 seconds)
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-primary bg-primary font-mono text-sm font-bold text-primary-foreground">
              4
            </div>
            <div>
              <h4 className="font-mono text-sm font-bold">Submit Transaction</h4>
              <p className="text-sm text-muted-foreground">
                Confirm the transaction in your wallet
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-primary bg-primary font-mono text-sm font-bold text-primary-foreground">
              5
            </div>
            <div>
              <h4 className="font-mono text-sm font-bold">Receive Payment</h4>
              <p className="text-sm text-muted-foreground">
                ETH is transferred to your wallet automatically
              </p>
            </div>
          </li>
        </ol>
      </DocSubsection>

      <InfoBox>
        Your raw email content is processed locally. Only the recipient email is encrypted inside
        the TEE and referenced on-chain via an encryptedCID.
      </InfoBox>
    </DocSection>
  );
}

function GettingPaidSection() {
  return (
    <DocSection title="Getting Paid">
      <p className="mb-6 text-muted-foreground">
        Payments are instant and automatic upon successful proof verification.
      </p>

      <DocSubsection title="Payment Process">
        <div className="border-2 border-primary/30 bg-primary/5 p-6">
          <div className="space-y-4 font-mono text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Proof Verified</span>
              <span className="text-primary">→</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Data Token Minted</span>
              <span className="text-primary">→</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ETH Transferred</span>
              <span className="text-primary">✓</span>
            </div>
          </div>
        </div>
      </DocSubsection>

      <DocSubsection title="Viewing Earnings">
        <p className="mb-4 text-sm text-muted-foreground">
          Track your earnings in the Dashboard → Joined Pools section. You can see:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Total ETH earned across all pools</li>
          <li>• Earnings per pool</li>
          <li>• Number of successful submissions</li>
          <li>• Transaction history</li>
        </ul>
      </DocSubsection>
    </DocSection>
  );
}

// ============================================================
//                    TECHNICAL SECTIONS
// ============================================================

function SmartContractsSection() {
  const assetRegistry = process.env.NEXT_PUBLIC_ASSET_REGISTRY_ADDRESS || '0x...';
  const factoryPool = process.env.NEXT_PUBLIC_FACTORY_POOL_ADDRESS || '0x...';
  const factoryUser = process.env.NEXT_PUBLIC_FACTORY_USER_ADDRESS || '0x...';
  const zkVerifier = process.env.NEXT_PUBLIC_ZK_VERIFIER_ADDRESS || '0x...';

  return (
    <DocSection title="Smart Contracts">
      <p className="mb-6 text-muted-foreground">
        AccessFi is built on a set of upgradeable smart contracts deployed on Horizen Testnet.
      </p>

      <DocSubsection title="Contract Architecture">
        <div className="space-y-4">
          <div className="border-2 border-border bg-card p-4">
            <h4 className="font-mono text-sm font-bold text-primary">FactoryAccessFiPool</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Creates and tracks AccessFi pool contracts.
            </p>
          </div>
          <div className="border-2 border-border bg-card p-4">
            <h4 className="font-mono text-sm font-bold text-primary">FactoryUser</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Deploys and tracks per-user User contracts.
            </p>
          </div>
          <div className="border-2 border-border bg-card p-4">
            <h4 className="font-mono text-sm font-bold text-primary">User</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Per-user contract that submits proofs and manages user interactions.
            </p>
          </div>
          <div className="border-2 border-border bg-card p-4">
            <h4 className="font-mono text-sm font-bold text-primary">AccessfiPool</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Handles pool logic, proof verification, payments, and seller management.
            </p>
          </div>
          <div className="border-2 border-border bg-card p-4">
            <h4 className="font-mono text-sm font-bold text-primary">AssetRegistry</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Source of truth for registered assets, purchases, and buyer access rights.
            </p>
          </div>
          <div className="border-2 border-border bg-card p-4">
            <h4 className="font-mono text-sm font-bold text-primary">VerifyProof</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Verifies zkVerify aggregation results for AccessFi pools.
            </p>
          </div>
        </div>
      </DocSubsection>

      <DocSubsection title="Deployed Addresses">
        <CodeBlock>{`
Network: Horizen Testnet (Chain ID 2651420)

FactoryPool: ${factoryPool}
FactoryUser: ${factoryUser}
AssetRegistry:${assetRegistry}
ZkVerifier:  ${zkVerifier}
        `}</CodeBlock>
      </DocSubsection>
    </DocSection>
  );
}

function ZkEmailSection() {
  return (
    <DocSection title="zkEmail Integration">
      <p className="mb-6 text-muted-foreground">
        zkEmail enables proving email authenticity using DKIM signatures and zero-knowledge proofs.
      </p>

      <DocSubsection title="How DKIM Works">
        <p className="mb-4 text-sm text-muted-foreground">
          DKIM (DomainKeys Identified Mail) is an email authentication method that allows the receiver
          to check that an email was indeed sent by the owner of that domain.
        </p>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>1. Email provider signs outgoing emails with their private key</li>
          <li>2. DKIM signature is included in email headers</li>
          <li>3. Anyone can verify using the provider&apos;s public key (DNS)</li>
          <li>4. zkEmail creates a ZK proof of this verification</li>
        </ol>
      </DocSubsection>

      <DocSubsection title="Privacy Guarantees">
        <InfoBox>
          The ZK proof reveals only what you choose to reveal. For example, you can prove you received
          an email from netflix.com without revealing the email content or your email address.
        </InfoBox>
      </DocSubsection>

      <DocSubsection title="Blueprint System">
        <p className="mb-4 text-sm text-muted-foreground">
          zkEmail uses &quot;blueprints&quot; - predefined circuits that specify what data to extract and verify
          from emails. AccessFi uses custom blueprints for different verification types.
        </p>
      </DocSubsection>
    </DocSection>
  );
}

function ZkVerifySection() {
  return (
    <DocSection title="zkVerify">
      <p className="mb-6 text-muted-foreground">
        zkVerify provides efficient on-chain proof verification with aggregation.
      </p>

      <DocSubsection title="What is zkVerify?">
        <p className="mb-4 text-sm text-muted-foreground">
          zkVerify is a specialized blockchain for ZK proof verification. It aggregates multiple
          proofs and posts verification results for efficient on-chain checks.
        </p>
      </DocSubsection>

      <DocSubsection title="Domain Aggregation">
        <div className="border-2 border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Multiple proofs are aggregated into a single verification transaction, drastically
            reducing gas costs. AccessFi verifies results on Horizen Testnet.
          </p>
        </div>
      </DocSubsection>

      <DocSubsection title="Verification Flow">
        <CodeBlock>{`
1. User submits proof to zkVerify (Horizen testnet)
2. zkVerify verifies and aggregates proofs
3. AccessFi contract verifies against merkle root on Horizen
4. Proof marked as verified, payment processed
        `}</CodeBlock>
      </DocSubsection>
    </DocSection>
  );
}

function SecuritySection() {
  return (
    <DocSection title="Security Model">
      <p className="mb-6 text-muted-foreground">
        AccessFi is designed with security as a primary concern.
      </p>

      <DocSubsection title="Trust Assumptions">
        <div className="space-y-4">
          <div className="flex items-start gap-4 border-2 border-primary/30 bg-primary/5 p-4">
            <span className="text-primary">✓</span>
            <div>
              <h4 className="font-mono text-sm font-bold">No Central Authority</h4>
              <p className="text-sm text-muted-foreground">
                All logic runs on smart contracts. No admin keys or upgrades without governance.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 border-2 border-primary/30 bg-primary/5 p-4">
            <span className="text-primary">✓</span>
            <div>
              <h4 className="font-mono text-sm font-bold">Client-Side Proof Generation</h4>
              <p className="text-sm text-muted-foreground">
                Proofs are generated in the user&apos;s browser. Raw email content stays local.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 border-2 border-primary/30 bg-primary/5 p-4">
            <span className="text-primary">✓</span>
            <div>
              <h4 className="font-mono text-sm font-bold">Cryptographic Verification</h4>
              <p className="text-sm text-muted-foreground">
                All proofs verified on-chain using zkVerify. Cannot fake or manipulate.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 border-2 border-primary/30 bg-primary/5 p-4">
            <span className="text-primary">✓</span>
            <div>
              <h4 className="font-mono text-sm font-bold">TEE-Encrypted Storage</h4>
              <p className="text-sm text-muted-foreground">
                Recipient data is encrypted and stored inside a TEE. Decryption requires wallet
                signature and on-chain ownership.
              </p>
            </div>
          </div>
        </div>
      </DocSubsection>

      <DocSubsection title="Anti-Fraud Measures">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">◆</span>
            <span>Each email can only be used once per pool (hash uniqueness check)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">◆</span>
            <span>DKIM signatures verified - cannot forge emails</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">◆</span>
            <span>Proof replay protection via global hash registry</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">◆</span>
            <span>Reentrancy guards on all payment functions</span>
          </li>
        </ul>
      </DocSubsection>
    </DocSection>
  );
}

// ============================================================
//                    API SECTIONS
// ============================================================

function ApiOverviewSection() {
  return (
    <DocSection title="API Overview">
      <div className="mb-6 inline-flex items-center gap-2 border border-yellow-500 bg-yellow-500/10 px-4 py-2">
        <span className="font-mono text-sm text-yellow-500">COMING SOON</span>
      </div>

      <p className="mb-6 text-muted-foreground">
        We&apos;re building a REST API to allow programmatic access to your pool data.
      </p>

      <DocSubsection title="Planned Features">
        <div className="space-y-4">
          <div className="border-2 border-border bg-card p-4">
            <h4 className="font-mono text-sm font-bold">Per-Pool API Keys</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate API keys for each pool you create to access data programmatically.
            </p>
          </div>
          <div className="border-2 border-border bg-card p-4">
            <h4 className="font-mono text-sm font-bold">Data Export</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Export all verified data from your pools in JSON or CSV format.
            </p>
          </div>
          <div className="border-2 border-border bg-card p-4">
            <h4 className="font-mono text-sm font-bold">Webhooks</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Get notified when new data is submitted to your pools.
            </p>
          </div>
        </div>
      </DocSubsection>

      <DocSubsection title="Use Cases">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Integrate verified user data into your applications</li>
          <li>• Build custom dashboards for data analysis</li>
          <li>• Automate data processing workflows</li>
          <li>• Connect to CRM or analytics platforms</li>
        </ul>
      </DocSubsection>
    </DocSection>
  );
}

function EndpointsSection() {
  return (
    <DocSection title="API Endpoints">
      <div className="mb-6 inline-flex items-center gap-2 border border-yellow-500 bg-yellow-500/10 px-4 py-2">
        <span className="font-mono text-sm text-yellow-500">COMING SOON</span>
      </div>

      <p className="mb-6 text-muted-foreground">
        Preview of planned API endpoints.
      </p>

      <DocSubsection title="Authentication">
        <CodeBlock>{`
Authorization: Bearer <your-api-key>
        `}</CodeBlock>
      </DocSubsection>

      <DocSubsection title="Endpoints (Planned)">
        <div className="space-y-4">
          <div className="border-2 border-border bg-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs bg-primary px-2 py-1 text-primary-foreground">GET</span>
              <code className="font-mono text-sm">/api/v1/pools</code>
            </div>
            <p className="text-sm text-muted-foreground">List all pools you&apos;ve created</p>
          </div>

          <div className="border-2 border-border bg-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs bg-primary px-2 py-1 text-primary-foreground">GET</span>
              <code className="font-mono text-sm">/api/v1/pools/:id/data</code>
            </div>
            <p className="text-sm text-muted-foreground">Get all verified data from a pool</p>
          </div>

          <div className="border-2 border-border bg-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs bg-primary px-2 py-1 text-primary-foreground">GET</span>
              <code className="font-mono text-sm">/api/v1/assets/:id</code>
            </div>
            <p className="text-sm text-muted-foreground">Get specific asset metadata and access details</p>
          </div>

          <div className="border-2 border-border bg-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs bg-blue-500 px-2 py-1 text-white">POST</span>
              <code className="font-mono text-sm">/api/v1/webhooks</code>
            </div>
            <p className="text-sm text-muted-foreground">Register a webhook for pool events</p>
          </div>
        </div>
      </DocSubsection>
    </DocSection>
  );
}

// ============================================================
//                    FAQ SECTIONS
// ============================================================

function BuyersFaqSection() {
  return (
    <DocSection title="Buyers FAQ">
      <DocSubsection title="What do I actually receive?">
        <p className="text-sm text-muted-foreground">
          You receive on-chain access rights for each verified asset you buy, plus access to the
          encrypted recipient email stored in the TEE. Decryption requires wallet-based access checks.
        </p>
      </DocSubsection>

      <DocSubsection title="How is the data protected?">
        <p className="text-sm text-muted-foreground">
          Recipient data is encrypted in a Phala CVM (TEE). Only a buyer with active access can decrypt it by
          signing a wallet message, and access is verified on-chain.
        </p>
      </DocSubsection>

      <DocSubsection title="Can I export data?">
        <p className="text-sm text-muted-foreground">
          API export is coming soon. Right now you can view and decrypt inside the dashboard.
        </p>
      </DocSubsection>
    </DocSection>
  );
}

function SellersFaqSection() {
  return (
    <DocSection title="Sellers FAQ">
      <DocSubsection title="Do I upload my full email?">
        <p className="text-sm text-muted-foreground">
          No. The proof is generated locally. Only the recipient email is encrypted and stored in
          the TEE. Raw email content stays on your device.
        </p>
      </DocSubsection>

      <DocSubsection title="How do I get paid?">
        <p className="text-sm text-muted-foreground">
          Once your proof is verified, the pool contract instantly transfers ETH to your wallet.
        </p>
      </DocSubsection>

      <DocSubsection title="Can I submit the same email to another pool?">
        <p className="text-sm text-muted-foreground">
          Yes. Uniqueness is enforced per pool, so the same email can be used across different pools.
        </p>
      </DocSubsection>
    </DocSection>
  );
}

function SecurityFaqSection() {
  return (
    <DocSection title="Security FAQ">
      <DocSubsection title="What if someone steals a wallet?">
        <p className="text-sm text-muted-foreground">
          Decryption requires an on-chain access check and a wallet signature. If access is revoked or
          the wallet no longer controls the asset access, decryption stops working.
        </p>
      </DocSubsection>

      <DocSubsection title="Can the platform decrypt data?">
        <p className="text-sm text-muted-foreground">
          No. Decryption is performed inside the TEE and gated by wallet access. The platform
          never sees raw data.
        </p>
      </DocSubsection>

      <DocSubsection title="Is the proof reusable?">
        <p className="text-sm text-muted-foreground">
          Proofs are bound to a pool. Reusing the same email in the same pool is rejected.
        </p>
      </DocSubsection>
    </DocSection>
  );
}
