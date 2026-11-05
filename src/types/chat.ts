import { ContextualCardType } from './api';

export interface ChatConversationSummary {
  id: string;
  cropId: string;
  cropName: string;
  title: string;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface StoredChatMessage {
  id: string;
  sender: 'farmer' | 'assistant';
  text: string;
  textTe?: string;
  textEn?: string;
  spokenTextTe?: string;
  spokenTextEn?: string;
  imageUrl?: string;
  card?: {
    type: ContextualCardType;
    data: unknown;
  };
  timestamp: string;
}

export interface FarmerNotification {
  id: string;
  type: 'verified-outbreak' | 'ai-diagnosis-outbreak' | 'farmer-reported-outbreak';
  reportId: string;
  titleEn: string;
  titleTe: string;
  messageEn: string;
  messageTe: string;
  crop: string;
  cropTe: string;
  diseaseName: string;
  diseaseNameTe: string;
  severity: 'low' | 'moderate' | 'severe';
  distanceKm: number;
  recommendedActionEn: string;
  recommendedActionTe: string;
  createdAt: string;
  read: boolean;
}

export interface ChatCropSummary {
  id: string;
  name: string;
  conversations: ChatConversationSummary[];
}