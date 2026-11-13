import React from 'react';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';

interface WindowControlsProps {
  onClose: () => void;
  onMinimize?: () => void;
  onToggleMaximize?: () => void;
  isMaximized?: boolean;
}

export const WindowControls: React.FC<WindowControlsProps> = ({
  onClose,
  onMinimize,
  onToggleMaximize,
  isMaximized = false,
}) => {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 group/traffic">
      {/* Exit (Red) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title="Exit window"
        aria-label="Exit window"
        className="p-1.5 -m-1 rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70"
      >
        <span className="w-4 h-4 sm:w-3.5 sm:h-3.5 rounded-full bg-[#ff5f57] hover:bg-[#ff3b30] border border-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] flex items-center justify-center transition-transform duration-150 active:scale-90 group-hover/traffic:scale-105">
          <X className="w-2.5 h-2.5 text-black/80 opacity-80 sm:opacity-65 sm:group-hover/traffic:opacity-100 transition-opacity stroke-[2.75]" />
        </span>
      </button>

      {/* Minimize to Dock (Yellow) */}
      {onMinimize && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMinimize();
          }}
          title="Minimize to Dock"
          aria-label="Minimize window"
          className="p-1.5 -m-1 rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
        >
          <span className="w-4 h-4 sm:w-3.5 sm:h-3.5 rounded-full bg-[#febc2e] hover:bg-[#f59e0b] border border-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] flex items-center justify-center transition-transform duration-150 active:scale-90 group-hover/traffic:scale-105">
            <Minus className="w-2.5 h-2.5 text-black/80 opacity-80 sm:opacity-65 sm:group-hover/traffic:opacity-100 transition-opacity stroke-[2.75]" />
          </span>
        </button>
      )}

      {/* Maximize / Restore (Green) */}
      {onToggleMaximize && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMaximize();
          }}
          title={isMaximized ? 'Restore compact window' : 'Maximize window'}
          aria-label={isMaximized ? 'Restore compact window' : 'Maximize window'}
          className="p-1.5 -m-1 rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
        >
          <span className="w-4 h-4 sm:w-3.5 sm:h-3.5 rounded-full bg-[#28c840] hover:bg-[#16a34a] border border-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] flex items-center justify-center transition-transform duration-150 active:scale-90 group-hover/traffic:scale-105">
            {isMaximized ? (
              <Minimize2 className="w-2 h-2 text-black/80 opacity-80 sm:opacity-65 sm:group-hover/traffic:opacity-100 transition-opacity stroke-[2.75]" />
            ) : (
              <Maximize2 className="w-2 h-2 text-black/80 opacity-80 sm:opacity-65 sm:group-hover/traffic:opacity-100 transition-opacity stroke-[2.75]" />
            )}
          </span>
        </button>
      )}
    </div>
  );
};
