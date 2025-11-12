/**
 * S3/MinIO client for file uploads
 */

export interface UploadResult {
  url: string;
  key: string;
  size: number;
}

export class S3Client {
  private endpoint: string;
  private bucketName: string;

  constructor() {
    this.endpoint = process.env.NEXT_PUBLIC_S3_URL || 'http://localhost:9000/fieldform';
    this.bucketName = process.env.S3_BUCKET || 'fieldform';
  }

  /**
   * Upload a file to S3/MinIO
   */
  async uploadFile(file: File, path?: string): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (path) {
      formData.append('path', path);
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  /**
   * Get public URL for a file
   */
  getFileUrl(key: string): string {
    return `${this.endpoint}/${key}`;
  }

  /**
   * Upload with progress tracking
   */
  async uploadWithProgress(
    file: File,
    onProgress: (progress: number) => void,
    path?: string
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);
      if (path) {
        formData.append('path', path);
      }

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  }
}

export const s3Client = new S3Client();

