import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingBottomNav } from '../../components/FloatingBottomNav';
import { StatusPanel } from '../../components/StatusPanel';
import { DecorativeBackdrop } from '../../components/DecorativeBackdrop';
import { useAuth } from '../../context/AuthContext';
import { useSavedScholarships, useScholarships } from '../../data/scholarshipApi';
import { FONTS } from '../../theme/colors';
import { getFundingVisual } from '../../theme/scholarshipVisuals';
import { Scholarship } from '../../types/scholarship';

const UPCOMING_DATE = /^\d{4}-\d{2}-\d{2}$/;
const APPLYING_STATUSES = new Set(['preparing', 'applied', 'interviewing']);
const COMPLETED_STATUSES = new Set(['awarded', 'rejected']);

function parseDeadline(value: string): Date | null {
  if (!UPCOMING_DATE.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function ScholarshipCard({
  item,
  saved,
  onToggle,
  onPress,
  closing = false,
}: {
  item: Scholarship;
  saved: boolean;
  onToggle: () => void;
  onPress: () => void;
  closing?: boolean;
}) {
  const funding = getFundingVisual(item.award_amount);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className="mr-3 w-[268px] overflow-hidden rounded-[26px] border border-[#E4EBDD] bg-white p-5 shadow-sm"
    >
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: funding.background }}>
            <Ionicons name="school-outline" size={20} color={funding.foreground} />
          </View>
          <View className="ml-2.5">
            <Text className="text-[9px] tracking-[1.2px] text-[#718568]" style={{ fontFamily: FONTS.bold }}>OPPORTUNITY</Text>
            <Text className="mt-0.5 text-[11px]" style={{ color: funding.foreground, fontFamily: FONTS.semiBold }}>{funding.label}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onToggle} hitSlop={8} accessibilityLabel={saved ? 'Remove bookmark' : 'Save scholarship'} className="h-10 w-10 items-center justify-center rounded-full bg-[#F2F5EF]">
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={19} color="#3D6414" />
        </TouchableOpacity>
      </View>
      <Text className="text-[16px] leading-5 text-[#152A17]" numberOfLines={2} style={{ fontFamily: FONTS.bold }}>{item.title}</Text>
      <Text className="mt-1 text-[12px] text-[#798C76]" numberOfLines={1} style={{ fontFamily: FONTS.medium }}>{item.provider_name}</Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        <Text className="rounded-xl bg-[#EDF3E8] px-2.5 py-1 text-[11px] text-[#2C4C16]">{item.country}</Text>
        <Text className="rounded-xl bg-[#EDF3E8] px-2.5 py-1 text-[11px] text-[#2C4C16]">{item.study_levels.join(', ')}</Text>
      </View>
      <View className="my-3 h-px bg-[#ECEFE4]" />
      <Text className="text-[10px] text-[#798C76]" style={{ fontFamily: FONTS.bold }}>
        {closing ? `CLOSES · ${item.deadline}` : `DEADLINE · ${item.deadline}`}
      </Text>
      <Text className="mt-1 text-[14px] text-[#3D6414]" style={{ fontFamily: FONTS.bold }}>{item.award_amount}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [filter, setFilter] = useState('All Types');
  const { items, loading, error, refresh } = useScholarships();
  const { saved, savedDetails, toggle } = useSavedScholarships();

  const filters = ['All Types', ...Array.from(new Set(items.flatMap((item) => item.study_levels))).sort()];
  const filtered = useMemo(
    () => items.filter((item) => filter === 'All Types' || item.study_levels.some((level) => level.toLowerCase().includes(filter.toLowerCase()))),
    [items, filter]
  );

  const recommended = useMemo(() => {
    const profile = user?.profile;
    const degree = profile?.degreeLevel?.trim().toLowerCase();
    const countries = (profile?.targetCountries || []).map((country) => country.trim().toLowerCase()).filter(Boolean);
    const hasPreferences = Boolean(degree || countries.length);

    if (!hasPreferences) return filtered;
    const ranked = filtered
      .map((item) => {
        const levelMatch = Boolean(degree && item.study_levels.some((level) => level.toLowerCase().includes(degree) || degree.includes(level.toLowerCase())));
        const countryMatch = countries.length > 0 && [...item.eligible_countries, item.country]
          .some((country) => countries.some((target) => country.toLowerCase().includes(target) || target.includes(country.toLowerCase())));
        return { item, score: Number(levelMatch) + Number(countryMatch) };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    return ranked.length ? ranked.map(({ item }) => item) : filtered;
  }, [filtered, user?.profile?.degreeLevel, user?.profile?.targetCountries]);

  const closingSoon = useMemo(() => {
    const today = new Date();
    const todayLocalMidnight = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    return items
      .map((item) => ({ item, deadline: parseDeadline(item.deadline) }))
      .filter((entry): entry is { item: Scholarship; deadline: Date } => Boolean(entry.deadline) && entry.deadline!.getTime() >= todayLocalMidnight)
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
      .map(({ item }) => item);
  }, [items]);

  const destinations = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => counts.set(item.country, (counts.get(item.country) || 0) + 1));
    return Array.from(counts, ([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country))
      .slice(0, 8);
  }, [items]);

  const trackerCounts = useMemo(() => {
    const statuses = new Map(savedDetails.map((item) => [item.id, item.tracker?.status || 'saved']));
    return {
      saved: saved.length ? saved.filter((id) => (statuses.get(id) || 'saved') === 'saved').length : 0,
      applying: saved.filter((id) => APPLYING_STATUSES.has(statuses.get(id) || 'saved')).length,
      completed: saved.filter((id) => COMPLETED_STATUSES.has(statuses.get(id) || 'saved')).length,
    };
  }, [saved, savedDetails]);

  const greeting = user ? `WELCOME BACK, ${user.fullName.split(' ')[0].toUpperCase()}` : 'COLLABX SCHOLARSHIPS';
  const openDetails = (id: string) => router.push({ pathname: '/scholarships/details', params: { id } });

  return (
    <View className="flex-1 bg-[#F0F2E9]">
      <DecorativeBackdrop />
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="w-full max-w-[760px] self-center px-5"
        contentContainerStyle={{ paddingTop: Math.max(insets.top, 20) + 12, paddingBottom: Math.max(insets.bottom, 20) + 100 }}
      >
        <View className="mb-5">
          <Text className="text-[11px] tracking-wider text-[#798C76]" style={{ fontFamily: FONTS.bold }}>{greeting}</Text>
          <Text className="mt-3 text-[34px] leading-10 text-[#152A17]" style={{ fontFamily: FONTS.bold }}>
            Find your perfect{'\n'}<Text className="italic text-[#3D6414]">Scholarship</Text>
          </Text>
        </View>

        <TouchableOpacity onPress={() => router.push('/scholarships')} activeOpacity={0.92} className="mb-6 rounded-[28px] bg-[#183119] p-5">
          <View className="flex-row items-center">
            <Ionicons name="globe-outline" size={23} color="#A7F3D0" />
            <Text className="ml-3 flex-1 text-white" style={{ fontFamily: FONTS.bold }}>Explore verified scholarship records</Text>
            <Ionicons name="chevron-forward" size={18} color="white" />
          </View>
          <Text className="mt-3 text-[13px] text-[#B6CAB2]">
            {loading ? 'Loading from the scholarship service…' : error ? 'Scholarship service is unavailable. Tap to retry.' : `${items.length} records · Review each award’s eligibility and deadlines`}
          </Text>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6" contentContainerStyle={{ gap: 10 }}>
          {filters.map((value) => (
            <TouchableOpacity key={value} onPress={() => setFilter(value)} className={`rounded-full border px-4 py-2.5 ${filter === value ? 'border-[#3D6414] bg-[#3D6414]' : 'border-[#ECEFE4] bg-white'}`}>
              <Text className={filter === value ? 'text-[13px] text-white' : 'text-[13px] text-[#152A17]'} style={{ fontFamily: FONTS.bold }}>{value}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-[#E3EBDD]"><Ionicons name="sparkles" size={19} color="#476C19" /></View>
            <View className="flex-1">
              <Text className="text-[19px] text-[#152A17]" style={{ fontFamily: FONTS.bold }}>Recommended for you</Text>
              <Text className="mt-1 text-[12px] text-[#798C76]">{user?.profile?.degreeLevel || user?.profile?.targetCountries?.length ? 'Based on your study preferences' : 'Explore current opportunities'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/scholarships')}>
            <Text className="text-[13px] text-[#3D6414]" style={{ fontFamily: FONTS.bold }}>See all ({recommended.length})</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator color="#3D6414" /> : error ? (
          <StatusPanel tone="error" compact title="Scholarships unavailable" message={error} actionLabel="Try again" onAction={refresh} />
        ) : recommended.length === 0 ? (
          <StatusPanel
            tone="empty"
            compact
            title={items.length ? 'No matches for this level' : 'No scholarships available yet'}
            message={items.length ? 'Try another study level or browse all opportunities.' : 'New opportunities will appear here when they become available.'}
            actionLabel={items.length && filter !== 'All Types' ? 'Clear level filter' : undefined}
            onAction={items.length && filter !== 'All Types' ? () => setFilter('All Types') : undefined}
          />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            {recommended.slice(0, 5).map((item) => (
              <ScholarshipCard key={item.id} item={item} saved={saved.includes(item.id)} onToggle={() => toggle(item.id)} onPress={() => openDetails(item.id)} />
            ))}
          </ScrollView>
        )}

        <View className="mb-4 mt-5 flex-row items-end justify-between">
          <View className="flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-[#F3EBDD]"><Ionicons name="time-outline" size={19} color="#9A6B38" /></View>
            <View>
              <Text className="text-[19px] text-[#152A17]" style={{ fontFamily: FONTS.bold }}>Closing soon</Text>
              <Text className="mt-1 text-[12px] text-[#798C76]">Nearest upcoming deadlines</Text>
            </View>
          </View>
        </View>
        {loading ? <ActivityIndicator color="#3D6414" /> : closingSoon.length === 0 ? (
          <StatusPanel tone="info" compact title="No upcoming deadlines" message="Dated opportunities will appear here when available." />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            {closingSoon.slice(0, 4).map((item) => (
              <ScholarshipCard key={item.id} item={item} saved={saved.includes(item.id)} onToggle={() => toggle(item.id)} onPress={() => openDetails(item.id)} closing />
            ))}
          </ScrollView>
        )}

        <View className="mb-4 mt-5 flex-row items-end justify-between">
          <View className="flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-[#E3EBDD]"><Ionicons name="earth-outline" size={19} color="#476C19" /></View>
            <View>
              <Text className="text-[19px] text-[#152A17]" style={{ fontFamily: FONTS.bold }}>Explore by destination</Text>
              <Text className="mt-1 text-[12px] text-[#798C76]">Scholarships by host country</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/scholarships')}>
            <Text className="text-[13px] text-[#3D6414]" style={{ fontFamily: FONTS.bold }}>All countries</Text>
          </TouchableOpacity>
        </View>
        {destinations.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            {destinations.map(({ country, count }) => (
              <TouchableOpacity
                key={country}
                onPress={() => router.push({ pathname: '/scholarships', params: { country } })}
                className="mr-3 min-h-[112px] w-[148px] justify-between rounded-[24px] border border-[#E4EBDD] bg-white p-4 shadow-sm"
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#EDF3E8]"><Ionicons name="location-outline" size={19} color="#3D6414" /></View>
                <View>
                  <Text numberOfLines={1} className="text-[14px] text-[#152A17]" style={{ fontFamily: FONTS.bold }}>{country}</Text>
                  <Text className="mt-0.5 text-[11px] text-[#798C76]">{count} {count === 1 ? 'scholarship' : 'scholarships'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : !loading ? <Text className="text-[13px] text-[#798C76]">Destinations will appear when records are available.</Text> : null}

        <View className="mb-3 mt-5 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-[#E3EBDD]"><Ionicons name="clipboard-outline" size={19} color="#476C19" /></View>
            <View>
              <Text className="text-[19px] text-[#152A17]" style={{ fontFamily: FONTS.bold }}>Application Tracker</Text>
              <Text className="mt-1 text-[12px] text-[#798C76]">Your scholarship journey at a glance</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/tracker')} className="h-10 w-10 items-center justify-center rounded-full bg-white">
            <Ionicons name="arrow-forward" size={18} color="#3D6414" />
          </TouchableOpacity>
        </View>
        <View className="mb-4 rounded-[26px] border border-[#E4EBDD] bg-white p-4 shadow-sm">
          <View className="flex-row">
            {[
              { label: 'Saved', count: trackerCounts.saved, icon: 'bookmark-outline' as const },
              { label: 'Applying', count: trackerCounts.applying, icon: 'paper-plane-outline' as const },
              { label: 'Completed', count: trackerCounts.completed, icon: 'checkmark-circle-outline' as const },
            ].map((stat, index) => (
              <View key={stat.label} className={`flex-1 items-center ${index > 0 ? 'border-l border-[#ECEFE4]' : ''}`}>
                <Ionicons name={stat.icon} size={18} color="#476C19" />
                <Text className="mt-1 text-[20px] text-[#152A17]" style={{ fontFamily: FONTS.bold }}>{stat.count}</Text>
                <Text className="text-[11px] text-[#798C76]" style={{ fontFamily: FONTS.medium }}>{stat.label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity onPress={() => router.push('/tracker')} className="mt-4 h-11 flex-row items-center justify-center rounded-full bg-[#183119]">
            <Text className="text-[12px] text-white" style={{ fontFamily: FONTS.bold }}>Open tracker</Text>
            <Ionicons name="arrow-forward" size={15} color="white" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>
      <FloatingBottomNav currentTab="home" />
    </View>
  );
}
