import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Loader2, X } from 'lucide-react';
import api from '../utils/axios';

export default function UploadDropzone({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const maybeConvertWebpToJpeg = useCallback(async (file) => {
    if (!file || file.type !== 'image/webp' || typeof createImageBitmap !== 'function') {
      return file;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return file;

      // Match backend preprocessing intent for transparent WEBP uploads.
      ctx.fillStyle = '#f2f2f2';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0);
      if (typeof bitmap.close === 'function') bitmap.close();

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.94);
      });
      if (!blob) return file;

      const convertedName = file.name.replace(/\.webp$/i, '.jpg');
      return new File([blob], convertedName, { type: 'image/jpeg' });
    } catch (convertErr) {
      console.warn('WEBP conversion skipped:', convertErr);
      return file;
    }
  }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const preparedFile = await maybeConvertWebpToJpeg(file);
      const formData = new FormData();
      formData.append('file', preparedFile);

      // 1. Upload the file to Cloudinary via backend
      const uploadRes = await api.post('/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const imageUrl = uploadRes.data.image_url;

      // 2. Classify and add to wardrobe
      const classifyRes = await api.post('/classify/', { image_url: imageUrl });
      
      onUploadSuccess(classifyRes.data.item);
    } catch (err) {
      const responseData = err.response?.data || {};
      const backendCode = responseData.error;
      const backendMessage = responseData.message || responseData.error;

      if (backendCode === 'low_confidence') {
        setError(
          `${backendMessage || 'Classification was ambiguous.'} ` +
          'Tip: upload a cropped single-item photo; full-body and WEBP images are less reliable.'
        );
      } else {
        setError(backendMessage || 'Failed to process clothing item');
      }
    } finally {
      setUploading(false);
    }
  }, [maybeConvertWebpToJpeg, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: false
  });

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`w-full bg-surface border border-dashed border-border-subtle rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
          isDragActive 
            ? 'border-primary bg-primary/10 shadow-[0_0_40px_-10px_rgba(0,255,178,0.3)] scale-[1.02]' 
            : 'hover:border-primary/50 hover:shadow-[0_0_20px_-5px_rgba(0,255,178,0.1)]'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <>
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-text font-medium text-center">AI is analyzing your clothing...</p>
          </>
        ) : (
          <>
            <UploadCloud className={`w-12 h-12 mb-4 transition-colors ${isDragActive ? 'text-primary' : 'text-text-muted'}`} />
            <p className="text-text font-medium text-center mb-1">
              Drag & drop a clothing image here
            </p>
            <p className="text-sm text-text-muted text-center">
              or click to browse from your device
            </p>
          </>
        )}
      </div>
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X className="w-4 h-4 hover:text-red-300" /></button>
        </div>
      )}
    </div>
  );
}
