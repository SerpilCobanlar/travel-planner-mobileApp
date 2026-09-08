// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, ViewStyle } from 'react-native';

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.
  'house.fill': 'home',
  'paperplane.fill': 'explore',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'gearshape.fill': 'settings',
  'sun.max.fill': 'light-mode',
  'moon.fill': 'dark-mode',
  'globe': 'language',
  'rectangle.portrait.and.arrow.right': 'logout',
  'pencil': 'edit',
  'trash': 'delete',
  'map': 'map',
  'gearshape': 'settings',
  'person.fill': 'person',
  'calendar': 'calendar-today',
  'clock': 'access-time',
  'doc.text.image': 'feed',
} as Record<string, keyof typeof MaterialIcons.glyphMap>;

export type IconSymbolName = keyof typeof MAPPING | string;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name as keyof typeof MAPPING] as any} style={style as any} />;
}
