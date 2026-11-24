import { useEffect, useRef, useState } from "react";
import { toast } from "../../../components/ui/Toast";
import { useEditorStore } from "../../../editor/store/editorStore";
import { saveImage, sharesFile } from "../../../lib/saveImage";
import type { EncodeVideoResult } from "../utils/encodeVideo";
import type { ExportVideoOptions } from "../utils/exportVideo";

/** Un video ya exportado, a falta de entregarlo. */
export interface ReadyVideo {
  blob: Blob;
  fileName: string;
}

interface VideoExportOptions {
  /** Exporta el video y dice cómo terminó. */
  runExport: (options: ExportVideoOptions) => Promise<EncodeVideoResult>;
  /** Se llama al terminar, bien o mal: el diálogo se cierra. */
  onDone: () => void;
  /** Avisa al empezar y al acabar (mientras, el diálogo no se cierra). */
  onWorkingChange: (isWorking: boolean) => void;
}

/**
 * Exportar un video desde un diálogo: el avance, cancelar y entregar el
 * archivo (descargarlo o abrir la hoja de compartir del móvil).
 */
export const useVideoExport = ({
  runExport,
  onDone,
  onWorkingChange,
}: VideoExportOptions) => {
  const setStatus = useEditorStore((state) => state.setStatus);
  /** null = aún no se ha empezado; después, el avance de 0 a 100. */
  const [percent, setPercent] = useState<number | null>(null);
  const [ready, setReady] = useState<ReadyVideo | null>(null);
  const controller = useRef<AbortController | null>(null);

  // Si el diálogo desaparece a media exportación, se cancela.
  useEffect(() => () => controller.current?.abort(), []);

  /** Entrega el video. `false` si el usuario cerró la hoja de compartir. */
  const deliver = async ({ blob, fileName }: ReadyVideo) => {
    const result = await saveImage(blob, fileName);
    if (result === "cancelled") return false;
    // Con la hoja de compartir del móvil, el sistema ya da su respuesta.
    if (result === "downloaded") {
      toast.success(`Video descargado: ${fileName}`);
    }
    return true;
  };

  const run = async () => {
    const abort = new AbortController();
    controller.current = abort;
    setPercent(0);
    onWorkingChange(true);
    setStatus("exportingVideo");
    try {
      return await runExport({
        onProgress: (progress) => setPercent(Math.round(progress * 100)),
        signal: abort.signal,
      });
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      controller.current = null;
      setStatus("idle");
      onWorkingChange(false);
    }
  };

  /** Exporta el video y lo entrega con ese nombre de archivo. */
  const exportAs = async (fileName: string) => {
    const result = await run();
    if (!result) {
      toast.error("No se pudo exportar el video");
      return onDone();
    }
    if (result.status === "canceled") return onDone();
    if (result.status === "unsupported") {
      toast.error("Este navegador no puede exportar este video");
      return onDone();
    }
    if (result.hasLostSound) toast.error("El video se exportó sin sonido");

    const video = { blob: result.blob, fileName };
    // La hoja de compartir del móvil exige que el usuario acabe de tocar
    // algo, y la exportación puede haber tardado más que eso: entonces se
    // muestra un botón para abrirla con un toque nuevo.
    const needsTap =
      sharesFile(video.blob, video.fileName) &&
      !navigator.userActivation?.isActive;
    if (needsTap) {
      setPercent(null);
      setReady(video);
      return;
    }
    await deliver(video);
    onDone();
  };

  return {
    /** null si no se está exportando; si no, el avance de 0 a 100. */
    percent,
    /** El video exportado que espera un toque para compartirse, o null. */
    ready,
    exportAs,
    cancel: () => controller.current?.abort(),
    /** Entrega el video que esperaba (`ready`), con el toque del usuario. */
    deliverReady: async () => {
      if (ready && (await deliver(ready))) onDone();
    },
  };
};
