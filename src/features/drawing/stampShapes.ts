import { Circle, Shapes, Square, Star, Triangle } from "lucide-react";
import type { ChoiceMenuOption } from "../../components/ui/Menu";
import type { StampShape } from "../../editor/model/types";

/** Figuras del pincel de formas, en el orden en que se ofrecen. */
export const STAMP_SHAPE_OPTIONS: readonly ChoiceMenuOption<StampShape>[] = [
  { value: "circle", label: "Círculos", icon: Circle },
  { value: "square", label: "Cuadrados", icon: Square },
  { value: "triangle", label: "Triángulos", icon: Triangle },
  { value: "star", label: "Estrellas", icon: Star },
  { value: "mix", label: "Mezcla", icon: Shapes },
];
