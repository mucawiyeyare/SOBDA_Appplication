import React from 'react';
import { Alert, Image, Linking, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { errorMessage } from '../../api/client';
import { publicApi } from '../../api/public';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { QueryList } from '../../components/QueryList';
import { Screen } from '../../components/Screen';
import { Select } from '../../components/Select';
import { Avatar, Card } from '../../components/ui';
import { colors } from '../../constants/theme';
import type { Doctor, Partner } from '../../types/models';

export function PublicDoctorsScreen() {
  const query = useQuery({ queryKey: ['doctors'], queryFn: publicApi.doctors });
  return (
    <Screen hasHeader>
      <QueryList
        query={query}
        keyExtractor={(d) => d._id}
        emptyTitle="No doctors listed"
        renderItem={(d: Doctor) => (
          <Card>
            <View style={styles.row}>
              <Avatar name={d.name} uri={d.photo || undefined} size={56} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{d.name}</Text>
                <Text style={styles.spec}>{d.specialty}</Text>
                {!!d.title && <Text style={styles.muted}>{d.title}</Text>}
              </View>
            </View>
            {!!d.bio && <Text style={styles.bio}>{d.bio}</Text>}
            {d.highlights?.map((h) => <Text key={h} style={styles.muted}>• {h}</Text>)}
          </Card>
        )}
      />
    </Screen>
  );
}

export function PublicPartnersScreen() {
  const query = useQuery({ queryKey: ['partners'], queryFn: publicApi.partners });
  return (
    <Screen hasHeader>
      <QueryList
        query={query}
        keyExtractor={(p) => p._id}
        emptyTitle="No partners listed"
        renderItem={(p: Partner) => (
          <Card onPress={() => Linking.openURL(p.websiteUrl).catch(() => Alert.alert('Could not open link'))}>
            <View style={styles.row}>
              <Image source={{ uri: p.logo }} style={styles.logo} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.muted} numberOfLines={1}>{p.websiteUrl}</Text>
              </View>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const URGENCY = ['Normal', 'Urgent', 'Emergency'];

export function ContactScreen() {
  const [f, setF] = React.useState({ fullName: '', email: '', phone: '', subject: '', message: '', urgency: 'Normal' });
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const send = useMutation({
    mutationFn: () => publicApi.contact({ ...f, fullName: f.fullName.trim(), email: f.email.trim(), phone: f.phone.trim() || undefined }),
    onSuccess: (r) => {
      Alert.alert('Message sent', r.message ?? 'Thank you, we will get back to you.');
      setF({ fullName: '', email: '', phone: '', subject: '', message: '', urgency: 'Normal' });
    },
    onError: (e) => Alert.alert('Could not send', errorMessage(e)),
  });
  const submit = () => {
    if (!f.fullName.trim() || !f.email.trim() || !f.subject.trim() || !f.message.trim()) return Alert.alert('Please fill in name, email, subject and message');
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return Alert.alert('Enter a valid email address');
    send.mutate();
  };
  return (
    <Screen scroll hasHeader>
      <Input label="Full name" value={f.fullName} onChangeText={set('fullName')} />
      <Input label="Email" value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
      <Input label="Phone (optional)" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
      <Select label="Priority" value={f.urgency} options={URGENCY} onChange={set('urgency')} />
      <Input label="Subject" value={f.subject} onChangeText={set('subject')} />
      <Input label="Message" value={f.message} onChangeText={set('message')} multiline style={{ minHeight: 110, textAlignVertical: 'top', paddingTop: 12 }} />
      <Button title="Send message" loading={send.isPending} onPress={submit} />
    </Screen>
  );
}

export function AboutScreen() {
  return (
    <Screen scroll hasHeader>
      <Text style={styles.h}>SOBDA</Text>
      <Text style={styles.bio}>
        SOBDA is the national blood donation management system for Somalia. It connects hospitals that urgently need blood with
        registered donors nearby, tracks every request from the first message to the completed donation, and gives health
        authorities the reporting they need to plan.
      </Text>
      <Text style={styles.bio}>
        Donors can register, respond to hospital requests, ask doctors health questions, and see the difference they make.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 16, fontWeight: '700', color: colors.navy },
  spec: { fontSize: 13, color: colors.brand, fontWeight: '600' },
  muted: { fontSize: 12, color: colors.muted, marginTop: 2 },
  bio: { fontSize: 14, color: colors.text, marginTop: 10, lineHeight: 21 },
  logo: { width: 56, height: 56, backgroundColor: colors.soft, borderRadius: 8 },
  h: { fontSize: 26, fontWeight: '900', color: colors.navy, marginBottom: 4 },
});
