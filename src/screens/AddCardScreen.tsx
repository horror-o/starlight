import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Image, Platform, KeyboardAvoidingView, Keyboard, Modal, FlatList } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { addCollectionItem } from '../services/storage';
import { CollectionItem, Condition, Edition, GradingCompany } from '../types';
import { Toast } from '../components/Toast';
import { SuccessView } from '../components/SuccessView';
import { COLORS, STYLES, FONTS } from '../theme';

type AddCardScreenRouteProp = RouteProp<RootStackParamList, 'AddCard'>;

const COMMON_RARITIES = [
    "Common", "Rare", "Super Rare", "Ultra Rare", "Secret Rare", 
    "Ultimate Rare", "Ghost Rare", "Starlight Rare", "Collector's Rare", 
    "Prismatic Secret Rare", "Quarter Century Secret Rare", "Gold Rare"
];

export default function AddCardScreen() {
  const route = useRoute<AddCardScreenRouteProp>();
  const { card, guessedRarity, scannedSetCode, fromScan } = route.params;
  const navigation = useNavigation<any>();

  // Auto-select set based on guessed rarity if available
  const initialSet = React.useMemo(() => {
      // 1. Priority: Exact Set Code match from Scan
      if (scannedSetCode && card.card_sets) {
          const match = card.card_sets.find(s => s.set_code === scannedSetCode);
          if (match) return match.set_code;
      }
      // 2. Priority: Guessed Rarity
      if (guessedRarity && card.card_sets) {
          const match = card.card_sets.find(s => s.set_rarity === guessedRarity);
          if (match) return match.set_code;
      }
      return card.card_sets?.[0]?.set_code || '';
  }, [card, guessedRarity, scannedSetCode]);

  // Form State
  const [selectedSet, setSelectedSet] = useState(initialSet);
  // Initialize rarity from the initial set, or guessed rarity, or Common
  const getRarityForSet = (setCode: string) => card.card_sets?.find(s => s.set_code === setCode)?.set_rarity;
  const [selectedRarity, setSelectedRarity] = useState(getRarityForSet(initialSet) || guessedRarity || 'Common');
   
  const [quantity, setQuantity] = useState('1');
  const [condition, setCondition] = useState<Condition>('NM');
  const [edition, setEdition] = useState<Edition>('1st Edition');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [isGraded, setIsGraded] = useState(false);
  const [gradingCompany, setGradingCompany] = useState<GradingCompany>('PSA');
  const [grade, setGrade] = useState('10');

  // UI Feedback
  const [toastVisible, setToastVisible] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [setPickerVisible, setSetPickerVisible] = useState(false); // New state for custom picker

  // Notify user if rarity was auto-detected
  useEffect(() => {
      if (guessedRarity && initialSet) {
          Alert.alert("Auto-Detection", `Detected ${guessedRarity} card. Selected matching set: ${initialSet}`);
      }
  }, [guessedRarity, initialSet]);

  // Update rarity when set changes
  useEffect(() => {
      if (selectedSet) {
          const rarity = getRarityForSet(selectedSet);
          if (rarity) {
              setSelectedRarity(rarity);
          }
      }
  }, [selectedSet]);

  const handleSave = async () => {
    Keyboard.dismiss();
    
    // Basic validation
    if (isGraded && (!grade || isNaN(Number(grade)))) {
      Alert.alert('Error', 'Please enter a valid numeric grade.');
      return;
    }
    
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
        Alert.alert('Error', 'Please enter a valid quantity (at least 1).');
        return;
    }

    const newItem: CollectionItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Simple ID generation
      cardId: card.id,
      cardData: card,
      setCode: selectedSet,
      setRarity: selectedRarity,
      condition,
      edition,
      isGraded,
      gradingCompany: isGraded ? gradingCompany : undefined,
      grade: isGraded ? Number(grade) : undefined,
      purchasePrice: purchasePrice || undefined,
      quantity: qty,
      dateAdded: new Date().toISOString(),
    };

    const success = await addCollectionItem(newItem);
    if (success) {
      setToastVisible(true);
      setSaveSuccess(true);
    } else {
      Alert.alert('Error', 'Failed to save card.');
    }
  };

  const handleScanAnother = () => {
    setSaveSuccess(false);
    setToastVisible(false);
    navigation.navigate('ScanCard');
  };

  const handleDone = () => {
    setToastVisible(false);
    navigation.goBack();
  };

  const handleViewCollection = () => {
      setSaveSuccess(false);
      setToastVisible(false);
      navigation.navigate('Tabs', { screen: 'Collection' });
  };
   
  // Combine rarities from card sets and common rarities, unique list
  const availableRarities = React.useMemo(() => {
      if (selectedSet && card.card_sets) {
          const matchingSets = card.card_sets.filter(s => s.set_code === selectedSet);
          if (matchingSets.length > 0) {
              const rarities = matchingSets.map(s => s.set_rarity).filter((r): r is string => !!r);
              if (rarities.length > 0) {
                  return [...new Set(rarities)].sort();
              }
          }
      }
      
      const setRarities = card.card_sets?.map(s => s.set_rarity) || [];
      const combined = [...new Set([...setRarities, ...COMMON_RARITIES])];
      return combined.sort();
  }, [card, selectedSet]);

  // Helper to get display label for the custom set picker
  const getSelectedSetLabel = () => {
      const s = card.card_sets?.find(s => s.set_code === selectedSet);
      return s ? `${s.set_name} (${s.set_code})` : 'Select Set';
  };

  return (
    <View style={styles.mainContainer}>
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, backgroundColor: COLORS.deepVoid }}
        >
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
            <Image source={{ uri: card.card_images[0].image_url_small }} style={styles.image} />
            <View style={styles.headerText}>
                <Text style={styles.cardName}>{card.name}</Text>
                <Text style={styles.cardType}>{card.type}</Text>
            </View>
        </View>

        <View style={styles.formContainer}>
            <Text style={styles.label}>Set</Text>
            
            {/* --- REPLACED PICKER WITH CUSTOM MODAL SELECTOR --- */}
            {card.card_sets && card.card_sets.length > 0 ? (
                <>
                    <TouchableOpacity 
                        style={styles.customPickerButton} 
                        onPress={() => setSetPickerVisible(true)}
                    >
                        <Text style={styles.customPickerText} numberOfLines={1}>
                            {getSelectedSetLabel()}
                        </Text>
                        <Text style={{color: COLORS.electricCyan}}>▼</Text>
                    </TouchableOpacity>

                    <Modal
                        visible={setPickerVisible}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setSetPickerVisible(false)}
                    >
                        <TouchableOpacity 
                            style={styles.modalOverlay} 
                            activeOpacity={1} 
                            onPress={() => setSetPickerVisible(false)}
                        >
                            <View style={styles.pickerModalContent}>
                                <Text style={styles.modalTitle}>Select Set</Text>
                                <FlatList
                                    data={card.card_sets}
                                    keyExtractor={(item) => item.set_code}
                                    style={{ maxHeight: 300 }}
                                    renderItem={({item}) => (
                                        <TouchableOpacity 
                                            style={styles.pickerModalItem}
                                            onPress={() => {
                                                setSelectedSet(item.set_code);
                                                setSetPickerVisible(false);
                                            }}
                                        >
                                            <Text style={styles.pickerModalItemText}>
                                                {item.set_name} <Text style={{color: COLORS.electricCyan}}>({item.set_code})</Text>
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        </TouchableOpacity>
                    </Modal>
                </>
            ) : (
                <View style={styles.pickerContainer}>
                     <Text style={styles.noSetsText}>No specific sets found in DB.</Text>
                </View>
            )}
            {/* ------------------------------------------------ */}
            
            <Text style={styles.label}>Rarity</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedRarity}
                    onValueChange={(itemValue) => setSelectedRarity(itemValue)}
                    style={styles.picker}
                    dropdownIconColor={COLORS.electricCyan}
                    style={{ color: COLORS.text }}
                >
                    {availableRarities.map((rarity, index) => (
                        <Picker.Item 
                            key={index} 
                            label={rarity} 
                            value={rarity} 
                            color={Platform.OS === 'android' ? '#000' : COLORS.text}
                        />
                    ))}
                </Picker>
            </View>
            
            <Text style={styles.label}>Quantity</Text>
            <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor={COLORS.textDim}
                value={quantity}
                onChangeText={setQuantity}
            />

            <Text style={styles.label}>Condition</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={condition}
                    onValueChange={(itemValue) => setCondition(itemValue)}
                    style={styles.picker}
                    dropdownIconColor={COLORS.electricCyan}
                    style={{ color: COLORS.text }}
                >
                    <Picker.Item label="Near Mint (NM)" value="NM" color={Platform.OS === 'android' ? '#000' : COLORS.text} />
                    <Picker.Item label="Lightly Played (LP)" value="LP" color={Platform.OS === 'android' ? '#000' : COLORS.text} />
                    <Picker.Item label="Moderately Played (MP)" value="MP" color={Platform.OS === 'android' ? '#000' : COLORS.text} />
                    <Picker.Item label="Heavy Played (HP)" value="HP" color={Platform.OS === 'android' ? '#000' : COLORS.text} />
                    <Picker.Item label="Damaged (DMG)" value="DMG" color={Platform.OS === 'android' ? '#000' : COLORS.text} />
                </Picker>
            </View>

            <Text style={styles.label}>Edition</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={edition}
                    onValueChange={(itemValue) => setEdition(itemValue)}
                    style={styles.picker}
                    dropdownIconColor={COLORS.electricCyan}
                    style={{ color: COLORS.text }}
                >
                    <Picker.Item label="1st Edition" value="1st Edition" color={Platform.OS === 'android' ? '#000' : COLORS.text} />
                    <Picker.Item label="Unlimited" value="Unlimited" color={Platform.OS === 'android' ? '#000' : COLORS.text} />
                    <Picker.Item label="Limited" value="Limited" color={Platform.OS === 'android' ? '#000' : COLORS.text} />
                </Picker>
            </View>

            <Text style={styles.label}>Purchase Price ($)</Text>
            <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={COLORS.textDim}
                value={purchasePrice}
                onChangeText={setPurchasePrice}
            />

            <View style={styles.switchRow}>
                <Text style={styles.label}>Graded?</Text>
                <Switch value={isGraded} onValueChange={setIsGraded} trackColor={{ false: "#767577", true: COLORS.electricCyan }} thumbColor={isGraded ? "#fff" : "#f4f3f4"}/>
            </View>

            {isGraded && (
                <View style={styles.gradedContainer}>
                    <Text style={styles.label}>Grading Company</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={gradingCompany}
                            onValueChange={(itemValue) => setGradingCompany(itemValue)}
                            style={styles.picker}
                            dropdownIconColor={COLORS.electricCyan}
                            style={{ color: COLORS.text }}
                        >
                            <Picker.Item label="PSA" value="PSA" color={Platform.OS === 'android' ? '#000' : COLORS.text} />
                            <Picker.Item label="Beckett (BGS)" value="BGS" color={Platform.OS === 'android' ? '#000' : COLORS.text} />
                            <Picker.Item label="CGC" value="CGC" color={Platform.OS === 'android' ? '#000' : COLORS.text} />
                            <Picker.Item label="Other" value="Other" color={Platform.OS === 'android' ? '#000' : COLORS.text} />
                        </Picker>
                    </View>

                    <Text style={styles.label}>Grade (1-10)</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="10"
                        placeholderTextColor={COLORS.textDim}
                        value={grade}
                        onChangeText={setGrade}
                        maxLength={4}
                    />
                </View>
            )}

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save to Collection</Text>
            </TouchableOpacity>
        </View>
        </ScrollView>
        </KeyboardAvoidingView>
        
        <Toast message="Added to Collection!" visible={toastVisible} />
        
        <Modal 
            visible={saveSuccess} 
            transparent={true} 
            animationType="fade"
            onRequestClose={handleDone}
        >
            <SuccessView 
                message="Card added to your collection."
                primaryText="Done"
                onPrimaryPress={handleDone}
                secondaryText={fromScan ? "+ Scan Another" : undefined}
                onSecondaryPress={fromScan ? handleScanAnother : undefined}
                tertiaryText="View Collection"
                onTertiaryPress={handleViewCollection}
            />
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.deepVoid,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.deepVoid,
  },
  header: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: COLORS.glassBackground,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.chromeMist,
  },
  image: {
    width: 60,
    height: 87,
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  cardName: {
    fontSize: 20,
    fontFamily: FONTS.header,
    color: COLORS.text,
  },
  cardType: {
    fontSize: 14,
    color: COLORS.textDim,
    fontFamily: FONTS.body,
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
    color: COLORS.electricCyan,
    fontFamily: FONTS.header,
  },
  // Custom Picker Styles
  customPickerButton: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.chromeMist,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  customPickerText: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FONTS.body,
    flex: 1,
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalContent: {
    width: '100%',
    backgroundColor: COLORS.deepVoid,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.chromeMist,
    overflow: 'hidden',
    padding: 20,
  },
  modalTitle: {
      fontSize: 18,
      fontFamily: FONTS.header,
      color: COLORS.electricCyan,
      marginBottom: 15,
      textAlign: 'center',
  },
  pickerModalItem: {
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  pickerModalItemText: {
      color: COLORS.text,
      fontSize: 16,
      fontFamily: FONTS.body,
      flexWrap: 'wrap', // This ensures text wraps
  },
  // End Custom Picker Styles
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.chromeMist,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 10,
    ...Platform.select({
      android: {
        height: 50,
        justifyContent: 'center',
      },
      ios: {
        height: 150,
      }
    })
  },
  picker: {
    width: '100%',
     ...Platform.select({
      android: {
         height: 50,
         color: COLORS.text,
      },
      ios: {
          color: COLORS.text,
      }
    })
  },
  noSetsText: {
      color: COLORS.textDim,
      fontStyle: 'italic',
      marginBottom: 10,
      fontFamily: FONTS.body,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.chromeMist,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FONTS.body,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  gradedContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.chromeMist,
  },
  saveButton: {
    backgroundColor: COLORS.electricCyan,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
    shadowColor: COLORS.electricCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: FONTS.header,
  },
});
