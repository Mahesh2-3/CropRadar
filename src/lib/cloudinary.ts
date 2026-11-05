'use client';

export async function uploadImageToCloudinary(imageDataUrl: string): Promise<string> {
  const imageResponse = await fetch(imageDataUrl);
  const imageBlob = await imageResponse.blob();
  const formData = new FormData();
  formData.append('file', imageBlob, 'crop-image');

  const response = await fetch('/api/uploads/cloudinary', {
    method: 'POST',
    credentials: 'same-origin',
    body: formData,
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || typeof result.secureUrl !== 'string') {
    throw new Error(result.error || 'Cloudinary image upload failed.');
  }

  return result.secureUrl;
}