import React, { useState } from 'react';
import { ImageBackground, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS } from '../../theme/colors';

const CRITERIA = [
  { label: 'Min CGPA of 3.5 / 4.0', met: true },
  { label: 'International Residency', met: true },
  { label: 'Leadership Potential Proof', met: false },
];

export default function ScholarshipDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <View className="flex-1 bg-white">
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 112 }}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=85' }}
          className="bg-[#294425]"
          style={{ height: 418 }}
          imageStyle={{ opacity: 0.96 }}
          resizeMode="cover"
        >
          <LinearGradient colors={['rgba(13, 36, 16, 0.12)', 'rgba(13, 36, 16, 0.88)']} className="flex-1 px-6">
            <View className="flex-row items-center justify-between" style={{ paddingTop: Math.max(insets.top, 18) + 8 }}>
              <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 rounded-full bg-white/90 items-center justify-center" accessibilityRole="button" accessibilityLabel="Back">
                <Ionicons name="chevron-back" size={23} color="#284126" />
              </TouchableOpacity>
              <View className="flex-row gap-3">
                <TouchableOpacity className="w-12 h-12 rounded-full bg-white/90 items-center justify-center" accessibilityRole="button" accessibilityLabel="Share scholarship">
                  <Ionicons name="share-social-outline" size={21} color="#284126" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setBookmarked((value) => !value)} className="w-12 h-12 rounded-full bg-white/90 items-center justify-center" accessibilityRole="button" accessibilityLabel="Bookmark scholarship">
                  <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={21} color="#284126" />
                </TouchableOpacity>
              </View>
            </View>
            <View className="mt-auto pb-12 px-6">
              <View className="self-start rounded-full bg-[#577E10] px-4 py-2 mb-4">
                <Text className="text-[12px] text-white tracking-wider" style={{ fontFamily: FONTS.bold }}>MASTER OF SCIENCE • USA</Text>
              </View>
              <Text className="text-[35px] leading-[41px] text-white tracking-tight" style={{ fontFamily: FONTS.bold }}>Gates Cambridge{ '\n' }Scholarship 2025</Text>
            </View>
          </LinearGradient>
        </ImageBackground>

        <View className="bg-white -mt-7 rounded-t-[34px] px-6 pt-1">
          <View className="rounded-[30px] bg-white border border-[#F0F2EC] px-5 py-5 flex-row justify-between shadow-sm -mt-10">
            {[['FUNDING', 'Full Ride'], ['DEADLINE', 'Dec 12'], ['MATCH', '98%']].map(([label, value], index) => (
              <View key={label} className={`flex-1 ${index === 1 ? 'border-x border-[#EDF0E9] px-3' : ''}`}>
                <Text className="text-[10px] tracking-wider text-[#9AAA96]" style={{ fontFamily: FONTS.bold }}>{label}</Text>
                <Text className={`text-[16px] mt-1 ${label === 'MATCH' ? 'text-[#537314]' : 'text-[#263C26]'}`} style={{ fontFamily: FONTS.bold }}>{value}</Text>
              </View>
            ))}
          </View>

          <View className="rounded-[27px] bg-[#F1F4EC] border border-[#E5EAE0] px-6 py-6 mt-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[14px] tracking-wider text-[#30452F]" style={{ fontFamily: FONTS.bold }}>ELIGIBILITY SCORE</Text>
              <Text className="text-[15px] text-[#496B18]" style={{ fontFamily: FONTS.bold }}>98 / 100</Text>
            </View>
            <View className="h-2.5 rounded-full bg-[#E5E9E1] overflow-hidden"><View className="w-[98%] h-full rounded-full bg-[#5B8116]" /></View>
            <Text className="text-[13px] leading-5 text-[#9AA796] mt-4" style={{ fontFamily: FONTS.regular }}>Based on your CGPA (3.8), field of study (CS), and residency (International).</Text>
          </View>

          <View className="mt-12">
            <Text className="text-[22px] text-[#274128]" style={{ fontFamily: FONTS.bold }}>About Scholarship</Text>
            <Text className="text-[17px] leading-7 text-[#758072] mt-4" style={{ fontFamily: FONTS.regular }}>The Gates Cambridge Scholarship is one of the most prestigious international scholarships in the world. It is awarded to outstanding applicants from countries outside the UK to pursue a full-time postgraduate degree in any subject available at the University of Cambridge.</Text>
          </View>

          <View className="mt-12">
            <Text className="text-[22px] text-[#274128] mb-5" style={{ fontFamily: FONTS.bold }}>Key Criteria</Text>
            <View className="gap-4">
              {CRITERIA.map((criterion) => (
                <View key={criterion.label} className="rounded-[22px] bg-white border border-[#EEF1EB] px-5 py-5 flex-row items-center shadow-sm">
                  <View className={`w-10 h-10 rounded-xl items-center justify-center ${criterion.met ? 'bg-[#F2F5EE]' : 'bg-[#FFF8F2]'}`}>
                    <Ionicons name={criterion.met ? 'checkmark' : 'information-circle-outline'} size={21} color={criterion.met ? '#58732B' : '#EDA96D'} />
                  </View>
                  <Text className={`ml-4 text-[15px] ${criterion.met ? 'text-[#355033]' : 'text-[#99A296]'}`} style={{ fontFamily: FONTS.semiBold }}>{criterion.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#F0F2EC] px-6 pt-4 flex-row items-center gap-4" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <TouchableOpacity className="w-14 h-14 rounded-[22px] bg-[#F4F7F0] border border-[#E4EADD] items-center justify-center" accessibilityRole="button" accessibilityLabel="Ask a question">
          <Ionicons name="chatbubble-outline" size={25} color="#304B2E" />
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 h-14 rounded-full bg-[#24451F] items-center justify-center" accessibilityRole="button" accessibilityLabel="Apply now">
          <Text className="text-[17px] tracking-wider text-white" style={{ fontFamily: FONTS.bold }}>APPLY NOW</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
