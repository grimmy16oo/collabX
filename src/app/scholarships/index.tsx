import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../theme/colors';
import { FloatingBottomNav } from '../../components/FloatingBottomNav';

interface Scholarship {
  id: string;
  title: string;
  institution: string;
  logoBg: string;
  logoIcon: keyof typeof Ionicons.glyphMap;
  logoIconColor?: string;
  matchScore: string;
  matchType: 'high' | 'medium';
  funding: string;
  isBookmarked: boolean;
}

const INITIAL_SCHOLARSHIPS: Scholarship[] = [
  {
    id: '1',
    title: 'Knight–Hennessy Scholars',
    institution: 'STANFORD UNIVERSITY, USA',
    logoBg: '#263D36',
    logoIcon: 'shield-outline',
    logoIconColor: '#FFFFFF',
    matchScore: '98% MATCH',
    matchType: 'high',
    funding: 'FULL RIDE',
    isBookmarked: false,
  },
  {
    id: '2',
    title: 'Rhodes Scholarship',
    institution: 'UNIVERSITY OF OXFORD, UK',
    logoBg: '#68948B',
    logoIcon: 'business-outline',
    logoIconColor: '#FFFFFF',
    matchScore: '85% MATCH',
    matchType: 'medium',
    funding: 'FULL FUNDING',
    isBookmarked: false,
  },
  {
    id: '3',
    title: 'DAAD Master Scholarship',
    institution: 'VARIOUS UNIVERSITIES, GERMANY',
    logoBg: '#33403B',
    logoIcon: 'earth',
    logoIconColor: '#65A376',
    matchScore: '91% MATCH',
    matchType: 'high',
    funding: '€1,200/MO',
    isBookmarked: false,
  },
  {
    id: '4',
    title: 'Gates Cambridge Scholarship',
    institution: 'UNIVERSITY OF CAMBRIDGE, UK',
    logoBg: '#183119',
    logoIcon: 'school-outline',
    logoIconColor: '#FFFFFF',
    matchScore: '94% MATCH',
    matchType: 'high',
    funding: 'FULL FUNDING',
    isBookmarked: true,
  },
];

const INITIAL_TAGS = ['USA', 'FULL FUNDING', 'MASTERS'];

