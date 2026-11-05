'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  CloudSun,
  FlaskConical,
  Radio,
  History,
  Languages,
  Menu,
  X,
  Sparkles,
  MapPin,
  Mic,
  Bell,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { FarmerNotification } from '@/types/chat';
import NotificationCenter from '@/components/NotificationCenter';

export default function Navbar({ onOpenVoiceAssistant }: { onOpenVoiceAssistant?: () => void }) {
  const pathname = usePathname();
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<FarmerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  const refreshNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const response = await fetch('/api/notifications', { credentials: 'same-origin' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load notifications.');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setNotificationError(null);
    } catch (error) {
      console.warn('Unable to load notifications:', error);
      setNotificationError(language === 'te' ? 'హెచ్చరికలను లోడ్ చేయలేకపోయాం.' : 'Unable to load notifications.');
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    void refreshNotifications();
    const intervalId = window.setInterval(() => void refreshNotifications(), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleNotificationSelect = async (notification: FarmerNotification) => {
    if (notification.read) return;
    try {
      await fetch(`/api/notifications/${encodeURIComponent(notification.id)}`, {
        method: 'PATCH',
        credentials: 'same-origin',
      });
      setNotifications((previous) => previous.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item
      ));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      console.warn('Could not mark notification read:', error);
    }
  };

  const navItems = [
    {
      href: '/',
      labelEn: 'Dashboard',
      labelTe: 'డాష్‌బోర్డ్',
      icon: Sparkles,
    },
    {
      href: '/diagnosis',
      labelEn: 'Disease AI',
      labelTe: 'తెగుళ్ల గుర్తింపు',
      icon: ShieldAlert,
    },
    {
      href: '/weather',
      labelEn: 'Spray Weather',
      labelTe: 'పిచికారీ వాతావరణం',
      icon: CloudSun,
    },
    {
      href: '/treatment',
      labelEn: 'Treatment Engine',
      labelTe: 'మందుల మోతాదు',
      icon: FlaskConical,
    },
    {
      href: '/radar',
      labelEn: '5km Radar',
      labelTe: '5 కి.మీ రాడార్',
      icon: Radio,
    },
    {
      href: '/history',
      labelEn: 'Health Timeline',
      labelTe: 'పంట చరిత్ర',
      icon: History,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-emerald-950/95 backdrop-blur-md border-b border-emerald-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-lime-400 flex items-center justify-center text-emerald-950 font-black shadow-md group-hover:scale-105 transition-transform">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  CROP RADAR
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-lime-400 text-emerald-950">
                    Pro
                  </span>
                </span>
                <span className="text-xs text-emerald-300 block font-medium">
                  {language === 'te' ? 'రైతు రక్షణ & నిర్ణయ వేదిక' : 'Decision-Support & Warning'}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-inner font-semibold'
                      : 'text-emerald-100 hover:bg-emerald-900/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 text-emerald-300" />
                  <span>{language === 'te' ? item.labelTe : item.labelEn}</span>
                </Link>
              );
            })}
          </nav>

          {/* Action Tools */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Location Badge */}
            <div className="hidden sm:flex items-center gap-1 text-xs bg-emerald-900/80 text-emerald-200 px-2.5 py-1.5 rounded-full border border-emerald-700/50">
              <MapPin className="w-3.5 h-3.5 text-lime-400" />
              <span>Guntur, AP</span>
            </div>

            {/* Floating Voice Assistant Trigger */}
            {onOpenVoiceAssistant && (
              <button
                onClick={onOpenVoiceAssistant}
                className="flex items-center gap-1.5 bg-gradient-to-r from-lime-500 to-emerald-400 text-emerald-950 px-3 py-1.5 rounded-full font-semibold text-xs shadow-md hover:brightness-110 transition-all cursor-pointer"
                title="Open Telugu Voice Assistant"
              >
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {language === 'te' ? 'మాట్లాడండి' : 'Voice Asst'}
                </span>
              </button>
            )}

            {/* Language Switcher */}
            <button
              onClick={() => {
                setNotificationsOpen(true);
                void refreshNotifications();
              }}
              className="relative p-2 rounded-lg bg-emerald-900 hover:bg-emerald-800 border border-emerald-700 text-emerald-100 cursor-pointer"
              title={language === 'te' ? 'సమీప పంట హెచ్చరికలు' : 'Nearby crop alerts'}
              aria-label={language === 'te' ? 'సమీప పంట హెచ్చరికలు' : 'Nearby crop alerts'}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-4 h-4 rounded-full bg-red-500 px-1 text-[9px] font-bold leading-4 text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 bg-emerald-900 hover:bg-emerald-800 border border-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Toggle Telugu / English"
            >
              <Languages className="w-3.5 h-3.5 text-lime-400" />
              <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-emerald-200 hover:text-white hover:bg-emerald-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-emerald-950 border-b border-emerald-800 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive ? 'bg-emerald-800 text-white font-bold' : 'text-emerald-100 hover:bg-emerald-900'
                }`}
              >
                <Icon className="w-5 h-5 text-lime-400" />
                <span>{language === 'te' ? item.labelTe : item.labelEn}</span>
              </Link>
            );
          })}
        </div>
      )}

      <NotificationCenter
        isOpen={notificationsOpen}
        isLoading={notificationsLoading}
        notifications={notifications}
        error={notificationError}
        onClose={() => setNotificationsOpen(false)}
        onSelect={(notification) => void handleNotificationSelect(notification)}
      />
    </header>
  );
}
