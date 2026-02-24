import React, { useEffect, useRef } from 'react';

interface ScrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Optional class for the scroll-content div (e.g. max-h-[65vh] overflow-y-auto for long forms). */
  contentClassName?: string;
  children: React.ReactNode;
}

export function ScrollModal({
  isOpen,
  onClose,
  title,
  contentClassName,
  children,
}: ScrollModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        /* ─── Overlay ─────────────────────────────────────────── */
        .scroll-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 6, 2, 0.82);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: scrollFadeIn 0.25s ease;
        }

        @keyframes scrollFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes unrollScroll {
          from { transform: scaleY(0.12) scaleX(0.88); opacity: 0; }
          to   { transform: scaleY(1)    scaleX(1);    opacity: 1; }
        }

        /* ─── Container ───────────────────────────────────────── */
        .scroll-container {
          position: relative;
          width: min(640px, 92vw);
          max-height: 90vh;
          animation: unrollScroll 0.48s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-origin: top center;
          filter:
            drop-shadow(0 24px 64px rgba(0,0,0,0.8))
            drop-shadow(0 4px 12px rgba(0,0,0,0.5));
        }

        /* ─── Wooden Rods ─────────────────────────────────────── */
        .scroll-rod-top,
        .scroll-rod-bottom {
          position: relative;
          width: 100%;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .scroll-rod-top::before,
        .scroll-rod-bottom::before {
          content: '';
          position: absolute;
          left: -6px; right: -6px;
          height: 100%;
          border-radius: 50px;
          background: linear-gradient(
            180deg,
            #d4aa6a 0%,
            #9a6830 15%,
            #5c3610 32%,
            #7a4c1e 50%,
            #5c3610 68%,
            #9a6830 85%,
            #d4aa6a 100%
          );
          box-shadow:
            inset 0 2px 5px rgba(255,225,140,0.45),
            inset 0 -2px 5px rgba(0,0,0,0.55),
            0 4px 14px rgba(0,0,0,0.65);
        }

        .scroll-rod-top::after,
        .scroll-rod-bottom::after {
          content: '';
          position: absolute;
          left: -16px; right: -16px;
          height: 100%;
          border-radius: 50px;
          background: linear-gradient(
            180deg,
            #dbb87a 0%,
            #a07230 18%,
            #6e4018 40%,
            #8c5824 60%,
            #6e4018 82%,
            #a07230 100%
          );
          z-index: -1;
          box-shadow: 5px 0 10px rgba(0,0,0,0.5), -5px 0 10px rgba(0,0,0,0.5);
        }

        .scroll-rod-top .rod-inner,
        .scroll-rod-bottom .rod-inner {
          position: absolute;
          left: 0; right: 0;
          height: 100%;
          border-radius: 50px;
          background: linear-gradient(
            180deg,
            rgba(255,225,140,0.18) 0%,
            transparent 42%,
            transparent 58%,
            rgba(0,0,0,0.22) 100%
          );
          z-index: 3;
        }

        /* ─── Parchment Body ──────────────────────────────────── */
        .scroll-body {
          position: relative;
          margin: -20px 10px;
          padding: 40px 48px 36px;
          min-height: 120px;
          background:
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E"),
            radial-gradient(ellipse at 0%   50%, rgba(110,62,15,0.20) 0%, transparent 32%),
            radial-gradient(ellipse at 100% 50%, rgba(110,62,15,0.20) 0%, transparent 32%),
            linear-gradient(180deg,
              rgba(70,35,8,0.26) 0%,
              rgba(70,35,8,0.06) 10%,
              transparent 22%,
              transparent 78%,
              rgba(70,35,8,0.06) 90%,
              rgba(70,35,8,0.26) 100%
            ),
            linear-gradient(158deg,
              #f7e9c5 0%,
              #f0dfa8 22%,
              #e9d597 46%,
              #eedca5 68%,
              #e7d498 86%,
              #dfc98a 100%
            );
          z-index: 1;
          overflow: hidden;
        }

        /* Ruling lines */
        .scroll-body::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 30px,
            rgba(150, 100, 30, 0.055) 30px,
            rgba(150, 100, 30, 0.055) 31px
          );
          pointer-events: none;
          z-index: 0;
        }

        /* Vignette edges */
        .scroll-body::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 85% 10% at 50%   0%, rgba(90,50,8,0.28) 0%, transparent 100%),
            radial-gradient(ellipse 85% 10% at 50% 100%, rgba(90,50,8,0.28) 0%, transparent 100%);
          pointer-events: none;
          z-index: 0;
        }

        /* ─── Title (site font: Cinzel) ────────────────────────── */
        .scroll-title {
          font-family: 'Cinzel', serif;
          font-size: 1.85rem;
          color: #2a1203;
          text-align: center;
          margin-bottom: 14px;
          letter-spacing: 0.03em;
          text-shadow:
            0 1px 0 rgba(255,210,120,0.35),
            1px 0 2px rgba(0,0,0,0.18),
            0 0 18px rgba(60,20,0,0.12);
          position: relative;
          z-index: 1;
        }

        /* ─── Divider ─────────────────────────────────────────── */
        .scroll-divider {
          width: 82%;
          margin: 0 auto 22px;
          position: relative;
          z-index: 1;
        }

        .scroll-divider-line {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, #7a4c1e 15%, #c8903a 50%, #7a4c1e 85%, transparent);
          position: relative;
        }

        .scroll-divider-line::before {
          content: '✦';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          color: #7a4c1e;
          font-size: 0.65rem;
          background: linear-gradient(158deg, #f3e4bc, #ecdaa2);
          padding: 0 10px;
        }

        /* ─── Scroll content area (site font: Lora) ──────────────── */
        .scroll-content {
          font-family: 'Lora', serif;
          font-size: 1rem;
          line-height: 1.85;
          color: #1e0e02;
          position: relative;
          z-index: 1;
        }

        /* Labels — small-caps, Cinzel */
        .scroll-content label,
        .scroll-label {
          display: block;
          font-family: 'Cinzel', serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #3a1a03;
          margin-bottom: 4px;
          text-shadow: 0.3px 0.3px 0 rgba(0,0,0,0.3);
        }

        /* Helper text beneath labels */
        .scroll-content .field-hint {
          font-family: 'Lora', serif;
          font-size: 0.82rem;
          font-style: italic;
          color: #6b4018;
          opacity: 0.75;
          margin-top: -2px;
          margin-bottom: 5px;
        }

        /* Inputs: underline-only, no box */
        .scroll-content input[type="text"],
        .scroll-content input[type="number"],
        .scroll-content input[type="date"],
        .scroll-content select,
        .scroll-input,
        .scroll-select {
          width: 100%;
          font-family: 'Lora', serif;
          font-size: 1rem;
          color: #1a0c02;
          background: transparent;
          border: none;
          border-bottom: 1.5px solid rgba(100, 58, 16, 0.5);
          border-radius: 0;
          padding: 5px 2px 6px;
          outline: none;
          box-shadow: none;
          -webkit-appearance: none;
          appearance: none;
          box-sizing: border-box;
          transition: border-bottom-color 0.2s, box-shadow 0.2s;
        }

        .scroll-content input::placeholder,
        .scroll-input::placeholder {
          font-family: 'Lora', serif;
          font-style: italic;
          color: rgba(70, 38, 8, 0.38);
        }

        .scroll-content input[type="text"]:focus,
        .scroll-content input[type="number"]:focus,
        .scroll-content input[type="date"]:focus,
        .scroll-content select:focus,
        .scroll-input:focus,
        .scroll-select:focus {
          border-bottom-color: #6e3608;
          box-shadow: 0 2px 0 rgba(110,54,8,0.15);
        }

        .scroll-select-wrap {
          position: relative;
        }
        .scroll-select-wrap::after {
          content: '▾';
          position: absolute;
          right: 4px;
          bottom: 8px;
          color: #7a3e0e;
          font-size: 0.75rem;
          pointer-events: none;
        }

        .scroll-inline-row {
          display: flex;
          align-items: flex-end;
          gap: 12px;
        }

        .scroll-inline-row .scroll-narrow {
          width: 54px;
          flex-shrink: 0;
        }

        .scroll-inline-row .scroll-sep {
          font-family: 'Lora', serif;
          font-style: italic;
          font-size: 0.9rem;
          color: #5a3010;
          padding-bottom: 6px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .scroll-date-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .scroll-content input[type="color"] {
          width: 44px;
          height: 30px;
          padding: 2px 3px;
          cursor: pointer;
          border: 1.5px solid rgba(100,58,16,0.45);
          border-radius: 2px;
          background: transparent;
          vertical-align: middle;
        }

        .scroll-color-row {
          display: flex;
          align-items: flex-end;
          gap: 12px;
        }
        .scroll-color-row .scroll-input {
          width: 110px;
          flex-shrink: 0;
        }

        .scroll-field {
          margin-bottom: 18px;
        }

        /* ─── Action buttons ──────────────────────────────────── */
        .scroll-btn-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 26px;
        }

        .scroll-btn {
          font-family: 'Cinzel', serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 11px 16px;
          border: none;
          cursor: pointer;
          transition: filter 0.18s, transform 0.12s;
          position: relative;
        }

        .scroll-btn:hover  { filter: brightness(1.09); transform: translateY(-1px); }
        .scroll-btn:active { filter: brightness(0.93); transform: translateY(0);    }

        .scroll-btn-primary {
          background: linear-gradient(155deg, #9c6018 0%, #7b4510 55%, #692e06 100%);
          color: #f5e3b2;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          box-shadow:
            inset 0 1px 0 rgba(255,210,100,0.22),
            0 3px 12px rgba(0,0,0,0.38);
        }

        .scroll-btn-secondary {
          background: transparent;
          color: #4a2208;
          border: 1.5px solid rgba(100,58,16,0.45);
        }

        .scroll-btn-secondary:hover {
          background: rgba(120,70,20,0.07);
        }

        /* ─── Close (site font: Lora) ──────────────────────────── */
        .scroll-close {
          position: absolute;
          top: 22px; right: 18px;
          z-index: 10;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Lora', serif;
          font-size: 1.05rem;
          color: #5a3210;
          opacity: 0.5;
          transition: opacity 0.2s, transform 0.2s;
          line-height: 1;
          padding: 4px 6px;
        }
        .scroll-close:hover { opacity: 0.88; transform: scale(1.2) rotate(8deg); }

        /* ─── Corner ornaments ───────────────────────────────── */
        .scroll-ornament {
          position: absolute;
          font-size: 0.8rem;
          color: rgba(95, 55, 12, 0.36);
          line-height: 1;
          z-index: 2;
          pointer-events: none;
        }
        .scroll-ornament.tl { top: 28px;   left: 20px;  }
        .scroll-ornament.tr { top: 28px;   right: 20px; transform: scaleX(-1);  }
        .scroll-ornament.bl { bottom: 28px; left: 20px;  transform: scaleY(-1); }
        .scroll-ornament.br { bottom: 28px; right: 20px; transform: scale(-1);  }
      `}</style>

      <div
        className="scroll-overlay"
        ref={overlayRef}
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'scroll-modal-title' : undefined}
      >
        <div className="scroll-container">
          <div className="scroll-rod-top">
            <div className="rod-inner" />
          </div>

          <div className="scroll-body">
            <button type="button" className="scroll-close" onClick={onClose} aria-label="Close">✕</button>

            <span className="scroll-ornament tl" aria-hidden="true">❧</span>
            <span className="scroll-ornament tr" aria-hidden="true">❧</span>
            <span className="scroll-ornament bl" aria-hidden="true">❧</span>
            <span className="scroll-ornament br" aria-hidden="true">❧</span>

            {title && (
              <>
                <h2 id="scroll-modal-title" className="scroll-title">{title}</h2>
                <div className="scroll-divider">
                  <div className="scroll-divider-line" />
                </div>
              </>
            )}

            <div className={`scroll-content ${contentClassName ?? ''}`.trim()}>{children}</div>
          </div>

          <div className="scroll-rod-bottom">
            <div className="rod-inner" />
          </div>
        </div>
      </div>
    </>
  );
}
