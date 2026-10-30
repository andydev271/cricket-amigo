import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PropsWithChildren } from 'react';

import { colors } from '@/src/theme';

export function Screen({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <SafeAreaView className={`flex-1 bg-[#052e16] ${className}`} edges={['top', 'left', 'right']}>
      {children}
    </SafeAreaView>
  );
}

export function Title({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <Text className={`text-2xl font-bold text-slate-50 ${className}`}>{children}</Text>
  );
}

export function Subtitle({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <Text className={`text-base text-slate-400 ${className}`}>{children}</Text>
  );
}

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
}: ButtonProps) {
  const base = 'rounded-2xl px-5 py-4 items-center justify-center';
  const styles = {
    primary: 'bg-pitch-500',
    secondary: 'bg-night-800 border border-pitch-700',
    ghost: 'bg-transparent',
    danger: 'bg-red-500',
  } as const;
  const textStyles = {
    primary: 'text-pitch-950 font-bold text-base',
    secondary: 'text-slate-50 font-semibold text-base',
    ghost: 'text-pitch-400 font-semibold text-base',
    danger: 'text-white font-semibold text-base',
  } as const;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${base} ${styles[variant]} ${disabled ? 'opacity-50' : ''} ${className}`}
      style={({ pressed }) => (pressed && !disabled ? { opacity: 0.85 } : undefined)}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.bg : colors.text} />
      ) : (
        <Text className={textStyles[variant]}>{title}</Text>
      )}
    </Pressable>
  );
}

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  className?: string;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType = 'default',
  className = '',
}: InputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      keyboardType={keyboardType}
      className={`rounded-2xl border border-slate-600/40 bg-night-800 px-4 py-4 text-base text-slate-50 ${className}`}
    />
  );
}

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <View className={`rounded-3xl bg-night-800/80 p-5 ${className}`}>{children}</View>
  );
}

export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      {icon}
      <Text className="mt-4 text-center text-lg font-semibold text-slate-200">{title}</Text>
      {hint ? (
        <Text className="mt-2 text-center text-sm text-slate-400">{hint}</Text>
      ) : null}
    </View>
  );
}
