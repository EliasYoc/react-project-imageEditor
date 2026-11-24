import { useState } from "react";
import type { ColorStop, Gradient } from "../../../editor/model/types";

/**
 * La parada que se está editando en un degradado. Si la elegida ya no existe
 * (se quitó, o el degradado cambió), cae en la primera.
 */
export const useSelectedStop = (gradient: Gradient) => {
  const [selectedId, setSelectedId] = useState<string | null>(
    gradient.stops[0]?.id ?? null
  );
  const selectedStop: ColorStop | undefined =
    gradient.stops.find((stop) => stop.id === selectedId) ?? gradient.stops[0];

  return { selectedStop, selectStop: setSelectedId };
};
