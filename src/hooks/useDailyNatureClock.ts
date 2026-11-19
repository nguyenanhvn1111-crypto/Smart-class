import { useEffect, useMemo, useState } from 'react';
import natureRiverDawn from '../assets/images/nature_river_dawn_1794650285621.jpg';
import natureMountainValley from '../assets/images/nature_mountain_valley_1794650286648.jpg';
import natureMistyLake from '../assets/images/nature_misty_lake_1794650286812.jpg';
import natureWaterfallCanyon from '../assets/images/nature_waterfall_canyon_1794650287271.jpg';
import natureRiverSunset from '../assets/images/nature_river_sunset_1794650287885.jpg';
import natureHighlandStream from '../assets/images/nature_highland_stream_1794650288798.jpg';
import natureCloudPeaks from '../assets/images/nature_cloud_peaks_1794650288602.jpg';

export interface NatureScene {
  id: string;
  title: string;
  imageUrl: string;
  alt: string;
}

export const DAILY_NATURE_SCENES: NatureScene[] = [
  {
    id: 'river-dawn',
    title: 'Sông núi Tràng An buổi sớm',
    imageUrl: natureRiverDawn,
    alt: 'Cảnh sắc thiên nhiên núi đá vôi và dòng sông xanh buổi bình minh'
  },
  {
    id: 'mountain-valley',
    title: 'Thung lũng sông xanh & đỉnh núi tuyết',
    imageUrl: natureMountainValley,
    alt: 'Dòng sông xanh uốn lượn qua thung lũng rừng thông và dãy núi cao'
  },
  {
    id: 'misty-lake',
    title: 'Mặt hồ núi sương sớm',
    imageUrl: natureMistyLake,
    alt: 'Dãy núi phủ sương phản chiếu trên mặt hồ và dòng sông yên bình'
  },
  {
    id: 'waterfall-canyon',
    title: 'Thác nước & dòng suối đại ngàn',
    imageUrl: natureWaterfallCanyon,
    alt: 'Thác nước đổ xuống dòng sông ngọc bích giữa hẻm núi rừng xanh'
  },
  {
    id: 'river-sunset',
    title: 'Hoàng hôn trên sông núi',
    imageUrl: natureRiverSunset,
    alt: 'Dòng sông uốn quanh triền núi rừng dưới ánh hoàng hôn ấm áp'
  },
  {
    id: 'highland-stream',
    title: 'Suối nguồn vùng cao nguyên',
    imageUrl: natureHighlandStream,
    alt: 'Dòng suối trong vắt chảy qua sườn đồi bậc thang và dãy núi mờ sương'
  },
  {
    id: 'cloud-peaks',
    title: 'Biển mây & thung lũng sông núi',
    imageUrl: natureCloudPeaks,
    alt: 'Biển mây bồng bềnh trên dãy núi cao và dòng sông lấp lánh ánh nắng sớm'
  }
];

const VIETNAMESE_WEEKDAYS = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy'
] as const;

export interface DailyCalendarInfo {
  now: Date;
  day: number;
  month: number;
  year: number;
  paddedDay: string;
  paddedMonth: string;
  weekdayName: string;
  fullVietnameseDate: string;
  compactDate: string;
  academicTermLabel: string;
  dailyScene: NatureScene;
}

export function computeDailyCalendarInfo(date: Date): DailyCalendarInfo {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const paddedDay = String(day).padStart(2, '0');
  const paddedMonth = String(month).padStart(2, '0');
  const weekdayName = VIETNAMESE_WEEKDAYS[date.getDay()];

  const fullVietnameseDate = `${weekdayName}, ngày ${paddedDay} tháng ${paddedMonth} năm ${year}`;
  const compactDate = `${paddedDay}/${paddedMonth}/${year}`;

  let academicTermLabel: string;
  if (month >= 9) {
    academicTermLabel = `Học kỳ 1 · Năm học ${year} - ${year + 1}`;
  } else if (month <= 5) {
    academicTermLabel = `Học kỳ 2 · Năm học ${year - 1} - ${year}`;
  } else {
    academicTermLabel = `Học kỳ Hè · Năm học ${year - 1} - ${year}`;
  }

  // Deterministic day number in UTC calendar days so image updates strictly once every day
  const utcDayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
  const sceneIndex =
    ((utcDayNumber % DAILY_NATURE_SCENES.length) + DAILY_NATURE_SCENES.length) %
    DAILY_NATURE_SCENES.length;

  return {
    now: date,
    day,
    month,
    year,
    paddedDay,
    paddedMonth,
    weekdayName,
    fullVietnameseDate,
    compactDate,
    academicTermLabel,
    dailyScene: DAILY_NATURE_SCENES[sceneIndex]
  };
}

export function useDailyNatureClock(): DailyCalendarInfo {
  const [dateKey, setDateKey] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  });
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout> | null = null;

    const syncClock = () => {
      const current = new Date();
      const currentKey = `${current.getFullYear()}-${current.getMonth() + 1}-${current.getDate()}`;
      setNow(current);
      setDateKey((prev) => (prev === currentKey ? prev : currentKey));
    };

    const scheduleMidnightRollover = () => {
      if (midnightTimer) clearTimeout(midnightTimer);
      const current = new Date();
      const nextMidnight = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate() + 1,
        0,
        0,
        1
      );
      const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - current.getTime());
      // setTimeout max safe 32-bit delay is ~24.8 days, cap safely at 1 hour and re-arm
      const delay = Math.min(msUntilMidnight, 3_600_000);
      midnightTimer = setTimeout(() => {
        syncClock();
        scheduleMidnightRollover();
      }, delay);
    };

    scheduleMidnightRollover();
    const intervalId = setInterval(syncClock, 30_000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncClock();
        scheduleMidnightRollover();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (midnightTimer) clearTimeout(midnightTimer);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return useMemo(() => computeDailyCalendarInfo(now), [dateKey, now]);
}
