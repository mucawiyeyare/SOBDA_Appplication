import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/account';
import { consultApi } from '../api/public';
import { LoadingView } from '../components/StateView';
import { colors } from '../constants/theme';
import { ActivityScreen } from '../screens/admin/ActivityScreen';
import { AdminDashboardScreen } from '../screens/main/AdminDashboardScreen';
import { ContactMessagesScreen } from '../screens/admin/ContactMessagesScreen';
import { DoctorsAdminScreen } from '../screens/admin/DoctorsAdminScreen';
import { HospitalsScreen } from '../screens/admin/HospitalsScreen';
import { PartnersAdminScreen } from '../screens/admin/PartnersAdminScreen';
import { RegisterUserScreen } from '../screens/admin/RegisterUserScreen';
import { ReportsScreen } from '../screens/admin/ReportsScreen';
import { UsersScreen } from '../screens/admin/UsersScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { AskDoctorScreen } from '../screens/consult/AskDoctorScreen';
import { ChatScreen } from '../screens/consult/ChatScreen';
import { DoctorInboxScreen } from '../screens/consult/DoctorInboxScreen';
import { DonorHistoryScreen } from '../screens/donor/DonorHistoryScreen';
import { DonorRequestsScreen } from '../screens/donor/DonorRequestsScreen';
import { LocationScreen } from '../screens/donor/LocationScreen';
import { NearestDonorsScreen } from '../screens/hospital/NearestDonorsScreen';
import { HospitalDonorsScreen } from '../screens/hospital/HospitalDonorsScreen';
import { HospitalHistoryScreen } from '../screens/hospital/HospitalHistoryScreen';
import { HospitalRequestsScreen } from '../screens/hospital/HospitalRequestsScreen';
import { AboutScreen, ContactScreen, PublicDoctorsScreen, PublicPartnersScreen } from '../screens/public/PublicListScreens';
import { WelcomeScreen } from '../screens/public/WelcomeScreen';
import { MoreScreen } from '../screens/shared/MoreScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { useAuthStore } from '../store/authStore';
import type { Role } from '../types';
import { linking } from './linking';
import type { AuthStackParamList, MainStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tabs = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerTintColor: colors.navy, headerBackTitle: 'Back' }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="PublicDoctors" component={PublicDoctorsScreen} options={{ title: 'Doctors' }} />
      <AuthStack.Screen name="PublicPartners" component={PublicPartnersScreen} options={{ title: 'Partners' }} />
      <AuthStack.Screen name="Contact" component={ContactScreen} options={{ title: 'Contact us' }} />
      <AuthStack.Screen name="About" component={AboutScreen} options={{ title: 'About' }} />
    </AuthStack.Navigator>
  );
}

type Icon = React.ComponentProps<typeof Ionicons>['name'];
interface TabDef {
  name: string;
  title: string;
  icon: Icon;
  component: React.ComponentType;
  badge?: 'alerts' | 'chat';
}

const T = {
  requests: { name: 'Requests', title: 'Requests', icon: 'water', component: DonorRequestsScreen },
  askDoctor: { name: 'AskDoctor', title: 'Doctors', icon: 'medkit', component: AskDoctorScreen, badge: 'chat' },
  donorHistory: { name: 'History', title: 'History', icon: 'time', component: DonorHistoryScreen },
  alerts: { name: 'Alerts', title: 'Alerts', icon: 'notifications', component: NotificationsScreen, badge: 'alerts' },
  profile: { name: 'ProfileTab', title: 'Profile', icon: 'person', component: ProfileScreen },
  more: { name: 'More', title: 'More', icon: 'menu', component: MoreScreen },
  hDonors: { name: 'Donors', title: 'Donors', icon: 'people', component: HospitalDonorsScreen },
  hRequests: { name: 'HRequests', title: 'Requests', icon: 'clipboard', component: HospitalRequestsScreen },
  hHistory: { name: 'HHistory', title: 'History', icon: 'time', component: HospitalHistoryScreen },
  inbox: { name: 'Inbox', title: 'Inbox', icon: 'chatbubbles', component: DoctorInboxScreen, badge: 'chat' },
  dashboard: { name: 'Dashboard', title: 'Dashboard', icon: 'grid', component: AdminDashboardScreen },
  users: { name: 'UsersTab', title: 'Users', icon: 'people', component: UsersScreen },
  hospitals: { name: 'HospitalsTab', title: 'Hospitals', icon: 'business', component: HospitalsScreen },
  reports: { name: 'ReportsTab', title: 'Reports', icon: 'stats-chart', component: ReportsScreen },
} satisfies Record<string, TabDef>;

