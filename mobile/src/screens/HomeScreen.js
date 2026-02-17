import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

const HomeScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#fb923c', '#f97316', '#ea580c']}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Find Your Perfect Home</Text>
        <Text style={styles.heroSubtitle}>Verified listings from trusted landlords</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate('Explore')}
        >
          <Text style={styles.searchButtonText}>Search Properties</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Property Types</Text>
        <View style={styles.propertyTypes}>
          {['Bedsitter', '1BR', '2BR', 'Maisonette', 'Bungalow'].map((type) => (
            <TouchableOpacity key={type} style={styles.propertyTypeCard}>
              <Text style={styles.propertyTypeText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  hero: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 24,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  propertyTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  propertyTypeCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
})

export default HomeScreen

