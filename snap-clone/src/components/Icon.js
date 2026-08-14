import React from "react";
import { View } from "react-native";
import { colors } from "../theme/colors";

// Eigenes, minimalistisches Icon-System aus reinen View-Primitiven (keine
// SVG-Bibliothek) - react-native-svg waere ein neues natives Modul und
// wuerde die bereits verteilte Standalone-App beim naechsten OTA-Update
// zum Absturz bringen, bis ein komplett neuer nativer Build gemacht wird.
// Alle Icons teilen sich dieselbe Strichstaerke und dasselbe 24er-Raster,
// damit sie visuell zusammengehoeren.

const GRID = 24;
const STROKE = 1.75;

function Bar({ top, left, width, height = STROKE, color, rotate, radius = STROKE / 2 }) {
  return (
    <View
      style={{
        position: "absolute",
        top,
        left,
        width,
        height,
        backgroundColor: color,
        borderRadius: radius,
        transform: rotate ? [{ rotate: `${rotate}deg` }] : undefined,
      }}
    />
  );
}

function Ring({ top, left, size, color, open, rotate }) {
  return (
    <View
      style={{
        position: "absolute",
        top,
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: STROKE,
        borderColor: color,
        borderBottomColor: open ? "transparent" : color,
        borderRightColor: open ? "transparent" : color,
        transform: rotate ? [{ rotate: `${rotate}deg` }] : undefined,
      }}
    />
  );
}

function Box({ top, left, width, height, color, radius = 3, filled, openBottom }) {
  return (
    <View
      style={{
        position: "absolute",
        top,
        left,
        width,
        height,
        borderRadius: radius,
        borderBottomLeftRadius: openBottom ? 0 : radius,
        borderBottomRightRadius: openBottom ? 0 : radius,
        borderWidth: filled ? 0 : STROKE,
        borderBottomWidth: openBottom ? 0 : STROKE,
        borderColor: color,
        backgroundColor: filled ? color : "transparent",
      }}
    />
  );
}

function Tri({ top, left, direction = "up", size = 8, color, rotate }) {
  const base = { position: "absolute", top, left, width: 0, height: 0, borderColor: "transparent" };
  const styleByDirection = {
    up: { borderLeftWidth: size / 2, borderRightWidth: size / 2, borderBottomWidth: size, borderBottomColor: color },
    down: { borderLeftWidth: size / 2, borderRightWidth: size / 2, borderTopWidth: size, borderTopColor: color },
    right: { borderTopWidth: size / 2, borderBottomWidth: size / 2, borderLeftWidth: size, borderLeftColor: color },
    left: { borderTopWidth: size / 2, borderBottomWidth: size / 2, borderRightWidth: size, borderRightColor: color },
  };
  return (
    <View
      style={[base, styleByDirection[direction], rotate ? { transform: [{ rotate: `${rotate}deg` }] } : null]}
    />
  );
}

function Dot({ top, left, size = 3.5, color }) {
  return (
    <View
      style={{ position: "absolute", top, left, width: size, height: size, borderRadius: size / 2, backgroundColor: color }}
    />
  );
}

