import { LayoutToolBox } from "../ui/legacy/styledComponents";

// React 19: `ref` llega como una prop más; ya no hace falta forwardRef.
const ToolBox = ({ children, ref, ...rest }) => {
  return (
    <LayoutToolBox {...rest} ref={ref}>
      {children}
    </LayoutToolBox>
  );
};

export default ToolBox;
