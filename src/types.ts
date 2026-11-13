export type ItemKind = 'docs' | 'sheets' | 'slides' | 'file';

export type SlideLayout =
  | 'title'
  | 'title-content'
  | 'two-column'
  | 'section'
  | 'quote'
  | 'blank'
  | 'standard'
  | 'bullets'
  | 'title-only';

export type SlideThemeId =
  | 'obsidian-glass'
  | 'midnight-aurora'
  | 'cupertino-blue'
  | 'arctic-white'
  | 'warm-editorial'
  | 'emerald-studio'
  | 'sunset-amber'
  | 'rose-velvet';

export type SlideTransitionType =
  | 'none'
  | 'fade'
  | 'slide-left'
  | 'slide-up'
  | 'zoom'
  | 'flip'
  | 'morph';

export interface SlideElement {
  id: string;
  type: 'text' | 'shape' | 'image';
  shapeKind?: 'rect' | 'rounded' | 'circle' | 'pill' | 'callout';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fill?: string;
  color?: string;
  fontSize?: number;
  opacity?: number;
}

export interface SlideItem {
  id: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  rightColumnTitle?: string;
  rightBullets?: string[];
  notes?: string;
  layout?: SlideLayout;
  themeId?: SlideThemeId;
  customBg?: string;
  textColor?: string;
  accentColor?: string;
  titleAlign?: 'left' | 'center' | 'right';
  titleFontSize?: 'sm' | 'md' | 'lg' | 'xl';
  fontFamily?: 'sans' | 'serif' | 'mono';
  transition?: SlideTransitionType;
  transitionDuration?: number;
  animateBullets?: boolean;
  elements?: SlideElement[];
}

export interface WorkspaceItem {
  id: string;
  kind: ItemKind;
  name: string;
  content?: string;
  size?: number;
  mime?: string;
  url?: string;
  updated: number;
  starred?: boolean;
  tags?: string[];
}

export type NavPage = 'home' | 'files' | 'docs' | 'sheets' | 'slides' | 'settings';

export interface UserProfile {
  name: string;
  email: string;
  avatarText: string;
  isDemo: boolean;
  storageLimitBytes: number;
}

export interface PairedDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  connectedAt: number;
  lastSync: number;
  status: 'online' | 'synced' | 'pending';
}
