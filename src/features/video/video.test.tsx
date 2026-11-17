import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TooltipProvider } from "../../components/ui/Tooltip";
import {
  createFakeVideo,
  createFakeVideoSource,
  type FakeVideo,
  type FakeVideoOptions,
} from "../../test/video";
import PlaybackBar from "./components/PlaybackBar";
import { createSeeker, togglePlayback } from "./utils/playback";

const renderBar = (options?: FakeVideoOptions) => {
  const video = createFakeVideoSource(options);
  render(
    <TooltipProvider>
      <PlaybackBar video={video} />
    </TooltipProvider>
  );
  return video.element as FakeVideo;
};

describe("togglePlayback", () => {
  it("reproduce si está parado y pausa si está en marcha", () => {
    const video = createFakeVideo();
    togglePlayback(video);
    expect(video.paused).toBe(false);
    togglePlayback(video);
    expect(video.paused).toBe(true);
  });

  it("al final del video, lo vuelve a reproducir", () => {
    const video = createFakeVideo();
    void video.play();
    video.ended = true;
    togglePlayback(video);
    expect(video.play).toHaveBeenCalledTimes(2);
    expect(video.pause).not.toHaveBeenCalled();
  });
});

describe("createSeeker", () => {
  it("salta al momento pedido", () => {
    const video = createFakeVideo();
    createSeeker(video).seek(4);
    expect(video.currentTime).toBe(4);
  });

  it("mientras el video está saltando, espera y solo pide el último destino", () => {
    const video = createFakeVideo();
    const seeker = createSeeker(video);
    video.seeking = true;
    seeker.seek(3);
    seeker.seek(7);
    expect(video.currentTime).toBe(0);

    video.seeking = false;
    video.dispatchEvent(new Event("seeked"));
    expect(video.currentTime).toBe(7);
  });

  it("al soltarlo deja de escuchar al video", () => {
    const video = createFakeVideo();
    const seeker = createSeeker(video);
    video.seeking = true;
    seeker.seek(5);
    seeker.dispose();
    video.dispatchEvent(new Event("seeked"));
    expect(video.currentTime).toBe(0);
  });
});

describe("PlaybackBar", () => {
  it("muestra por dónde va el video y cuánto dura", () => {
    const video = renderBar({ duration: 75 });
    expect(screen.getByText("0:00 / 1:15")).toBeInTheDocument();

    act(() => {
      video.currentTime = 63;
    });
    expect(screen.getByText("1:03 / 1:15")).toBeInTheDocument();
    expect(
      screen.getByRole("slider", { name: "Posición del video" })
    ).toHaveAttribute("aria-valuetext", "1:03 de 1:15");
  });

  it("el botón reproduce y pausa, y cambia de nombre", async () => {
    const user = userEvent.setup();
    const video = renderBar();
    await user.click(screen.getByRole("button", { name: "Reproducir" }));
    expect(video.paused).toBe(false);

    await user.click(screen.getByRole("button", { name: "Pausar" }));
    expect(video.paused).toBe(true);
    expect(
      screen.getByRole("button", { name: "Reproducir" })
    ).toBeInTheDocument();
  });

  it("sigue al video aunque se pause o termine desde fuera (p. ej. con K)", () => {
    const video = renderBar();
    act(() => void video.play());
    expect(screen.getByRole("button", { name: "Pausar" })).toBeInTheDocument();

    act(() => {
      video.ended = true;
      video.dispatchEvent(new Event("ended"));
    });
    expect(
      screen.getByRole("button", { name: "Reproducir" })
    ).toBeInTheDocument();
  });

  it("la barra de tiempo lleva el video a otro momento con el teclado", async () => {
    const user = userEvent.setup();
    const video = renderBar({ duration: 10 });
    screen.getByRole("slider", { name: "Posición del video" }).focus();

    await user.keyboard("{End}");
    expect(video.currentTime).toBe(10);
    expect(screen.getByText("0:10 / 0:10")).toBeInTheDocument();

    await user.keyboard("{Home}");
    expect(video.currentTime).toBe(0);

    // Cada flecha avanza 1/200 de la duración.
    await user.keyboard("{ArrowRight}");
    expect(video.currentTime).toBeCloseTo(0.05);
  });

  it("silencia y vuelve a activar el sonido", async () => {
    const user = userEvent.setup();
    const video = renderBar();
    await user.click(screen.getByRole("button", { name: "Silenciar" }));
    expect(video.muted).toBe(true);

    await user.click(screen.getByRole("button", { name: "Activar el sonido" }));
    expect(video.muted).toBe(false);
    expect(
      screen.getByRole("button", { name: "Silenciar" })
    ).toBeInTheDocument();
  });
});
