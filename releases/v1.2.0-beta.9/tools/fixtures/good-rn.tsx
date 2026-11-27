// Fixture: a React Native screen that takes every value from antzTheme.
import { StyleSheet, Text, View } from 'react-native';
import { antzTheme } from '@antz/design-system/react-native';
const c = antzTheme.colors.light;
const styles = StyleSheet.create({
  card: { backgroundColor: c.surface, padding: antzTheme.space['4'], borderRadius: antzTheme.radius.lg, ...antzTheme.shadow.light.sm, borderWidth: 1, flex: 1 },
  title: { color: c.text, fontSize: antzTheme.fontSize.lg, fontWeight: antzTheme.fontWeight.semibold, fontFamily: antzTheme.fontFamily.body, margin: 0 },
});
export const Good = () => <View style={styles.card}><Text style={styles.title}>Sheru</Text></View>;
