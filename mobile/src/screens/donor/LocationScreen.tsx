import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text } from 'react-native';
import * as Location from 'expo-location';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '../../api/client';
import { geoApi } from '../../api/geo';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { LoadingView } from '../../components/StateView';
import { Card, Row } from '../../components/ui';
import { colors } from '../../constants/theme';

/** Donor: save the current GPS position so hospitals can find nearby donors. */
export function LocationScreen() {
  const qc = useQueryClient();
  const saved = useQuery({ queryKey: ['donor', 'location'], queryFn: geoApi.myLocation });
  const [address, setAddress] = useState('');
  const [locating, setLocating] = useState(false);

  const save = useMutation({
    mutationFn: (body: { latitude: number; longitude: number; address?: string }) => geoApi.setLocation(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['donor', 'location'] });
      Alert.alert('Location saved', 'Hospitals can now find you when you are nearby.');
    },
    onError: (e) => Alert.alert('Could not save location', errorMessage(e)),
  });

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Location permission needed', 'Allow location access in Settings so we can save where you are.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open settings', onPress: () => void Linking.openSettings() },
        ]);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      save.mutate({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, address: address.trim() || undefined });
    } catch (e) {
      Alert.alert('Could not get your location', errorMessage(e));
    } finally {
      setLocating(false);
    }
  };

  if (saved.isLoading) return <Screen><LoadingView /></Screen>;
  const loc = saved.data?.location;

  return (
    <Screen scroll>
      <Text style={styles.intro}>
        Sharing your location lets hospitals find donors close to a patient. It is only visible to hospitals and administrators.
      </Text>
      <Card>
        <Text style={styles.h}>{loc ? 'Saved location' : 'No location saved yet'}</Text>
        {loc && (
          <>
            <Row label="Coordinates" value={`${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`} />
            <Row label="Note" value={loc.address} />
          </>
        )}
      </Card>
      <Input label="Area or landmark (optional)" value={address} onChangeText={setAddress} placeholder="e.g. Near Hodan market" />
      <Button title={loc ? 'Update to my current location' : 'Use my current location'} onPress={useMyLocation} loading={locating || save.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 14, color: colors.muted, marginBottom: 14, lineHeight: 20 },
  h: { fontSize: 15, fontWeight: '700', color: colors.navy, marginBottom: 6 },
});
