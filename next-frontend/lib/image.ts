// Ask Cloudinary for a small, auto-format (WebP/AVIF) copy instead of the original upload.
// Other URLs are returned unchanged.
export function cloudinaryThumb(url: string, size: number) {
  const marker = '/image/upload/';
  if (!url.includes('res.cloudinary.com') || !url.includes(marker)) return url;
  return url.replace(marker, `${marker}f_auto,q_auto,c_limit,w_${size},h_${size}/`);
}
