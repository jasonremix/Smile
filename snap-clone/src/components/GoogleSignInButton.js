import React from "react";
import { Text } from "react-native";
import PrimaryButton from "./PrimaryButton";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";
import { colors } from "../theme/colors";

export default function GoogleSignInButton({ style }) {
  const { signIn, signingIn, error, ready } = useGoogleSignIn();

  return (
    <>
      <PrimaryButton
        title="Mit Google fortfahren"
        variant="outline"
        onPress={signIn}
        disabled={!ready}
        loading={signingIn}
        style={style}
      />
      {error ? <Text style={{ color: colors.danger, fontSize: 12, marginTop: 6, textAlign: "center" }}>{error}</Text> : null}
    </>
  );
}
