'use client';

import { useMemo, useState } from 'react';
import { MessageSquareText, Plus, Search, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { ChatCropSummary } from '@/types/chat';

interface ConversationSidebarProps {
  isOpen: boolean;
  isLoading: boolean;
  activeConversationId: string | null;
  activeCropId: string | null;
  crops: ChatCropSummary[];
  availableCrops: string[];
  error: string | null;
  onClose: () => void;
  onNewConversation: (cropName: string) => void;
  onSelectConversation: (cropId: string, conversationId: string) => void;
}

export default function ConversationSidebar({
  isOpen,
  isLoading,
  activeConversationId,
  activeCropId,
  crops,
  availableCrops,
  error,
  onClose,
  onNewConversation,
  onSelectConversation,
}: ConversationSidebarProps) {
  const { language } = useLanguage();
  const [search, setSearch] = useState('');
  const [isChoosingCrop, setIsChoosingCrop] = useState(false);
  const isTelugu = language === 'te';
  const filteredCrops = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return crops;
    return crops
      .map((crop) => ({
        ...crop,
        conversations: crop.conversations.filter((conversation) =>
          `${crop.name} ${conversation.title} ${conversation.lastMessage}`
            .toLocaleLowerCase()
            .includes(term)
        ),
      }))
      .filter((crop) => crop.conversations.length > 0);
  }, [crops, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <aside
        aria-label={isTelugu ? 'సంభాషణలు' : 'Conversations'}
        className="flex h-full w-[min(360px,88vw)] flex-col border-r border-stone-200 bg-stone-50 shadow-2xl dark:border-stone-800 dark:bg-stone-950"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-stone-200 px-4 py-4 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-900 text-lime-300">
                <MessageSquareText className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-white">
                  {isTelugu ? 'పంట సంభాషణలు' : 'Crop conversations'}
                </h2>
                <p className="text-[11px] text-stone-500">
                  {isTelugu ? 'ప్రతి సంభాషణ ఒకే పంటకు' : 'One crop per conversation'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800"
              aria-label={isTelugu ? 'మూసివేయండి' : 'Close'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setIsChoosingCrop((open) => !open)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-800"
          >
            <Plus className="h-4 w-4" />
            {isTelugu ? 'కొత్త పంట సంభాషణ' : 'New crop conversation'}
          </button>

          {isChoosingCrop && (
            <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg border border-stone-200 bg-white p-2 dark:border-stone-700 dark:bg-stone-900">
              {availableCrops.map((cropName) => (
                <button
                  key={cropName}
                  onClick={() => {
                    onNewConversation(cropName);
                    setIsChoosingCrop(false);
                  }}
                  className="rounded-md px-2 py-2 text-left text-xs font-semibold text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 dark:text-stone-200 dark:hover:bg-emerald-950"
                >
                  {localizeCropName(cropName, isTelugu)}
                </button>
              ))}
            </div>
          )}

          <label className="mt-3 flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 dark:border-stone-700 dark:bg-stone-900">
            <Search className="h-3.5 w-3.5 shrink-0 text-stone-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={isTelugu ? 'సంభాషణలను వెతకండి' : 'Search conversations'}
              className="h-9 min-w-0 flex-1 bg-transparent text-xs text-stone-800 outline-none placeholder:text-stone-400 dark:text-stone-100"
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mx-3 mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            {error}
          </p>
        )}

        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {isLoading ? (
            <p className="px-3 py-8 text-center text-xs text-stone-500">
              {isTelugu ? 'లోడ్ అవుతోంది...' : 'Loading conversations...'}
            </p>
          ) : filteredCrops.length ? (
            filteredCrops.map((crop) => (
              <section key={crop.id} className="pt-2">
                <h3 className="px-3 pb-1 text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
                  {localizeCropName(crop.name, isTelugu)}
                </h3>
                {crop.conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => onSelectConversation(crop.id, conversation.id)}
                    className={`mb-1 w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                      activeCropId === crop.id && activeConversationId === conversation.id
                        ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40'
                        : 'border-transparent hover:border-stone-200 hover:bg-white dark:hover:border-stone-800 dark:hover:bg-stone-900'
                    }`}
                  >
                    <span className="block truncate text-xs font-semibold text-stone-800 dark:text-stone-100">
                      {conversation.title}
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-stone-500">
                      {conversation.lastMessage || (isTelugu ? 'ఇంకా సందేశాలు లేవు' : 'No messages yet')}
                    </span>
                    <span className="mt-2 block text-[10px] text-stone-400">
                      {new Date(conversation.updatedAt).toLocaleString(isTelugu ? 'te-IN' : 'en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </button>
                ))}
              </section>
            ))
          ) : (
            <p className="px-5 py-12 text-center text-xs leading-5 text-stone-500">
              {isTelugu ? 'ఇంకా పంట సంభాషణలు లేవు. కొత్తది ప్రారంభించండి.' : 'No crop conversations yet. Start one for a crop.'}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function localizeCropName(cropName: string, isTelugu: boolean): string {
  if (!isTelugu) return cropName;
  const labels: Record<string, string> = {
    Chilli: 'మిరప',
    Paddy: 'వరి',
    Rice: 'వరి',
    Cotton: 'పత్తి',
    Tomato: 'టమాటా',
    Groundnut: 'వేరుశనగ',
  };
  return labels[cropName] || cropName;
}