import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Faengt Render-Fehler ab, die sonst zu einem stummen leeren/weissen Bildschirm
// fuehren wuerden, und zeigt die Fehlermeldung + den Stacktrace direkt an -
// im normalen App-Theme statt einer eigenen, dazu passenden Farbwelt.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={styles.title}>Etwas ist schiefgelaufen</Text>
          <Text style={styles.subtitle}>Nicht deine Schuld - das ist ein Fehler in der App.</Text>
          <Text style={styles.message}>{String(this.state.error?.message || this.state.error)}</Text>
          {this.state.error?.stack ? (
            <ScrollView horizontal style={styles.stackWrap}>
              <Text style={styles.stack}>{this.state.error.stack}</Text>
            </ScrollView>
          ) : null}
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    paddingTop: 64,
  },
  title: {
    color: colors.text,
    ...typography.title,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    ...typography.footnote,
    marginBottom: spacing.lg,
  },
  message: {
    color: colors.danger,
    ...typography.body,
    marginBottom: spacing.lg,
  },
  stackWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  stack: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: "monospace",
  },
});
