import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { TimelineScreen } from '@/screens/TimelineScreen';
import { RoveScreen } from '@/screens/RoveScreen';
import { PostScreen } from '@/screens/PostScreen';
import { AccountScreen } from '@/screens/AccountScreen';
import { NavigationTabParamList } from '@/types';

const Tab = createBottomTabNavigator<NavigationTabParamList>();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Timeline':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Rove':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Post':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Account':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
      })}>
      <Tab.Screen name="Timeline" component={TimelineScreen} />
      <Tab.Screen name="Rove" component={RoveScreen} />
      <Tab.Screen name="Post" component={PostScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
};