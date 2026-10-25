import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingBottomNav } from '../components/FloatingBottomNav';
import { StatusPanel } from '../components/StatusPanel';
import { DecorativeBackdrop } from '../components/DecorativeBackdrop';
import { useSavedScholarships, useScholarships } from '../data/scholarshipApi';
import { COLORS, FONTS } from '../theme/colors';

const STATUS_CYCLE = ['saved', 'preparing', 'applied', 'awarded'] as const;

export default function Tracker() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, loading: loadingAll, error, refresh } = useScholarships();
  const { saved, savedDetails, ready, toggle, updateTrackerStatus, refreshSaved } = useSavedScholarships();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Combine details from API or local fallback
  const displayItems = savedDetails.length
    ? savedDetails
    : items.filter((item) => saved.includes(item.id));

  const filtered = displayItems.filter((item) => {
    if (filterStatus === 'all') return true;
    const currentStatus = item.tracker?.status || 'saved';
    return currentStatus === filterStatus;
  });

  const handleCycleStatus = async (item: typeof displayItems[0]) => {
    const current = item.tracker?.status || 'saved';
    const currentIndex = STATUS_CYCLE.indexOf(current as any);
    const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
    const nextStatus = STATUS_CYCLE[nextIndex];
    await updateTrackerStatus(item.id, nextStatus);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'applied':
        return { bg: COLORS.accentBlueLight, text: COLORS.accentBlue };
      case 'awarded':
        return { bg: COLORS.accentOliveLight, text: COLORS.accentOlive };
      case 'preparing':
        return { bg: COLORS.accentAmberLight, text: COLORS.accentAmber };
      case 'rejected':
        return { bg: COLORS.accentRoseLight, text: COLORS.accentRose };
      default:
        return { bg: COLORS.accentOliveLight, text: COLORS.accentOlive };
    }
  };

  return (
    <View className="flex-1 bg-[#F0F2E9]">
      <DecorativeBackdrop />
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="w-full max-w-[720px] self-center px-5"
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20) + 14,
          paddingBottom: Math.max(insets.bottom, 20) + 100,
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text
              className="text-[11px] text-[#798C76] tracking-wider uppercase"
              style={{ fontFamily: FONTS.bold }}
            >
              APPLICATION PIPELINE
            </Text>
            <Text
              className="text-[26px] text-[#203E20] mt-1"
              style={{ fontFamily: FONTS.bold }}
            >
              Application Tracker
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/scholarships')}
            className="w-11 h-11 rounded-2xl bg-white items-center justify-center shadow-sm"
          >
            <Ionicons name="add" size={24} color="#203E20" />
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View className="flex-row gap-2 mb-6">
          {[
            { key: 'all', label: `All (${displayItems.length})` },
            { key: 'saved', label: 'Saved' },
            { key: 'preparing', label: 'In Prep' },
            { key: 'applied', label: 'Applied' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setFilterStatus(tab.key)}
              className={`py-2 px-3.5 rounded-full border ${
                filterStatus === tab.key
                  ? 'bg-[#274423] border-[#274423]'
                  : 'bg-white border-[#E2E6D9]'
              }`}
            >
              <Text
                className={`text-[12px] ${
                  filterStatus === tab.key ? 'text-white' : 'text-[#203E20]'
                }`}
                style={{ fontFamily: FONTS.bold }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loadingAll && !ready ? (
          <ActivityIndicator color="#3D6414" size="large" />
        ) : error ? (
          <StatusPanel tone="error" title="Tracker unavailable" message={error} actionLabel="Try again" onAction={() => { refresh(); refreshSaved(); }} />
        ) : filtered.length === 0 ? (
          <View className="bg-white rounded-[32px] p-7 shadow-sm items-center">
            <View className="w-14 h-14 rounded-2xl bg-[#EDF3E8] items-center justify-center mb-4">
              <Ionicons name="bookmark-outline" size={28} color="#274423" />
            </View>
            <Text className="text-[18px] text-[#29472A]" style={{ fontFamily: FONTS.bold }}>
              No scholarships tracked here
            </Text>
            <Text className="text-[13px] text-[#798C76] text-center mt-2 mb-6 leading-5">
              Browse scholarship records and tap the bookmark icon to start tracking your applications.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/scholarships')}
              className="bg-[#23451F] rounded-full px-6 py-3.5 items-center w-full"
            >
              <Text className="text-white text-xs tracking-wider" style={{ fontFamily: FONTS.bold }}>
                BROWSE SCHOLARSHIPS
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((item) => {
            const currentStatus = item.tracker?.status || 'saved';
            const colors = getStatusColor(currentStatus);
            return (
              <View
                key={item.id}
                className="bg-white rounded-[26px] p-5 mb-4 shadow-sm border border-[#E4EBDD]"
              >
                <View className="flex-row items-start justify-between">
                  <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF1E5]">
                    <Ionicons name="school-outline" size={21} color="#476C19" />
                  </View>
                  <View className="flex-1 mr-3">
                    <Text className="text-[16px] text-[#29472A]" numberOfLines={2} style={{ fontFamily: FONTS.bold }}>{item.title}</Text>
                    <Text className="text-[12px] text-[#718568] mt-1" numberOfLines={1} style={{ fontFamily: FONTS.medium }}>{item.provider_name} · {item.country}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggle(item.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Remove scholarship from tracker" className="h-10 w-10 items-center justify-center rounded-full bg-[#F2F5EF]">
                    <Ionicons name="bookmark" size={22} color="#3D6414" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-[#F2F4EB]">
                  <TouchableOpacity
                    onPress={() => handleCycleStatus(item)}
                    className="flex-row items-center px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: colors.bg }}
                  >
                    <View
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: colors.text }}
                    />
                    <Text
                      className="text-[11px] uppercase tracking-wide"
                      style={{ color: colors.text, fontFamily: FONTS.bold }}
                    >
                      {currentStatus} (tap to cycle)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      router.push({ pathname: '/scholarships/details', params: { id: item.id } })
                    }
                    className="bg-[#24451F] px-4 py-2 rounded-full"
                  >
                    <Text className="text-white text-[11px]" style={{ fontFamily: FONTS.bold }}>
                      DETAILS
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
      <FloatingBottomNav currentTab="grid" />
    </View>
  );
}