export default function ScholarshipsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>(INITIAL_TAGS);
  const [scholarships, setScholarships] = useState<Scholarship[]>(INITIAL_SCHOLARSHIPS);

  const removeTag = (tagToRemove: string) => {
    setActiveTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const toggleBookmark = (id: string) => {
    setScholarships((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
      )
    );
  };

  const filteredScholarships = scholarships.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.institution.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-[#F0F2E9]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="px-5"
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20) + 12,
          paddingBottom: Math.max(insets.bottom, 20) + 100, // Space for floating bottom nav
        }}
      >
        {/* Top Header: Back Button & Screen Title */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="w-11 h-11 rounded-full bg-white items-center justify-center border border-[#ECEFE4] shadow-sm mr-4"
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.headingDark} />
          </TouchableOpacity>
          <Text
            className="text-2xl font-bold text-[#152A17] tracking-tight"
            style={{ fontFamily: FONTS.bold }}
          >
            Scholarships
          </Text>
        </View>

        {/* Search & Filter Row */}
        <View className="flex-row items-center mb-4">
          <View className="flex-1 flex-row items-center bg-white rounded-full px-4 h-12 border border-[#ECEFE4] shadow-sm">
            <Ionicons name="search-outline" size={19} color="#798C76" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name, field..."
              placeholderTextColor="#9AAFA0"
              className="flex-1 ml-2.5 text-sm text-[#152A17]"
              style={{ fontFamily: FONTS.medium }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9AAFA0" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            className="w-12 h-12 rounded-2xl bg-[#28431E] items-center justify-center shadow-sm ml-3"
            accessibilityRole="button"
            accessibilityLabel="Filter Options"
          >
            <Ionicons name="options-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Active Filter Tags */}
        {activeTags.length > 0 && (
          <View className="mb-5">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {activeTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => removeTag(tag)}
                  activeOpacity={0.8}
                  className="bg-[#E5ECE0] border border-[#D7E2D1] rounded-xl px-3.5 py-2 flex-row items-center"
                >
                  <Text
                    className="text-xs font-bold text-[#152A17] tracking-wider uppercase mr-2"
                    style={{ fontFamily: FONTS.bold }}
                  >
                    {tag}
                  </Text>
                  <Ionicons name="close" size={13} color="#152A17" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Results Count & Sort Dropdown */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-[13px] text-[#798C76]">
            Found{' '}
            <Text
              className="font-bold text-[#152A17]"
              style={{ fontFamily: FONTS.bold }}
            >
              128 Results
            </Text>
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center gap-1"
          >
            <Text
              className="text-[13px] font-bold text-[#152A17]"
              style={{ fontFamily: FONTS.bold }}
            >
              Recent
            </Text>
            <Ionicons name="chevron-down" size={14} color="#152A17" />
          </TouchableOpacity>
        </View>

        {/* Scholarship Cards List */}
        <View className="gap-4">
          {filteredScholarships.map((item) => (
            <View
              key={item.id}
              className="bg-white rounded-[28px] border border-[#ECEFE4] p-5 shadow-sm justify-between"
              style={{
                ...Platform.select({
                  web: {
                    boxShadow: '0px 6px 16px rgba(21, 42, 23, 0.05)',
                  },
                }),
              }}
            >
              {/* Card Header: Icon, Titles & Bookmark */}
              <View className="flex-row items-start justify-between mb-4">
                <View className="flex-row items-center flex-1 gap-3.5 mr-2">
                  <View
                    className="w-14 h-14 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: item.logoBg }}
                  >
                    <Ionicons
                      name={item.logoIcon}
                      size={26}
                      color={item.logoIconColor || '#FFFFFF'}
                    />
                  </View>

                  <View className="flex-1">
                    <Text
                      className="text-[17px] font-bold text-[#152A17] leading-[22px] mb-1"
                      style={{ fontFamily: FONTS.bold }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      className="text-[11px] font-bold text-[#8FA38D] tracking-wider uppercase"
                      style={{ fontFamily: FONTS.bold }}
                    >
                      {item.institution}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => toggleBookmark(item.id)}
                  activeOpacity={0.7}
                  className="p-1"
                  accessibilityRole="button"
                  accessibilityLabel="Bookmark"
                >
                  <Ionicons
                    name={item.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={21}
                    color={item.isBookmarked ? COLORS.accentOlive : '#798C76'}
                  />
                </TouchableOpacity>
              </View>

              {/* Card Bottom Row: Eligibility, Funding, Details Button */}
              <View className="flex-row items-end justify-between pt-1 border-t border-[#F2F4EE]">
                {/* Eligibility */}
                <View>
                  <Text
                    className="text-[10px] font-bold text-[#8FA38D] tracking-wider uppercase mb-1.5"
                    style={{ fontFamily: FONTS.bold }}
                  >
                    ELIGIBILITY
                  </Text>
                  <View
                    className={`px-2.5 py-1 rounded-xl ${
                      item.matchType === 'high' ? 'bg-[#E8F3E4]' : 'bg-[#FDF0E7]'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        item.matchType === 'high'
                          ? 'text-[#345B18]'
                          : 'text-[#C86638]'
                      }`}
                      style={{ fontFamily: FONTS.bold }}
                    >
                      {item.matchScore}
                    </Text>
                  </View>
                </View>

                {/* Funding */}
                <View>
                  <Text
                    className="text-[10px] font-bold text-[#8FA38D] tracking-wider uppercase mb-1.5"
                    style={{ fontFamily: FONTS.bold }}
                  >
                    FUNDING
                  </Text>
                  <Text
                    className="text-xs font-bold text-[#152A17]"
                    style={{ fontFamily: FONTS.bold }}
                  >
                    {item.funding}
                  </Text>
                </View>

                {/* Details Button */}
                <TouchableOpacity
                  onPress={() => router.push('/scholarships/details')}
                  activeOpacity={0.85}
                  className="bg-[#233D1F] px-5 py-2.5 rounded-full items-center justify-center shadow-sm"
                  accessibilityRole="button"
                  accessibilityLabel="Details"
                >
                  <Text
                    className="text-xs font-bold text-white tracking-wider uppercase"
                    style={{ fontFamily: FONTS.bold }}
                  >
                    DETAILS
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Bottom Nav with Search Tab Active */}
      <FloatingBottomNav currentTab="search" />
    </View>
  );
}
