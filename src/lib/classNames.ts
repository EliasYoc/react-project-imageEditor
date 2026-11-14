/** Une clases CSS ignorando las vacías: classNames("a", cond && "b") → "a b". */
export const classNames = (
  ...names: Array<string | false | null | undefined>
) => names.filter(Boolean).join(" ");
