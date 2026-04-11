import ImageKit from 'imagekit';
import { env } from '../config/env';

// Initialize ImageKit client (lazy — only fails if keys are actually used)
function getImageKit(): ImageKit {
  if (!env.IMAGEKIT_PUBLIC_KEY || !env.IMAGEKIT_PRIVATE_KEY || !env.IMAGEKIT_URL_ENDPOINT) {
    throw new Error('ImageKit is not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT in .env');
  }
  return new ImageKit({
    publicKey: env.IMAGEKIT_PUBLIC_KEY,
    privateKey: env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
  });
}

/**
 * Upload a file buffer to ImageKit under /exercises/{exerciseId}/
 * Returns the uploaded file URL and fileId.
 */
export async function uploadExerciseImage(
  exerciseId: string,
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<{ url: string; fileId: string }> {
  const ik = getImageKit();

  const ext = originalName.split('.').pop() || 'jpg';
  const fileName = `exercise_${exerciseId}_${Date.now()}.${ext}`;

  const response = await ik.upload({
    file: fileBuffer,
    fileName,
    folder: `/exercises/${exerciseId}`,
    useUniqueFileName: false,
    tags: ['exercise', exerciseId],
  });

  return {
    url: response.url,
    fileId: response.fileId,
  };
}

/**
 * Delete a file from ImageKit by its fileId.
 * The fileId is stored in the image URL's last segment or separately.
 * We extract it from the URL path convention or accept it explicitly.
 */
export async function deleteImageByFileId(fileId: string): Promise<void> {
  const ik = getImageKit();
  await ik.deleteFile(fileId);
}

/**
 * Extract ImageKit fileId from a stored image URL by listing files in the exercise folder.
 * Used when we only stored the URL and not the fileId.
 */
export async function findFileIdByUrl(exerciseId: string, imageUrl: string): Promise<string | null> {
  const ik = getImageKit();
  const files = await ik.listFiles({
    path: `/exercises/${exerciseId}`,
    type: 'file',
  });

  const file = files.find((f: { url: string; fileId: string }) => f.url === imageUrl);
  return file ? file.fileId : null;
}
