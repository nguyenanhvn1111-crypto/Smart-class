import React, { createContext, useContext, useEffect, useState } from 'react';
import { store } from '../services/dataService';

export type ThemeMode = 'light' | 'dark';
export type DisplayDensity = 'comfortable' | 'compact';

export interface DisplaySettings {
  themeMode: ThemeMode;
  density: DisplayDensity;
  reduceMotion: boolean;
}

export interface SystemSettings {
  schoolName: string;
  academicYear: string;
  semester: '1' | '2';
  timezone: string;
  autoSaveDrafts: boolean;
  absenceAlertThreshold: number;
  assignmentReminderHours: 'off' | '24' | '48';
  allowLateSubmissionDefault: boolean;
  soundNotifications: boolean;
}

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  displaySettings: DisplaySettings;
  updateDisplaySettings: (patch: Partial<DisplaySettings>) => void;
  systemSettings: SystemSettings;
  updateSystemSettings: (patch: Partial<SystemSettings>) => void;
  resetSystemSettings: () => void;
}

const DISPLAY_STORAGE_KEY = 'smartclass_display_settings';
const SYSTEM_STORAGE_KEY = 'smartclass_system_settings';

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  themeMode: 'light',
  density: 'comfortable',
  reduceMotion: false
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  schoolName: 'Trường THPT Chuyên Khoa Học Thực Nghiệm',
  academicYear: '2026 - 2027',
  semester: '1',
  timezone: 'Asia/Ho_Chi_Minh',
  autoSaveDrafts: true,
  absenceAlertThreshold: 3,
  assignmentReminderHours: '24',
  allowLateSubmissionDefault: true,
  soundNotifications: true
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const applyHtmlDisplayClasses = (settings: DisplaySettings) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', settings.themeMode === 'dark');
  root.classList.toggle('reduce-motion', settings.reduceMotion);
  root.dataset.theme = settings.themeMode;
  root.dataset.density = settings.density;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(() => {
    try {
      const saved = localStorage.getItem(DISPLAY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged: DisplaySettings = {
          themeMode: parsed.themeMode === 'dark' ? 'dark' : 'light',
          density: parsed.density === 'compact' ? 'compact' : 'comfortable',
          reduceMotion: Boolean(parsed.reduceMotion)
        };
        applyHtmlDisplayClasses(merged);
        return merged;
      }
    } catch {}
    applyHtmlDisplayClasses(DEFAULT_DISPLAY_SETTINGS);
    return DEFAULT_DISPLAY_SETTINGS;
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem(SYSTEM_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SYSTEM_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_SYSTEM_SETTINGS;
  });

  useEffect(() => {
    applyHtmlDisplayClasses(displaySettings);
    try {
      localStorage.setItem(DISPLAY_STORAGE_KEY, JSON.stringify(displaySettings));
    } catch {}
  }, [displaySettings]);

  useEffect(() => {
    try {
      localStorage.setItem(SYSTEM_STORAGE_KEY, JSON.stringify(systemSettings));
    } catch {}
  }, [systemSettings]);

  const setThemeMode = (mode: ThemeMode) => {
    setDisplaySettings((prev) => ({ ...prev, themeMode: mode }));
  };

  const toggleThemeMode = () => {
    setDisplaySettings((prev) => ({
      ...prev,
      themeMode: prev.themeMode === 'dark' ? 'light' : 'dark'
    }));
  };

  const updateDisplaySettings = (patch: Partial<DisplaySettings>) => {
    setDisplaySettings((prev) => ({ ...prev, ...patch }));
  };

  const updateSystemSettings = (patch: Partial<SystemSettings>) => {
    setSystemSettings((prev) => ({ ...prev, ...patch }));
    store.logAudit(
      'UPDATE_SYSTEM_SETTINGS',
      'settings',
      'system',
      'Cập nhật cấu hình hệ thống SmartClass',
      'System',
      'teacher'
    );
  };

  const resetSystemSettings = () => {
    setSystemSettings(DEFAULT_SYSTEM_SETTINGS);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode: displaySettings.themeMode,
        setThemeMode,
        toggleThemeMode,
        displaySettings,
        updateDisplaySettings,
        systemSettings,
        updateSystemSettings,
        resetSystemSettings
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
