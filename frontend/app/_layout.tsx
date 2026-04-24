import React from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const goBack = () => {
  if (router.canGoBack()) router.back();
  else router.replace('/');
};

const BackButton = () => (
  <TouchableOpacity onPress={goBack} testID="header-back" style={{ paddingHorizontal: 12, paddingVertical: 4 }}>
    <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
  </TouchableOpacity>
);

const HomeButton = () => (
  <TouchableOpacity onPress={() => router.replace('/')} testID="header-home" style={{ paddingHorizontal: 12, paddingVertical: 4 }}>
    <Ionicons name="home" size={22} color="#FFFFFF" />
  </TouchableOpacity>
);

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
            headerBackVisible: false,
            headerLeft: () => <BackButton />,
            headerRight: () => <HomeButton />,
            // Disable swipe-back confusion on web
            ...(Platform.OS === 'web' ? { animation: 'none' as const } : {}),
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false, headerLeft: undefined, headerRight: undefined }} />
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
          <Stack.Screen name="calculator" options={{ title: 'KPI Calculator' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
