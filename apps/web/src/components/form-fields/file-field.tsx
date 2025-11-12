'use client';

import { FormField } from '@fieldform/types';
import { Label } from '@fieldform/ui';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { useState } from 'react';

interface FileFieldProps {
  field: FormField;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  setValue?: UseFormSetValue<any>;
}

export function FileField({ field, register, errors, setValue }: FileFieldProps) {
  const error = errors[field.id]?.message as string;
  const [fileName, setFileName] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);

    try {
      // For offline support, we'll store the file locally
      // In a real app, you'd upload to S3 here
      const fileUrl = URL.createObjectURL(file);
      
      if (setValue) {
        setValue(field.id, fileUrl);
      }
      
      console.log('File selected:', file.name);
    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
        <input
          id={field.id}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept={field.validation?.fileTypes?.join(',') || '*'}
          disabled={uploading}
        />
        <label
          htmlFor={field.id}
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </>
          ) : fileName ? (
            <>
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium">{fileName}</span>
              <span className="text-xs text-muted-foreground">Click to change</span>
            </>
          ) : (
            <>
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm text-muted-foreground">Click to upload file</span>
              {field.validation?.maxSize && (
                <span className="text-xs text-muted-foreground">
                  Max size: {(field.validation.maxSize / 1024 / 1024).toFixed(1)}MB
                </span>
              )}
            </>
          )}
        </label>
      </div>

      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

