import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Presentation,
  X,
  Download,
  Play,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Square,
  Circle,
  Image as ImageIcon,
  Sparkles,
  Palette,
  Layers,
  Sliders,
  MonitorPlay,
  Wand2,
  MousePointer2,
  Timer,
  FileCode2,
  FileText,
  Check,
} from 'lucide-react';
import {
  WorkspaceItem,
  SlideItem,
  SlideLayout,
  SlideThemeId,
  SlideTransitionType,
  SlideElement,
} from '../types';
import { downloadBlob, generateId } from '../utils';
import { MacWindowFrame } from './MacWindowFrame';
import { WindowControls } from './WindowControls';

interface PresentationEditorModalProps {
  item: WorkspaceItem;
  onSave: (updatedItem: WorkspaceItem) => void;
  onClose: () => void;
  onMinimize?: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

interface ThemePreset {
  id: SlideThemeId;
  name: string;
  bg: string;
  text: string;
  subtext: string;
  accent: string;
  isLight?: boolean;
}

const SLIDE_THEMES: ThemePreset[] = [
  {
    id: 'obsidian-glass',
    name: 'Obsidian Glass',
    bg: 'linear-gradient(135deg, #070b19 0%, #111b36 55%, #091024 100%)',
    text: '#f8fafc',
    subtext: '#cbd5e1',
    accent: '#818cf8',
  },
  {
    id: 'midnight-aurora',
    name: 'Midnight Aurora',
    bg: 'linear-gradient(135deg, #04131c 0%, #0b2d39 55%, #061826 100%)',
    text: '#f0fdfa',
    subtext: '#99f6e4',
    accent: '#34d399',
  },
  {
    id: 'cupertino-blue',
    name: 'Cupertino Pro',
    bg: 'linear-gradient(135deg, #081c3a 0%, #1e40af 55%, #0f172a 100%)',
    text: '#ffffff',
    subtext: '#bfdbfe',
    accent: '#38bdf8',
  },
  {
    id: 'arctic-white',
    name: 'Arctic Light',
    bg: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%)',
    text: '#0f172a',
    subtext: '#475569',
    accent: '#4f46e5',
    isLight: true,
  },
  {
    id: 'warm-editorial',
    name: 'Studio Ivory',
    bg: 'linear-gradient(135deg, #fdfbf7 0%, #f3ece0 65%, #e8dccb 100%)',
    text: '#1c1917',
    subtext: '#57534e',
    accent: '#d97706',
    isLight: true,
  },
  {
    id: 'emerald-studio',
    name: 'Forest Keynote',
    bg: 'linear-gradient(135deg, #03221a 0%, #064e3b 55%, #021812 100%)',
    text: '#ecfdf5',
    subtext: '#a7f3d0',
    accent: '#10b981',
  },
  {
    id: 'sunset-amber',
    name: 'Executive Copper',
    bg: 'linear-gradient(135deg, #1a0f0a 0%, #431407 55%, #1c100b 100%)',
    text: '#fff7ed',
    subtext: '#fed7aa',
    accent: '#fb923c',
  },
  {
    id: 'rose-velvet',
    name: 'Royal Plum',
    bg: 'linear-gradient(135deg, #1b0a24 0%, #4a0e4e 55%, #14081d 100%)',
    text: '#fdf4ff',
    subtext: '#f5d0fe',
    accent: '#f472b6',
  },
];

const LAYOUT_OPTIONS: { id: SlideLayout; label: string; desc: string }[] = [
  { id: 'title', label: 'Title Slide', desc: 'Centered cover headline' },
  { id: 'title-content', label: 'Title & Content', desc: 'Headline with bullet list' },
  { id: 'two-column', label: 'Two Columns', desc: 'Side-by-side comparison' },
  { id: 'section', label: 'Section Header', desc: 'Bold chapter divider' },
  { id: 'quote', label: 'Quote Spotlight', desc: 'Centered statement' },
  { id: 'blank', label: 'Blank Canvas', desc: 'Freeform shapes & text' },
];

const TRANSITION_OPTIONS: { id: SlideTransitionType; label: string; desc: string }[] = [
  { id: 'none', label: 'None', desc: 'Instant cut' },
  { id: 'fade', label: 'Fade', desc: 'Smooth dissolve' },
  { id: 'slide-left', label: 'Push', desc: 'Slide horizontally' },
  { id: 'slide-up', label: 'Cover Up', desc: 'Slide vertically' },
  { id: 'zoom', label: 'Zoom', desc: 'Dynamic scale in' },
  { id: 'flip', label: '3D Flip', desc: 'Perspective rotate' },
  { id: 'morph', label: 'Apple Morph', desc: 'Fluid blur & spring' },
];

function getThemePreset(themeId?: SlideThemeId): ThemePreset {
  return SLIDE_THEMES.find((t) => t.id === themeId) || SLIDE_THEMES[0];
}

function getTransitionVariants(type: SlideTransitionType = 'morph', duration = 0.5) {
  const ease = [0.22, 1, 0.36, 1] as const;
  switch (type) {
    case 'none':
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
        transition: { duration: 0.01 },
      };
    case 'fade':
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration, ease },
      };
    case 'slide-left':
      return {
        initial: { opacity: 0, x: 80 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -80 },
        transition: { duration, ease },
      };
    case 'slide-up':
      return {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -40 },
        transition: { duration, ease },
      };
    case 'zoom':
      return {
        initial: { opacity: 0, scale: 0.86 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.08 },
        transition: { duration, ease },
      };
    case 'flip':
      return {
        initial: { opacity: 0, rotateY: 55, scale: 0.94 },
        animate: { opacity: 1, rotateY: 0, scale: 1 },
        exit: { opacity: 0, rotateY: -55, scale: 0.94 },
        transition: { duration, ease },
      };
    case 'morph':
    default:
      return {
        initial: { opacity: 0, scale: 0.96, filter: 'blur(8px)' },
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, scale: 1.03, filter: 'blur(6px)' },
        transition: { duration, ease },
      };
  }
}

