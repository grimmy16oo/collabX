import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingBottomNav } from '../../components/FloatingBottomNav';
import { useSavedScholarships, useScholarships } from '../../data/scholarshipApi';
import { FONTS } from '../../theme/colors';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('All Types');
  const { items, loading, error, refresh } = useScholarships();
  const { saved, toggle } = useSavedScholarships();
  const filters = ['All Types', ...Array.from(new Set(items.flatMap((item) => item.study_levels))).sort()];
  const filtered = useMemo(() => items.filter((item) => filter === 'All Types' || item.study_levels.some((level) => level.toLowerCase().includes(filter.toLowerCase()))), [items, filter]);

  return <View className="flex-1 bg-[#F0F2E9]"><ScrollView showsVerticalScrollIndicator={false} className="px-5" contentContainerStyle={{ paddingTop: Math.max(insets.top, 20) + 12, paddingBottom: Math.max(insets.bottom, 20) + 100 }}>
    <View className="mb-5"><Text className="text-[11px] text-[#798C76] tracking-wider" style={{ fontFamily: FONTS.bold }}>COLLABX SCHOLARSHIPS</Text><Text className="text-[34px] leading-10 text-[#152A17] mt-3" style={{ fontFamily: FONTS.bold }}>Find your perfect{'\n'}<Text className="italic text-[#3D6414]">Scholarship</Text></Text></View>
    <TouchableOpacity onPress={() => router.push('/scholarships')} activeOpacity={0.92} className="bg-[#183119] rounded-[28px] p-5 mb-6"><View className="flex-row items-center"><Ionicons name="globe-outline" size={23} color="#A7F3D0" /><Text className="text-white ml-3 flex-1" style={{ fontFamily: FONTS.bold }}>Explore verified scholarship records</Text><Ionicons name="chevron-forward" size={18} color="white" /></View><Text className="text-[13px] text-[#B6CAB2] mt-3">{loading ? 'Loading from the scholarship service…' : error ? 'Scholarship service is unavailable. Tap to retry.' : `${items.length} records · Review each award’s eligibility and deadlines`}</Text></TouchableOpacity>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6" contentContainerStyle={{ gap: 10 }}>{filters.map((value) => <TouchableOpacity key={value} onPress={() => setFilter(value)} className={`py-2.5 px-4 rounded-full border ${filter === value ? 'bg-[#3D6414] border-[#3D6414]' : 'bg-white border-[#ECEFE4]'}`}><Text className={filter === value ? 'text-white text-[13px]' : 'text-[#152A17] text-[13px]'} style={{ fontFamily: FONTS.bold }}>{value}</Text></TouchableOpacity>)}</ScrollView>
    <View className="flex-row items-center justify-between mb-4"><Text className="text-[19px] text-[#152A17]" style={{ fontFamily: FONTS.bold }}>Featured for you</Text><TouchableOpacity onPress={() => router.push('/scholarships')}><Text className="text-[13px] text-[#3D6414]" style={{ fontFamily: FONTS.bold }}>See all ({filtered.length})</Text></TouchableOpacity></View>
    {loading ? <ActivityIndicator color="#3D6414" /> : error ? <TouchableOpacity onPress={refresh} className="bg-white rounded-2xl p-5 mb-6"><Text className="text-[#9A3C2D]">{error} Tap to retry.</Text></TouchableOpacity> : filtered.length === 0 ? <Text className="text-[#798C76] mb-6">No scholarships match this study level.</Text> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>{filtered.slice(0, 12).map((item) => <TouchableOpacity key={item.id} onPress={() => router.push({ pathname: '/scholarships/details', params: { id: item.id } })} className="w-[280px] bg-white rounded-[28px] border border-[#ECEFE4] p-5 mr-4">
      <View className="flex-row justify-between"><View className="w-11 h-11 rounded-[14px] bg-[#183119] items-center justify-center"><Text className="text-white" style={{ fontFamily: FONTS.bold }}>{item.country.slice(0, 2).toUpperCase()}</Text></View><TouchableOpacity onPress={() => toggle(item.id)}><Ionicons name={saved.includes(item.id) ? 'bookmark' : 'bookmark-outline'} size={20} color="#3D6414" /></TouchableOpacity></View>
      <Text className="text-[17px] text-[#152A17] mt-4" numberOfLines={2} style={{ fontFamily: FONTS.bold }}>{item.title}</Text><Text className="text-[13px] text-[#798C76] mt-1" numberOfLines={1}>{item.provider_name}</Text><View className="flex-row flex-wrap gap-2 mt-3"><Text className="text-[11px] bg-[#EDF3E8] text-[#2C4C16] px-2.5 py-1 rounded-xl">{item.country}</Text><Text className="text-[11px] bg-[#EDF3E8] text-[#2C4C16] px-2.5 py-1 rounded-xl">{item.study_levels.join(', ')}</Text></View><View className="h-px bg-[#ECEFE4] my-4"/><Text className="text-[10px] text-[#798C76]" style={{ fontFamily: FONTS.bold }}>DEADLINE · {item.deadline}</Text><Text className="text-[14px] text-[#3D6414] mt-1" style={{ fontFamily: FONTS.bold }}>{item.award_amount}</Text>
    </TouchableOpacity>)}</ScrollView>}
    <View className="mt-5"><Text className="text-[19px] text-[#152A17] mb-2" style={{ fontFamily: FONTS.bold }}>Saved scholarships</Text>{saved.length === 0 ? <Text className="text-[13px] text-[#798C76]">Bookmark a scholarship to keep it here.</Text> : <TouchableOpacity onPress={() => router.push('/tracker')}><Text className="text-[13px] text-[#3D6414]">{saved.length} saved · View saved awards</Text></TouchableOpacity>}</View>
  </ScrollView><FloatingBottomNav currentTab="home" /></View>;
}
