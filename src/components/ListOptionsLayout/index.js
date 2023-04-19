import React from "react";
import { OptionsList } from "./styles";

const ListOptionsLayout = ({
  children,
  position,
  top,
  bottom,
  left,
  right,
  inset,
  background,
}) => {
  return (
    <OptionsList
      position={position}
      top={top}
      bottom={bottom}
      left={left}
      right={right}
      inset={inset}
      background={background}
    >
      {children}
    </OptionsList>
  );
};

export default ListOptionsLayout;
