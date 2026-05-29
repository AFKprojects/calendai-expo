import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { CalendarScreen } from './src/screens/CalendarScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ArchiveScreen } from './src/screens/ArchiveScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Calendar"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#FAF9F6' },
          }}
        >
          <Stack.Screen name="Calendar" component={CalendarScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Archive" component={ArchiveScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
