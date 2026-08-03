// XButton.tsx
import React from "react";
import { Pressable, View } from "react-native";
import { BlurView } from "expo-blur";
import AntDesign from "@expo/vector-icons/AntDesign";
import { StyleSheet } from "react-native-unistyles";

interface XButtonProps {
  onPress: () => void;
  size?: number; // optional, default = 34
  tint?: "light" | "dark";
  color?: string;
}

export const XButton: React.FC<XButtonProps> = ({
  onPress,
  size = 34,
  tint = "light",
  color = "#000000ff",
}) => {
  const radius = size ;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <BlurView intensity={40} tint={tint} style={[styles.blur, { borderRadius: radius }]}>
        <Pressable onPress={onPress} style={styles.pressable}>
          <AntDesign name="close" size={16} color={color} />
        </Pressable>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create(() => ({
  container: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 999,
  },
  blur: {
    flex: 1,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5, // Android shadow
  },
  pressable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
}));
