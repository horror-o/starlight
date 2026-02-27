import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import { CardDetailView } from '../components/CardDetailView';
import { COLORS } from '../theme';

type CardDetailScreenRouteProp = RouteProp<RootStackParamList, 'CardDetail'>;
type CardDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CardDetail'>;

export default function CardDetailScreen() {
  const route = useRoute<CardDetailScreenRouteProp>();
  const { card } = route.params;
  const navigation = useNavigation<CardDetailNavigationProp>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top + 10 }]}>
        <CardDetailView
            card={card}
            onClose={() => navigation.goBack()}
            onNavigateToCollection={(c) => navigation.navigate('AddCard', { card: c })}
            onNavigateToDeck={(deckId) => navigation.navigate('DeckDetail', { deckId })}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.deepVoid,
    paddingHorizontal: 10,
  },
});
