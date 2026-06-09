import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Tela nao encontrada.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Voltar para Mission Control</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Palette.background,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: Palette.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: Palette.accent,
  },
});
