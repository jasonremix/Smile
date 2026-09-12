import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { listenCircles, MAX_CIRCLES_PER_USER } from "../services/circleService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Eigene Kreise (Familie/Arbeit/Gaming/...) statt nur der einen festen
// "Enge Freunde"-Liste - beim Teilen eines Moments waehlbar, um gezielt nur
// einen Ausschnitt der eigenen Connections zu erreichen.
export default function CirclesScreen({ navigation }) {
  const { user } = useAuth();
  const [circles, setCircles] = useState([]);

  useEffect(() => {
    const unsubscribe = listenCircles(user.uid, setCircles);
    return unsubscribe;
  }, [user.uid]);

  const atLimit = circles.length >= MAX_CIRCLES_PER_USER;

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Meine Kreise" />
      <Text style={styles.intro}>
        Erstelle eigene Kreise - z.B. Familie, Arbeit oder Gaming - um beim Teilen eines Moments
        gezielt nur die richtigen Connections zu erreichen.
      </Text>

      <FlatList
        data={circles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.circleRow}
            onPress={() => navigation.navigate("CircleEdit", { circle: item })}
          >
            <Text style={styles.circleEmoji}>{item.emoji || "💜"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.circleName}>{item.name}</Text>
              <Text style={styles.circleCount}>
                {(item.memberUids || []).length} {(item.memberUids || []).length === 1 ? "Person" : "Personen"}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Noch keine Kreise angelegt. Erstelle deinen ersten Kreis, um Momente gezielter zu teilen.
          </Text>
        }
      />

      <TouchableOpacity
        style={[styles.createButton, atLimit && styles.createButtonDisabled]}
        onPress={() => !atLimit && navigation.navigate("CircleEdit", {})}
        disabled={atLimit}
      >
        <Icon name="plus" size={16} color={colors.onPrimary} style={{ marginRight: spacing.sm }} />
        <Text style={styles.createButtonText}>{atLimit ? `Maximal ${MAX_CIRCLES_PER_USER} Kreise` : "Neuer Kreis"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  intro: {
    color: colors.textMuted,
    ...typography.footnote,
    lineHeight: 18,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  circleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  circleEmoji: {
    fontSize: 26,
    marginRight: spacing.md,
  },
  circleName: {
    color: colors.text,
    ...typography.body,
    fontWeight: "600",
  },
  circleCount: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: 2,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 20,
  },
  emptyText: {
    color: colors.textMuted,
    ...typography.footnote,
    textAlign: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    lineHeight: 18,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  createButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  createButtonText: {
    color: colors.onPrimary,
    ...typography.subhead,
    fontWeight: "700",
  },
});
