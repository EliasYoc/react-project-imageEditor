import { LayoutToolBox } from "../../utils/styledComponents";
const Header = ({ children }) => {
  return (
    <LayoutToolBox
      className="animationAppearDown"
      width="100%"
      position="relative"
      justifyContent="space-between"
      display="flex"
      gap="1rem"
      margin="0 0 10px"
      borderRadius="0px"
      padding="0 10px"
    >
      {children}
    </LayoutToolBox>
  );
};

export default Header;
