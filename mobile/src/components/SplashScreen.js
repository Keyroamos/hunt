import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

const { width, height } = Dimensions.get('window')

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const progressAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2000,
        delay: 1000,
        useNativeDriver: false,
      }),
    ]).start()
  }, [])

  return (
    <LinearGradient
      colors={['#fb923c', '#f97316', '#ea580c']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.logo}>🏠</Text>
        <Text style={styles.title}>House Hunt</Text>
        <Text style={styles.tagline}>Find Your Perfect Home in Kenya</Text>
        <Text style={styles.byline}>by Tal Shamayim</Text>

        {/* Loading Bar */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBarBackground}>
            <Animated.View
              style={[
                styles.loadingBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>

        <Animated.Text
          style={[
            styles.loadingText,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          Loading...
        </Animated.Text>
      </Animated.View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 20,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 32,
    fontWeight: '300',
  },
  byline: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 48,
  },
  loadingContainer: {
    width: width * 0.7,
    marginBottom: 24,
  },
  loadingBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBar: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
})

export default SplashScreen

