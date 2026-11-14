import { useRef, useState, type ReactNode } from "react";
import { StageContext, type StageHandles } from "./stageContext";

export default function StageProvider({ children }: { children: ReactNode }) {
  const documentFrameRef = useRef<HTMLDivElement>(null);
  // Objeto creado una sola vez: el valor del contexto es estable.
  const [value] = useState<StageHandles>(() => ({ documentFrameRef }));

  return <StageContext value={value}>{children}</StageContext>;
}
