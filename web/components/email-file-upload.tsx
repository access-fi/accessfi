'use client';

import { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmailFileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
}

export function EmailFileUpload({ onFileSelect, accept = '.eml' }: EmailFileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');

  const validateFile = (selectedFile: File): boolean => {
    setError('');

    // Check file extension
    if (!selectedFile.name.endsWith('.eml')) {
      setError('Please upload a .eml file');
      return false;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      setError('File too large. Maximum size is 10MB');
      return false;
    }

    // Check minimum size (at least 100 bytes for a valid email)
    if (selectedFile.size < 100) {
      setError('File too small. This doesn\'t appear to be a valid email');
      return false;
    }

    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    if (validateFile(droppedFile)) {
      setFile(droppedFile);
      onFileSelect(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      onFileSelect(selectedFile);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setError('');
  };

  return (
    <div>
      <div
        className={cn(
          "border-2 border-dashed border-border p-8 text-center transition-all",
          isDragging && "border-primary bg-primary/5",
          error && "border-destructive bg-destructive/5"
        )}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />

        {!file ? (
          <>
            <p className="font-mono text-sm mb-2 font-bold uppercase">
              DRAG & DROP YOUR .EML FILE HERE
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              or click to browse
            </p>
            <input
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
              id="email-upload"
            />
            <label htmlFor="email-upload">
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>SELECT FILE</span>
              </Button>
            </label>
          </>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div className="text-left">
              <p className="font-mono text-sm font-bold">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="text-destructive hover:text-destructive/80 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 border-2 border-destructive bg-destructive/10 p-3">
          <p className="font-mono text-xs text-destructive">{error}</p>
        </div>
      )}

      {file && !error && (
        <div className="mt-2 border-2 border-primary/30 bg-primary/5 p-3">
          <p className="font-mono text-xs text-primary">
            ✓ File validated and ready for proof generation
          </p>
        </div>
      )}
    </div>
  );
}
