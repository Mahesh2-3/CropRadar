'use client';

import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import Header from '@/components/Header';
import ChatContainer, { ChatMessage } from '@/components/ChatContainer';
import MessageComposer from '@/components/MessageComposer';
import CameraCaptureModal from '@/components/CameraCaptureModal';
import LocationModal from '@/components/LocationModal';
import SettingsModal from '@/components/SettingsModal';
import HistoryDrawer from '@/components/HistoryDrawer';
import ConversationSidebar from '@/components/ConversationSidebar';
import NotificationCenter from '@/components/NotificationCenter';
import { useLanguage } from '@/context/LanguageContext';
import { LocationCoordinate, AlertRadiusKm } from '@/types/models';
import { ChatCropSummary, FarmerNotification, StoredChatMessage } from '@/types/chat';
import { BrowserWebSpeechProvider } from '@/lib/speech/provider';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import {
  createCropConversation,
  listCrops,
  loadConversationMessages,
  saveConversationMessage,
} from '@/lib/conversations';
import { UnifiedAssistantResponse } from '@/types/api';
import { auth, firebaseReady } from '@/lib/firebase/client';
import {
  ensureFarmerProfile,
  signInWithGoogle,
  saveFarmerLocation,
  signOutCurrentUser,
  toFarmLocation,
  getPreferredLanguage,
} from '@/lib/firebase/service';

const DEFAULT_FARM_LOCATION: LocationCoordinate = {
  latitude: 16.3067,
  longitude: 80.4365,
  district: 'Guntur',
  village: 'Rural Farm',
  displayNameEn: 'Guntur, Andhra Pradesh',
  displayNameTe: 'గుంటూరు, ఆంధ్రప్రదేశ్',
};

const CROP_CONVERSATION_OPTIONS = ['Chilli', 'Paddy', 'Cotton', 'Tomato', 'Groundnut'];

