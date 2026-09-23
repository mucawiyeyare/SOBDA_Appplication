import * as Linking from 'expo-linking';
import type { LinkingOptions } from '@react-navigation/native';

// Deep links: sobda://requests opens the donor request list, sobda://alerts the notifications tab, etc.
// The navigator shape differs per role, so links to tabs a role does not have are simply ignored.
export const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: [Linking.createURL('/'), 'sobda://'],
  config: {
    screens: {
      Welcome: 'welcome',
      Login: 'login',
      Register: 'register',
      Tabs: {
        screens: {
          Requests: 'requests',
          HRequests: 'hospital-requests',
          Alerts: 'alerts',
          Inbox: 'inbox',
          Dashboard: 'dashboard',
        },
      },
      Profile: 'profile',
    },
  },
};