export const PresentationEditorModal: React.FC<PresentationEditorModalProps> = ({
  item,
  onSave,
  onClose,
  onMinimize,
  isMaximized = false,
  onToggleMaximize,
}) => {
  const [title, setTitle] = useState(item.name || 'Untitled Presentation');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  const [slides, setSlides] = useState<SlideItem[]>(() => {
    try {
      const parsed = JSON.parse(item.content || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s: any, idx: number) => ({
          id: s.id || `slide_${idx}_${Date.now()}`,
          title: s.title ?? (idx === 0 ? item.name : `Slide ${idx + 1}`),
          subtitle: s.subtitle ?? '',
          bullets: Array.isArray(s.bullets) ? s.bullets : s.body ? [s.body] : [],
          rightColumnTitle: s.rightColumnTitle ?? 'Key Takeaways',
          rightBullets: Array.isArray(s.rightBullets) ? s.rightBullets : ['Supporting detail'],
          notes: s.notes ?? '',
          layout: s.layout || (idx === 0 ? 'title' : 'title-content'),
          themeId: s.themeId || 'obsidian-glass',
          customBg: s.customBg,
          textColor: s.textColor,
          accentColor: s.accentColor,
          titleAlign: s.titleAlign || (idx === 0 ? 'center' : 'left'),
          titleFontSize: s.titleFontSize || 'lg',
          fontFamily: s.fontFamily || 'sans',
          transition: s.transition || 'morph',
          transitionDuration: s.transitionDuration ?? 0.55,
          animateBullets: Boolean(s.animateBullets),
          elements: Array.isArray(s.elements) ? s.elements : [],
        }));
      }
    } catch {}
    return [
      {
        id: 'slide_1',
        title: item.name || 'Untitled Presentation',
        subtitle: 'Click to edit subtitle or choose a design theme above',
        bullets: ['First strategic highlight', 'Supporting point'],
        rightColumnTitle: 'Column Two',
        rightBullets: ['Right column point'],
        notes: '',
        layout: 'title',
        themeId: 'obsidian-glass',
        titleAlign: 'center',
        titleFontSize: 'xl',
        fontFamily: 'sans',
        transition: 'morph',
        transitionDuration: 0.55,
        animateBullets: false,
        elements: [],
      },
    ];
  });

  // Undo / Redo stacks
  const [historyPast, setHistoryPast] = useState<SlideItem[][]>([]);
  const [historyFuture, setHistoryFuture] = useState<SlideItem[][]>([]);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [ribbonTab, setRibbonTab] = useState<'home' | 'insert' | 'design' | 'transitions' | 'slideshow'>('home');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showLayoutDropdown, setShowLayoutDropdown] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(true);
  const [transitionPreviewKey, setTransitionPreviewKey] = useState(0);

  // Fullscreen Slideshow States
  const [isPresenting, setIsPresenting] = useState(false);
  const [showNotesInPresent, setShowNotesInPresent] = useState(false);
  const [revealedBulletsCount, setRevealedBulletsCount] = useState(999);
  const [laserEnabled, setLaserEnabled] = useState(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [autoAdvanceSec, setAutoAdvanceSec] = useState<number>(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);

  const activeSlide = slides[activeSlideIndex] || slides[0];
  const activeTheme = getThemePreset(activeSlide.themeId);
  const slideBg = activeSlide.customBg || activeTheme.bg;
  const slideTextColor = activeSlide.textColor || activeTheme.text;
  const slideSubtextColor = activeSlide.textColor ? `${activeSlide.textColor}cc` : activeTheme.subtext;
  const slideAccentColor = activeSlide.accentColor || activeTheme.accent;

  // Debounced auto-save
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      const content = JSON.stringify(slides);
      onSave({
        ...item,
        name: title.trim() || 'Untitled Presentation',
        content,
        size: new Blob([content]).size,
        updated: Date.now(),
      });
      setSaveStatus('saved');
    }, 350);
    return () => clearTimeout(timer);
  }, [title, slides]);

  const commitSlidesChange = useCallback(
    (updater: (prev: SlideItem[]) => SlideItem[], recordHistory = true) => {
      setSlides((prev) => {
        const next = updater(prev);
        if (recordHistory) {
          setHistoryPast((past) => [...past.slice(-24), prev]);
          setHistoryFuture([]);
        }
        return next;
      });
    },
    []
  );

  const handleUndo = () => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((past) => past.slice(0, -1));
    setHistoryFuture((future) => [slides, ...future]);
    setSlides(previous);
    setActiveSlideIndex((idx) => Math.min(idx, Math.max(0, previous.length - 1)));
  };

  const handleRedo = () => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture((future) => future.slice(1));
    setHistoryPast((past) => [...past, slides]);
    setSlides(next);
    setActiveSlideIndex((idx) => Math.min(idx, Math.max(0, next.length - 1)));
  };

  const updateActiveSlide = (fields: Partial<SlideItem>, recordHistory = true) => {
    commitSlidesChange(
      (prev) => prev.map((s, i) => (i === activeSlideIndex ? { ...s, ...fields } : s)),
      recordHistory
    );
  };

  const addSlide = (layout: SlideLayout = 'title-content') => {
    const newSlide: SlideItem = {
      id: generateId('slide'),
      title:
        layout === 'title'
          ? 'Presentation Title'
          : layout === 'section'
          ? 'Section Break'
          : layout === 'quote'
          ? '"Design is not just what it looks like. Design is how it works."'
          : layout === 'blank'
          ? ''
          : `Slide ${slides.length + 1}`,
      subtitle:
        layout === 'quote'
          ? '— Steve Jobs'
          : layout === 'blank'
          ? ''
          : 'Add your subtitle or takeaway here',
      bullets:
        layout === 'title-content' || layout === 'two-column'
          ? ['Key point or insight', 'Supporting metric or milestone']
          : [],
      rightColumnTitle: 'Column Two',
      rightBullets: ['Right column highlight', 'Next action step'],
      notes: '',
      layout,
      themeId: activeSlide.themeId || 'obsidian-glass',
      customBg: activeSlide.customBg,
      accentColor: activeSlide.accentColor,
      titleAlign: layout === 'title' || layout === 'section' || layout === 'quote' ? 'center' : 'left',
      titleFontSize: layout === 'title' ? 'xl' : 'lg',
      fontFamily: activeSlide.fontFamily || 'sans',
      transition: activeSlide.transition || 'morph',
      transitionDuration: activeSlide.transitionDuration ?? 0.55,
      animateBullets: activeSlide.animateBullets || false,
      elements: [],
    };
    commitSlidesChange((prev) => {
      const next = [...prev];
      next.splice(activeSlideIndex + 1, 0, newSlide);
      return next;
    });
    setActiveSlideIndex(activeSlideIndex + 1);
    setSelectedElementId(null);
    setShowLayoutDropdown(false);
  };

  const duplicateSlide = (idx: number) => {
    const target = slides[idx];
    if (!target) return;
    const clone: SlideItem = {
      ...JSON.parse(JSON.stringify(target)),
      id: generateId('slide'),
      title: target.title ? `${target.title} (Copy)` : 'Slide Copy',
    };
    commitSlidesChange((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
    setActiveSlideIndex(idx + 1);
  };

  const deleteSlide = (idx: number) => {
    if (slides.length <= 1) return;
    commitSlidesChange((prev) => prev.filter((_, i) => i !== idx));
    if (activeSlideIndex >= idx && activeSlideIndex > 0) {
      setActiveSlideIndex((prev) => prev - 1);
    }
    setSelectedElementId(null);
  };

  const moveSlide = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;
    commitSlidesChange((prev) => {
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
    setActiveSlideIndex(targetIdx);
  };

  // Bullets operations
  const handleBulletChange = (bIdx: number, val: string, isRightCol = false) => {
    if (isRightCol) {
      const next = [...(activeSlide.rightBullets || [])];
      next[bIdx] = val;
      updateActiveSlide({ rightBullets: next }, false);
    } else {
      const next = [...(activeSlide.bullets || [])];
      next[bIdx] = val;
      updateActiveSlide({ bullets: next }, false);
    }
  };

  const addBullet = (isRightCol = false) => {
    if (isRightCol) {
      updateActiveSlide({ rightBullets: [...(activeSlide.rightBullets || []), 'New point'] });
    } else {
      updateActiveSlide({ bullets: [...(activeSlide.bullets || []), 'New key point'] });
    }
  };

  const removeBullet = (bIdx: number, isRightCol = false) => {
    if (isRightCol) {
      updateActiveSlide({
        rightBullets: (activeSlide.rightBullets || []).filter((_, i) => i !== bIdx),
      });
    } else {
      updateActiveSlide({
        bullets: (activeSlide.bullets || []).filter((_, i) => i !== bIdx),
      });
    }
  };

  // Freeform Elements (Text Boxes, Shapes, Images)
  const insertTextBox = () => {
    const el: SlideElement = {
      id: generateId('el'),
      type: 'text',
      x: 20,
      y: 65,
      width: 34,
      height: 14,
      content: 'Double-click or edit text here',
      fill: 'rgba(15, 23, 42, 0.45)',
      color: slideTextColor,
      fontSize: 16,
    };
    updateActiveSlide({ elements: [...(activeSlide.elements || []), el] });
    setSelectedElementId(el.id);
  };

  const insertShape = (shapeKind: SlideElement['shapeKind']) => {
    const el: SlideElement = {
      id: generateId('el'),
      type: 'shape',
      shapeKind,
      x: 62,
      y: 25,
      width: shapeKind === 'circle' ? 18 : 26,
      height: shapeKind === 'circle' ? 32 : shapeKind === 'pill' ? 10 : 22,
      content: shapeKind === 'pill' ? 'KEY HIGHLIGHT' : shapeKind === 'callout' ? 'Callout Note' : '',
      fill: slideAccentColor,
      color: '#ffffff',
      fontSize: 14,
      opacity: 0.9,
    };
    updateActiveSlide({ elements: [...(activeSlide.elements || []), el] });
    setSelectedElementId(el.id);
  };

  const handleInsertImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const el: SlideElement = {
        id: generateId('el'),
        type: 'image',
        x: 58,
        y: 20,
        width: 34,
        height: 55,
        content: reader.result as string,
      };
      updateActiveSlide({ elements: [...(activeSlide.elements || []), el] });
      setSelectedElementId(el.id);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const updateElement = (elId: string, fields: Partial<SlideElement>, recordHistory = true) => {
    updateActiveSlide(
      {
        elements: (activeSlide.elements || []).map((el) =>
          el.id === elId ? { ...el, ...fields } : el
        ),
      },
      recordHistory
    );
  };

  const deleteElement = (elId: string) => {
    updateActiveSlide({
      elements: (activeSlide.elements || []).filter((el) => el.id !== elId),
    });
    if (selectedElementId === elId) setSelectedElementId(null);
  };

  // Dragging inserted elements on 16:9 canvas
  const startDraggingElement = (e: React.PointerEvent, el: SlideElement) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') {
      setSelectedElementId(el.id);
      return;
    }
    e.stopPropagation();
    setSelectedElementId(el.id);

    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = el.x;
    const origY = el.y;

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const dxPct = ((moveEvt.clientX - startX) / rect.width) * 100;
      const dyPct = ((moveEvt.clientY - startY) / rect.height) * 100;
      const clampedX = Math.max(0, Math.min(100 - el.width, origX + dxPct));
      const clampedY = Math.max(0, Math.min(100 - el.height, origY + dyPct));
      updateElement(el.id, { x: Math.round(clampedX * 10) / 10, y: Math.round(clampedY * 10) / 10 }, false);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Apply theme or transition to all slides
  const applyThemeToAll = (themeId: SlideThemeId) => {
    commitSlidesChange((prev) =>
      prev.map((s) => ({ ...s, themeId, customBg: undefined, textColor: undefined, accentColor: undefined }))
    );
  };

  const applyTransitionToAll = (transition: SlideTransitionType, duration: number) => {
    commitSlidesChange((prev) =>
      prev.map((s) => ({ ...s, transition, transitionDuration: duration }))
    );
  };

  // Start Slideshow
  const startSlideshow = (fromIndex: number) => {
    setActiveSlideIndex(fromIndex);
    const targetSlide = slides[fromIndex];
    setRevealedBulletsCount(targetSlide?.animateBullets ? 0 : 999);
    setIsPresenting(true);
  };

  const advanceSlideShow = useCallback(() => {
    const current = slides[activeSlideIndex];
    const totalBullets = current?.bullets?.length || 0;
    if (current?.animateBullets && revealedBulletsCount < totalBullets) {
      setRevealedBulletsCount((c) => c + 1);
      return;
    }
    if (activeSlideIndex < slides.length - 1) {
      const nextIdx = activeSlideIndex + 1;
      setActiveSlideIndex(nextIdx);
      setRevealedBulletsCount(slides[nextIdx]?.animateBullets ? 0 : 999);
    }
  }, [activeSlideIndex, revealedBulletsCount, slides]);

  const prevSlideShow = useCallback(() => {
    if (activeSlideIndex > 0) {
      const prevIdx = activeSlideIndex - 1;
      setActiveSlideIndex(prevIdx);
      setRevealedBulletsCount(slides[prevIdx]?.animateBullets ? 999 : 999);
    }
  }, [activeSlideIndex, slides]);

  // Keyboard navigation in Fullscreen Slideshow
  useEffect(() => {
    if (!isPresenting) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown' || e.key === 'Enter') {
        e.preventDefault();
        advanceSlideShow();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlideShow();
      } else if (e.key === 'Escape') {
        setIsPresenting(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, advanceSlideShow, prevSlideShow]);

  // Auto-advance timer in Slideshow
  useEffect(() => {
    if (!isPresenting || autoAdvanceSec <= 0) return;
    const timer = window.setInterval(() => {
      if (activeSlideIndex < slides.length - 1) {
        advanceSlideShow();
      } else {
        setActiveSlideIndex(0);
        setRevealedBulletsCount(slides[0]?.animateBullets ? 0 : 999);
      }
    }, autoAdvanceSec * 1000);
    return () => window.clearInterval(timer);
  }, [isPresenting, autoAdvanceSec, activeSlideIndex, slides, advanceSlideShow]);

  // Export interactive HTML presentation
  const handleExportHtmlDeck = () => {
    const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const serializedSlides = JSON.stringify(
      slides.map((s) => {
        const theme = getThemePreset(s.themeId);
        return {
          ...s,
          resolvedBg: s.customBg || theme.bg,
          resolvedText: s.textColor || theme.text,
          resolvedSub: s.textColor ? `${s.textColor}cc` : theme.subtext,
          resolvedAccent: s.accentColor || theme.accent,
        };
      })
    );

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${safeTitle}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#050814;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden}
  #stage{position:relative;width:min(94vw,1120px);aspect-ratio:16/9;border-radius:20px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6);transition:all .55s cubic-bezier(.22,1,.36,1)}
  .slide{position:absolute;inset:0;padding:6%;display:flex;flex-direction:column;justify-content:center;transition:opacity .5s ease,transform .55s cubic-bezier(.22,1,.36,1)}
  h1{font-size:clamp(24px,4vw,52px);line-height:1.15;font-weight:800;margin-bottom:14px}
  p.sub{font-size:clamp(14px,1.8vw,22px);opacity:.85;margin-bottom:24px}
  ul{list-style:none;display:grid;gap:12px}
  li{display:flex;align-items:flex-start;gap:12px;font-size:clamp(14px,1.6vw,20px);line-height:1.4}
  .dot{width:9px;height:9px;border-radius:50%;margin-top:9px;flex-shrink:0}
  .nav{position:fixed;bottom:18px;display:flex;gap:12px;align-items:center;background:rgba(15,23,42,.75);backdrop-filter:blur(18px);padding:8px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.15);font-size:13px}
  button{background:rgba(255,255,255,.12);color:#fff;border:0;padding:6px 14px;border-radius:999px;cursor:pointer}
  button:hover{background:rgba(255,255,255,.24)}
</style>
</head>
<body>
<div id="stage"></div>
<div class="nav"><button onclick="prev()">Prev</button><span id="counter">1 / 1</span><button onclick="next()">Next</button></div>
<script>
const slides = ${serializedSlides};
let idx = 0;
function render(){
  const s = slides[idx];
  const st = document.getElementById('stage');
  st.style.background = s.resolvedBg;
  st.style.color = s.resolvedText;
  const align = s.titleAlign || 'left';
  const bullets = (s.bullets||[]).map(b=>'<li><span class="dot" style="background:'+s.resolvedAccent+'"></span><span>'+b.replace(/</g,'&lt;')+'</span></li>').join('');
  st.innerHTML = '<div class="slide" style="text-align:'+align+';align-items:'+(align==='center'?'center':'flex-start')+'"><h1>'+ (s.title||'').replace(/</g,'&lt;') +'</h1>' + (s.subtitle?'<p class="sub" style="color:'+s.resolvedSub+'">'+s.subtitle.replace(/</g,'&lt;')+'</p>':'') + (bullets?'<ul>'+bullets+'</ul>':'') + '</div>';
  document.getElementById('counter').textContent = (idx+1)+' / '+slides.length;
}
function next(){ if(idx<slides.length-1){idx++;render()} }
function prev(){ if(idx>0){idx--;render()} }
window.addEventListener('keydown',e=>{ if(e.key==='ArrowRight'||e.key===' ') next(); if(e.key==='ArrowLeft') prev(); });
render();
</script>
</body>
</html>`;

    downloadBlob(
      html,
      `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_presentation.html`,
      'text/html;charset=utf-8'
    );
    setShowExportMenu(false);
  };

  const handleDownloadOutline = () => {
    const outline = slides
      .map((s, idx) => {
        const bulletsText = s.bullets?.map((b) => `  • ${b}`).join('\n') || '';
        const notesText = s.notes ? `\n  [Presenter Notes: ${s.notes}]` : '';
        return `Slide ${idx + 1}: ${s.title}\n${s.subtitle ? `  Subtitle: ${s.subtitle}\n` : ''}${bulletsText}${notesText}`;
      })
      .join('\n\n' + '='.repeat(40) + '\n\n');

    downloadBlob(
      `# ${title}\n\n${outline}`,
      `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_outline.txt`
    );
    setShowExportMenu(false);
  };

  const getTitleSizeClass = (size?: SlideItem['titleFontSize'], isSmallPreview = false) => {
    if (isSmallPreview) return 'text-xs font-bold';
    switch (size) {
      case 'sm':
        return 'text-xl md:text-2xl font-bold';
      case 'md':
        return 'text-2xl md:text-3xl font-bold';
      case 'xl':
        return 'text-3xl md:text-5xl font-extrabold';
      case 'lg':
      default:
        return 'text-2xl md:text-4xl font-bold';
    }
  };

  const getFontFamilyClass = (ff?: SlideItem['fontFamily']) => {
    if (ff === 'serif') return 'font-serif';
    if (ff === 'mono') return 'font-mono';
    return 'font-display';
  };

  const selectedElement = (activeSlide.elements || []).find((e) => e.id === selectedElementId) || null;

  // ============================================================================
  // FULLSCREEN POWERPOINT SLIDESHOW VIEW
  // ============================================================================
  if (isPresenting) {
    const transitionConfig = getTransitionVariants(
      activeSlide.transition || 'morph',
      activeSlide.transitionDuration || 0.55
    );
    const align = activeSlide.titleAlign || 'left';
    const layout = activeSlide.layout || 'title-content';

    return (
      <div
        className="fixed inset-0 z-50 bg-black text-slate-100 flex flex-col justify-between p-4 md:p-10 select-none overflow-hidden"
        onMouseMove={(e) => {
          if (laserEnabled) setLaserPos({ x: e.clientX, y: e.clientY });
        }}
      >
        {/* Laser Pointer Dot */}
        {laserEnabled && laserPos && (
          <div
            className="fixed w-3.5 h-3.5 rounded-full bg-rose-500 pointer-events-none z-50 shadow-[0_0_16px_4px_rgba(244,63,94,0.85)] -translate-x-1/2 -translate-y-1/2"
            style={{ left: laserPos.x, top: laserPos.y }}
          />
        )}

        {/* Top Floating Liquid Glass Bar */}
        <div className="flex items-center justify-between z-20">
          <div className="liquid-glass px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-200 flex items-center gap-2">
            <Presentation className="w-3.5 h-3.5 text-amber-400" />
            <span>{title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLaserEnabled((v) => !v)}
              className={`liquid-btn px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border ${
                laserEnabled
                  ? 'bg-rose-500/25 border-rose-400/50 text-rose-200'
                  : 'liquid-glass text-slate-300 hover:text-white'
              }`}
            >
              <MousePointer2 className="w-3.5 h-3.5" />
              <span>Laser</span>
            </button>
            <button
              onClick={() => setShowNotesInPresent((prev) => !prev)}
              className={`liquid-btn px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                showNotesInPresent ? 'bg-indigo-600 text-white' : 'liquid-glass text-slate-300 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Notes</span>
            </button>
            <button
              onClick={() => setIsPresenting(false)}
              className="liquid-glass liquid-btn p-2 rounded-full text-slate-300 hover:text-white"
              title="Exit Slide Show (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center 16:9 Stage with PowerPoint Transitions */}
        <div
          className="flex-1 flex items-center justify-center my-4 perspective-[1400px]"
          onClick={advanceSlideShow}
        >
          <div className="w-full max-w-6xl aspect-[16/9] relative rounded-2xl overflow-hidden shadow-[0_32px_90px_rgba(0,0,0,0.85)] border border-white/10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide.id}
                initial={transitionConfig.initial}
                animate={transitionConfig.animate}
                exit={transitionConfig.exit}
                transition={transitionConfig.transition}
                style={{ background: slideBg, color: slideTextColor }}
                className={`absolute inset-0 p-8 md:p-16 flex flex-col justify-center overflow-hidden ${getFontFamilyClass(
                  activeSlide.fontFamily
                )}`}
              >
                {/* Ambient glass highlight */}
                <div className="absolute -top-36 -right-36 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

                {layout !== 'blank' && (
                  <div
                    className={`relative z-10 w-full flex flex-col ${
                      align === 'center'
                        ? 'items-center text-center'
                        : align === 'right'
                        ? 'items-end text-right'
                        : 'items-start text-left'
                    }`}
                  >
                    {layout === 'section' && (
                      <div
                        className="w-16 h-1.5 rounded-full mb-5"
                        style={{ backgroundColor: slideAccentColor }}
                      />
                    )}

                    <h1
                      className={`${getTitleSizeClass(
                        activeSlide.titleFontSize
                      )} tracking-tight leading-tight max-w-4xl`}
                    >
                      {activeSlide.title}
                    </h1>

                    {activeSlide.subtitle && (
                      <p
                        className="text-lg md:text-2xl font-medium mt-3 max-w-3xl"
                        style={{ color: slideSubtextColor }}
                      >
                        {activeSlide.subtitle}
                      </p>
                    )}

                    {layout === 'two-column' ? (
                      <div className="grid grid-cols-2 gap-10 mt-8 w-full text-left">
                        <div className="space-y-3">
                          {(activeSlide.bullets || []).map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-3">
                              <span
                                className="w-2.5 h-2.5 rounded-full mt-2 shrink-0"
                                style={{ backgroundColor: slideAccentColor }}
                              />
                              <span className="text-base md:text-xl leading-relaxed">{bullet}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-3 pl-6 border-l border-white/15">
                          {activeSlide.rightColumnTitle && (
                            <h3
                              className="text-base md:text-xl font-bold mb-2"
                              style={{ color: slideAccentColor }}
                            >
                              {activeSlide.rightColumnTitle}
                            </h3>
                          )}
                          {(activeSlide.rightBullets || []).map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-3">
                              <span
                                className="w-2.5 h-2.5 rounded-full mt-2 shrink-0"
                                style={{ backgroundColor: slideAccentColor }}
                              />
                              <span className="text-base md:text-xl leading-relaxed">{bullet}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      activeSlide.bullets &&
                      activeSlide.bullets.length > 0 &&
                      layout !== 'quote' &&
                      layout !== 'section' && (
                        <div className="mt-8 space-y-4 max-w-3xl w-full">
                          {activeSlide.bullets.map((bullet, bIdx) => {
                            const visible = !activeSlide.animateBullets || bIdx < revealedBulletsCount;
                            return (
                              <motion.div
                                key={bIdx}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: visible ? 1 : 0.08, y: visible ? 0 : 8 }}
                                transition={{ duration: 0.25 }}
                                className={`flex items-start gap-4 ${
                                  align === 'center' ? 'justify-center' : ''
                                }`}
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full mt-2.5 shrink-0"
                                  style={{ backgroundColor: slideAccentColor }}
                                />
                                <p className="text-base md:text-2xl leading-relaxed">{bullet}</p>
                              </motion.div>
                            );
                          })}
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Freeform Inserted Elements */}
                {(activeSlide.elements || []).map((el) => (
                  <div
                    key={el.id}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.width}%`,
                      height: `${el.height}%`,
                      opacity: el.opacity ?? 1,
                    }}
                    className="absolute z-20 flex items-center justify-center pointer-events-none"
                  >
                    {el.type === 'image' && el.content ? (
                      <img
                        src={el.content}
                        alt="Slide element"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <div
                        style={{
                          backgroundColor: el.fill || 'transparent',
                          color: el.color || slideTextColor,
                          fontSize: `${el.fontSize || 16}px`,
                        }}
                        className={`w-full h-full flex items-center justify-center p-3 text-center font-medium ${
                          el.shapeKind === 'circle'
                            ? 'rounded-full'
                            : el.shapeKind === 'pill'
                            ? 'rounded-full px-5'
                            : el.shapeKind === 'rounded' || el.shapeKind === 'callout'
                            ? 'rounded-2xl shadow-lg'
                            : el.shapeKind === 'rect'
                            ? 'rounded-md'
                            : 'rounded-xl backdrop-blur-md border border-white/15'
                        }`}
                      >
                        {el.content}
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Presenter Notes Floating Glass Drawer */}
        {showNotesInPresent && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[92%] max-w-2xl liquid-glass-elevated p-4 rounded-2xl z-30">
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 mb-1">
              Presenter Notes
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {activeSlide.notes || 'No presenter notes for this slide.'}
            </p>
          </div>
        )}

        {/* Bottom Apple Liquid Glass Control Pill */}
        <div className="flex items-center justify-center z-20">
          <div className="liquid-glass px-4 py-2 rounded-full flex items-center gap-4 text-xs">
            <button
              onClick={prevSlideShow}
              disabled={activeSlideIndex === 0}
              className="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded-full transition-colors"
              title="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono tabular-nums font-semibold text-slate-100">
              {activeSlideIndex + 1} / {slides.length}
            </span>
            <button
              onClick={advanceSlideShow}
              disabled={
                activeSlideIndex === slides.length - 1 &&
                (!activeSlide.animateBullets ||
                  revealedBulletsCount >= (activeSlide.bullets?.length || 0))
              }
              className="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded-full transition-colors"
              title="Next slide / reveal bullet"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // POWERPOINT APPLICATION STUDIO VIEW
  // ============================================================================
  const previewTransition = getTransitionVariants(
    activeSlide.transition || 'morph',
    activeSlide.transitionDuration || 0.55
  );
  const activeAlign = activeSlide.titleAlign || 'left';
  const activeLayout = activeSlide.layout || 'title-content';

  return (
    <MacWindowFrame isMaximized={isMaximized} maxWidthClass="max-w-7xl" heightClass="h-[76dvh] sm:h-[80dvh]">
        {/* Hidden image picker for Insert Image */}
        <input
          ref={imageUploadRef}
          type="file"
          accept="image/*"
          onChange={handleInsertImageFile}
          className="hidden"
        />

        {/* 1. POWERPOINT TITLE BAR */}
        <div
          onDoubleClick={onToggleMaximize}
          className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-slate-950/40 gap-3 select-none"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <WindowControls
              onClose={onClose}
              onMinimize={onMinimize}
              onToggleMaximize={onToggleMaximize}
              isMaximized={isMaximized}
            />
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/25 shrink-0">
              <Presentation className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent border border-transparent hover:border-white/15 focus:border-amber-400/60 focus:bg-slate-950/60 px-2.5 py-1 rounded-lg text-sm font-semibold text-white outline-none w-full max-w-sm transition-colors"
              placeholder="Presentation Title"
            />
            <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] text-slate-400">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  saveStatus === 'saved' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span>{saveStatus === 'saved' ? 'Saved' : 'Saving...'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleUndo}
              disabled={historyPast.length === 0}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyFuture.length === 0}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors mr-1"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => startSlideshow(activeSlideIndex)}
              className="liquid-btn flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Slide Show</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportMenu((v) => !v)}
                className="liquid-btn flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 text-slate-100 text-xs font-medium rounded-xl whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-56 liquid-glass-elevated rounded-xl py-1.5 z-40">
                  <button
                    onClick={handleExportHtmlDeck}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2.5"
                  >
                    <FileCode2 className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-semibold">Interactive Deck (.html)</div>
                      <div className="text-[10px] text-slate-400">With themes & transitions</div>
                    </div>
                  </button>
                  <button
                    onClick={handleDownloadOutline}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2.5"
                  >
                    <FileText className="w-4 h-4 text-sky-400" />
                    <div>
                      <div className="font-semibold">Text Outline (.txt)</div>
                      <div className="text-[10px] text-slate-400">Slides & speaker notes</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors ml-1"
              aria-label="Close presentation studio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. POWERPOINT RIBBON TABS & TOOLBAR */}
        <div className="border-b border-white/10 bg-slate-900/50">
          {/* Ribbon Tab Headers */}
          <div className="flex items-center gap-1 px-4 pt-1.5 border-b border-white/5 text-xs overflow-x-auto">
            {[
              { id: 'home', label: 'Home', icon: Layers },
              { id: 'insert', label: 'Insert', icon: Plus },
              { id: 'design', label: 'Design', icon: Palette },
              { id: 'transitions', label: 'Transitions', icon: Wand2 },
              { id: 'slideshow', label: 'Slide Show', icon: MonitorPlay },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = ribbonTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setRibbonTab(tab.id as any)}
                  className={`px-3.5 py-2 flex items-center gap-1.5 font-medium border-b-2 transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-amber-400 text-amber-300 bg-white/5 rounded-t-lg'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Ribbon Controls */}
          <div className="px-4 py-2.5 flex flex-wrap items-center gap-2.5 text-xs min-h-[52px]">
            {/* HOME RIBBON */}
            {ribbonTab === 'home' && (
              <>
                <div className="relative">
                  <button
                    onClick={() => setShowLayoutDropdown((v) => !v)}
                    className="liquid-btn flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200 rounded-lg font-medium whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Slide</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showLayoutDropdown && (
                    <div className="absolute left-0 mt-1.5 w-64 liquid-glass-elevated rounded-xl p-1.5 z-40 grid grid-cols-1 gap-0.5">
                      {LAYOUT_OPTIONS.map((lay) => (
                        <button
                          key={lay.id}
                          onClick={() => addSlide(lay.id)}
                          className="px-3 py-2 rounded-lg text-left hover:bg-white/10 transition-colors flex items-center justify-between"
                        >
                          <span className="font-semibold text-slate-100 text-xs">{lay.label}</span>
                          <span className="text-[10px] text-slate-400">{lay.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <select
                  value={activeLayout}
                  onChange={(e) => updateActiveSlide({ layout: e.target.value as SlideLayout })}
                  className="bg-slate-950/70 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                  title="Change Current Slide Layout"
                >
                  {LAYOUT_OPTIONS.map((l) => (
                    <option key={l.id} value={l.id}>
                      Layout: {l.label}
                    </option>
                  ))}
                </select>

                <div className="h-5 w-px bg-white/10 mx-1" />

                {/* Alignment */}
                <div className="flex items-center bg-slate-950/60 border border-white/10 rounded-lg p-0.5">
                  {[
                    { id: 'left', icon: AlignLeft },
                    { id: 'center', icon: AlignCenter },
                    { id: 'right', icon: AlignRight },
                  ].map((al) => {
                    const Icon = al.icon;
                    return (
                      <button
                        key={al.id}
                        onClick={() => updateActiveSlide({ titleAlign: al.id as any })}
                        className={`p-1.5 rounded-md transition-colors ${
                          activeAlign === al.id
                            ? 'bg-white/15 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title={`Align ${al.id}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>

                {/* Title Font Size */}
                <select
                  value={activeSlide.titleFontSize || 'lg'}
                  onChange={(e) => updateActiveSlide({ titleFontSize: e.target.value as any })}
                  className="bg-slate-950/70 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                >
                  <option value="sm">Size: Small</option>
                  <option value="md">Size: Medium</option>
                  <option value="lg">Size: Large</option>
                  <option value="xl">Size: Hero XL</option>
                </select>

                {/* Font Family */}
                <select
                  value={activeSlide.fontFamily || 'sans'}
                  onChange={(e) => updateActiveSlide({ fontFamily: e.target.value as any })}
                  className="bg-slate-950/70 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                >
                  <option value="sans">Font: Modern Sans</option>
                  <option value="serif">Font: Editorial Serif</option>
                  <option value="mono">Font: Technical Mono</option>
                </select>

                <div className="h-5 w-px bg-white/10 mx-1" />

                <button
                  onClick={() => duplicateSlide(activeSlideIndex)}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center gap-1.5 text-slate-200"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>
              </>
            )}

            {/* INSERT RIBBON */}
            {ribbonTab === 'insert' && (
              <>
                <button
                  onClick={insertTextBox}
                  className="liquid-btn px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg flex items-center gap-1.5 text-slate-100"
                >
                  <Type className="w-3.5 h-3.5 text-sky-400" />
                  <span>Text Box</span>
                </button>
                <button
                  onClick={() => insertShape('rounded')}
                  className="liquid-btn px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg flex items-center gap-1.5 text-slate-100"
                >
                  <Square className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Rounded Card</span>
                </button>
                <button
                  onClick={() => insertShape('circle')}
                  className="liquid-btn px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg flex items-center gap-1.5 text-slate-100"
                >
                  <Circle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Circle</span>
                </button>
                <button
                  onClick={() => insertShape('pill')}
                  className="liquid-btn px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg flex items-center gap-1.5 text-slate-100"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Highlight Badge</span>
                </button>
                <button
                  onClick={() => imageUploadRef.current?.click()}
                  className="liquid-btn px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg flex items-center gap-1.5 text-slate-100"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                  <span>Insert Image</span>
                </button>
                <div className="h-5 w-px bg-white/10 mx-1" />
                <button
                  onClick={() => addBullet(false)}
                  className="liquid-btn px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center gap-1.5 text-slate-200"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add Bullet</span>
                </button>
              </>
            )}

            {/* DESIGN RIBBON */}
            {ribbonTab === 'design' && (
              <div className="flex flex-wrap items-center gap-2.5 w-full">
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                  {SLIDE_THEMES.map((theme) => {
                    const isSelected = (activeSlide.themeId || 'obsidian-glass') === theme.id && !activeSlide.customBg;
                    return (
                      <button
                        key={theme.id}
                        onClick={() =>
                          updateActiveSlide({
                            themeId: theme.id,
                            customBg: undefined,
                            textColor: undefined,
                            accentColor: undefined,
                          })
                        }
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all whitespace-nowrap shrink-0 ${
                          isSelected
                            ? 'border-amber-400 bg-white/15 shadow-sm'
                            : 'border-white/10 bg-slate-950/50 hover:border-white/25'
                        }`}
                        title={theme.name}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                          style={{ background: theme.bg }}
                        />
                        <span className="text-[11px] font-medium">{theme.name}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/60 border border-white/10 rounded-lg cursor-pointer">
                    <span className="text-[11px] text-slate-300">Bg</span>
                    <input
                      type="color"
                      value={activeSlide.customBg?.startsWith('#') ? activeSlide.customBg : '#0f172a'}
                      onChange={(e) => updateActiveSlide({ customBg: e.target.value })}
                      className="w-5 h-5 bg-transparent border-0 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/60 border border-white/10 rounded-lg cursor-pointer">
                    <span className="text-[11px] text-slate-300">Accent</span>
                    <input
                      type="color"
                      value={slideAccentColor}
                      onChange={(e) => updateActiveSlide({ accentColor: e.target.value })}
                      className="w-5 h-5 bg-transparent border-0 cursor-pointer"
                    />
                  </label>
                  <button
                    onClick={() => applyThemeToAll(activeSlide.themeId || 'obsidian-glass')}
                    className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/30 text-indigo-200 rounded-lg text-[11px] font-semibold whitespace-nowrap"
                  >
                    Apply to All Slides
                  </button>
                </div>
              </div>
            )}

            {/* TRANSITIONS RIBBON */}
            {ribbonTab === 'transitions' && (
              <div className="flex flex-wrap items-center gap-2 w-full">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {TRANSITION_OPTIONS.map((tr) => {
                    const isSelected = (activeSlide.transition || 'morph') === tr.id;
                    return (
                      <button
                        key={tr.id}
                        onClick={() => {
                          updateActiveSlide({ transition: tr.id });
                          setTransitionPreviewKey((k) => k + 1);
                        }}
                        className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-semibold'
                            : 'border-white/10 bg-slate-950/50 text-slate-300 hover:border-white/25'
                        }`}
                        title={tr.desc}
                      >
                        <Wand2 className="w-3 h-3" />
                        <span>{tr.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <select
                    value={activeSlide.transitionDuration ?? 0.55}
                    onChange={(e) => updateActiveSlide({ transitionDuration: Number(e.target.value) })}
                    className="bg-slate-950/70 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none"
                  >
                    <option value={0.3}>0.3s (Fast)</option>
                    <option value={0.55}>0.55s (Smooth)</option>
                    <option value={0.9}>0.9s (Slow)</option>
                    <option value={1.2}>1.2s (Dramatic)</option>
                  </select>

                  <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950/60 border border-white/10 rounded-lg cursor-pointer text-[11px] text-slate-200">
                    <input
                      type="checkbox"
                      checked={Boolean(activeSlide.animateBullets)}
                      onChange={(e) => updateActiveSlide({ animateBullets: e.target.checked })}
                      className="accent-amber-400"
                    />
                    <span>Step-by-step bullets</span>
                  </label>

                  <button
                    onClick={() => setTransitionPreviewKey((k) => k + 1)}
                    className="px-3 py-1.5 bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-400/30 text-emerald-200 rounded-lg font-medium flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" />
                    <span>Preview</span>
                  </button>

                  <button
                    onClick={() =>
                      applyTransitionToAll(
                        activeSlide.transition || 'morph',
                        activeSlide.transitionDuration ?? 0.55
                      )
                    }
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 rounded-lg font-medium whitespace-nowrap"
                  >
                    Apply to All
                  </button>
                </div>
              </div>
            )}

            {/* SLIDESHOW RIBBON */}
            {ribbonTab === 'slideshow' && (
              <>
                <button
                  onClick={() => startSlideshow(0)}
                  className="liquid-btn px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>From Beginning</span>
                </button>
                <button
                  onClick={() => startSlideshow(activeSlideIndex)}
                  className="liquid-btn px-3.5 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 text-slate-100 font-medium rounded-lg flex items-center gap-1.5"
                >
                  <MonitorPlay className="w-3.5 h-3.5 text-amber-400" />
                  <span>From Current Slide</span>
                </button>
                <div className="h-5 w-px bg-white/10 mx-1" />
                <div className="flex items-center gap-2">
                  <Timer className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-300">Auto-Advance:</span>
                  <select
                    value={autoAdvanceSec}
                    onChange={(e) => setAutoAdvanceSec(Number(e.target.value))}
                    className="bg-slate-950/70 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none"
                  >
                    <option value={0}>Manual (Click / Keys)</option>
                    <option value={5}>Every 5 seconds</option>
                    <option value={10}>Every 10 seconds</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowNotesDrawer((v) => !v)}
                  className="ml-auto px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showNotesDrawer ? 'Hide Notes' : 'Show Notes'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3. MAIN WORKSPACE: LEFT SLIDE SORTER + CENTER 16:9 CANVAS */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {/* LEFT SLIDE SORTER */}
          <div className="md:col-span-3 h-40 md:h-full overflow-y-auto smooth-scroll p-3 bg-slate-950/40 flex md:flex-col gap-2.5 overflow-x-auto md:overflow-x-hidden">
            {slides.map((s, idx) => {
              const th = getThemePreset(s.themeId);
              const isSelected = activeSlideIndex === idx;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveSlideIndex(idx);
                    setSelectedElementId(null);
                  }}
                  className={`shrink-0 w-44 md:w-full rounded-xl p-2 cursor-pointer transition-all group border ${
                    isSelected
                      ? 'bg-white/10 border-amber-400/80 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/50 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 px-0.5">
                    <span className="font-mono font-semibold text-slate-300">{idx + 1}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSlide(idx, 'up');
                        }}
                        disabled={idx === 0}
                        className="p-0.5 hover:text-white disabled:opacity-20"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSlide(idx, 'down');
                        }}
                        disabled={idx === slides.length - 1}
                        className="p-0.5 hover:text-white disabled:opacity-20"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateSlide(idx);
                        }}
                        className="p-0.5 hover:text-white"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {slides.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSlide(idx);
                          }}
                          className="p-0.5 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Scaled 16:9 Live Visual Thumbnail */}
                  <div
                    style={{
                      background: s.customBg || th.bg,
                      color: s.textColor || th.text,
                    }}
                    className="aspect-[16/9] w-full rounded-lg p-2.5 flex flex-col justify-center overflow-hidden border border-white/10 relative"
                  >
                    <div className="text-[10px] font-bold truncate leading-tight">
                      {s.title || 'Untitled Slide'}
                    </div>
                    {s.subtitle && (
                      <div className="text-[8px] opacity-75 truncate mt-0.5">{s.subtitle}</div>
                    )}
                    {s.transition && s.transition !== 'none' && (
                      <span className="absolute bottom-1 right-1.5 text-[8px] font-mono opacity-60 uppercase">
                        {s.transition}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => addSlide('title-content')}
              className="shrink-0 w-36 md:w-full py-2.5 border border-dashed border-white/15 hover:border-amber-400/60 rounded-xl text-xs text-slate-400 hover:text-amber-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Slide</span>
            </button>
          </div>

          {/* CENTER STAGE & NOTES */}
          <div className="md:col-span-9 h-full flex flex-col overflow-hidden bg-slate-950/25">
            {/* Selected Element Inspector Bar (when an inserted shape/textbox/image is selected) */}
            {selectedElement && (
              <div className="px-4 py-2 border-b border-white/10 bg-slate-900/70 flex flex-wrap items-center gap-3 text-xs">
                <span className="font-mono text-[11px] text-amber-300 font-semibold uppercase">
                  Element: {selectedElement.type}
                </span>
                {selectedElement.type !== 'image' && (
                  <>
                    <label className="flex items-center gap-1.5">
                      <span className="text-slate-400">Fill</span>
                      <input
                        type="color"
                        value={
                          selectedElement.fill?.startsWith('#') ? selectedElement.fill : '#6366f1'
                        }
                        onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value })}
                        className="w-5 h-5 bg-transparent border-0 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center gap-1.5">
                      <span className="text-slate-400">Text</span>
                      <input
                        type="color"
                        value={selectedElement.color || '#ffffff'}
                        onChange={(e) =>
                          updateElement(selectedElement.id, { color: e.target.value })
                        }
                        className="w-5 h-5 bg-transparent border-0 cursor-pointer"
                      />
                    </label>
                  </>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Width</span>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    value={selectedElement.width}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { width: Number(e.target.value) }, false)
                    }
                    className="w-20 accent-amber-400"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Height</span>
                  <input
                    type="range"
                    min={8}
                    max={90}
                    value={selectedElement.height}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { height: Number(e.target.value) }, false)
                    }
                    className="w-20 accent-amber-400"
                  />
                </div>
                <button
                  onClick={() => deleteElement(selectedElement.id)}
                  className="ml-auto px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            )}

            {/* 16:9 Interactive Canvas Viewport */}
            <div
              className="flex-1 overflow-y-auto smooth-scroll p-4 md:p-8 flex items-center justify-center"
              onClick={() => setSelectedElementId(null)}
            >
              <div
                ref={stageRef}
                className="w-full max-w-4xl aspect-[16/9] rounded-2xl overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.65)] border border-white/15 relative perspective-[1200px]"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeSlide.id}_${transitionPreviewKey}`}
                    initial={previewTransition.initial}
                    animate={previewTransition.animate}
                    exit={previewTransition.exit}
                    transition={previewTransition.transition}
                    style={{ background: slideBg, color: slideTextColor }}
                    className={`w-full h-full p-6 md:p-12 flex flex-col justify-center relative overflow-hidden ${getFontFamilyClass(
                      activeSlide.fontFamily
                    )}`}
                  >
                    {/* Subtle specular glow inside slide */}
                    <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />

                    {activeLayout !== 'blank' && (
                      <div
                        className={`relative z-10 w-full flex flex-col ${
                          activeAlign === 'center'
                            ? 'items-center text-center'
                            : activeAlign === 'right'
                            ? 'items-end text-right'
                            : 'items-start text-left'
                        }`}
                      >
                        {activeLayout === 'section' && (
                          <div
                            className="w-14 h-1.5 rounded-full mb-3"
                            style={{ backgroundColor: slideAccentColor }}
                          />
                        )}

                        <input
                          type="text"
                          value={activeSlide.title}
                          onChange={(e) => updateActiveSlide({ title: e.target.value }, false)}
                          placeholder="Click to add slide title..."
                          style={{ color: slideTextColor, textAlign: activeAlign }}
                          className={`w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-amber-400 outline-none py-1 transition-colors ${getTitleSizeClass(
                            activeSlide.titleFontSize
                          )}`}
                        />

                        <input
                          type="text"
                          value={activeSlide.subtitle || ''}
                          onChange={(e) => updateActiveSlide({ subtitle: e.target.value }, false)}
                          placeholder="Click to add subtitle..."
                          style={{ color: slideSubtextColor, textAlign: activeAlign }}
                          className="w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-amber-400 text-sm md:text-lg font-medium outline-none py-1 mt-1.5 transition-colors"
                        />

                        {/* Two Column Layout */}
                        {activeLayout === 'two-column' ? (
                          <div className="grid grid-cols-2 gap-6 mt-5 w-full text-left">
                            <div className="space-y-2">
                              {(activeSlide.bullets || []).map((bullet, bIdx) => (
                                <div key={bIdx} className="flex items-center gap-2.5 group">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: slideAccentColor }}
                                  />
                                  <input
                                    type="text"
                                    value={bullet}
                                    onChange={(e) => handleBulletChange(bIdx, e.target.value, false)}
                                    className="flex-1 bg-transparent border-b border-transparent hover:border-white/20 focus:border-amber-400 text-xs md:text-sm outline-none py-0.5"
                                  />
                                  <button
                                    onClick={() => removeBullet(bIdx, false)}
                                    className="opacity-0 group-hover:opacity-100 text-rose-400 p-0.5"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => addBullet(false)}
                                className="text-[11px] font-medium flex items-center gap-1 opacity-80 hover:opacity-100"
                                style={{ color: slideAccentColor }}
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add point</span>
                              </button>
                            </div>

                            <div className="space-y-2 pl-5 border-l border-white/15">
                              <input
                                type="text"
                                value={activeSlide.rightColumnTitle || ''}
                                onChange={(e) =>
                                  updateActiveSlide({ rightColumnTitle: e.target.value }, false)
                                }
                                placeholder="Right column heading"
                                style={{ color: slideAccentColor }}
                                className="w-full bg-transparent font-bold text-xs md:text-sm outline-none border-b border-transparent focus:border-amber-400"
                              />
                              {(activeSlide.rightBullets || []).map((bullet, bIdx) => (
                                <div key={bIdx} className="flex items-center gap-2.5 group">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: slideAccentColor }}
                                  />
                                  <input
                                    type="text"
                                    value={bullet}
                                    onChange={(e) => handleBulletChange(bIdx, e.target.value, true)}
                                    className="flex-1 bg-transparent border-b border-transparent hover:border-white/20 focus:border-amber-400 text-xs md:text-sm outline-none py-0.5"
                                  />
                                  <button
                                    onClick={() => removeBullet(bIdx, true)}
                                    className="opacity-0 group-hover:opacity-100 text-rose-400 p-0.5"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => addBullet(true)}
                                className="text-[11px] font-medium flex items-center gap-1 opacity-80 hover:opacity-100"
                                style={{ color: slideAccentColor }}
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add point</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          activeLayout !== 'quote' &&
                          activeLayout !== 'section' &&
                          activeLayout !== 'title' && (
                            <div className="mt-5 space-y-2 w-full max-w-2xl">
                              {(activeSlide.bullets || []).map((bullet, bIdx) => (
                                <div key={bIdx} className="flex items-center gap-3 group">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: slideAccentColor }}
                                  />
                                  <input
                                    type="text"
                                    value={bullet}
                                    onChange={(e) => handleBulletChange(bIdx, e.target.value, false)}
                                    placeholder="Bullet point..."
                                    className="flex-1 bg-transparent border-b border-transparent hover:border-white/20 focus:border-amber-400 text-sm md:text-base outline-none py-0.5"
                                  />
                                  <button
                                    onClick={() => removeBullet(bIdx, false)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-rose-400 transition-opacity"
                                    title="Remove bullet"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => addBullet(false)}
                                className="flex items-center gap-1.5 text-xs font-medium pt-1 opacity-85 hover:opacity-100 transition-opacity"
                                style={{ color: slideAccentColor }}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add bullet point</span>
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {activeLayout === 'blank' && (activeSlide.elements || []).length === 0 && (
                      <div className="text-center text-xs opacity-60 pointer-events-none">
                        Blank Canvas · Use the <strong>Insert</strong> tab above to add Text Boxes, Shapes, or Images.
                      </div>
                    )}

                    {/* Freeform Draggable Elements */}
                    {(activeSlide.elements || []).map((el) => {
                      const isElSelected = selectedElementId === el.id;
                      return (
                        <div
                          key={el.id}
                          onPointerDown={(e) => startDraggingElement(e, el)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedElementId(el.id);
                          }}
                          style={{
                            left: `${el.x}%`,
                            top: `${el.y}%`,
                            width: `${el.width}%`,
                            height: `${el.height}%`,
                            opacity: el.opacity ?? 1,
                          }}
                          className={`absolute z-20 cursor-move select-none ${
                            isElSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-transparent rounded-xl' : ''
                          }`}
                        >
                          {el.type === 'image' && el.content ? (
                            <img
                              src={el.content}
                              alt="Slide asset"
                              className="w-full h-full object-contain rounded-xl pointer-events-none"
                            />
                          ) : (
                            <div
                              style={{
                                backgroundColor: el.fill || 'transparent',
                                color: el.color || slideTextColor,
                                fontSize: `${el.fontSize || 15}px`,
                              }}
                              className={`w-full h-full flex items-center justify-center p-2.5 text-center font-medium ${
                                el.shapeKind === 'circle'
                                  ? 'rounded-full'
                                  : el.shapeKind === 'pill'
                                  ? 'rounded-full px-4'
                                  : el.shapeKind === 'rounded' || el.shapeKind === 'callout'
                                  ? 'rounded-2xl shadow-lg'
                                  : el.shapeKind === 'rect'
                                  ? 'rounded-md'
                                  : 'rounded-xl backdrop-blur-md border border-white/20'
                              }`}
                            >
                              <input
                                type="text"
                                value={el.content || ''}
                                onChange={(e) => updateElement(el.id, { content: e.target.value }, false)}
                                style={{ color: el.color || slideTextColor }}
                                className="w-full bg-transparent text-center outline-none font-medium"
                                placeholder="Type text..."
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Speaker Notes & Status Strip */}
            {showNotesDrawer && (
              <div className="px-4 py-2.5 border-t border-white/10 bg-slate-950/50">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5 font-medium">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>Speaker Notes</span>
                  </span>
                  <span className="font-mono tabular-nums text-slate-500">
                    Slide {activeSlideIndex + 1} of {slides.length} · Theme: {activeTheme.name} · Transition:{' '}
                    {activeSlide.transition || 'morph'}
                  </span>
                </div>
                <textarea
                  value={activeSlide.notes || ''}
                  onChange={(e) => updateActiveSlide({ notes: e.target.value }, false)}
                  placeholder="Click to add presenter notes for this slide..."
                  className="w-full h-12 bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-400/60 resize-none"
                />
              </div>
            )}
          </div>
        </div>
    </MacWindowFrame>
  );
};
