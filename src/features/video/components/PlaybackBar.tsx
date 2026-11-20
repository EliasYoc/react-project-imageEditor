import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { IconButton } from "../../../components/ui/Button";
import { SliderBar } from "../../../components/ui/SliderBar";
import type { VideoSource } from "../../../editor/model/types";
import { SHORTCUT_LABELS } from "../../shortcuts";
import { useVideoPlayback } from "../hooks/useVideoPlayback";
import { formatTime } from "../utils/formatTime";
import { createSeeker, toggleMuted, togglePlayback } from "../utils/playback";
import styles from "./PlaybackBar.module.css";

/** Posiciones de la barra de tiempo: cuánto avanza cada flecha del teclado. */
const SEEK_STEPS = 200;
/** El paso más corto: más o menos un fotograma. */
const MIN_SEEK_STEP = 1 / 30;

/**
 * Barra de reproducción del video del documento, encima de las herramientas:
 * reproducir o pausar (también con K), el tiempo, la barra de tiempo para ir
 * a otro momento y silenciar.
 *
 * La barra de tiempo es un slider de Radix: se arrastra con el dedo o el
 * ratón y se mueve con el teclado (flechas, RePág/AvPág, Inicio/Fin).
 */
const PlaybackBar = ({ video }: { video: VideoSource }) => {
  const { element } = video;
  const { isPlaying, currentTime, duration, isMuted } =
    useVideoPlayback(element);
  // Mientras se arrastra, la barra sigue al dedo: el video va un poco por
  // detrás (cada salto tarda) y, si no, el pulgar daría tirones.
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const seeker = useMemo(() => createSeeker(element), [element]);
  useEffect(() => () => seeker.dispose(), [seeker]);

  const time = scrubTime ?? currentTime;
  const position = `${formatTime(time)} / ${formatTime(duration)}`;

  return (
    <div
      className={styles.bar}
      role="group"
      aria-label="Reproducción del video"
    >
      <IconButton
        icon={isPlaying ? Pause : Play}
        aria-label={isPlaying ? "Pausar" : "Reproducir"}
        shortcut={SHORTCUT_LABELS.togglePlayback}
        tooltipSide="top"
        onClick={() => togglePlayback(element)}
      />
      <span className={styles.time}>{position}</span>
      <SliderBar
        className={styles.slider}
        label="Posición del video"
        min={0}
        max={duration}
        step={Math.max(MIN_SEEK_STEP, duration / SEEK_STEPS)}
        value={Math.min(time, duration)}
        valueText={`${formatTime(time)} de ${formatTime(duration)}`}
        onChange={(next) => {
          setScrubTime(next);
          seeker.seek(next);
        }}
        onCommit={() => setScrubTime(null)}
      />
      <IconButton
        icon={isMuted ? VolumeX : Volume2}
        aria-label={isMuted ? "Activar el sonido" : "Silenciar"}
        tooltipSide="top"
        onClick={() => toggleMuted(element)}
      />
    </div>
  );
};

export default PlaybackBar;
