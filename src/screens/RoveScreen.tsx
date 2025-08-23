import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pin } from '@/types';

export const RoveScreen: React.FC = () => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [region, setRegion] = useState({
    latitude: 35.6762,
    longitude: 139.6503,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const fetchPins = async () => {
    setLoading(true);
    try {
      // TODO: Implement Supabase query for pins
      setPins([]);
    } catch (error) {
      console.error('Error fetching pins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPins();
  }, []);

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  const handlePinPress = (pin: Pin) => {
    setSelectedPin(pin);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search places..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}>
        {pins.map(pin => (
          <Marker
            key={pin.id}
            coordinate={{
              latitude: pin.display_latitude,
              longitude: pin.display_longitude,
            }}
            title={pin.name}
            description={pin.address}
            onPress={() => handlePinPress(pin)}
          />
        ))}
      </MapView>

      {selectedPin && (
        <View style={styles.pinDetailContainer}>
          <Text style={styles.pinName}>{selectedPin.name}</Text>
          {selectedPin.address && (
            <Text style={styles.pinAddress}>{selectedPin.address}</Text>
          )}
          <TouchableOpacity style={styles.pinDetailButton}>
            <Text style={styles.pinDetailButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  searchButton: {
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  searchButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  pinDetailContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  pinName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  pinAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  pinDetailButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pinDetailButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});