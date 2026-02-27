import { View, ViewProps, ScrollView } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Props = ViewProps & {
  scrollable?: boolean; // optional
};

export function Screen({ scrollable = true, ...props }: Props) {
  if (scrollable) {
    return (
      <ScrollView
        contentContainerStyle={[styles.container, props.style]}
        showsVerticalScrollIndicator
      >
        {props.children}
      </ScrollView>
    );
  }

  return <View {...props} style={[styles.container, props.style]} />;
}

const styles = StyleSheet.create((theme) => ({
  container: {
    padding: theme.info.screenMargin,
    maxWidth: theme.info.maxContentWidth,
    flexGrow: 1, 
    
  },
}));