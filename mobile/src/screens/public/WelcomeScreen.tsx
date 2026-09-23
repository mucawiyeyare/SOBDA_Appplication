import React from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { publicApi } from '../../api/public';
import { requestsApi } from '../../api/requests';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { Card, MenuItem } from '../../components/ui';
import { colors, radius } from '../../constants/theme';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const report = useQuery({ queryKey: ['public', 'report'], queryFn: publicApi.report });
  const board = useQuery({ queryKey: ['public', 'leaderboard'], queryFn: requestsApi.leaderboard });
  const a = report.data?.activityStats;

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={report.isRefetching} onRefresh={() => { void report.refetch(); void board.refetch(); }} tintColor={colors.brand} />}>
        <View style={styles.hero}>
          <Image source={require('../../../assets/logo-mark.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>SOBDA</Text>
          <Text style={styles.tagline}>Dhiigga aad bixiso, waa nolol aad qof ugu hibeysay</Text>
        </View>

        <View style={{ gap: 10, marginBottom: 18 }}>
          <Button title="Sign in" onPress={() => navigation.navigate('Login')} />
          <Button title="Become a donor" variant="outline" onPress={() => navigation.navigate('Register')} />
        </View>

        <View style={styles.grid}>
          <Stat label="Donors" value={a?.totalDonors} />
          <Stat label="Hospitals" value={a?.totalHospitals} />
          <Stat label="Regions" value={a?.regionsCovered} />
        </View>

        {!!board.data?.length && (
          <Card>
            <Text style={styles.h}>Top donors</Text>
            {board.data.map((d, i) => (
              <View key={i} style={styles.line}>
                <Text style={styles.rank}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.donor}>{d.firstName} {d.lastInitial}.</Text>
                  <Text style={styles.sub}>{d.location}</Text>
                </View>
                <Text style={styles.count}>{d.donationCount}</Text>
              </View>
            ))}
          </Card>
        )}

        <MenuItem label="Doctors" hint="Meet our medical advisers" onPress={() => navigation.navigate('PublicDoctors')} />
        <MenuItem label="Partners" hint="Organizations that support us" onPress={() => navigation.navigate('PublicPartners')} />
        <MenuItem label="Contact us" onPress={() => navigation.navigate('Contact')} />
        <MenuItem label="About SOBDA" onPress={() => navigation.navigate('About')} />
      </ScrollView>
    </Screen>
  );
}

const Stat = ({ label, value }: { label: string; value?: number }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value ?? '-'}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginVertical: 20 },
  logo: { width: 90, height: 90, marginBottom: 8 },
  title: { fontSize: 30, fontWeight: '900', color: colors.navy },
  tagline: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 6, paddingHorizontal: 12 },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  stat: { flex: 1, backgroundColor: colors.soft, borderRadius: radius.md, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.brand },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  h: { fontSize: 15, fontWeight: '700', color: colors.navy, marginBottom: 8 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  rank: { width: 24, fontSize: 18, fontWeight: '800', color: colors.brand },
  donor: { fontSize: 14, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.muted },
  count: { fontSize: 16, fontWeight: '800', color: colors.navy },
});
