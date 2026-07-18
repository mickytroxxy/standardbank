import {
  Text as RNText,
  TextInput as RNTextInput,
  TextProps as RNTextProps,
  TextInputProps as RNTextInputProps,
  StyleSheet,
  TextStyle,
  StyleProp,
} from "react-native";
import { forwardRef } from "react";

/**
 * Helper to resolve the correct font family based on standard font weights.
 */
function resolveFontFamily(style?: StyleProp<TextStyle>) {
  let fontFamily = "BentonSans Regular";
  let fontWeight: TextStyle["fontWeight"] = undefined;

  if (!style) return { fontFamily };

  const flattenedStyle = StyleSheet.flatten(style) || {};

  // Map font weights to specific BentonSans families
  const weight = flattenedStyle.fontWeight;
  if (weight) {
    if (
      weight === "bold" ||
      weight === "600" ||
      weight === "700" ||
      weight === "800" ||
      weight === "900"
    ) {
      fontFamily = "BentonSans Bold";
      fontWeight = "normal"; // Reset so OS doesn't apply faux bold
    } else if (weight === "300" || weight === "200" || weight === "100") {
      fontFamily = "BentonSans Book";
      fontWeight = "normal";
    } else {
      fontFamily = "BentonSans Regular";
      fontWeight = "normal";
    }
  }

  return { fontFamily, fontWeight };
}

export type TextProps = RNTextProps;

export const Text = forwardRef<RNText, TextProps>((props, ref) => {
  const { style, ...rest } = props;
  const { fontFamily, fontWeight } = resolveFontFamily(style);

  return (
    <RNText
      ref={ref}
      style={[style, { fontFamily, ...(fontWeight && { fontWeight }) }]}
      {...rest}
    />
  );
});
Text.displayName = "Text";

export type TextInputProps = RNTextInputProps;

export const TextInput = forwardRef<RNTextInput, TextInputProps>((props, ref) => {
  const { style, ...rest } = props;
  const { fontFamily, fontWeight } = resolveFontFamily(style);

  return (
    <RNTextInput
      ref={ref}
      style={[style, { fontFamily, ...(fontWeight && { fontWeight }) }]}
      {...rest}
    />
  );
});
TextInput.displayName = "TextInput";
