import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import SearchScreen from '../screens/SearchScreen';
import WishlistScreen from '../screens/WishlistScreen';
import CollectionScreen from '../screens/CollectionScreen';
import CardDetailScreen from '../screens/CardDetailScreen';
import AddCardScreen from '../screens/AddCardScreen';
import DecksScreen from '../screens/DecksScreen';
import DeckDetailScreen from '../screens/DeckDetailScreen';
import ScanCardScreen from '../screens/ScanCardScreen';
import { Card } from '../services/api';
import { FloatingDock } from '../components/FloatingDock';
import { COLORS, STYLES, FONTS } from '../theme';

export type RootStackParamList = {
  Tabs: undefined;
  CardDetail: { card: Card };
  AddCard: { card: Card; guessedRarity?: string; scannedSetCode?: string; fromScan?: boolean };
  DeckDetail: { deckId: string };
  ScanCard: undefined;
};

export type TabParamList = {
  Search: undefined;
  Collection: undefined;
  Decks: undefined;
  Wishlist: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingDock {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
        },
        sceneStyle: { backgroundColor: 'transparent' } // Important for transparency
      }}
    >
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarAccessibilityLabel: 'Search Tab' }} />
      <Tab.Screen name="Collection" component={CollectionScreen} options={{ tabBarAccessibilityLabel: 'Collection Tab' }} />
      <Tab.Screen name="Decks" component={DecksScreen} options={{ tabBarAccessibilityLabel: 'Decks Tab' }} />
      <Tab.Screen name="Wishlist" component={WishlistScreen} options={{ tabBarAccessibilityLabel: 'Wishlist Tab' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
            headerStyle: {
                backgroundColor: COLORS.deepVoid,
            },
            headerTintColor: COLORS.electricCyan,
            headerTitleStyle: {
                fontFamily: FONTS.header,
                color: COLORS.text,
            },
            contentStyle: {
                backgroundColor: COLORS.deepVoid,
            }
        }}
      >
        <Stack.Screen 
          name="Tabs" 
          component={TabNavigator} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="CardDetail" 
          component={CardDetailScreen} 
          options={{ title: 'Card Details' }}
        />
        <Stack.Screen 
          name="AddCard" 
          component={AddCardScreen} 
          options={{ title: 'Add to Collection' }}
        />
        <Stack.Screen 
          name="DeckDetail" 
          component={DeckDetailScreen} 
          options={{ title: 'Deck Builder' }}
        />
        <Stack.Screen 
          name="ScanCard" 
          component={ScanCardScreen} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
