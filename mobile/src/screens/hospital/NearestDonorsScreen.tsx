import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { useMutation } from '@tanstack/react-query';
import { errorMessage } from '../../api/client';
import { geoApi, NearDonor } from '../../api/geo';
import { Button } from '../../components/Button';
import { EmptyView } from '../../components/StateView';
import { Screen } from '../../components/Screen';
import { Avatar, BloodBadge, Card, Chips, Row } from '../../components/ui';
import { FlatList } from 'react-native';
import { colors } from '../../constants/theme';
import { BLOOD_TYPES, BloodType } from '../../types';

const RADII = ['5', '10', '25', '50', '100'] as const;

/** Hospital/admin: find available donors near the device's current position. */
export function NearestDonorsScreen() {
  const [radius, setRadius] = useState<(typeof RADII)[number]>('25');
  const [blood, setBlood] = useState<BloodType | ''>('');

  const search = useMutation({
    mutationFn: async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) throw new Error('Location permission is needed to search around you. Enable it in Settings.');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return geoApi.nearest({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, radius: Number(radius), bloodType: blood || undefined });
    },
    onError: (e) => Alert.alert('Search failed', errorMessage(e)),
  });

  const donors = search.data?.donors;

  return (
    <Screen>
      <Text style={styles.label}>Search radius (km)</Text>
      <Chips options={RADII} value={radius} onChange={(v) => v && setRadius(v)} allLabel="" />
      <Chips options={BLOOD_TYPES} value={blood} onChange={setBlood} allLabel="Any blood type" />
      <Button title="Find donors near me" onPress={() => search.mutate()} loading={search.isPending} />
      <View style={{ height: 12 }} />
      {donors && (
        <FlatList
          data={donors}
          keyExtractor={(d) => d._id}
          ListEmptyComponent={<EmptyView title="No donors nearby" message="Try a bigger radius or another blood type." />}
          renderItem={({ item }) => <DonorItem d={item} />}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        />
      )}
    </Screen>
  );
}

const DonorItem = React.memo(function DonorItem({ d }: { d: NearDonor }) {
  return (
    <Card>
      <View style={styles.row}>
        <Avatar name={d.name} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{d.name}</Text>
          <Text style={styles.dist}>{d.distance} km away</Text>
        </View>
        <BloodBadge type={d.bloodType} />
      </View>
      <Row label="Area" value={d.address || d.location} />
      <View style={[styles.row, { gap: 8, marginTop: 8 }]}>
        <View style={{ flex: 1 }}><Button title="Call" onPress={() => Linking.openURL(`tel:${d.phone}`)} /></View>
        <View style={{ flex: 1 }}>
          <Button
            title="Directions"
            variant="outline"
            onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${d.coordinates.latitude},${d.coordinates.longitude}`)}
          />
        </View>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.navy, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontSize: 15, fontWeight: '700', color: colors.navy },
  dist: { fontSize: 12, color: colors.brand, fontWeight: '700' },
});
