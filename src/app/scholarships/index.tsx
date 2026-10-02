import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingBottomNav } from '../../components/FloatingBottomNav';
import { useSavedScholarships, useScholarships } from '../../data/scholarshipApi';
import { FONTS } from '../../theme/colors';

export default function ScholarshipsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('All levels');
  const { items, loading, error, refresh } = useScholarships(query);
  const { saved, toggle } = useSavedScholarships();
  const levels = ['All levels', ...Array.from(new Set(items.flatMap((item) => item.study_levels))).sort()];
  const results = useMemo(() => items.filter((item) => level === 'All levels' || item.study_levels.some((value) => value.toLowerCase().includes(level.toLowerCase()))), [items, level]);

  return <View className="flex-1 bg-[#F0F2E9]"><ScrollView className="px-5" contentContainerStyle={{ paddingTop: Math.max(insets.top, 20) + 12, paddingBottom: Math.max(insets.bottom, 20) + 100 }}>
    <View className="flex-row items-center mb-6"><TouchableOpacity onPress={() => router.back()} className="w-11 h-11 rounded-full bg-white items-center justify-center mr-4"><Ionicons name="chevron-back" size={20} color="#152A17" /></TouchableOpacity><Text className="text-2xl text-[#152A17]" style={{ fontFamily: FONTS.bold }}>Scholarships</Text></View>
    <View className="flex-row items-center bg-white rounded-full px-4 h-12 border border-[#ECEFE4] mb-4"><Ionicons name="search-outline" size={19} color="#798C76" /><TextInput value={query} onChangeText={setQuery} placeholder="Search name, provider, country, field..." placeholderTextColor="#9AAFA0" className="flex-1 ml-2.5 text-sm text-[#152A17]" style={{ fontFamily: FONTS.medium }} /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5" contentContainerStyle={{ gap: 8 }}>{levels.map((value) => <TouchableOpacity key={value} onPress={() => setLevel(value)} className={`rounded-xl px-3.5 py-2 ${level === value ? 'bg-[#3D6414]' : 'bg-white'}`}><Text className={level === value ? 'text-white text-xs' : 'text-[#152A17] text-xs'} style={{ fontFamily: FONTS.bold }}>{value}</Text></TouchableOpacity>)}</ScrollView>
    <Text className="text-[13px] text-[#798C76] mb-4">{loading ? 'Loading scholarships…' : error ? 'Unable to load scholarships' : `Found ${results.length} scholarships`}</Text>
    {loading ? <ActivityIndicator color="#3D6414" /> : error ? <TouchableOpacity onPress={refresh} className="bg-white p-5 rounded-2xl"><Text className="text-[#9A3C2D]">{error} Tap to retry.</Text></TouchableOpacity> : results.length === 0 ? <Text className="text-[#798C76] py-8">No scholarships match this search.</Text> : results.map((item) => <View key={item.id} className="bg-white rounded-[28px] border border-[#ECEFE4] p-5 mb-4">
      <View className="flex-row items-start"><View className="flex-1 mr-2"><Text className="text-[17px] text-[#152A17] mb-1" style={{ fontFamily: FONTS.bold }}>{item.title}</Text><Text className="text-[11px] text-[#8FA38D] uppercase" style={{ fontFamily: FONTS.bold }}>{item.provider_name} · {item.country}</Text></View><TouchableOpacity onPress={() => toggle(item.id)}><Ionicons name={saved.includes(item.id) ? 'bookmark' : 'bookmark-outline'} size={21} color="#3D6414" /></TouchableOpacity></View>
      <Text className="text-xs text-[#42603C] mt-3">{item.study_levels.join(' · ') || 'Study level not specified'} · {item.award_amount}</Text><TouchableOpacity onPress={() => router.push({ pathname: '/scholarships/details', params: { id: item.id } })} className="self-end bg-[#233D1F] px-5 py-2.5 rounded-full mt-4"><Text className="text-xs text-white" style={{ fontFamily: FONTS.bold }}>DETAILS</Text></TouchableOpacity>
    </View>)}
  </ScrollView><FloatingBottomNav currentTab="search" /></View>;
}
