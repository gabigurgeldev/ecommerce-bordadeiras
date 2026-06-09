"use client";

import { useState, useCallback } from "react";
import { Play, Plus, X, Video, AlertCircle, GripVertical, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface VideoUrlListProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxVideos?: number;
}

function isValidVideoUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  const cleanUrl = url.trim();
  // YouTube
  if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i.test(cleanUrl)) {
    return true;
  }
  // Vimeo
  if (/^(https?:\/\/)?(www\.)?(vimeo\.com)\/.+/i.test(cleanUrl)) {
    return true;
  }
  return false;
}

function extractVideoId(url: string): { type: 'youtube' | 'vimeo' | null; id: string | null } {
  const cleanUrl = url.trim();
  
  // YouTube
  const youtubeMatch = cleanUrl.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return { type: 'youtube', id: youtubeMatch[1] };
  }
  
  // Vimeo
  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return { type: 'vimeo', id: vimeoMatch[1] };
  }
  
  return { type: null, id: null };
}

function getThumbnailUrl(url: string): string | null {
  const { type, id } = extractVideoId(url);
  if (!id) return null;
  
  if (type === 'youtube') {
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
  }
  
  if (type === 'vimeo') {
    // Vimeo requer API, retornar placeholder
    return null;
  }
  
  return null;
}

export function VideoUrlList({ value, onChange, maxVideos = 5 }: VideoUrlListProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAdd = useCallback(() => {
    setError(null);
    
    if (value.length >= maxVideos) {
      setError(`Limite máximo de ${maxVideos} vídeos atingido`);
      return;
    }
    
    if (!inputValue.trim()) {
      setError("Digite uma URL de vídeo");
      return;
    }
    
    if (!isValidVideoUrl(inputValue)) {
      setError("URL inválida. Use apenas links do YouTube ou Vimeo");
      return;
    }
    
    if (value.some(url => url.trim() === inputValue.trim())) {
      setError("Este vídeo já foi adicionado");
      return;
    }
    
    onChange([...value, inputValue.trim()]);
    setInputValue("");
    setError(null);
  }, [inputValue, value, onChange, maxVideos]);

  const handleRemove = useCallback((index: number) => {
    onChange(value.filter((_, i) => i !== index));
    setError(null);
  }, [value, onChange]);

  const handleMove = useCallback((index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= value.length) return;
    const newValue = [...value];
    [newValue[index], newValue[index + direction]] = [newValue[index + direction], newValue[index]];
    onChange(newValue);
  }, [value, onChange]);

  const startEdit = useCallback((index: number) => {
    setEditingIndex(index);
    setEditValue(value[index]);
  }, [value]);

  const saveEdit = useCallback(() => {
    if (editingIndex === null) return;
    
    if (!isValidVideoUrl(editValue)) {
      setError("URL inválida");
      return;
    }
    
    const newValue = [...value];
    newValue[editingIndex] = editValue.trim();
    onChange(newValue);
    setEditingIndex(null);
    setEditValue("");
    setError(null);
  }, [editingIndex, editValue, value, onChange]);

  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditValue("");
    setError(null);
  }, []);

  return (
    <div className="space-y-4">
      {/* Input para adicionar novo vídeo */}
      <div className="space-y-2">
        <Label htmlFor="video-url-input" className="flex items-center gap-2">
          <Video className="h-4 w-4 text-red-500" />
          Adicionar vídeo (YouTube ou Vimeo)
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="video-url-input"
              placeholder="https://www.youtube.com/watch?v=..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              className={cn(error && "border-red-500 focus-visible:ring-red-500")}
            />
            {inputValue && isValidVideoUrl(inputValue) && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Check className="h-4 w-4 text-green-500" />
              </div>
            )}
          </div>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={value.length >= maxVideos || !inputValue.trim()}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {value.length} de {maxVideos} vídeos • Aceita YouTube e Vimeo
        </p>
      </div>

      {/* Lista de vídeos adicionados */}
      {value.length > 0 && (
        <div className="space-y-2">
          <Label>Vídeos adicionados</Label>
          <div className="space-y-2">
            {value.map((url, index) => {
              const { type, id } = extractVideoId(url);
              const thumbnail = getThumbnailUrl(url);
              const isEditing = editingIndex === index;

              return (
                <div
                  key={`${index}-${url}`}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg border p-3 transition-colors",
                    isEditing ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  )}
                >
                  {/* Thumbnail ou ícone */}
                  <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={`Thumbnail vídeo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        {type === 'youtube' ? (
                          <Video className="h-6 w-6 text-red-500" />
                        ) : type === 'vimeo' ? (
                          <Play className="h-6 w-6 text-blue-500" />
                        ) : (
                          <Play className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    {/* Ícone de play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="rounded-full bg-white/90 p-1.5">
                        <ExternalLink className="h-3.5 w-3.5 text-black" />
                      </div>
                    </div>
                  </div>

                  {/* Info e controles */}
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-8 text-sm"
                          placeholder="https://..."
                        />
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            onClick={saveEdit}
                            className="h-7 px-2 text-xs"
                          >
                            Salvar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                            className="h-7 px-2 text-xs"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          {type === 'youtube' && (
                            <Video className="h-3.5 w-3.5 text-red-500" />
                          )}
                          {type === 'vimeo' && (
                            <Play className="h-3.5 w-3.5 text-blue-500" />
                          )}
                          <span className="truncate text-sm font-medium">
                            Vídeo {index + 1}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {id}
                        </p>
                        <div className="mt-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMove(index, -1)}
                            disabled={index === 0}
                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                            title="Mover para cima"
                          >
                            <GripVertical className="h-3 w-3 -rotate-90" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(index, 1)}
                            disabled={index === value.length - 1}
                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                            title="Mover para baixo"
                          >
                            <GripVertical className="h-3 w-3 rotate-90" />
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(index)}
                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="Editar URL"
                          >
                            <Play className="h-3 w-3" />
                          </button>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="Abrir vídeo"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Botão remover */}
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="rounded p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Remover vídeo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
