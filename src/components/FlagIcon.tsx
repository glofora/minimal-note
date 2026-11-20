import React from 'react';
import type { SupportedLanguage } from '@/lib/i18n';

interface FlagIconProps {
  code: SupportedLanguage | string;
  className?: string;
}

export const FlagIcon: React.FC<FlagIconProps> = ({ code, className = 'w-5 h-3.5' }) => {
  const normCode = code.toLowerCase();

  switch (normCode) {
    // 🇺🇸 English / US
    case 'en':
      return (
        <svg viewBox="0 0 640 480" className={`inline-block overflow-hidden rounded-xs shrink-0 align-middle ${className}`}>
          <rect width="640" height="480" fill="#bd3d44" />
          <path d="M0 37h640v37H0zm0 74h640v37H0zm0 74h640v37H0zm0 74h640v37H0zm0 74h640v37H0zm0 74h640v37H0z" fill="#fff" />
          <rect width="256" height="258" fill="#192f5d" />
          {/* Star grid preview */}
          <g fill="#fff">
            {[30, 80, 130, 180, 230].map((x) =>
              [25, 75, 125, 175, 225].map((y) => (
                <polygon
                  key={`star-${x}-${y}`}
                  points={`${x},${y - 9} ${x + 2.7},${y - 2.8} ${x + 9},${y - 2.8} ${x + 4},${y + 1.8} ${x + 5.8},${y + 8} ${x},${y + 3.8} ${x - 5.8},${y + 8} ${x - 4},${y + 1.8} ${x - 9},${y - 2.8} ${x - 2.7},${y - 2.8}`}
                />
              ))
            )}
          </g>
        </svg>
      );

    // 🇪🇸 Spanish / Spain
    case 'es':
      return (
        <svg viewBox="0 0 640 480" className={`inline-block overflow-hidden rounded-xs shrink-0 align-middle ${className}`}>
          <rect width="640" height="480" fill="#aa151b" />
          <rect y="120" width="640" height="240" fill="#f1bf00" />
          {/* Coat of arms emblem */}
          <g transform="translate(180, 240) scale(0.65)">
            <rect x="-35" y="-50" width="70" height="100" rx="35" fill="#aa151b" stroke="#000" strokeWidth="4" />
            <circle cx="0" cy="-5" r="18" fill="#f1bf00" />
            <path d="M-20,-75 L20,-75 L15,-60 L-15,-60 Z" fill="#f1bf00" />
          </g>
        </svg>
      );

    // 🇫🇷 French / France
    case 'fr':
      return (
        <svg viewBox="0 0 640 480" className={`inline-block overflow-hidden rounded-xs shrink-0 align-middle ${className}`}>
          <rect width="213.3" height="480" fill="#002654" />
          <rect x="213.3" width="213.4" height="480" fill="#ffffff" />
          <rect x="426.7" width="213.3" height="480" fill="#ce1126" />
        </svg>
      );

    // 🇩🇪 German / Germany
    case 'de':
      return (
        <svg viewBox="0 0 640 480" className={`inline-block overflow-hidden rounded-xs shrink-0 align-middle ${className}`}>
          <rect width="640" height="160" fill="#000000" />
          <rect y="160" width="640" height="160" fill="#dd0000" />
          <rect y="320" width="640" height="160" fill="#ffce00" />
        </svg>
      );

    // 🇮🇹 Italian / Italy
    case 'it':
      return (
        <svg viewBox="0 0 640 480" className={`inline-block overflow-hidden rounded-xs shrink-0 align-middle ${className}`}>
          <rect width="213.3" height="480" fill="#009246" />
          <rect x="213.3" width="213.4" height="480" fill="#ffffff" />
          <rect x="426.7" width="213.3" height="480" fill="#ce2b37" />
        </svg>
      );

    // 🇧🇷 Portuguese / Brazil
    case 'pt':
      return (
        <svg viewBox="0 0 640 480" className={`inline-block overflow-hidden rounded-xs shrink-0 align-middle ${className}`}>
          <rect width="640" height="480" fill="#009c3b" />
          <polygon points="320,40 590,240 320,440 50,240" fill="#ffdf00" />
          <circle cx="320" cy="240" r="105" fill="#002776" />
          <path d="M216 235 A105 105 0 0 1 424 235 A115 115 0 0 0 216 235" fill="#ffffff" />
        </svg>
      );

    // 🇷🇺 Russian / Russia
    case 'ru':
      return (
        <svg viewBox="0 0 640 480" className={`inline-block overflow-hidden rounded-xs shrink-0 align-middle ${className}`}>
          <rect width="640" height="160" fill="#ffffff" />
          <rect y="160" width="640" height="160" fill="#0039a6" />
          <rect y="320" width="640" height="160" fill="#d52b1e" />
        </svg>
      );

    // 🇹🇷 Turkish / Turkey
    case 'tr':
      return (
        <svg viewBox="0 0 640 480" className={`inline-block overflow-hidden rounded-xs shrink-0 align-middle ${className}`}>
          <rect width="640" height="480" fill="#e30a17" />
          <circle cx="260" cy="240" r="120" fill="#ffffff" />
          <circle cx="290" cy="240" r="96" fill="#e30a17" />
          <polygon
            points="380,240 361,246 368,227 353,214 372,214 380,195 388,214 407,214 392,227 399,246"
            fill="#ffffff"
          />
        </svg>
      );

    // 🇸🇦 Arabic / Saudi Arabia
    case 'ar':
      return (
        <svg viewBox="0 0 640 480" className={`inline-block overflow-hidden rounded-xs shrink-0 align-middle ${className}`}>
          <rect width="640" height="480" fill="#006c35" />
          <g fill="#ffffff">
            {/* Arabic inscription abstraction */}
            <path d="M150 180 h340 v30 h-340 z M180 150 h280 v20 h-280 z M210 220 h220 v20 h-220 z" opacity="0.9" />
            {/* Sword */}
            <rect x="160" y="270" width="320" height="12" rx="4" />
            <polygon points="160,266 140,276 160,286" />
            <rect x="440" y="260" width="12" height="32" rx="3" />
            <circle cx="485" cy="276" r="10" />
          </g>
        </svg>
      );

    // 🇮🇳 Hindi / India
    case 'hi':
      return (
        <svg viewBox="0 0 640 480" className={`inline-block overflow-hidden rounded-xs shrink-0 align-middle ${className}`}>
          <rect width="640" height="160" fill="#ff9933" />
          <rect y="160" width="640" height="160" fill="#ffffff" />
          <rect y="320" width="640" height="160" fill="#138808" />
          {/* Ashoka Chakra */}
          <circle cx="320" cy="240" r="54" fill="none" stroke="#000080" strokeWidth="6" />
          <circle cx="320" cy="240" r="12" fill="#000080" />
          <g stroke="#000080" strokeWidth="2.5">
            {[0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345].map(
              (deg) => (
                <line
                  key={`spoke-${deg}`}
                  x1="320"
                  y1="240"
                  x2={320 + 50 * Math.cos((deg * Math.PI) / 180)}
                  y2={240 + 50 * Math.sin((deg * Math.PI) / 180)}
                />
              )
            )}
          </g>
        </svg>
      );

    // 🇧🇩 Bengali / Bangladesh
    case 'bn':
      return (
        <svg viewBox="0 0 640 480" className={`inline-block overflow-hidden rounded-xs shrink-0 align-middle ${className}`}>
          <rect width="640" height="480" fill="#006a4e" />
          <circle cx="280" cy="240" r="130" fill="#f42a41" />
        </svg>
      );

    // 🇮🇳 Tamil / India
    case 'ta':
      return (
        <svg viewBox="0 0 640 480" className={`inline-block overflow-hidden rounded-xs shrink-0 align-middle ${className}`}>
          <rect width="640" height="160" fill="#ff9933" />
          <rect y="160" width="640" height="160" fill="#ffffff" />
          <rect y="320" width="640" height="160" fill="#138808" />
          {/* Ashoka Chakra */}
          <circle cx="320" cy="240" r="54" fill="none" stroke="#000080" strokeWidth="6" />
          <circle cx="320" cy="240" r="12" fill="#000080" />
          <g stroke="#000080" strokeWidth="2.5">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <line
                key={`ta-spoke-${deg}`}
                x1="320"
                y1="240"
                x2={320 + 50 * Math.cos((deg * Math.PI) / 180)}
                y2={240 + 50 * Math.sin((deg * Math.PI) / 180)}
              />
            ))}
          </g>
        </svg>
      );

    // 🇮🇩 Indonesian / Indonesia
    case 'id':
      return (
        <svg viewBox="0 0 640 480" className={`inline-block overflow-hidden rounded-xs shrink-0 align-middle ${className}`}>
          <rect width="640" height="240" fill="#ce1126" />
          <rect y="240" width="640" height="240" fill="#ffffff" />
        </svg>
      );

    // 🇯🇵 Japanese / Japan
    case 'ja':
      return (
        <svg viewBox="0 0 640 480" className={`inline-block overflow-hidden rounded-xs shrink-0 align-middle ${className}`}>
          <rect width="640" height="480" fill="#ffffff" />
          <circle cx="320" cy="240" r="144" fill="#bc002d" />
        </svg>
      );

    // 🇰🇷 Korean / South Korea
    case 'ko':
      return (
        <svg viewBox="0 0 640 480" className={`inline-block overflow-hidden rounded-xs shrink-0 align-middle ${className}`}>
          <rect width="640" height="480" fill="#ffffff" />
          {/* Taegeuk */}
          <g transform="rotate(-34 320 240)">
            <circle cx="320" cy="240" r="110" fill="#c60c30" />
            <path d="M320,130 A55,55 0 0,0 320,240 A55,55 0 0,1 320,350 A110,110 0 0,1 320,130" fill="#003478" />
          </g>
          {/* Trigrams in 4 corners */}
          <g stroke="#000" strokeWidth="10" strokeLinecap="round">
            {/* Top-left */}
            <line x1="140" y1="110" x2="190" y2="150" />
            <line x1="155" y1="95" x2="205" y2="135" />
            <line x1="125" y1="125" x2="175" y2="165" />
            {/* Bottom-right */}
            <line x1="450" y1="330" x2="500" y2="370" />
            <line x1="465" y1="315" x2="515" y2="355" />
            <line x1="435" y1="345" x2="485" y2="385" />
            {/* Top-right */}
            <line x1="490" y1="110" x2="440" y2="150" />
            <line x1="505" y1="125" x2="455" y2="165" />
            {/* Bottom-left */}
            <line x1="190" y1="330" x2="140" y2="370" />
            <line x1="205" y1="345" x2="155" y2="385" />
          </g>
        </svg>
      );

    // 🇨🇳 Chinese / China
    case 'zh':
      return (
        <svg viewBox="0 0 640 480" className={`inline-block overflow-hidden rounded-xs shrink-0 align-middle ${className}`}>
          <rect width="640" height="480" fill="#de2910" />
          {/* Main big star */}
          <polygon
            points="120,60 132,96 170,96 140,118 152,154 120,132 88,154 100,118 70,96 108,96"
            fill="#ffde00"
          />
          {/* 4 smaller stars */}
          <polygon points="200,40 204,50 215,50 206,56 210,66 200,60 190,66 194,56 185,50 196,50" fill="#ffde00" />
          <polygon points="240,70 244,80 255,80 246,86 250,96 240,90 230,96 234,86 225,80 236,80" fill="#ffde00" />
          <polygon points="240,120 244,130 255,130 246,136 250,146 240,140 230,146 234,136 225,130 236,130" fill="#ffde00" />
          <polygon points="200,160 204,170 215,170 206,176 210,186 200,180 190,186 194,176 185,170 196,170" fill="#ffde00" />
        </svg>
      );

    default:
      return (
        <span className={`inline-flex items-center justify-center font-bold text-[10px] bg-muted text-foreground border rounded-xs ${className}`}>
          {normCode.toUpperCase()}
        </span>
      );
  }
};
