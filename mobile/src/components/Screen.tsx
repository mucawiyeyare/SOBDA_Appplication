import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderShownContext } from '@react-navigation/elements';
import { colors, spacing } from '../constants/theme';

interface Props {
  children: React.ReactNode;
  /** Wrap in a keyboard-aware ScrollView (use for forms). */
  scroll?: boolean;
  style?: ViewStyle;
  /** Set when the navigator already draws a header, so the top safe area is not padded twice. */
  hasHeader?: boolean;
}

export function Screen({ children, scroll = false, style, hasHeader }: Props) {
  // Inside a navigator that draws its own header, the top safe area is already handled.
  const headerShown = React.useContext(HeaderShownContext);
  const skipTop = hasHeader ?? headerShown;
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={skipTop ? ['left', 'right'] : ['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  content: { padding: spacing.lg, flexGrow: 1 },
});
