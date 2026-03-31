import { getTypebotCookie } from "@typebot.io/telemetry/cookies/helpers";
import { useEffect, useState } from "react";

export const useIsAuthenticated = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const typebotCookie = getTypebotCookie(document.cookie);
    const hasProfitPilotUser = localStorage.getItem('profit_pilot_user') !== null;
    
    if (typebotCookie?.lastProvider || typebotCookie?.landingPage?.isMerged || hasProfitPilotUser)
      setIsAuthenticated(true);
  }, []);

  return isAuthenticated;
};
