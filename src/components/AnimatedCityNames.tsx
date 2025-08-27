import React, { useEffect, useRef, useState } from 'react';

import { Animated, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CITIES = [
  '東京', // Tokyo
  'New York',
  'London',
  'Paris',
  'Sydney',
  'Berlin',
  'Singapore',
  'دبي', // Dubai
  'मुंबई', // Mumbai
  '서울', // Seoul
  'Barcelona',
  'Toronto',
  'Amsterdam',
  '香港', // Hong Kong
  'กรุงเทพฯ', // Bangkok
  'Roma', // Rome
  'Stockholm',
  'Wien', // Vienna
  'Praha', // Prague
  'København', // Copenhagen
  'San Francisco',
  'Los Angeles',
  'Chicago',
  'Boston',
  'Seattle',
  'Melbourne',
  'Lisboa', // Lisbon
  'Dublin',
  'Bruxelles', // Brussels
  'Madrid',
  'Milano', // Milan
  'München', // Munich
  'Zürich', // Zurich
  'Oslo',
  'Helsinki',
  '上海', // Shanghai
  '北京', // Beijing
  'Jakarta',
  'İstanbul', // Istanbul
  'Москва', // Moscow
  'São Paulo',
  'Buenos Aires',
  'Ciudad de México', // Mexico City
  'القاهرة', // Cairo
  'תל אביב', // Tel Aviv
];

export const AnimatedCityNames: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [currentCity, setCurrentCity] = useState(
    () => CITIES[Math.floor(Math.random() * CITIES.length)],
  );

  useEffect(() => {
    const animateChange = () => {
      // Fade out and slide up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Change city while invisible
        const newCity = CITIES[Math.floor(Math.random() * CITIES.length)];
        setCurrentCity(newCity);

        // Reset position
        slideAnim.setValue(20);

        // Fade in and slide to center
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    };

    // Start animation after initial delay
    const initialDelay = setTimeout(() => {
      animateChange();

      // Set up recurring animation with random intervals
      const interval = setInterval(
        () => {
          animateChange();
        },
        4000 + Math.random() * 3000,
      ); // 4-7 seconds

      // Cleanup interval on unmount
      return () => clearInterval(interval);
    }, 2000); // Initial 2 second delay

    return () => clearTimeout(initialDelay);
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Icon name="location-on" size={14} color="#999" style={styles.icon} />
        <Animated.Text style={styles.cityText}>{currentCity}</Animated.Text>
        <View style={styles.spacer} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  cityText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '300',
  },
  container: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  icon: {
    marginRight: 3,
    opacity: 0.5, // Make icon more subtle
  },
  spacer: {
    marginLeft: 3,
    width: 14, // Same size as the icon
  },
});
