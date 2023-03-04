import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { FixedContainer, GlobalButton } from "../../utils/styledComponents";
import { SwipeableMenu, SwipeableMenuHeader } from "./styles";

const PortalsSwipeableMenuLayout = ({
  children,
  onClose,
  isOpen,
  title,
  adviseText,
}) => {
  const refFixedContainer = useRef();
  const refSwipeableMenu = useRef();
  const handleStopPropagation = (e) => e.stopPropagation();
  const hanldeCloseElement = () => {
    refSwipeableMenu.current.classList.add("close");
    refFixedContainer.current.classList.add("close");
  };
  if (!isOpen) return;
  return createPortal(
    <FixedContainer
      ref={refFixedContainer}
      onClick={hanldeCloseElement}
      onTransitionEnd={onClose}
    >
      <SwipeableMenu
        ref={refSwipeableMenu}
        onTransitionEnd={handleStopPropagation}
        onClick={handleStopPropagation}
      >
        <SwipeableMenuHeader>
          <p>{title}</p>
          <GlobalButton onClick={hanldeCloseElement}>
            <FiX />
          </GlobalButton>
        </SwipeableMenuHeader>
        {children}
      </SwipeableMenu>
    </FixedContainer>,
    document.getElementById("portal")
  );
};

export default PortalsSwipeableMenuLayout;
