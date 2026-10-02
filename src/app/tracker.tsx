import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingBottomNav } from '../components/FloatingBottomNav';
import { useSavedScholarships, useScholarships } from '../data/scholarshipApi';
import { FONTS } from '../theme/colors';

export default function Tracker() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, loading, error, refresh } = useScholarships();
  const { saved, toggle } = useSavedScholarships();
  const savedItems = items.filter((item) => saved.includes(item.id));
  return <View className="flex-1 bg-[#F4F6EF]"><ScrollView className="px-6" contentContainerStyle={{ paddingTop: Math.max(insets.top, 20) + 18, paddingBottom: Math.max(insets.bottom, 20) + 100 }}>
    <View className="flex-row items-center justify-between mb-6"><Text className="text-[21px] text-[#203E20]" style={{ fontFamily: FONTS.bold }}>Saved Scholarships</Text><TouchableOpacity onPress={() => router.push('/scholarships')} className="w-10 h-10 rounded-2xl bg-white items-center justify-center"><Ionicons name="add" size={24} color="#203E20" /></TouchableOpacity></View>
    {loading ? <ActivityIndicator color="#3D6414" /> : error ? <TouchableOpacity onPress={refresh}><Text className="text-[#9A3C2D]">{error} Tap to retry.</Text></TouchableOpacity> : savedItems.length === 0 ? <View className="bg-white rounded-[30px] p-6"><Text className="text-[#29472A]" style={{ fontFamily: FONTS.bold }}>No saved scholarships yet</Text><Text className="text-[#798C76] mt-2">Browse scholarship records and tap the bookmark to save one here.</Text><TouchableOpacity onPress={() => router.push('/scholarships')} className="bg-[#31532A] rounded-full py-3 items-center mt-5"><Text className="text-white" style={{ fontFamily: FONTS.bold }}>EXPLORE SCHOLARSHIPS</Text></TouchableOpacity></View> : savedItems.map((item) => <TouchableOpacity key={item.id} onPress={() => router.push({ pathname: '/scholarships/details', params: { id: item.id } })} className="bg-white rounded-[28px] p-5 mb-4"><View className="flex-row items-start"><View className="flex-1 mr-3"><Text className="text-[17px] text-[#29472A]" style={{ fontFamily: FONTS.bold }}>{item.title}</Text><Text className="text-[11px] text-[#798C76] mt-1">{item.provider_name} · {item.country}</Text></View><TouchableOpacity onPress={() => toggle(item.id)}><Ionicons name="bookmark" size={21} color="#3D6414" /></TouchableOpacity></View><Text className="text-xs text-[#42603C] mt-3">{item.study_levels.join(' · ')} · {item.award_amount}</Text></TouchableOpacity>)}
  </ScrollView><FloatingBottomNav currentTab="grid" /></View>;
}
