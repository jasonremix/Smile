import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "./Icon";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Gemeinsamer Screen-Header auf Basis von useSafeAreaInsets statt fester
// paddingTop-Werte (56/60/80) pro Screen - passt sich Notch/Dynamic Island
// automatisch an. Mit onBack: zentrierter Titel im "Detail"-Stil (wie ein
// nativer Stack-Header). Ohne onBack: grosser, linksbuendiger Titel im
// "Tab-Root"-Stil.
export default function ScreenHeader({ title, onBack, backIcon = "back", right, style }) {
  const insets = useSafeAreaInsets();
  const isDetail = !!onBack;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }, style]}>
      {isDetail ? (
        <>
          <TouchableOpacity onPress={onBack} style={styles.iconButton} hitSlop={8}>
            <Icon name={backIcon} size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.detailTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.rightSlot}>{right || <View style={styles.iconButton} />}</View>
        </>
      ) : (
        <>
          <Text style={styles.largeTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.rightSlot}>{right}</View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  rightSlot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  detailTitle: {
    flex: 1,
    textAlign: "center",
    color: colors.text,
    ...typography.headline,
  },
  largeTitle: {
    flex: 1,
    color: colors.text,
    ...typography.largeTitle,
  },
});