const TABS_BY_ROLE: Record<Role, TabDef[]> = {
  donor: [T.requests, T.askDoctor, T.donorHistory, T.alerts, T.profile],
  hospital: [T.hDonors, T.hRequests, T.hHistory, T.alerts, T.more],
  doctor: [T.inbox, T.profile],
  admin: [T.dashboard, T.users, T.hospitals, T.alerts, T.more],
  health_institution: [T.dashboard, T.hospitals, T.reports, T.alerts, T.more],
};

function useBadges(role: Role) {
  const alerts = useQuery({ queryKey: ['notifications'], queryFn: () => notificationsApi.list(50), refetchInterval: 60_000, enabled: role !== 'doctor' });
  const chat = useQuery({ queryKey: ['consult', 'unread'], queryFn: consultApi.unread, refetchInterval: 30_000, enabled: role === 'donor' || role === 'doctor' });
  return { alerts: alerts.data?.unreadCount ?? 0, chat: chat.data?.count ?? 0 };
}

function TabsNavigator() {
  const role = useAuthStore((s) => s.user!.role);
  const badges = useBadges(role);
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      {TABS_BY_ROLE[role].map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          component={t.component}
          options={{
            title: t.title,
            tabBarIcon: ({ color, size }) => <Ionicons name={t.icon} size={size} color={color} />,
            tabBarBadge: t.badge && badges[t.badge] > 0 ? badges[t.badge] : undefined,
          }}
        />
      ))}
    </Tabs.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerTintColor: colors.navy, headerBackTitle: 'Back' }}>
      <MainStack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
      <MainStack.Screen name="Chat" component={ChatScreen} options={({ route }) => ({ title: route.params.title })} />
      <MainStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My profile' }} />
      <MainStack.Screen name="Donors" component={HospitalDonorsScreen} />
      <MainStack.Screen name="HospitalHistory" component={HospitalHistoryScreen} options={{ title: 'History' }} />
      <MainStack.Screen name="Reports" component={ReportsScreen} />
      <MainStack.Screen name="Activity" component={ActivityScreen} options={{ title: 'Activity log' }} />
      <MainStack.Screen name="Messages" component={ContactMessagesScreen} options={{ title: 'Contact messages' }} />
      <MainStack.Screen name="Users" component={UsersScreen} />
      <MainStack.Screen name="RegisterUser" component={RegisterUserScreen} options={{ title: 'Register user' }} />
      <MainStack.Screen name="Partners" component={PartnersAdminScreen} />
      <MainStack.Screen name="DoctorsAdmin" component={DoctorsAdminScreen} options={{ title: 'Doctors' }} />
      <MainStack.Screen name="Hospitals" component={HospitalsScreen} />
      <MainStack.Screen name="Location" component={LocationScreen} options={{ title: 'My location' }} />
      <MainStack.Screen name="NearestDonors" component={NearestDonorsScreen} options={{ title: 'Nearest donors' }} />
    </MainStack.Navigator>
  );
}

export function RootNavigator() {
  const { user, hydrating } = useAuthStore();
  if (hydrating) return <LoadingView />;
  return <NavigationContainer linking={linking}>{user ? <MainNavigator /> : <AuthNavigator />}</NavigationContainer>;
}
