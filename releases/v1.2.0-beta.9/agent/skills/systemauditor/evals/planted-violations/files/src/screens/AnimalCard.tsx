import { StyleSheet, Text, View } from 'react-native';
const styles = StyleSheet.create({
  card: { backgroundColor: '#F4F4F4', padding: 13, borderRadius: 9 },
  name: { color: '#222222', fontSize: 15 },
});
export const AnimalCard = ({ name }: { name: string }) => <View style={styles.card}><Text style={styles.name}>{name}</Text></View>;
