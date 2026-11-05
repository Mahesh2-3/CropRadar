'use client';

import React from 'react';
import { User } from 'firebase/auth';
import { useLanguage } from '@/context/LanguageContext';
import { LocationCoordinate } from '@/types/models';
import {
  Radio,
  MapPin,
  Globe,
  Settings,
  History,
  Sparkles,
  LogIn,
  LogOut,
  LoaderCircle,
  MessageSquareText,
  Bell,
} from 'lucide-react';

interface HeaderProps {
  location: LocationCoordinate;
  user: User | null;
  isAuthLoading: boolean;
  isAuthBusy: boolean;
  authError: string | null;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  onOpenLocationModal: () => void;
  onOpenConversations: () => void;
  notificationCount: number;
  onOpenNotifications: () => void;
  onOpenSettingsModal: () => void;
  onOpenHistoryDrawer: () => void;
}

export default function Header({
  location,
  user,
  isAuthLoading,
  isAuthBusy,
  authError,
  onGoogleSignIn,
  onSignOut,
  onOpenLocationModal,
  onOpenConversations,
  notificationCount,
  onOpenNotifications,
  onOpenSettingsModal,
  onOpenHistoryDrawer,
}: HeaderProps) {
  const { language, toggleLanguage, t } = useLanguage();
  const firestoreError = authError?.match(/^firestore:(read|write|profile):(.+)$/);
  const localizedAuthError = firestoreError
    ? language === 'te'
      ? firestoreError[2] === 'permission-denied'
        ? `ఫైర్‌స్టోర్ ${firestoreError[1] === 'write' ? 'వ్రాయడానికి' : 'చదవడానికి'} అనుమతి నిరాకరించింది. లోపం: ${firestoreError[2]}`
        : `ఫైర్‌స్టోర్ ప్రొఫైల్ ${firestoreError[1] === 'write' ? 'సేవ్' : 'లోడ్'} కాలేదు. లోపం: ${firestoreError[2]}`
      : `Firestore profile ${firestoreError[1]} failed (${firestoreError[2]}).`
    : authError;

  return (
    <header className="sticky top-0 z-30 bg-emerald-950/95 backdrop-blur-md border-b border-emerald-800 text-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-lime-400 flex items-center justify-center text-emerald-950 font-black shadow-md">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
              {language === 'te' ? 'క్రాప్ రాడార్' : 'CROP RADAR'}
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-lime-400 text-emerald-950">
                AP
              </span>
            </h1>
            <span className="text-[10px] text-emerald-300 font-medium block mt-0.5">
              {language === 'te' ? 'రైతు నేస్తం AI' : 'Farming Companion'}
            </span>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center space-x-2">
          {user && !user.isAnonymous ? (
            <>
              <span className="hidden lg:block max-w-[110px] truncate text-[11px] font-medium text-emerald-100" title={user.email || undefined}>
                {user.displayName || user.email}
              </span>
              <button
                onClick={onSignOut}
                disabled={isAuthBusy}
                className="p-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-200 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                title={language === 'te' ? 'సైన్ అవుట్' : 'Sign out'}
                aria-label={language === 'te' ? 'సైన్ అవుట్' : 'Sign out'}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onGoogleSignIn}
              disabled={isAuthLoading || isAuthBusy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold transition-colors disabled:opacity-60 cursor-pointer"
              title={language === 'te' ? 'Googleతో సైన్ ఇన్ చేయండి' : 'Sign in with Google'}
              aria-label={language === 'te' ? 'Googleతో సైన్ ఇన్ చేయండి' : 'Sign in with Google'}
            >
              {isAuthLoading || isAuthBusy ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {language === 'te' ? 'సైన్ ఇన్' : 'Google'}
              </span>
            </button>
          )}

          {/* Location Button */}
          <button
            onClick={onOpenLocationModal}
            className="flex items-center gap-1 bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/60 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
            title={t('header.changeLocation')}
          >
            <MapPin className="w-3.5 h-3.5 text-lime-400 shrink-0" />
            <span className="max-w-[110px] sm:max-w-[140px] truncate">
              {language === 'te' ? location.displayNameTe : location.displayNameEn}
            </span>
          </button>

          {/* History Button */}
          <button
            onClick={onOpenConversations}
            className="p-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-200 hover:text-white transition-colors cursor-pointer"
            title={language === 'te' ? 'సంభాషణలు' : 'Conversations'}
            aria-label={language === 'te' ? 'సంభాషణలు' : 'Conversations'}
          >
            <MessageSquareText className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-200 hover:text-white transition-colors cursor-pointer"
            title={language === 'te' ? 'సమీప పంట హెచ్చరికలు' : 'Nearby crop alerts'}
            aria-label={language === 'te' ? 'సమీప పంట హెచ్చరికలు' : 'Nearby crop alerts'}
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-4 h-4 rounded-full bg-red-500 px-1 text-[9px] font-bold leading-4 text-white">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenHistoryDrawer}
            className="p-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-200 hover:text-white transition-colors cursor-pointer"
            title={t('header.historyTooltip')}
          >
            <History className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettingsModal}
            className="p-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-200 hover:text-white transition-colors cursor-pointer"
            title={t('header.settingsTooltip')}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 bg-lime-400 hover:bg-lime-300 text-emerald-950 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Switch Language / భాషను మార్చండి"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'te' ? 'English' : 'తెలుగు'}</span>
          </button>
        </div>
      </div>
      {localizedAuthError && (
        <p role="alert" className="max-w-4xl mx-auto px-4 pb-2 text-right text-[11px] text-amber-200">
          {localizedAuthError}
        </p>
      )}
    </header>
  );
}
