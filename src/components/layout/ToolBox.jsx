import { forwardRef } from "react";
import { LayoutToolBox } from "../ui/legacy/styledComponents";

const ToolBox = forwardRef(({ children, ...rest }, ref) => {
  return (
    <LayoutToolBox {...rest} ref={ref}>
      {children}
    </LayoutToolBox>
  );
});

export default ToolBox;
