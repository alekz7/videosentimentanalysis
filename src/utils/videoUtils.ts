export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const parseTimestamp = (timestamp: string): number => {
  const [minutes, seconds] = timestamp.split(':').slice(-2);
  return parseInt(minutes) * 60 + parseInt(seconds);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateVideoFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Please upload a valid video file (MP4, WebM, or MOV)' };
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 100MB' };
  }
  
  return { isValid: true };
};

export const createVideoThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.currentTime = 1; // Seek to 1 second
    };
    
    video.onseeked = () => {
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        reject(new Error('Could not create thumbnail'));
      }
    };
    
    video.onerror = reject;
    video.src = URL.createObjectURL(file);
  });
};