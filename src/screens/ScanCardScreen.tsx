import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme';
import { searchCards, getCardById, getCardBySetCode } from '../services/api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { identifyCardWithGemini, GeminiCardData } from '../services/gemini';

type ScanScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ScanCard'>;

export default function ScanCardScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation<ScanScreenNavigationProp>();

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
      if (cameraRef.current && !scanning) {
          setScanning(true);
          try {
              const photo = await cameraRef.current.takePictureAsync({
                  quality: 1.0,
                  base64: true,
                  skipProcessing: true,
              });
              
              if (photo && photo.base64) {
                  processImage(photo.base64);
              }
          } catch (error) {
              console.error(error);
              setScanning(false);
          }
      }
  };

  const processImage = async (base64Image: string) => {
      console.log('Processing image with Gemini...');
      
      try {
          const geminiData = await identifyCardWithGemini(base64Image);
          await resolveCard(geminiData);
      } catch (error: any) {
          console.error('Gemini Scan Error:', error);
          if (error.message.includes('API Key not configured')) {
              Alert.alert("Configuration Error", "Gemini API Key is not configured in the app.");
          } else {
             Alert.alert("Scan Failed", "Could not identify card. Please try again or enter manually.");
          }
          setScanning(false);
      }
  };

  const resolveCard = async (data: GeminiCardData) => {
      console.log('Resolving card data:', data);
      let detectedCard = null;

      // 1. Try Passcode (Most reliable)
      if (data.passcode) {
          // Clean non-digit characters just in case
          const cleanPasscode = data.passcode.replace(/\D/g, '');
          if (cleanPasscode.length >= 7) { // Some passcodes are 7 or 8 digits
              console.log('Searching by Passcode:', cleanPasscode);
              detectedCard = await getCardById(cleanPasscode);
          }
      }

      // 2. Try Set Number (Reliable for specific printing)
      if (!detectedCard && data.setNumber) {
           console.log('Searching by Set Number:', data.setNumber);
           // Try to find the card via set code if API supports it, or if we had a dedicated endpoint.
           // Since we added getCardBySetCode:
           detectedCard = await getCardBySetCode(data.setNumber);
      }

      // 3. Try Name (Fuzzy fallback)
      if (!detectedCard && data.name) {
          console.log('Searching by Name:', data.name);
          const results = await searchCards(data.name);
          if (results && results.length > 0) {
              // Try to pick the best match? Just picking first for now.
              detectedCard = results[0];
          }
      }

      if (detectedCard) {
          finishScan(detectedCard, data);
      } else {
          Alert.alert("Not Found", "Could not identify card in database.");
          setScanning(false);
      }
  };

  const finishScan = (card: any, geminiData: GeminiCardData) => {
      navigation.replace('AddCard', { 
          card: card,
          guessedRarity: geminiData.rarity,
          scannedSetCode: geminiData.setNumber,
          fromScan: true
      });
      setScanning(false);
  };

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing={facing} 
        ref={cameraRef}
        autofocus="on"
        zoom={0}
      >
        <View style={styles.overlay}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Ionicons name="close" size={30} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Scan Card</Text>
                <View style={{width: 30}} />
            </View>

            <View style={styles.guideContainer}>
                <View style={styles.guideFrame}>
                    <View style={[styles.corner, styles.tl]} />
                    <View style={[styles.corner, styles.tr]} />
                    <View style={[styles.corner, styles.bl]} />
                    <View style={[styles.corner, styles.br]} />
                </View>
                <Text style={styles.guideText}>Align card within frame</Text>
            </View>

            <View style={styles.controls}>
                {scanning ? (
                    <ActivityIndicator size="large" color={COLORS.electricCyan} />
                ) : (
                    <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
                        <View style={styles.captureInner} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff',
    fontFamily: FONTS.body,
  },
  camera: {
    flex: 1,
  },
  overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'space-between',
  },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 50,
      paddingHorizontal: 20,
  },
  closeButton: {
      padding: 10,
  },
  title: {
      color: '#fff',
      fontSize: 18,
      fontFamily: FONTS.header,
      fontWeight: 'bold',
  },
  guideContainer: {
      alignItems: 'center',
      justifyContent: 'center',
  },
  guideFrame: {
      width: 250,
      height: 360, // ~Card Ratio
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      position: 'relative',
  },
  corner: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderColor: COLORS.electricCyan,
  },
  tl: { top: -1, left: -1, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { top: -1, right: -1, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { bottom: -1, left: -1, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { bottom: -1, right: -1, borderBottomWidth: 3, borderRightWidth: 3 },
  guideText: {
      color: '#fff',
      marginTop: 20,
      fontFamily: FONTS.body,
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 5,
  },
  controls: {
      paddingBottom: 50,
      alignItems: 'center',
  },
  captureButton: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: 'rgba(255,255,255,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  captureInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#fff',
  },
  button: {
      backgroundColor: COLORS.electricCyan,
      padding: 15,
      borderRadius: 8,
      alignSelf: 'center',
  },
  buttonText: {
      color: '#000',
      fontWeight: 'bold',
  }
});