const GLYPHS = {
  home: (c) => (
    <>
      <Tri top={4} left={3} size={18} color={c} />
      <Box top={11} left={7} width={10} height={9} color={c} radius={1.5} />
    </>
  ),
  search: (c) => (
    <>
      <Ring top={4} left={4} size={11} color={c} />
      <Bar top={16} left={15} width={7} color={c} rotate={45} />
    </>
  ),
  plus: (c) => (
    <>
      <Bar top={5} left={11.1} width={STROKE} height={14} color={c} />
      <Bar top={11.1} left={5} width={14} height={STROKE} color={c} />
    </>
  ),
  close: (c) => (
    <>
      <Bar top={11.1} left={4} width={16} color={c} rotate={45} />
      <Bar top={11.1} left={4} width={16} color={c} rotate={-45} />
    </>
  ),
  check: (c) => (
    <>
      <Bar top={13.5} left={5.5} width={7} color={c} rotate={45} />
      <Bar top={9.5} left={9} width={13} color={c} rotate={-45} />
    </>
  ),
  people: (c) => (
    <>
      <Ring top={3} left={2.5} size={7} color={c} />
      <Box top={10.5} left={0.5} width={11} height={8} color={c} radius={5.5} openBottom />
      <Ring top={3} left={11.5} size={7} color={c} />
      <Box top={10.5} left={9.5} width={11} height={8} color={c} radius={5.5} openBottom />
    </>
  ),
  person: (c) => (
    <>
      <Ring top={3} left={8} size={8} color={c} />
      <Box top={12.5} left={4} width={16} height={10} color={c} radius={8} openBottom />
    </>
  ),
  chat: (c) => (
    <>
      <Box top={4.5} left={3} width={18} height={12} color={c} radius={5} />
      <Tri top={14.5} left={6} direction="down" size={6} color={c} rotate={20} />
    </>
  ),
  bell: (c) => (
    <>
      <Box top={4} left={7} width={10} height={10} color={c} radius={5} openBottom={false} />
      <Bar top={17.5} left={9} width={6} color={c} />
    </>
  ),
  send: (c) => <Tri top={5} left={3} direction="right" size={14} color={c} />,
  warning: (c) => (
    <>
      <Tri top={4} left={3} size={18} color={c} />
      <Bar top={11} left={11.1} width={STROKE} height={5} color={colors.background} />
      <Dot top={17.5} left={10.3} size={3} color={colors.background} />
    </>
  ),
  lock: (c) => (
    <>
      <Ring top={4} left={6.5} size={11} color={c} open />
      <Box top={11} left={5} width={14} height={10} color={c} radius={2.5} />
    </>
  ),
  document: (c) => (
    <>
      <Box top={3} left={6} width={12} height={18} color={c} radius={2} />
      <Bar top={9} left={9} width={6} height={1.3} color={c} />
      <Bar top={13} left={9} width={6} height={1.3} color={c} />
      <Bar top={17} left={9} width={6} height={1.3} color={c} />
    </>
  ),
  ticket: (c) => (
    <>
      <Box top={7} left={3} width={18} height={10} color={c} radius={3} />
      <Dot top={10.5} left={1.3} size={4} color={colors.surface} />
      <Dot top={10.5} left={19.3} size={4} color={colors.surface} />
    </>
  ),
  video: (c) => (
    <>
      <Box top={7} left={2} width={14} height={10} color={c} radius={2.5} />
      <Tri top={10} left={17} direction="right" size={7} color={c} />
    </>
  ),
  camera: (c) => (
    <>
      <Box top={7} left={4} width={16} height={11} color={c} radius={3} />
      <Box top={4} left={10} width={7} height={3} color={c} radius={1} />
      <Ring top={9} left={8.5} size={7} color={c} />
    </>
  ),
  flash: (c) => (
    <>
      <Tri top={3} left={9} direction="down" size={9} color={c} rotate={15} />
      <Tri top={12} left={7} direction="up" size={9} color={c} rotate={15} />
    </>
  ),
  flashOff: (c) => (
    <>
      <Tri top={3} left={9} direction="down" size={9} color={c} rotate={15} />
      <Tri top={12} left={7} direction="up" size={9} color={c} rotate={15} />
      <Bar top={11.1} left={4} width={16} color={c} rotate={45} />
    </>
  ),
  flip: (c) => (
    <>
      <Ring top={4} left={4} size={16} color={c} open rotate={45} />
      <Tri top={4.5} left={16} direction="up" size={6} color={c} rotate={80} />
    </>
  ),
  repeat: (c) => (
    <>
      <Ring top={4} left={4} size={16} color={c} open rotate={-135} />
      <Tri top={4.5} left={5.5} direction="up" size={6} color={c} rotate={-100} />
    </>
  ),
  flame: (c) => (
    <View
      style={{
        position: "absolute",
        top: 3,
        left: 6,
        width: 12,
        height: 18,
        borderRadius: 8,
        borderBottomLeftRadius: 0,
        backgroundColor: c,
        transform: [{ rotate: "-12deg" }],
      }}
    />
  ),
  bug: (c) => (
    <>
      <Box top={7} left={7} width={10} height={13} color={c} radius={5} />
      <Ring top={3.5} left={9.5} size={5} color={c} />
      <Bar top={9} left={2} width={6} color={c} rotate={-25} />
      <Bar top={13} left={2} width={6} color={c} rotate={25} />
      <Bar top={9} left={16} width={6} color={c} rotate={25} />
      <Bar top={13} left={16} width={6} color={c} rotate={-25} />
    </>
  ),
  bulb: (c) => (
    <>
      <Ring top={3} left={6} size={12} color={c} />
      <Box top={15} left={9} width={6} height={4} color={c} radius={1.5} />
    </>
  ),
  sparkle: (c) => (
    <>
      <Bar top={4} left={10.6} width={2.8} height={16} color={c} radius={1.4} />
      <Bar top={10.6} left={4} width={16} height={2.8} color={c} radius={1.4} />
    </>
  ),
  diamond: (c) => (
    <View
      style={{
        position: "absolute",
        top: 6.5,
        left: 6.5,
        width: 11,
        height: 11,
        borderWidth: STROKE,
        borderColor: c,
        transform: [{ rotate: "45deg" }],
      }}
    />
  ),
  crown: (c) => (
    <>
      <Tri top={7} left={2} size={7} color={c} />
      <Tri top={3} left={9} size={9} color={c} />
      <Tri top={7} left={16} size={7} color={c} />
      <Bar top={16} left={3} width={18} height={3} color={c} radius={1} />
    </>
  ),
  block: (c) => (
    <>
      <Ring top={3} left={3} size={18} color={c} />
      <Bar top={11.1} left={3.5} width={17} color={c} rotate={45} />
    </>
  ),
  flag: (c) => (
    <>
      <Bar top={3} left={6} width={STROKE} height={18} color={c} />
      <Box top={3} left={7} width={10} height={7} color={c} radius={0} filled />
    </>
  ),
  star: (c) => (
    <>
      <Bar top={4.2} left={11.1} width={2} height={15.6} color={c} radius={1} rotate={0} />
      <Bar top={4.2} left={11.1} width={2} height={15.6} color={c} radius={1} rotate={36} />
      <Bar top={4.2} left={11.1} width={2} height={15.6} color={c} radius={1} rotate={72} />
      <Bar top={4.2} left={11.1} width={2} height={15.6} color={c} radius={1} rotate={108} />
      <Bar top={4.2} left={11.1} width={2} height={15.6} color={c} radius={1} rotate={144} />
    </>
  ),
  back: (c) => (
    <>
      <Tri top={7} left={2} direction="left" size={10} color={c} />
      <Bar top={11.1} left={7} width={13} color={c} />
    </>
  ),
  moment: (c) => <Ring top={3} left={3} size={18} color={c} />,
  bookmark: (c) => (
    <>
      <Box top={4} left={6} width={12} height={15} color={c} radius={1.5} openBottom />
      <Bar top={16.5} left={6.7} width={7.5} color={c} rotate={55} />
      <Bar top={16.5} left={9.8} width={7.5} color={c} rotate={-55} />
    </>
  ),
  heart: (c) => (
    <>
      <View
        style={{
          position: "absolute",
          top: 8.5,
          left: 6,
          width: 12,
          height: 12,
          backgroundColor: c,
          transform: [{ rotate: "45deg" }],
        }}
      />
      <View style={{ position: "absolute", top: 5, left: 3, width: 9, height: 9, borderRadius: 4.5, backgroundColor: c }} />
      <View style={{ position: "absolute", top: 5, left: 12, width: 9, height: 9, borderRadius: 4.5, backgroundColor: c }} />
    </>
  ),
  grid: (c) => (
    <>
      <Box top={3} left={3} width={7} height={7} color={c} radius={1.5} />
      <Box top={3} left={14} width={7} height={7} color={c} radius={1.5} />
      <Box top={14} left={3} width={7} height={7} color={c} radius={1.5} />
      <Dot top={16.5} left={16.5} size={4} color={c} />
    </>
  ),
  settings: (c) => (
    <>
      <Bar top={6} left={3} width={18} height={STROKE} color={c} />
      <Dot top={3} left={12} size={6} color={c} />
      <Bar top={12} left={3} width={18} height={STROKE} color={c} />
      <Dot top={9} left={5} size={6} color={c} />
      <Bar top={18} left={3} width={18} height={STROKE} color={c} />
      <Dot top={15} left={16} size={6} color={c} />
    </>
  ),
  trash: (c) => (
    <>
      <Bar top={6} left={3} width={18} height={STROKE} color={c} />
      <Box top={3} left={9} width={6} height={3} color={c} radius={1} />
      <Box top={6} left={5.5} width={13} height={14} color={c} radius={2} />
    </>
  ),
  logout: (c) => (
    <>
      <Box top={4} left={3} width={10} height={16} color={c} radius={2.5} />
      <Bar top={11.1} left={8} width={11} color={c} />
      <Tri top={8} left={16.5} direction="right" size={7} color={c} />
    </>
  ),
};

export default function Icon({ name, size = 22, color = colors.text, style }) {
  const draw = GLYPHS[name];
  if (!draw) return <View style={{ width: size, height: size }} />;
  const scale = size / GRID;
  return (
    <View style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, style]}>
      <View style={{ width: GRID, height: GRID, transform: [{ scale }] }}>{draw(color)}</View>
    </View>
  );
}
