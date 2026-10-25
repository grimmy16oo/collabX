import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS } from '../theme/colors';

type StatusTone = 'error' | 'empty' | 'info';

const toneStyles: Record<StatusTone, { icon: keyof typeof Ionicons.glyphMap; iconColor: string; iconBg: string }> = {
  error: { icon: 'cloud-offline-outline', iconColor: '#9A5B3D', iconBg: '#F8EEE8' },
  empty: { icon: 'search-outline', iconColor: COLORS.accentOlive, iconBg: COLORS.accentOliveLight },
  info: { icon: 'information-circle-outline', iconColor: COLORS.accentOlive, iconBg: COLORS.accentOliveLight },
};

export function StatusPanel({
  tone = 'info',
  title,
  message,
  actionLabel,
  onAction,
  compact = false,
}: {
  tone?: StatusTone;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  const style = toneStyles[tone];
  return (
    <View className={`rounded-[24px] border border-[#E8ECE1] bg-white ${compact ? 'p-4' : 'items-center px-6 py-7'}`}>
      <View className={`items-center justify-center rounded-2xl ${compact ? 'mb-3 h-10 w-10' : 'mb-4 h-12 w-12'}`} style={{ backgroundColor: style.iconBg }}>
        <Ionicons name={style.icon} size={compact ? 19 : 23} color={style.iconColor} />
      </View>
      <Text className={`text-[#203A25] ${compact ? 'text-[15px]' : 'text-center text-[17px]'}`} style={{ fontFamily: FONTS.bold }}>{title}</Text>
      <Text className={`mt-1 text-[13px] leading-5 text-[#71806C] ${compact ? '' : 'text-center'}`} style={{ fontFamily: FONTS.regular }}>{message}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.82}
          accessibilityRole="button"
          className={`min-h-11 items-center justify-center rounded-full bg-[#23451F] px-5 ${compact ? 'mt-3 self-start' : 'mt-5 w-full'}`}
        >
          <Text className="text-[13px] text-white" style={{ fontFamily: FONTS.bold }}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
