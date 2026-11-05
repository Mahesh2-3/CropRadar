import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase/admin';
import { getServerSessionUser } from '@/lib/firebase/server-session';
import { StoredChatMessage } from '@/types/chat';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ cropId: string; conversationId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser || sessionUser.firebase?.sign_in_provider === 'anonymous') {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { cropId, conversationId } = await context.params;
  const conversationRef = getConversationRef(sessionUser.uid, cropId, conversationId);

  try {
    const conversation = await conversationRef.get();
    if (!conversation.exists) {
      return NextResponse.json({ error: 'Crop conversation not found.' }, { status: 404 });
    }
    const snapshot = await conversationRef.collection('messages').orderBy('timestamp', 'desc').limit(100).get();
    return NextResponse.json({ messages: snapshot.docs.reverse().map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (error) {
    console.error('Crop conversation message read failed:', getErrorCode(error));
    return NextResponse.json({ error: 'Unable to load crop conversation messages.' }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser || sessionUser.firebase?.sign_in_provider === 'anonymous') {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let message: StoredChatMessage;
  try {
    ({ message } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid message request.' }, { status: 400 });
  }
  if (
    !message ||
    (message.sender !== 'farmer' && message.sender !== 'assistant') ||
    typeof message.text !== 'string' ||
    message.text.length > 20000
  ) {
    return NextResponse.json({ error: 'Invalid crop conversation message.' }, { status: 400 });
  }

  const { cropId, conversationId } = await context.params;
  const conversationRef = getConversationRef(sessionUser.uid, cropId, conversationId);
  const messagesRef = conversationRef.collection('messages');
  const messageRef = message.id && /^[\w-]{1,120}$/.test(message.id)
    ? messagesRef.doc(message.id)
    : messagesRef.doc();
  const storedMessage = toStoredMessage(message, messageRef.id);
  const now = new Date().toISOString();

  try {
    const conversation = await conversationRef.get();
    if (!conversation.exists) {
      return NextResponse.json({ error: 'Crop conversation not found.' }, { status: 404 });
    }
    await getFirebaseAdminFirestore().runTransaction(async (transaction) => {
      transaction.set(messageRef, storedMessage);
      transaction.update(conversationRef, {
        lastMessage: storedMessage.text.slice(0, 240) || (storedMessage.imageUrl ? 'Image' : ''),
        updatedAt: now,
        messageCount: FieldValue.increment(1),
      });
      transaction.update(conversationRef.parent.parent!, { updatedAt: now });
    });
    return NextResponse.json({ success: true, message: storedMessage });
  } catch (error) {
    console.error('Crop conversation message save failed:', getErrorCode(error));
    return NextResponse.json({ error: 'Unable to save crop conversation message.' }, { status: 500 });
  }
}

function getConversationRef(uid: string, cropId: string, conversationId: string) {
  return getFirebaseAdminFirestore()
    .collection('users')
    .doc(uid)
    .collection('crops')
    .doc(cropId)
    .collection('conversations')
    .doc(conversationId);
}

function toStoredMessage(message: StoredChatMessage, id: string): StoredChatMessage {
  return {
    id,
    sender: message.sender,
    text: message.text,
    ...(message.textTe ? { textTe: message.textTe } : {}),
    ...(message.textEn ? { textEn: message.textEn } : {}),
    ...(message.spokenTextTe ? { spokenTextTe: message.spokenTextTe } : {}),
    ...(message.spokenTextEn ? { spokenTextEn: message.spokenTextEn } : {}),
    ...(message.imageUrl?.startsWith('https://res.cloudinary.com/') ? { imageUrl: message.imageUrl } : {}),
    ...(message.card ? { card: message.card } : {}),
    timestamp: message.timestamp || new Date().toISOString(),
  };
}

function getErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : 'unknown';
}