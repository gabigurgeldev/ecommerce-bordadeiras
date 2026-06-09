"use client";

import { Info, Check, X, Image, FileImage, Monitor } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ImageFormatTooltipProps {
  /** Tamanho mínimo recomendado em pixels (largura) */
  minWidth?: number;
  /** Proporções de aspecto aceitas */
  aspectRatios?: string[];
  /** Formatos de arquivo aceitos */
  formats?: string[];
  /** Tamanho máximo do arquivo em MB */
  maxFileSize?: number;
  /** Se deve mostrar o botão de informação ou apenas o conteúdo */
  showTrigger?: boolean;
}

export function ImageFormatTooltip({
  minWidth = 1280,
  aspectRatios = ["1:1 (quadrada)", "4:3", "16:9"],
  formats = ["WEBP (recomendado)", "PNG", "JPEG", "GIF"],
  maxFileSize = 5,
  showTrigger = true,
}: ImageFormatTooltipProps) {
  const content = (
    <div className="w-80 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b pb-2">
        <div className="rounded-lg bg-primary/10 p-1.5">
          <Image className="h-4 w-4 text-primary" />
        </div>
        <span className="font-medium">Especificações de Imagem</span>
      </div>

      {/* Tamanho mínimo */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Tamanho Mínimo</span>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-sm">
            <span className="font-semibold text-primary">{minWidth}px</span> de largura
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Imagens menores serão pixeladas em telas grandes
          </p>
        </div>
      </div>

      {/* Proporções */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <FileImage className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Proporções Aceitas</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {aspectRatios.map((ratio) => (
            <span
              key={ratio}
              className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
            >
              {ratio}
            </span>
          ))}
        </div>
      </div>

      {/* Formatos */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-green-500" />
          <span className="font-medium">Formatos Permitidos</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {formats.map((format, index) => (
            <div
              key={format}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                index === 0
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index === 0 && <Check className="h-3 w-3" />}
              {format}
            </div>
          ))}
        </div>
      </div>

      {/* Tamanho do arquivo */}
      {maxFileSize && (
        <div className="space-y-2 border-t pt-2">
          <div className="flex items-center justify-between rounded-lg bg-amber-500/10 px-3 py-2">
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Tamanho máximo
            </span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {maxFileSize} MB
            </span>
          </div>
        </div>
      )}
    </div>
  );

  if (!showTrigger) {
    return content;
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <Info className="h-3 w-3" />
            Formato ideal
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="p-0" sideOffset={8}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
