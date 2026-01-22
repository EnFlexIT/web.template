import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Props = {
  children: React.ReactNode;
};

export function ContentContainer({ children }: Props) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: "100%",
    maxWidth: 600,
    
            
   
    paddingHorizontal: 16,
  },
}));
