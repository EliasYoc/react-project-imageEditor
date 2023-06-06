import { useEffect, useState } from "react";

const useClickAway = (element) => {
  const [isClickingAway, setIsClickingAway] = useState(false);

  useEffect(() => {
    const handleClick = (e) => {
      if (element && e.currentTarget.contains(element)) {
        setIsClickingAway(true);
      } else {
        setIsClickingAway(false);
      }
    };
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [element]);

  return [isClickingAway];
};

export default useClickAway;
