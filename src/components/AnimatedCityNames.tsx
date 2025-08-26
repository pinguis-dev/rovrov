import React, { useEffect, useRef, useState } from 'react';

import { Animated, StyleSheet, View } from 'react-native';

const CITIES = [
  'Tokyo',
  'New York',
  'London',
  'Paris',
  'Sydney',
  'Berlin',
  'Singapore',
  'Dubai',
  'Mumbai',
  'Seoul',
  'Barcelona',
  'Toronto',
  'Amsterdam',
  'Hong Kong',
  'Bangkok',
  'Rome',
  'Stockholm',
  'Vienna',
  'Prague',
  'Copenhagen',
  'San Francisco',
  'Los Angeles',
  'Chicago',
  'Boston',
  'Seattle',
  'Melbourne',
  'Lisbon',
  'Dublin',
  'Brussels',
  'Madrid',
  'Milan',
  'Munich',
  'Zurich',
  'Oslo',
  'Helsinki',
  'Shanghai',
  'Beijing',
  'Jakarta',
  'Istanbul',
  'Moscow',
  'São Paulo',
  'Buenos Aires',
  'Mexico City',
  'Cairo',
  'Tel Aviv',
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
      <Animated.Text
        style={[
          styles.cityText,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {currentCity}
      </Animated.Text>
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
});
