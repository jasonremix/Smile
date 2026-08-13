import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

// Faengt Render-Fehler ab, die sonst zu einem stummen leeren/weissen Bildschirm
// fuehren wuerden, und zeigt die Fehlermeldung + den Stacktrace direkt an.
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
          <Text style={styles.message}>{String(this.state.error?.message || this.state.error)}</Text>
          {this.state.error?.stack ? (
            <Text style={styles.stack}>{this.state.error.stack}</Text>
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
    backgroundColor: "#1a0000",
  },
  content: {
    padding: 24,
    paddingTop: 64,
  },
  title: {
    color: "#ff6b6b",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  message: {
    color: "#ffffff",
    fontSize: 15,
    marginBottom: 16,
  },
  stack: {
    color: "#ff9999",
    fontSize: 11,
    fontFamily: "monospace",
  },
});
