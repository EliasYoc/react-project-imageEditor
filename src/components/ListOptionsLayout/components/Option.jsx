import React from "react";
import { GlobalButton } from "../../../utils/styledComponents";
import { OptionLi, OptionText } from "../styles";

const Option = ({ icon: Icon, text, onClick, fontSize = "1.5rem" }) => {
  return (
    <OptionLi onClick={onClick}>
      <GlobalButton
        margin="0"
        padding=".5rem 1rem"
        borderRadius=".5rem"
        width="auto"
        height="auto"
        fontSize="14px"
        justifyContent="start"
        gap="1rem"
        flexShrink="0"
      >
        {Icon && (
          <span style={{ fontSize }}>
            <Icon />
          </span>
        )}
        <OptionText>{text}</OptionText>
      </GlobalButton>
    </OptionLi>
  );
};

export default Option;
