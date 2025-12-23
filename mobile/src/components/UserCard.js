import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * Componente UserCard - Scheda utente
 */
const UserCard = ({ user, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.name}>{user.nome} {user.cognome}</Text>
        <Text style={styles.badge}>{user.badge}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.infoText}>Reparto: {user.reparto}</Text>
        <Text style={styles.infoText}>Ruolo: {user.ruolo}</Text>
      </View>
      <Text style={styles.email}>{user.email}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  info: {
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  email: {
    fontSize: 12,
    color: '#999',
  },
});

export default UserCard;

