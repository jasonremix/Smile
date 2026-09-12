import React from "react";
import { View } from "react-native";

// Social-Login (Google/Apple) braucht native Module (expo-auth-session,
// expo-web-browser, expo-apple-authentication, expo-crypto), die es nur in
// einem frischen nativen Build gibt. Aeltere App-Installationen haben diese
// Module NICHT - ein statischer Import wuerde dort schon beim App-Start
// abstuerzen (requireNativeModule wirft beim Laden). Deshalb werden die
// Buttons hier bewusst nur "weich" per require in einem try/catch geladen:
// fehlen die Module, wird Social-Login einfach ausgeblendet und der normale
// E-Mail-Login bleibt voll nutzbar. Dadurch laeuft dasselbe JS-Bundle sowohl
// auf alten (ohne Module) als auch neuen (mit Modulen) App-Versionen.
let GoogleSignInButton = null;
let AppleSignInButton = null;
try {
  GoogleSignInButton = require("./GoogleSignInButton").default;
  AppleSignInButton = require("./AppleSignInButton").default;
} catch (e) {
  GoogleSignInButton = null;
  AppleSignInButton = null;
}

export const socialSignInAvailable = !!(GoogleSignInButton || AppleSignInButton);

export default function SocialSignInRow({ buttonStyle }) {
  if (!GoogleSignInButton && !AppleSignInButton) return null;
  return (
    <View>
      {GoogleSignInButton ? <GoogleSignInButton style={buttonStyle} /> : null}
      {AppleSignInButton ? <AppleSignInButton style={buttonStyle} /> : null}
    </View>
  );
}
