// Fixture: a React Native screen with literal values in StyleSheet. Every style value below should be flagged.
import { StyleSheet, Text, View } from 'react-native';
const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 10, elevation: 4, shadowColor: 'rgba(0,0,0,0.3)' },
  title: { color: 'black', fontSize: 17, fontWeight: '700', fontFamily: 'Helvetica' },
});
export const Bad = () => <View style={styles.card}><Text style={[styles.title, { marginBottom: 6 }]}>Sheru</Text></View>;
