import React from "react";
import PortalNormalModal from "../Layout/PortalNormalModal";
import {
  ConfirmBox,
  ConfirmButton,
  ConfirmDescription,
  ContainerButtons,
} from "./styles";

const ConfirmModal = ({
  isOpen,
  onClose,
  onClickConfirm = () => {},
  description = "Descripcion",
  children,
}) => {
  return (
    <PortalNormalModal
      isOpen={isOpen}
      onClose={onClose}
      background="#2e2e2ee0"
      position="absolute"
      zIndex="100"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ConfirmBox onClick={(e) => e.stopPropagation()}>
        <ConfirmDescription>{description}</ConfirmDescription>
        {children}
        <ContainerButtons>
          <ConfirmButton
            onClick={onClose}
            background="transparent"
            border="none"
            color="#ff3b60"
          >
            Cancelar
          </ConfirmButton>
          <ConfirmButton
            onClick={onClickConfirm}
            color="#fff"
            border="none"
            background="linear-gradient( 90deg, rgba(131,57,233,1) 1%, rgba(0,173,255,1) 100% )"
          >
            Aceptar
          </ConfirmButton>
        </ContainerButtons>
      </ConfirmBox>
    </PortalNormalModal>
  );
};

export default ConfirmModal;
