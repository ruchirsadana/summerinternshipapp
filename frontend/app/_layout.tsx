import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#1B2A4A' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: '#F6F7FB' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="survey/new" options={{ title: 'New Survey' }} />
          <Stack.Screen name="responses/index" options={{ title: 'All Responses' }} />
          <Stack.Screen name="responses/[id]" options={{ title: 'Response Detail' }} />
          <Stack.Screen name="competitive" options={{ title: 'Competitive Tracker' }} />
          <Stack.Screen name="performance" options={{ title: 'My Performance' }} />
          <Stack.Screen name="dead-hours" options={{ title: 'Dead Hour Tracker' }} />
          <Stack.Screen name="insights" options={{ title: 'AI Insights Feed' }} />
          <Stack.Screen name="brand-health" options={{ title: 'Brand Health' }} />
          <Stack.Screen name="occasion-mapper" options={{ title: 'Occasion Mapper' }} />
          <Stack.Screen name="field-notes" options={{ title: 'Field Notes' }} />
          <Stack.Screen name="presentation" options={{ title: 'Presentation Mode' }} />
          <Stack.Screen name="pipeline" options={{ title: 'B2B Pipeline' }} />
          <Stack.Screen name="timeline" options={{ title: 'Project Timeline' }} />
          <Stack.Screen name="export" options={{ title: 'Export & Reports' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
