import React, { forwardRef } from "react";
import { LayoutToolBox } from "../../utils/styledComponents";

const ToolBox = forwardRef(({ children, fullSize, ...rest }, ref) => {
  return (
    <LayoutToolBox {...rest} ref={ref}>
      {children}
    </LayoutToolBox>
  );
});

export default ToolBox;
