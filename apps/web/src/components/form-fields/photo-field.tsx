'use client';

import { FormField } from '@fieldform/types';
import { Label } from '@fieldform/ui';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { useState, useRef } from 'react';

interface PhotoFieldProps {
  field: FormField;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  setValue?: UseFormSetValue<any>;
}

export function PhotoField({ field, register, errors, setValue }: PhotoFieldProps) {
  const error = errors[field.id]?.message as string;
  const [preview, setPreview] = useState<string>('');
  const [capturing, setCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCapturing(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Store photo (would upload to S3 in production)
      if (setValue) {
        setValue(field.id, previewUrl);
      }

      console.log('Photo captured:', file.name);
    } catch (error) {
      console.error('Photo capture error:', error);
      alert('Failed to capture photo');
    } finally {
      setCapturing(false);
    }
  };

  const handleDelete = () => {
    setPreview('');
    if (setValue) {
      setValue(field.id, null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Captured"
            className="w-full max-h-64 object-contain rounded-lg border"
          />
          <button
            type="button"
            onClick={handleDelete}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
          <input
            ref={fileInputRef}
            id={field.id}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="hidden"
            disabled={capturing}
          />
          <label
            htmlFor={field.id}
            className="cursor-pointer flex flex-col items-center gap-3"
          >
            {capturing ? (
              <>
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium">Take Photo</span>
                <span className="text-xs text-muted-foreground">Tap to use camera</span>
              </>
            )}
          </label>
        </div>
      )}

      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

