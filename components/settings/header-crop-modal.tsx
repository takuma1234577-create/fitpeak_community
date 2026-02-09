"use client";

import { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getCroppedImg } from "@/lib/crop-image";
import { Loader2 } from "lucide-react";

const ASPECT = 3 / 1;

interface HeaderCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onConfirm: (blob: Blob) => void | Promise<void>;
}

export default function HeaderCropModal({
  open,
  onOpenChange,
  imageSrc,
  onConfirm,
}: HeaderCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onCropComplete = useCallback((_crop: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setSubmitting(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      await onConfirm(blob);
      onOpenChange(false);
    } catch (e) {
      console.error("Crop failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-full max-w-2xl overflow-hidden border-border/60 bg-card p-0">
        <DialogHeader className="shrink-0 border-b border-border/60 px-4 py-3">
          <DialogTitle className="text-base font-bold text-foreground">
            ヘッダー画像を切り抜く
          </DialogTitle>
        </DialogHeader>
        <div className="relative h-[280px] w-full bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={ASPECT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{ containerStyle: { backgroundColor: "#000" } }}
          />
        </div>
        <DialogFooter className="shrink-0 gap-2 border-t border-border/60 px-4 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-bold text-foreground"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !croppedAreaPixels}
            className="flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-[#050505] disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            決定
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
