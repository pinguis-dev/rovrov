import { Tabs } from 'expo-router';

import { SplitTabBar } from '@/components/split-tab-bar';
import { TabIcon } from '@/design/icons';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <SplitTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'TL',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="tl" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="map" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notice',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="notifications" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="account" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
