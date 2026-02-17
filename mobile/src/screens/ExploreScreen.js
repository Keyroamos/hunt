import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native'

const ExploreScreen = ({ navigation }) => {
  const properties = [
    {
      id: 1,
      title: 'Modern 2BR Apartment',
      location: 'Westlands, Nairobi',
      price: 35000,
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    },
    {
      id: 2,
      title: 'Cozy Bedsitter',
      location: 'Kilimani, Nairobi',
      price: 15000,
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    },
  ]

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore Houses</Text>
      </View>

      <View style={styles.propertiesList}>
        {properties.map((property) => (
          <TouchableOpacity
            key={property.id}
            style={styles.propertyCard}
            onPress={() => navigation.navigate('PropertyDetail', { property })}
          >
            <Image source={{ uri: property.image }} style={styles.propertyImage} />
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyTitle}>{property.title}</Text>
              <Text style={styles.propertyLocation}>{property.location}</Text>
              <Text style={styles.propertyPrice}>KES {property.price.toLocaleString()}/month</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  propertiesList: {
    padding: 16,
  },
  propertyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyImage: {
    width: '100%',
    height: 200,
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f97316',
  },
})

export default ExploreScreen

