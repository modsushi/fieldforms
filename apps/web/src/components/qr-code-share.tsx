'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@fieldform/ui';
import { Button } from '@fieldform/ui';
import { QrCode, Copy, Check, Download } from 'lucide-react';

interface QRCodeShareProps {
  url: string;
  title: string;
  description?: string;
}

export function QRCodeShare({ url, title, description }: QRCodeShareProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `qr-${title.replace(/\s+/g, '-').toLowerCase()}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <QrCode className="h-4 w-4" />
          Share QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          {/* QR Code */}
          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <QRCodeSVG
              id="qr-code-svg"
              value={url}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* URL Display */}
          <div className="w-full space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Form URL
            </label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={url}
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted/50"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full flex gap-2">
            <Button onClick={downloadQRCode} className="flex-1 gap-2">
              <Download className="h-4 w-4" />
              Download QR Code
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Scan this QR code with a mobile device to quickly access this form
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

