import { WorkspaceItem, SlideItem } from './types';

export const INITIAL_SLIDES: SlideItem[] = [
  {
    id: 'slide_1',
    title: 'SyncSpace 2026 Strategy',
    subtitle: 'Unified Cross-Device Connected Workspace',
    bullets: [
      'Seamless transition between phone, tablet, and desktop',
      'Instant local-first responsiveness with optional cloud sync',
      'Integrated lightweight editors for docs, sheets, and presentations'
    ],
    notes: 'Welcome everyone. Today we review our unified vision for frictionless cross-device work.',
    layout: 'standard',
  },
  {
    id: 'slide_2',
    title: 'The Challenge: Fragmented Tools',
    subtitle: 'Context Switching is Hurting Productivity',
    bullets: [
      'Workers lose 4 hours/week switching between heavyweight office apps',
      'Mobile editing experiences remain clunky and slow to load',
      'Cloud storage sync conflicts disrupt focused creative flow'
    ],
    notes: 'Highlight customer interview data and user survey insights from Q3.',
    layout: 'bullets',
  },
  {
    id: 'slide_3',
    title: 'SyncSpace Core Architecture',
    subtitle: 'Built for speed, offline reliability, and elegance',
    bullets: [
      'Local-first instant storage with zero latency editing',
      'Clean tabular sheets and rich markdown documentation',
      'Fluid presentation deck creation ready for boardroom pitch'
    ],
    notes: 'Show how documents and spreadsheets sync instantaneously without server lag.',
    layout: 'standard',
  },
  {
    id: 'slide_4',
    title: 'Key Milestones & Launch Timeline',
    subtitle: 'Q4 2026 Execution Targets',
    bullets: [
      'Sprint 1: Core reactive grid and markdown engine delivery',
      'Sprint 2: Multi-format export (TXT, TSV, CSV, Markdown, JSON)',
      'Sprint 3: Cross-device PWA installability and offline caching'
    ],
    notes: 'Wrap up with call to action for team signoffs and beta invites.',
    layout: 'standard',
  }
];

export const INITIAL_SHEET_DATA: string[][] = [
  ['Category', 'Q1 Budget ($)', 'Q2 Budget ($)', 'Q3 Budget ($)', 'Q4 Budget ($)', 'Full Year ($)'],
  ['Engineering & R&D', '145,000', '160,000', '180,000', '195,000', '680,000'],
  ['Cloud Infrastructure', '28,000', '34,000', '42,000', '51,000', '155,000'],
  ['Product Design & UX', '45,000', '48,000', '52,000', '55,000', '200,000'],
  ['Sales & Growth', '65,000', '85,000', '110,000', '130,000', '390,000'],
  ['Customer Operations', '22,000', '26,000', '30,000', '35,000', '113,000'],
  ['Security & Compliance', '18,000', '20,000', '25,000', '28,000', '91,000'],
  ['Marketing & Events', '35,000', '45,000', '55,000', '65,000', '200,000'],
  ['Total Operating Expenses', '358,000', '418,000', '494,000', '559,000', '1,829,000']
];

export const INITIAL_DOC_CONTENT = `# SyncSpace Q4 Product Roadmap & Executive Brief

## Executive Summary
SyncSpace represents a next-generation workspace architecture engineered for high-tempo professionals. By marrying local-first execution speeds with cross-device cohesion, our workspace eliminates the friction of traditional monolithic office suites.

### Core Objectives
1. **Zero-Latency Authoring**: Users can open, edit, and export documents without waiting for cloud handshakes.
2. **Unified Asset Hub**: Unified repository for documents, numerical sheets, slide decks, and external media assets.
3. **Frictionless Portability**: Clean export pipelines supporting TSV, CSV, Markdown, and JSON data structures.

---

## Technical Specifications
- **Client Engine**: React 19 with Vite bundler
- **Styling Architecture**: Tailwind CSS with dark-mode optical compensation
- **Typography**: Plus Jakarta Sans display pairing with DM Sans body prose and JetBrains Mono tabular figures
- **Persistence**: High-reliability browser local-storage with JSON backup/restore hooks

### Upcoming Sprint Priorities
- [x] Responsive layout with collapsible sidebar and mobile touch support
- [x] Dynamic formula recalculations and row/column manipulations for spreadsheets
- [x] Fullscreen slideshow preview mode with keyboard navigation
- [ ] Collaborative peer-to-peer WebRTC sync channels
`;

