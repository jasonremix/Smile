import React, { useRef, useState } from "react";
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GradientView from "../components/GradientView";
import Icon from "../components/Icon";
import PrimaryButton from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "moment",
    title: "Willkommen bei Nata",
    text: "Social. Echt. Verbunden. Nata ist für kleine Freundeskreise gedacht - nicht für möglichst viel Reichweite.",
    isLogo: true,
  },
  {
    icon: "moment",
    title: "Moments & Storys",
    text: "Teile Fotos und Videos, die nach 24 Stunden verschwinden - oder archiviere deine liebsten Momente dauerhaft.",
  },
  {
    icon: "sparkle",
    title: "Nata AI",
    text: "Frag Nata AI jederzeit etwas - erkennbar als KI, mit einem täglichen Nachrichtenlimit, damit wir als kleines Team fair bleiben.",
  },
  {
    icon: "shield",
    title: "Sicher unterwegs",
    text: "Automatische Inhaltsprüfung, Melden & Blockieren, und ein Gründer, der Support-Tickets persönlich liest.",
  },
];

// Einmaliger Erster-Start-Flow (siehe onboardingSeen.js) - kein Feature-
// Tutorial mit erfundenen Funktionen, sondern eine ehrliche, kurze
// Einführung in das, was es wirklich gibt.
export default function OnboardingScreen({ onSkip, onNext }) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef(null);
  const isLast = index === SLIDES.length - 1;

  const goToIndex = (i) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  const handleNext = () => {
    if (isLast) {
      onNext();
    } else {
      goToIndex(index + 1);
    }
  };

  const handleScrollEnd = (e) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(newIndex);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableOpacity style={styles.skip} onPress={onSkip} hitSlop={10}>
        <Text style={styles.skipText}>{isLast ? "" : "Überspringen"}</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={styles.slide}>
            {slide.isLogo ? (
              <Image source={require("../../assets/logo-full.png")} style={styles.logo} resizeMode="contain" />
            ) : (
              <GradientView colors={[colors.primaryLight, colors.primary]} style={styles.iconRing}>
                <Icon name={slide.icon} size={30} color={colors.onPrimary} />
              </GradientView>
            )}
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.text}>{slide.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View key={slide.title} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <PrimaryButton
          title="Weiter"
          onPress={handleNext}
          style={{ marginBottom: insets.bottom + spacing.lg }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skip: {
    position: "absolute",
    top: spacing.xl,
    right: spacing.xl,
    zIndex: 2,
    padding: spacing.sm,
  },
  skipText: {
    color: colors.textMuted,
    ...typography.footnote,
    fontWeight: "600",
  },
  slide: {
    width,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  logo: {
    width: 220,
    height: 74,
    marginBottom: spacing.xxl,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  title: {
    color: colors.text,
    ...typography.title,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: spacing.md,
  },
  text: {
    color: colors.textMuted,
    ...typography.body,
    textAlign: "center",
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.surfaceLight,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
});
