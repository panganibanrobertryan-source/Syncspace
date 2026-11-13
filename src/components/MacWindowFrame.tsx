import React from 'react';
import { motion, usePresenceData } from 'motion/react';

export type WindowExitMode = 'close' | 'minimize';

interface MacWindowFrameProps {
  children: React.ReactNode;
  isMaximized: boolean;
  onBackdropClick?: () => void;
  maxWidthClass?: string;
  heightClass?: string;
  zIndexClass?: string;
}

const windowVariants = {
  initial: {
    opacity: 0,
    scale: 0.68,
    y: 130,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 350,
      damping: 31,
      mass: 0.65,
    },
  },
  exit: (mode: WindowExitMode) =>
    mode === 'minimize'
      ? {
          opacity: 0,
          scale: 0.28,
          y: 220,
          transition: {
            duration: 0.26,
            ease: [0.32, 0.72, 0, 1] as const,
          },
        }
      : {
          opacity: 0,
          scale: 0.92,
          y: 16,
          transition: {
            duration: 0.2,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        },
};

export const MacWindowFrame: React.FC<MacWindowFrameProps> = ({
  children,
  isMaximized,
  onBackdropClick,
  maxWidthClass = 'max-w-4xl',
  heightClass = 'h-[72dvh] sm:h-[76dvh]',
  zIndexClass = 'z-50',
}) => {
  const presenceExitMode = usePresenceData() as WindowExitMode | undefined;
  const exitMode: WindowExitMode = presenceExitMode === 'minimize' ? 'minimize' : 'close';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
      exit={{ opacity: 0, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }}
      onClick={onBackdropClick}
      className={`fixed inset-0 ${
        isMaximized ? 'z-[55] p-0' : `${zIndexClass} px-2.5 pt-3 pb-22 sm:px-6 sm:pt-6 sm:pb-24`
      } flex items-center justify-center bg-slate-950/60 transition-[padding] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]`}
    >
      <motion.div
        variants={windowVariants}
        custom={exitMode}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className={`w-full liquid-glass-elevated flex flex-col overflow-hidden text-slate-100 will-change-transform transition-[max-width,height,border-radius] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isMaximized
            ? 'max-w-none h-[100dvh] rounded-none border-0'
            : `${maxWidthClass} ${heightClass} rounded-2xl sm:rounded-3xl`
        }`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
