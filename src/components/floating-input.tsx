import { Text, TextInput } from "@/components/typography";
import { Brand, Spacing } from "@/constants/theme";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, View, type TextInputProps } from "react-native";

export type FloatingFieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: TextInputProps["keyboardType"];
  hint?: string;
  rightAccessory?: React.ReactNode;
  prefix?: string;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoCorrect?: TextInputProps["autoCorrect"];
};

export function FloatingLabelInput({
  label,
  value,
  onChangeText,
  keyboardType,
  hint,
  rightAccessory,
  prefix,
  autoCapitalize,
  autoCorrect,
}: FloatingFieldProps) {
  const [focused, setFocused] = useState(false);
  const floated = focused || (value && value.length > 0);
  const [anim] = useState(() => new Animated.Value(floated ? 1 : 0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: floated ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [floated, anim]);

  const labelTop = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });
  const labelSize = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [17, 12],
  });
  const labelColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [Brand.textMuted, Brand.textMuted],
  });

  return (
    <View style={floatStyles.wrap}>
      <Animated.Text
        pointerEvents="none"
        style={[
          floatStyles.label,
          { top: labelTop, fontSize: labelSize, color: labelColor },
        ]}
      >
        {label}
      </Animated.Text>
      <View style={floatStyles.inputRow}>
        {prefix && floated ? (
          <Text style={floatStyles.prefix}>{prefix}</Text>
        ) : null}
        <TextInput
          style={floatStyles.input}
          value={value ?? ""}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={keyboardType}
          underlineColorAndroid="transparent"
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
        />
        {rightAccessory ? (
          <View style={floatStyles.accessory}>{rightAccessory}</View>
        ) : null}
      </View>
      {hint ? <Text style={floatStyles.hint}>{hint}</Text> : null}
    </View>
  );
}

const floatStyles = StyleSheet.create({
  wrap: {
    marginTop: Spacing.three,
    paddingTop: 14,
  },
  label: {
    position: "absolute",
    left: 0,
    color: Brand.textMuted,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Brand.divider,
  },
  prefix: {
    fontSize: 17,
    color: Brand.navy,
    paddingVertical: Spacing.one,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: Brand.navy,
    paddingVertical: Spacing.one,
    paddingHorizontal: 0,
    margin: 0,
  },
  accessory: { paddingLeft: Spacing.two },
  hint: {
    color: Brand.textMuted,
    fontSize: 13,
    marginTop: Spacing.one * 3,
  },
});
