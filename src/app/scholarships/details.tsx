import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSavedScholarships } from '../../data/scholarshipApi';
import { Scholarship } from '../../types/scholarship';
import { FONTS } from '../../theme/colors';

export default function ScholarshipDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { saved, toggle } = useSavedScholarships();
  const [item, setItem] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`${(process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '')}/api/scholarships/${encodeURIComponent(id || '')}`)
      .then((response) => { if (!response.ok) throw new Error('Could not load scholarship details. Check the API address and try again.'); return response.json(); })
      .then((body) => { if (active) setItem(body.data); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load scholarship details.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const section = (title: string, values: string[]) => <View className="mt-7"><Text className="text-xl text-[#274128] mb-3" style={{ fontFamily: FONTS.bold }}>{title}</Text>{values.length ? values.map((value, index) => <Text key={index} className="text-[15px] leading-6 text-[#758072] mb-2">• {value}</Text>) : <Text className="text-[#9AA796]">Not specified in the source data.</Text>}</View>;

  return <View className="flex-1 bg-white"><ScrollView contentContainerStyle={{ paddingBottom: 40, paddingTop: Math.max(insets.top, 18) + 8, paddingHorizontal: 24 }}>
    <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 rounded-full bg-[#F1F4EC] items-center justify-center mb-7"><Ionicons name="chevron-back" size={23} color="#284126" /></TouchableOpacity>
    {loading ? <ActivityIndicator size="large" color="#3D6414" /> : error ? <Text className="text-[#9A3C2D]">{error}</Text> : item && <>
      <View className="rounded-[30px] bg-[#183119] p-6"><Text className="text-xs text-[#B7C9AF] uppercase" style={{ fontFamily: FONTS.bold }}>{item.study_levels.join(' · ')} · {item.country}</Text><Text className="text-[30px] leading-9 text-white mt-4" style={{ fontFamily: FONTS.bold }}>{item.title}</Text><Text className="text-sm text-[#D6E1D1] mt-2">{item.provider_name}</Text></View>
      <View className="flex-row justify-between bg-white border border-[#F0F2EC] rounded-[24px] p-4 mt-5"><View className="flex-1"><Text className="text-[10px] text-[#9AAA96]">AWARD</Text><Text className="text-sm text-[#263C26] mt-1" style={{ fontFamily: FONTS.bold }}>{item.award_amount}</Text></View><View className="flex-1 px-2"><Text className="text-[10px] text-[#9AAA96]">DEADLINE</Text><Text className="text-sm text-[#263C26] mt-1" style={{ fontFamily: FONTS.bold }}>{item.deadline}</Text></View><TouchableOpacity onPress={() => toggle(item.id)}><Ionicons name={saved.includes(item.id) ? 'bookmark' : 'bookmark-outline'} size={23} color="#3D6414" /></TouchableOpacity></View>
      {section('Study fields', item.fields_of_study)}{section('Eligible countries', item.eligible_countries)}{section('Benefits', item.benefits)}
      <Text className="text-xs text-[#899686] mt-6">Deadline timezone: {item.deadline_timezone || 'Not specified'} · Last verified: {item.last_verified_at || 'Not specified'}</Text>
      <TouchableOpacity onPress={() => Linking.openURL(item.source_url)} className="h-12 rounded-full border border-[#24451F] items-center justify-center mt-5"><Text className="text-[#24451F]" style={{ fontFamily: FONTS.bold }}>VIEW OFFICIAL SOURCE</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => Linking.openURL(item.application_url)} className="h-14 rounded-full bg-[#24451F] items-center justify-center mt-3"><Text className="text-white" style={{ fontFamily: FONTS.bold }}>OPEN APPLICATION</Text></TouchableOpacity>
    </>}
  </ScrollView></View>;
}
