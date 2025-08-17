import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, type UploadTaskSnapshot } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload an image file for an entry
 * Now uses Firebase Storage by default. Base64 kept as fallback.
 */
export async function uploadEntryImage(
  userId: string,
  file: File,
  useFirebaseStorage: boolean = true
): Promise<{ url: string }> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }
    
    // Different size limits based on storage method
    const maxSize = useFirebaseStorage ? 10 * 1024 * 1024 : 500 * 1024; // 10MB vs 500KB
    if (file.size > maxSize) {
      const limitText = useFirebaseStorage ? '10MB' : '500KB';
      throw new Error(`Image file must be smaller than ${limitText}`);
    }
    
    if (useFirebaseStorage) {
      // Use Firebase Storage (when properly configured)
      return await uploadToFirebaseStorage(userId, file);
    } else {
      // Use base64 method (current default)
      return await uploadAsBase64(file);
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Failed to upload image. Please try again.');
  }
}

/**
 * Upload image as base64 (current method)
 */
async function uploadAsBase64(file: File): Promise<{ url: string }> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  
  console.log('Using base64 fallback for image upload');
  return { url: base64 };
}

/**
 * Upload to Firebase Storage (for future use)
 */
async function uploadToFirebaseStorage(userId: string, file: File): Promise<{ url: string }> {
  if (!storage) {
    throw new Error('Image upload is not configured. Please set Firebase Storage env vars and rebuild.');
  }
  const safeFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const path = `entry-images/${userId}/${Date.now()}_${safeFileName}`;
  const fileRef = ref(storage, path);
  
  console.log('Uploading to Firebase Storage:', path);
  
  let snapshot: UploadTaskSnapshot;
  try {
    const uploadTask = uploadBytesResumable(fileRef, file);
    snapshot = await new Promise<UploadTaskSnapshot>((resolve, reject) => {
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        }, 
        (error) => reject(error),
        () => resolve(uploadTask.snapshot)
      );
    });
  } catch (resumableError) {
    console.log('Resumable upload failed, trying regular upload...', resumableError);
    const result = await uploadBytes(fileRef, file);
    const url = await getDownloadURL(result.ref);
    console.log('Firebase Storage upload completed (fallback):', url);
    return { url };
  }
  
  const url = await getDownloadURL(snapshot.ref);
  console.log('Firebase Storage upload completed:', url);
  return { url };
}
