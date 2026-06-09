"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, ImageIcon, AlertCircle, Monitor, Smartphone } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadImageViaApi } from "@/lib/upload-via-api";

interface ImageUploadFieldProps {
  label: string;
  description?: string;
  value: string;
  onChange: (url: string) => void;
  entityId: string;
  kind: "banner" | "product" | "category";
  recommendedSize?: {
    width: number;
    height: number;
    label: string;
  };
  aspectRatio?: string;
  required?: boolean;
  error?: string;
  deviceType?: "desktop" | "mobile";
}

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export function ImageUploadField({
  label,
  description,
  value,
  onChange,
  entityId,
  kind,
  recommendedSize,
  aspectRatio = "21/9",
  required = false,
  error,
  deviceType = "desktop",
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validações
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error("Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error("Arquivo muito grande. Tamanho máximo: 8MB.");
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        // Simular progresso
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const url = await uploadImageViaApi(file, kind, entityId);

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (url) {
          onChange(url);
          toast.success("Imagem enviada com sucesso!");
        } else {
          toast.error("Falha ao enviar imagem. Tente novamente.");
        }
      } catch (err: any) {
        console.error("Erro no upload:", err);
        toast.error(`Erro ao enviar imagem: ${err.message || 'Verifique sua conexão'}`);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [kind, entityId, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleRemove = () => {
    onChange("");
  };

  const DeviceIcon = deviceType === "desktop" ? Monitor : Smartphone;
  const deviceLabel = deviceType === "desktop" ? "Desktop" : "Mobile";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DeviceIcon className="h-4 w-4 text-muted-foreground" />
          <Label className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
            {label}
          </Label>
        </div>
        {recommendedSize && (
          <span className="text-xs text-muted-foreground">
            {recommendedSize.label}
          </span>
        )}
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {value ? (
        <div className="relative overflow-hidden rounded-lg border bg-muted/30">
          <div
            className={cn(
              "relative w-full overflow-hidden",
              aspectRatio && `aspect-[${aspectRatio}]`
            )}
            style={{ aspectRatio }}
          >
            <Image
              src={value}
              alt={label}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 560px"
              unoptimized={value.startsWith("http://localhost")}
            />
          </div>
          <div className="absolute right-2 top-2">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute bottom-2 left-2">
            <span className="rounded-full bg-black/60 px-2 py-1 text-xs text-white">
              {deviceLabel}
            </span>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "relative cursor-pointer rounded-lg border-2 border-dashed transition-colors",
            "flex flex-col items-center justify-center gap-3 p-6",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            uploading && "pointer-events-none opacity-60"
          )}
          style={{ aspectRatio }}
        >
          <input {...getInputProps()} />

          {uploading ? (
            <>
              <div className="relative h-12 w-12">
                <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-muted"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="text-primary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${uploadProgress}, 100`}
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-medium">Enviando...</p>
                <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-full bg-muted p-3">
                {isDragActive ? (
                  <Upload className="h-6 w-6 text-primary" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="text-center">
                <p className="font-medium">
                  {isDragActive
                    ? "Solte a imagem aqui"
                    : "Clique ou arraste uma imagem"}
                </p>
                <p className="text-sm text-muted-foreground">
                  JPEG, PNG, WebP ou GIF até 8MB
                </p>
              </div>
              {recommendedSize && (
                <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                  <AlertCircle className="h-3 w-3" />
                  <span>{recommendedSize.label}</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}