import React from "react";
import { View } from "react-native";

// expo-linear-gradient ist ein natives Modul, das erst mit dem naechsten
// nativen Build in den ausgelieferten Apps steckt - anders als bei reinen
// JS-Funktionen (siehe pushNotifications.js) wuerde ein fehlendes natives
// Modul beim RENDERN abstuerzen, nicht nur beim Aufrufen. Deshalb hier
// zusaetzlich ein Laufzeit-Fallback: schlaegt das Rendern fehl (Alt-App
// ohne dieses Modul), faengt eine kleine Error Boundary das ab und zeigt
// stattdessen eine flache Flaeche in der ersten Verlaufsfarbe - optisch ein
// kleiner Unterschied, aber kein Absturz.
let LinearGradient = null;
try {
  LinearGradient = require("expo-linear-gradient").LinearGradient;
} catch (e) {
  LinearGradient = null;
}

class GradientErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

export default function GradientView({ colors: gradientColors, style, children, ...rest }) {
  const fallback = <View style={[style, { backgroundColor: gradientColors[0] }]}>{children}</View>;
  if (!LinearGradient) return fallback;
  return (
    <GradientErrorBoundary fallback={fallback}>
      <LinearGradient colors={gradientColors} style={style} {...rest}>
        {children}
      </LinearGradient>
    </GradientErrorBoundary>
  );
}