function normalizeCropId(cropName: string): string {
  return cropName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function HomePage() {
  const { language, setLanguage, t } = useLanguage();

  // Location State (Default: Guntur, Andhra Pradesh)
  const [farmLocation, setFarmLocation] = useState<LocationCoordinate>(DEFAULT_FARM_LOCATION);

  // Settings State
  const [alertRadiusKm, setAlertRadiusKm] = useState<AlertRadiusKm>(5);
  const [activeCrops, setActiveCrops] = useState<string[]>(['Chilli', 'Paddy']);

  // Modals Visibility
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isConversationSidebarOpen, setIsConversationSidebarOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [notifications, setNotifications] = useState<FarmerNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [activeCropId, setActiveCropId] = useState<string | null>(null);
  const [activeCropName, setActiveCropName] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [crops, setCrops] = useState<ChatCropSummary[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);

  // Composer States
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Chat conversation
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [cloudinaryUploadFailed, setCloudinaryUploadFailed] = useState(false);

  // Speech Provider reference
  const speechProviderRef = useRef<BrowserWebSpeechProvider | null>(null);

  const refreshConversations = async () => {
    setIsLoadingConversations(true);
    try {
      setCrops(await listCrops());
      setConversationError(null);
    } catch (error) {
      console.warn('Unable to load saved conversations:', error);
      setConversationError(
        language === 'te'
          ? 'సంభాషణలను లోడ్ చేయలేకపోయాం. సర్వర్ ఫైర్‌స్టోర్ అనుమతులను తనిఖీ చేయండి.'
          : 'Could not load conversations. Check server Firestore access.'
      );
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const refreshNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const response = await fetch('/api/notifications', { credentials: 'same-origin' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load notifications.');
      setNotifications(result.notifications || []);
      setUnreadNotificationCount(result.unreadCount || 0);
      setNotificationError(null);
    } catch (error) {
      console.warn('Unable to load farmer notifications:', error);
      setNotificationError(
        language === 'te' ? 'హెచ్చరికలను లోడ్ చేయలేకపోయాం.' : 'Unable to load notifications.'
      );
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    speechProviderRef.current = new BrowserWebSpeechProvider();

    let initialFarmLocation = DEFAULT_FARM_LOCATION;
    let hasSavedFarmLocation = false;
    const savedLoc = localStorage.getItem('crop_radar_farm_location');
    if (savedLoc) {
      try {
        initialFarmLocation = JSON.parse(savedLoc);
        hasSavedFarmLocation = true;
        setFarmLocation(initialFarmLocation);
      } catch (e) {}
    } else {
      setIsLocationModalOpen(true);
    }

    const savedRadius = localStorage.getItem('crop_radar_alert_radius');
    if (savedRadius) {
      setAlertRadiusKm(Number(savedRadius) as AlertRadiusKm);
    }

    if (!auth || !firebaseReady) {
      setIsAuthLoading(false);
      setAuthError('Firebase is not configured.');
      return;
    }

    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (!user) return;

      try {
        if (user.isAnonymous) return;
          const profile = await ensureFarmerProfile(
            user,
            hasSavedFarmLocation ? initialFarmLocation : undefined
          );
        if (!isMounted || !profile) return;

        const savedFarmLocation = toFarmLocation(profile);
        if (savedFarmLocation) {
          setFarmLocation(savedFarmLocation);
          localStorage.setItem('crop_radar_farm_location', JSON.stringify(savedFarmLocation));
        }

        const preferredLanguage = getPreferredLanguage(profile);
        if (preferredLanguage !== language) setLanguage(preferredLanguage);
        if (Array.isArray(profile.activeCrops) && profile.activeCrops.length) {
          setActiveCrops(profile.activeCrops);
        }
        if (profile.locationSetupComplete !== true) setIsLocationModalOpen(true);
        setAuthError(null);
        void refreshConversations();
        void refreshNotifications();
      } catch (error) {
        const syncError = error as { code?: string; operation?: string };
        console.error('Firebase farmer profile sync failed:', {
          code: syncError.code || 'unknown',
          operation: syncError.operation || 'profile',
        });
        if (isMounted) {
          setAuthError(`firestore:${syncError.operation || 'profile'}:${syncError.code || 'unknown'}`);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      speechProviderRef.current?.stopSpeaking();
      speechProviderRef.current?.stopListening();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setIsAuthBusy(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.warn('Google sign-in failed:', error);
      const code = (error as { code?: string })?.code;
      setAuthError(
        code === 'auth/unauthorized-domain'
          ? 'Add this site to Firebase Authentication authorized domains.'
          : code === 'auth/popup-blocked'
            ? 'Allow pop-ups for this site and try again.'
            : code === 'auth/operation-not-allowed'
              ? 'Enable Google sign-in in Firebase Authentication.'
              : 'Google sign-in failed. Check Firebase Authentication settings and try again.'
      );
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    setIsAuthBusy(true);
    setAuthError(null);
    try {
      await signOutCurrentUser();
    } catch (error) {
      console.warn('Firebase sign-out failed:', error);
      setAuthError('Sign out failed. Please try again.');
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleNewConversation = (cropName: string) => {
    setActiveCropName(cropName);
    setActiveCropId(normalizeCropId(cropName));
    setActiveConversationId(null);
    setMessages([]);
    setConversationError(null);
    setIsConversationSidebarOpen(false);
  };

  const handleSelectConversation = async (cropId: string, conversationId: string) => {
    setIsLoadingConversations(true);
    setConversationError(null);
    try {
      const selectedCrop = crops.find((crop) => crop.id === cropId);
      if (!selectedCrop) throw new Error('Crop conversation not found.');
      const savedMessages = await loadConversationMessages(cropId, conversationId);
      setMessages(savedMessages.map((message) => ({
        ...message,
        imageBase64: message.imageUrl,
      })));
      setActiveCropId(cropId);
      setActiveCropName(selectedCrop.name);
      setActiveConversationId(conversationId);
      setIsConversationSidebarOpen(false);
    } catch (error) {
      console.error('Unable to load conversation messages:', error);
      setConversationError(
        language === 'te'
          ? 'ఈ సంభాషణ సందేశాలను తెరవలేకపోయాం.'
          : 'Could not open this conversation.'
      );
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleSelectNotification = async (notification: FarmerNotification) => {
    if (!notification.read) {
      try {
        await fetch(`/api/notifications/${encodeURIComponent(notification.id)}`, {
          method: 'PATCH',
          credentials: 'same-origin',
        });
        setNotifications((previous) => previous.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item
        ));
        setUnreadNotificationCount((count) => Math.max(0, count - 1));
      } catch (error) {
        console.warn('Could not mark notification read:', error);
      }
    }
  };

  useEffect(() => {
    if (!currentUser || currentUser.isAnonymous) return;
    const intervalId = window.setInterval(() => void refreshNotifications(), 60_000);
    return () => window.clearInterval(intervalId);
  }, [currentUser?.uid]);

  const resolveConversationCrop = (message: string) => {
    if (activeCropName && activeCropId) {
      return { cropId: activeCropId, cropName: activeCropName };
    }

    const lowerMessage = message.toLowerCase();
    const cropAliases: Array<{ name: string; aliases: string[] }> = [
      { name: 'Paddy', aliases: ['paddy', 'rice', 'వరి'] },
      { name: 'Chilli', aliases: ['chilli', 'chili', 'మిరప'] },
      { name: 'Cotton', aliases: ['cotton', 'పత్తి'] },
      { name: 'Tomato', aliases: ['tomato', 'టమాటా', 'టమోటా'] },
      { name: 'Groundnut', aliases: ['groundnut', 'peanut', 'వేరుశనగ'] },
    ];
    const matchedCrop = cropAliases.find((crop) => crop.aliases.some((alias) => lowerMessage.includes(alias)));
    const cropName = matchedCrop?.name || activeCrops[0] || 'Paddy';
    return { cropId: normalizeCropId(cropName), cropName };
  };

  // When language changes, stop active speech and auto-translate any messages missing target language
  useEffect(() => {
    speechProviderRef.current?.stopSpeaking();
    setIsSpeaking(false);

    if (messages.length === 0) return;

    const missing = messages.filter((m) =>
      language === 'te' ? !m.textTe : !m.textEn
    );

    if (missing.length === 0) return;

    let isMounted = true;

    fetch('/api/translate-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: missing.map((m) => ({ id: m.id, text: m.text, sender: m.sender })),
        targetLanguage: language,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted || !data.translations || !Array.isArray(data.translations)) return;
        const map = new Map<string, { translatedText: string; spokenText?: string }>(
          data.translations.map((t: any) => [t.id, t])
        );

        setMessages((prev) =>
          prev.map((msg) => {
            const found = map.get(msg.id);
            if (!found) return msg;
            if (language === 'te') {
              return {
                ...msg,
                textTe: found.translatedText,
                spokenTextTe: found.spokenText || found.translatedText,
              };
            } else {
              return {
                ...msg,
                textEn: found.translatedText,
                spokenTextEn: found.spokenText || found.translatedText,
              };
            }
          })
        );
      })
      .catch((err) => console.warn('Auto-translate notice:', err));

    return () => {
      isMounted = false;
    };
  }, [language]);

  const handleSaveLocation = (newLoc: LocationCoordinate) => {
    setFarmLocation(newLoc);
    localStorage.setItem('crop_radar_farm_location', JSON.stringify(newLoc));
    if (currentUser && !currentUser.isAnonymous) {
      saveFarmerLocation(currentUser, newLoc).catch((error) => {
        console.warn('Failed to save farm location to Firestore:', error);
        setAuthError('Farm location could not be saved to Firestore. Check Firestore rules.');
      });
    }
  };

  const handleChangeRadius = (radius: AlertRadiusKm) => {
    setAlertRadiusKm(radius);
    localStorage.setItem('crop_radar_alert_radius', String(radius));
  };

  const handleSpeakText = (text: string) => {
    if (!speechProviderRef.current) return;
    setIsSpeaking(true);
    speechProviderRef.current.speak(text, language, () => {
      setIsSpeaking(false);
    });
  };

  const handleSpeakMessage = (msg: ChatMessage) => {
    if (!speechProviderRef.current) return;
    const textToSpeak =
      language === 'te'
        ? msg.spokenTextTe || msg.textTe || msg.text
        : msg.spokenTextEn || msg.textEn || msg.text;

    setIsSpeaking(true);
    speechProviderRef.current.speak(textToSpeak, language, () => {
      setIsSpeaking(false);
    });
  };

  const handleStopSpeaking = () => {
    speechProviderRef.current?.stopSpeaking();
    setIsSpeaking(false);
  };

  const handleSendMessage = async (
    text: string,
    imageBase64?: string,
    queryTe?: string,
    queryEn?: string
  ) => {
    const userMsgId = `msg-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'farmer',
      text,
      textTe: queryTe || (language === 'te' ? text : undefined),
      textEn: queryEn || (language === 'en' ? text : undefined),
      spokenTextTe: queryTe || (language === 'te' ? text : undefined),
      spokenTextEn: queryEn || (language === 'en' ? text : undefined),
      imageBase64,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setAttachedImage(null);
    setIsLoading(true);
    setCloudinaryUploadFailed(false);

    try {
      const selectedCrop = resolveConversationCrop(text);
      if (!activeConversationId) {
        setActiveCropId(selectedCrop.cropId);
        setActiveCropName(selectedCrop.cropName);
      }

      let uploadedImageUrl: string | undefined;
      if (imageBase64?.startsWith('data:')) {
        try {
          const secureUrl = await uploadImageToCloudinary(imageBase64);
          uploadedImageUrl = secureUrl;
          setMessages((previous) =>
            previous.map((message) =>
              message.id === userMsgId ? { ...message, imageBase64: secureUrl } : message
            )
          );
        } catch (uploadError) {
          console.warn('Cloudinary upload unavailable; continuing image analysis:', uploadError);
          setCloudinaryUploadFailed(true);
        }
      }

      let conversationId = activeConversationId;
      let conversationCropId = activeCropId || selectedCrop.cropId;
      if (!conversationId) {
        try {
          const conversation = await createCropConversation(
            selectedCrop.cropName,
            text.slice(0, 80)
          );
          conversationId = conversation.id;
          conversationCropId = conversation.cropId;
          setActiveCropId(conversation.cropId);
          setActiveCropName(conversation.cropName);
          setActiveConversationId(conversation.id);
          void refreshConversations();
        } catch (error) {
          console.warn('Unable to create saved conversation:', error);
        }
      }

      if (conversationId && conversationCropId) {
        const storedUserMessage: StoredChatMessage = {
          id: userMsg.id,
          sender: 'farmer',
          text: userMsg.text,
          textTe: userMsg.textTe,
          textEn: userMsg.textEn,
          spokenTextTe: userMsg.spokenTextTe,
          spokenTextEn: userMsg.spokenTextEn,
          ...(uploadedImageUrl ? { imageUrl: uploadedImageUrl } : {}),
          timestamp: userMsg.timestamp,
        };
        try {
          await saveConversationMessage(conversationCropId, conversationId, storedUserMessage);
        } catch (error) {
          console.warn('Unable to save farmer message:', error);
          setConversationError(
            language === 'te'
              ? 'సందేశాన్ని భద్రపరచలేకపోయాం. సర్వర్ ఫైర్‌స్టోర్ అనుమతులను తనిఖీ చేయండి.'
              : 'Message could not be saved. Check server Firestore access.'
          );
        }
      }

      const res = await fetch('/api/unified-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          imageBase64,
          language,
          cropName: selectedCrop.cropName,
          farmLocation: {
            latitude: farmLocation.latitude,
            longitude: farmLocation.longitude,
            displayNameEn: farmLocation.displayNameEn,
            displayNameTe: farmLocation.displayNameTe,
            district: farmLocation.district,
            village: farmLocation.village,
          },
          historyContext: [...messages, userMsg].slice(-12).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      if (!res.ok) throw new Error('Assistant failed to reply');
      const data: UnifiedAssistantResponse = await res.json();

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: data.textResponse,
        textTe: data.textResponseTe || (language === 'te' ? data.textResponse : undefined),
        textEn: data.textResponseEn || (language === 'en' ? data.textResponse : undefined),
        spokenTextTe: data.spokenTextTe || (language === 'te' ? data.spokenText : undefined),
        spokenTextEn: data.spokenTextEn || (language === 'en' ? data.spokenText : undefined),
        card: data.card,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (conversationId && conversationCropId) {
        try {
          await saveConversationMessage(conversationCropId, conversationId, assistantMsg);
          await refreshConversations();
        } catch (error) {
          console.warn('Unable to save assistant message:', error);
        }
      }

      // Automatically speak spokenText via TTS in current language
      const audioText =
        language === 'te'
          ? assistantMsg.spokenTextTe || assistantMsg.textTe || data.spokenText
          : assistantMsg.spokenTextEn || assistantMsg.textEn || data.spokenText;

      handleSpeakText(audioText);
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text:
          language === 'te'
            ? 'క్షమించండి, మీ అభ్యర్థనను విశ్లేషించడంలో సమస్య ఎదురైంది. దయచేసి మళ్లీ ప్రయత్నించండి.'
            : 'Sorry, there was an issue processing your query. Please try again.',
        textTe: 'క్షమించండి, మీ అభ్యర్థనను విశ్లేషించడంలో సమస్య ఎదురైంది. దయచేసి మళ్లీ ప్రయత్నించండి.',
        textEn: 'Sorry, there was an issue processing your query. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      {/* 1. Ultra-Clean Header */}
      <Header
        location={farmLocation}
        user={currentUser}
        isAuthLoading={isAuthLoading}
        isAuthBusy={isAuthBusy}
        authError={authError}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        onOpenConversations={() => {
          setIsConversationSidebarOpen(true);
          void refreshConversations();
        }}
        notificationCount={unreadNotificationCount}
        onOpenNotifications={() => {
          setIsNotificationCenterOpen(true);
          void refreshNotifications();
        }}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenHistoryDrawer={() => setIsHistoryDrawerOpen(true)}
      />

      {/* 2. Conversational Main Feed */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          onSpeakMessage={handleSpeakMessage}
          onSelectQuickQuery={(q, qTe, qEn) => handleSendMessage(q, undefined, qTe, qEn)}
        />
      </main>

      {/* 3. Unified Bottom Message Composer */}
      <MessageComposer
        onSendMessage={handleSendMessage}
        onOpenCamera={() => setIsCameraOpen(true)}
        isLoading={isLoading}
        isSpeaking={isSpeaking}
        onStopSpeaking={handleStopSpeaking}
        attachedImage={attachedImage}
        onRemoveAttachedImage={() => setAttachedImage(null)}
        onAttachImage={(base64) => setAttachedImage(base64)}
        imageUploadFailed={cloudinaryUploadFailed}
      />

      {/* 4. Modals & Drawers */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(base64) => setAttachedImage(base64)}
      />

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={farmLocation}
        onSaveLocation={handleSaveLocation}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        alertRadiusKm={alertRadiusKm}
        onChangeRadius={handleChangeRadius}
        activeCrops={activeCrops}
        onChangeCrops={setActiveCrops}
      />

      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        onSelectRecordQuestion={(q) => handleSendMessage(q)}
      />

      <ConversationSidebar
        isOpen={isConversationSidebarOpen}
        isLoading={isLoadingConversations}
        activeConversationId={activeConversationId}
        activeCropId={activeCropId}
        crops={crops}
        availableCrops={CROP_CONVERSATION_OPTIONS}
        error={conversationError}
        onClose={() => setIsConversationSidebarOpen(false)}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
      />

      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        isLoading={isLoadingNotifications}
        notifications={notifications}
        error={notificationError}
        onClose={() => setIsNotificationCenterOpen(false)}
        onSelect={handleSelectNotification}
      />
    </div>
  );
}
