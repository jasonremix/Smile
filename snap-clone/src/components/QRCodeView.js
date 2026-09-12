import qrGenerator from "qrcode-generator";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";

// Reines JS ohne natives Modul (bewusst kein react-native-svg) - eine neue
// native Abhaengigkeit wuerde die schon gebaute Standalone-APK ohne neuen
// nativen Build zum Absturz bringen. Der QR-Code wird stattdessen als Gitter
// aus einfachen Views gezeichnet, funktioniert also sofort per OTA-Update.
export default function QRCodeView({ value, size = 220 }) {
  const { count, isDark } = useMemo(() => {
    const qr = qrGenerator(0, "M");
    qr.addData(value);
    qr.make();
    return { count: qr.getModuleCount(), isDark: qr.isDark.bind(qr) };
  }, [value]);

  const cellSize = size / count;

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      {Array.from({ length: count }).map((_, row) =>
        Array.from({ length: count }).map((_, col) =>
          isDark(row, col) ? (
            <View
              key={`${row}-${col}`}
              style={{
                position: "absolute",
                top: row * cellSize,
                left: col * cellSize,
                width: cellSize,
                height: cellSize,
                backgroundColor: "#000",
              }}
            />
          ) : null
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 6,
    borderColor: colors.primary,
  },
});
