import React, { useId } from 'react';

interface SmartClassLogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-8 h-8 rounded-xl',
  md: 'w-9 h-9 rounded-xl',
  lg: 'w-16 h-16 rounded-2xl',
};

export const SmartClassLogo: React.FC<SmartClassLogoProps> = ({
  variant = 'dark',
  size = 'md',
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const gradPrimary = `sc-grad-${uid}`;
  const gradCyan = `sc-cyan-${uid}`;
  const gradBorder = `sc-border-${uid}`;
  const glowFilter = `sc-glow-${uid}`;

  const isDark = variant === 'dark';

  return (
    <div
      className={`relative shrink-0 inline-flex items-center justify-center p-[1.5px] ${SIZE_MAP[size]} ${
        isDark
          ? 'shadow-[0_0_18px_rgba(37,99,255,0.35)]'
          : 'shadow-[0_10px_28px_-6px_rgba(37,99,255,0.32),0_4px_12px_-2px_rgba(113,59,255,0.2)]'
      } ${className}`}
      style={{
        background: 'linear-gradient(135deg, #00D4FF 0%, #2563FF 48%, #713BFF 100%)',
      }}
      aria-hidden="true"
    >
      <div
        className={`w-full h-full flex items-center justify-center overflow-hidden ${
          size === 'lg' ? 'rounded-[14px]' : 'rounded-[10.5px]'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(circle at 28% 20%, #101D47 0%, #070D20 75%)'
            : 'radial-gradient(circle at 30% 20%, #FFFFFF 0%, #F1F6FF 70%, #EEF2FF 100%)',
        }}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[82%] h-[82%]"
        >
          <defs>
            <linearGradient id={gradPrimary} x1="8" y1="10" x2="56" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00D4FF" />
              <stop offset="50%" stopColor="#2563FF" />
              <stop offset="100%" stopColor="#713BFF" />
            </linearGradient>
            <linearGradient id={gradCyan} x1="16" y1="14" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={isDark ? '#7AEBFF' : '#00D4FF'} />
              <stop offset="55%" stopColor="#2563FF" />
              <stop offset="100%" stopColor="#713BFF" />
            </linearGradient>
            <linearGradient id={gradBorder} x1="12" y1="30" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00D4FF" />
              <stop offset="100%" stopColor="#713BFF" />
            </linearGradient>
            <filter id={glowFilter} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Subtle orbital knowledge ring */}
          <ellipse
            cx="32"
            cy="33"
            rx="24"
            ry="15"
            transform="rotate(-14 32 33)"
            stroke={`url(#${gradBorder})`}
            strokeOpacity={isDark ? '0.32' : '0.24'}
            strokeWidth="1.3"
            strokeDasharray="3 3"
          />

          {/* Graduation Cap - Futuristic Diamond Mortarboard */}
          <path
            d="M32 10L53 19.5L32 29L11 19.5L32 10Z"
            fill={`url(#${gradPrimary})`}
          />
          <path
            d="M32 10L53 19.5L32 23.8L11 19.5L32 10Z"
            fill={isDark ? '#00D4FF' : '#60A5FA'}
            fillOpacity={isDark ? '0.35' : '0.28'}
          />
          {/* Cap base crown */}
          <path
            d="M21 24.8V31.2C21 33.4 25.9 35.5 32 35.5C38.1 35.5 43 33.4 43 31.2V24.8L32 29.6L21 24.8Z"
            fill={`url(#${gradCyan})`}
          />
          {/* Cap tassel & neural drop */}
          <path
            d="M49 21.5V30.5"
            stroke="#00D4FF"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="49" cy="32" r="2.2" fill="#00D4FF" filter={`url(#${glowFilter})`} />

          {/* Open Book - Sweeping Dual Tech Wings */}
          <path
            d="M11 36.5C18.5 35.2 26.2 37.2 32 42.2C37.8 37.2 45.5 35.2 53 36.5V49.2C45.4 47.8 37.8 49.4 32 53.5C26.2 49.4 18.6 47.8 11 49.2V36.5Z"
            fill={isDark ? '#0D1B44' : '#EEF4FF'}
            stroke={`url(#${gradPrimary})`}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Center book spine */}
          <path
            d="M32 42.2V53.5"
            stroke={`url(#${gradPrimary})`}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Book page circuit lines */}
          <path
            d="M16 41.2C20.5 40.8 24.5 41.8 28 44"
            stroke="#00D4FF"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M48 41.2C43.5 40.8 39.5 41.8 36 44"
            stroke="#713BFF"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {/* Knowledge Connection Nodes & Circuit Links */}
          <path
            d="M16 14L22.5 17M48 13.5L42 16.8M11 30.5L19 28.5"
            stroke={`url(#${gradBorder})`}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeOpacity="0.85"
          />
          <circle cx="15" cy="13.5" r="2.1" fill="#00D4FF" filter={`url(#${glowFilter})`} />
          <circle cx="49" cy="13" r="2" fill="#713BFF" filter={`url(#${glowFilter})`} />
          <circle cx="10.5" cy="31" r="1.9" fill="#2563FF" filter={`url(#${glowFilter})`} />
          <circle cx="32" cy="19.5" r="2" fill="#FFFFFF" fillOpacity={isDark ? '0.95' : '0.9'} />
        </svg>
      </div>
    </div>
  );
};
