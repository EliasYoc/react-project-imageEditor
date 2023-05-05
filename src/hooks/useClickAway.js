import { useEffect, useState } from "react";

const useClickAway = (element) => {
  const [isClickingAway, setIsClickingAway] = useState(false);

  useEffect(() => {
    const handleClick = (e) => {
      if (element && e.target.contains(element)) {
        alert("isClickingAway");
        setIsClickingAway(true);
      } else {
        setIsClickingAway(false);
      }
    };
    document.addEventListener("onClick", handleClick);

    return () => {
      document.removeEventListener("onClick", handleClick);
    };
  }, [element]);

  return [isClickingAway];
};

export default useClickAway;
