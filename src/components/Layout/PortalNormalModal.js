import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { FixedContainer } from "../../utils/styledComponents";

const PortalNormalModal = ({ children, onClose, isOpen }) => {
  const refFixedContainer = useRef();
  const hanldeCloseElement = () => {
    refFixedContainer.current.classList.add("close");
  };
  if (!isOpen) return;
  return createPortal(
    <FixedContainer
      ref={refFixedContainer}
      onClick={hanldeCloseElement}
      onTransitionEnd={onClose}
    >
      {children}
    </FixedContainer>,
    document.getElementById("portal")
  );
};

export default PortalNormalModal;
