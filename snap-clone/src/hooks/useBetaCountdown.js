import { useEffect, useState } from "react";
import { getBetaCountdown } from "../utils/betaCountdown";

// Minuetlicher Refresh reicht - der Countdown zeigt Tage/Stunden/Minuten,
// keine Sekunden, ein sekuendlicher Timer waere unnoetiger Akkuverbrauch.
export function useBetaCountdown() {
  const [countdown, setCountdown] = useState(() => getBetaCountdown());

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getBetaCountdown()), 60000);
    return () => clearInterval(interval);
  }, []);

  return countdown;
}
