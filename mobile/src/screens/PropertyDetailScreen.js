import React from 'react'
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native'

const PropertyDetailScreen = ({ route }) => {
  const { property } = route.params || {}

  return (
    <ScrollView style={styles.container}>
      {property?.image && (
        <Image source={{ uri: property.image }} style={styles.image} />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{property?.title || 'Property Details'}</Text>
        <Text style={styles.location}>{property?.location || 'Location'}</Text>
        <Text style={styles.price}>
          KES {property?.price?.toLocaleString() || '0'}/month
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f97316',
  },
})

export default PropertyDetailScreen

