import React, { useEffect, useState } from 'react';
import { DailyCalendarInfo, useDailyNatureClock } from '../../hooks/useDailyNatureClock';

interface DailyNatureBannerProps {
  title: React.ReactNode;
  description: React.ReactNode;
  roleMeta?: string;
  actions?: React.ReactNode;
  calendarInfo?: DailyCalendarInfo;
  ariaLabel?: string;
}

export const DailyNatureBanner: React.FC<DailyNatureBannerProps> = ({
  title,
  description,
  roleMeta,
  actions,
  calendarInfo,
  ariaLabel
}) => {
  const internalCalendar = useDailyNatureClock();
  const { academicTermLabel, fullVietnameseDate, dailyScene } = calendarInfo || internalCalendar;
  const [bannerImgError, setBannerImgError] = useState(false);

  useEffect(() => {
    setBannerImgError(false);
  }, [dailyScene.id]);

  return (
    <section
      aria-label={ariaLabel}
      className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-lg bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900"
    >
      {!bannerImgError && (
        <img
          src={dailyScene.imageUrl}
          alt={dailyScene.alt}
          referrerPolicy="no-referrer"
          onError={() => setBannerImgError(true)}
          className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
        />
      )}

      {/* Measured contrast scrims so foreground text & controls meet WCAG AA over daylight or sunset nature scenes */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/60 to-slate-950/30"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/20"
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm font-medium text-emerald-100/95 tabular-nums">
            <span>{academicTermLabel}</span>
            <span aria-hidden="true" className="text-white/50">·</span>
            <span className="text-white font-semibold">{fullVietnameseDate}</span>
            {roleMeta && (
              <>
                <span aria-hidden="true" className="text-white/50">·</span>
                <span className="text-emerald-100/90">{roleMeta}</span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white [text-wrap:balance]">
            {title}
          </h1>

          <p className="text-sm text-slate-100/90 leading-relaxed max-w-xl">
            {description}
          </p>

          <p className="text-xs text-slate-200/80 pt-0.5">
            Khung cảnh thiên nhiên hôm nay: {dailyScene.title}
          </p>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
};
