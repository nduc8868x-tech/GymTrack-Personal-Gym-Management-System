import ImageKit from 'imagekit';
import { env } from './env';

let _imagekit: ImageKit | null = null;

function getImageKit(): ImageKit | null {
  if (!env.IMAGEKIT_PUBLIC_KEY || !env.IMAGEKIT_PRIVATE_KEY || !env.IMAGEKIT_URL_ENDPOINT) {
    return null;
  }
  if (!_imagekit) {
    _imagekit = new ImageKit({
      publicKey: env.IMAGEKIT_PUBLIC_KEY,
      privateKey: env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
    });
  }
  return _imagekit;
}

export const getImageKitAuthParams = () => {
  const ik = getImageKit();
  if (!ik) return null;
  return ik.getAuthenticationParameters();
};
