import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PHOTO_FILTERS } from "../utils/photoFilters";
import { colors } from "../theme/colors";

// Horizontale Filter-Auswahl im Snapchat-Stil - jeder Chip zeigt eine
// kleine Vorschau des Farbtons plus Label, aktiver Filter ist umrandet.
export default function FilterPickerRow({ value, onChange, style }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={style}
      contentContainerStyle={styles.row}
    >
      {PHOTO_FILTERS.map((f) => {
        const active = value === f.id;
        return (
          <TouchableOpacity key={f.id} style={styles.item} onPress={() => onChange(f.id)}>
            <View
              style={[
                styles.swatch,
                active && styles.swatchActive,
                f.overlayColor ? { backgroundColor: f.overlayColor } : styles.swatchNone,
              ]}
            />
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {f.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    gap: 14,
    alignItems: "center",
  },
  item: {
    alignItems: "center",
    width: 56,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  swatchActive: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  swatchNone: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  label: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
  labelActive: {
    color: colors.text,
    fontWeight: "700",
  },
});