export const INITIAL_ITEMS: WorkspaceItem[] = [
  {
    id: 'item_doc_1',
    kind: 'docs',
    name: 'Q4 Product Roadmap & Brief',
    content: INITIAL_DOC_CONTENT,
    size: 1420,
    updated: Date.now() - 1000 * 60 * 35, // 35 min ago
    starred: true,
    tags: ['strategy', 'q4', 'roadmap']
  },
  {
    id: 'item_sheet_1',
    kind: 'sheets',
    name: '2026 Operating Budget Model',
    content: JSON.stringify(INITIAL_SHEET_DATA),
    size: 3200,
    updated: Date.now() - 1000 * 60 * 120, // 2 hours ago
    starred: true,
    tags: ['finance', 'planning']
  },
  {
    id: 'item_slide_1',
    kind: 'slides',
    name: 'SyncSpace Keynote Deck',
    content: JSON.stringify(INITIAL_SLIDES),
    size: 4500,
    updated: Date.now() - 1000 * 60 * 240, // 4 hours ago
    starred: false,
    tags: ['keynote', 'pitch']
  },
  {
    id: 'item_file_1',
    kind: 'file',
    name: 'System_Architecture_Overview.svg',
    size: 24500,
    mime: 'image/svg+xml',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
      <rect width="800" height="450" fill="#0f172a"/>
      <circle cx="400" cy="225" r="160" fill="none" stroke="#6366f1" stroke-width="2" stroke-dasharray="6 6"/>
      <rect x="330" y="185" width="140" height="80" rx="12" fill="#1e293b" stroke="#818cf8" stroke-width="2"/>
      <text x="400" y="230" fill="#f8fafc" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">SyncSpace Core</text>
      <circle cx="240" cy="140" r="40" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      <text x="240" y="145" fill="#bae6fd" font-family="sans-serif" font-size="11" text-anchor="middle">Docs Engine</text>
      <circle cx="560" cy="140" r="40" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
      <text x="560" y="145" fill="#a7f3d0" font-family="sans-serif" font-size="11" text-anchor="middle">Sheet Grid</text>
      <circle cx="400" cy="340" r="40" fill="#1e293b" stroke="#fb923c" stroke-width="2"/>
      <text x="400" y="345" fill="#fed7aa" font-family="sans-serif" font-size="11" text-anchor="middle">Slide Deck</text>
    </svg>`,
    url: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%"><rect width="800" height="450" fill="#0f172a"/><circle cx="400" cy="225" r="160" fill="none" stroke="#6366f1" stroke-width="2" stroke-dasharray="6 6"/><rect x="330" y="185" width="140" height="80" rx="12" fill="#1e293b" stroke="#818cf8" stroke-width="2"/><text x="400" y="230" fill="#f8fafc" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">SyncSpace Core</text><circle cx="240" cy="140" r="40" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/><text x="240" y="145" fill="#bae6fd" font-family="sans-serif" font-size="11" text-anchor="middle">Docs Engine</text><circle cx="560" cy="140" r="40" fill="#1e293b" stroke="#34d399" stroke-width="2"/><text x="560" y="145" fill="#a7f3d0" font-family="sans-serif" font-size="11" text-anchor="middle">Sheet Grid</text><circle cx="400" cy="340" r="40" fill="#1e293b" stroke="#fb923c" stroke-width="2"/><text x="400" y="345" fill="#fed7aa" font-family="sans-serif" font-size="11" text-anchor="middle">Slide Deck</text></svg>`),
    updated: Date.now() - 1000 * 60 * 60 * 18,
    starred: true,
    tags: ['diagram', 'architecture']
  },
  {
    id: 'item_file_2',
    kind: 'file',
    name: 'Brand_Identity_Guidelines.pdf',
    size: 1540000,
    mime: 'application/pdf',
    updated: Date.now() - 1000 * 60 * 60 * 48,
    starred: false,
    tags: ['design', 'brand']
  }
];
