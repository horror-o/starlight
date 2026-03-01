import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { useFonts, Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './src/theme';

export default function App() {
  let [fontsLoaded] = useFonts({
    Orbitron_700Bold,
    Inter_400Regular,
    Inter_500Medium,
  });

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" color={COLORS.electricCyan} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#eff3f6', '#dbe4eb', '#c5d3df']} // Soft pastel blue/grey gradient
      style={styles.container}
    >
      <AppNavigator />
      <StatusBar style="dark" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.deepVoid,
  },
});
