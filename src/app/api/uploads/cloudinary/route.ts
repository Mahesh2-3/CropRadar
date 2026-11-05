import { createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getFirebaseAdminAuth } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

const SESSION_COOKIE = 'crop-radar-session';
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary server credentials are not configured.' }, { status: 503 });
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(cloudName)) {
    return NextResponse.json({ error: 'Cloudinary cloud name is invalid.' }, { status: 500 });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get('file');
  } catch {
    return NextResponse.json({ error: 'A valid image file is required.' }, { status: 400 });
  }

  if (!file || typeof file === 'string' || !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'A valid image file is required.' }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json({ error: 'Images must be smaller than 10 MB.' }, { status: 413 });
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = 'crop-radar';
  const signature = createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');
  const uploadData = new FormData();
  uploadData.append('file', file, file.name || 'crop-image');
  uploadData.append('api_key', apiKey);
  uploadData.append('folder', folder);
  uploadData.append('timestamp', timestamp);
  uploadData.append('signature', signature);

  try {
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: uploadData }
    );
    const result = await cloudinaryResponse.json();

    if (!cloudinaryResponse.ok || typeof result.secure_url !== 'string') {
      console.error('Cloudinary upload rejected the image:', result.error?.code || cloudinaryResponse.status);
      return NextResponse.json({ error: 'Cloudinary rejected the image upload.' }, { status: 502 });
    }

    return NextResponse.json({ secureUrl: result.secure_url, publicId: result.public_id });
  } catch (error) {
    console.error('Cloudinary image upload failed:', error);
    return NextResponse.json({ error: 'Cloudinary image upload failed.' }, { status: 502 });
  }
}