import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '@/app/user_utils/api';

const SpecialChargeManager = ({ authHeader }) => {
  const [charges, setCharges] = useState([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  const fetchCharges = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/specialcharges/`, authHeader);
      setCharges(res.data);
    } catch (err) {
      console.error('Failed to fetch special charges', err);
    }
  };

  const addCharge = async () => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/specialcharges/`,
        {
          title,
          amount_expected: amount,
          due_date: dueDate,
          description,
        },
        authHeader
      );
      setCharges([...charges, res.data]);
      setTitle('');
      setAmount('');
      setDueDate('');
      setDescription('');
    } catch (err) {
      console.error('Failed to add special charge', err);
    }
  };

  const deleteCharge = async (id) => {
    Alert.alert('Delete', 'Delete this special charge?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE_URL}/api/specialcharges/${id}/`, authHeader);
            setCharges(charges.filter((c) => c.id !== id));
          } catch (err) {
            console.error('Failed to delete charge', err);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchCharges();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>⚡ Special Charges</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={styles.input}
          placeholder="Due Date (YYYY-MM-DD)"
          value={dueDate}
          onChangeText={setDueDate}
        />
        <TextInput
          style={styles.input}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
        />
        <Button title="Add" onPress={addCharge} color="#16a34a" />
      </View>

      <FlatList
        data={charges}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text>₹{item.amount_expected}</Text>
            <Text>{item.due_date}</Text>
            <Text>{item.description}</Text>
            <Text style={styles.deleteText} onPress={() => deleteCharge(item.id)}>
              Delete
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    flex: 1,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  form: {
    marginBottom: 24,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cccccc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  item: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  itemTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  deleteText: {
    color: '#dc2626',
    marginTop: 4,
  },
});

export default SpecialChargeManager;
