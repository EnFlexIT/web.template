import { View } from "react-native";
import { Text } from "../components/stylistic/Text";
import { Card } from "../components/ui-elements/Card";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";
import { useLinkTo } from "@react-navigation/native";
import { SmallStat } from "../components/ui-elements/SmallStat";
export function SettingsScreen() {
  const linkTo = useLinkTo();
  const { theme } = useUnistyles();
  const colors: any = theme.colors;

  const descriptionColor =
    colors.textMuted ?? colors.subText ?? colors.textSecondary ?? theme.colors.text;

  return (
    <View style={{ flex: 1, padding: 24, gap: 24 }}>
      {/* Header */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 22, fontWeight: "600" }}>Settings</Text>
       
      </View>

      {/* Cards */}
      <View style={{ gap: 12, flexDirection: "row" }}>
        
        <Card  
        padding="sm" 
         onPress={() => linkTo("/3010")} contentStyle={styles.cardContent}
         >
          <Text style={styles.title}>Database Connections & Settings</Text>
          
        </Card>

          <Card 
          padding="sm"
          onPress={() => linkTo("/3004")} contentStyle={styles.cardContent}>
          <Text style={styles.title}>Allgmein</Text>
          
        </Card>

        <Card 
        padding="sm"
        onPress={() => linkTo("/3005")} contentStyle={styles.cardContent}>
          <Text style={styles.title}>Privacy</Text>
         
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  cardContent: {
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    opacity: 0.8,
  },
}));
