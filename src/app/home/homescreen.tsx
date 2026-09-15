import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../theme/colors';
import { CircularProgress } from '../../components/CircularProgress';
import { FloatingBottomNav, TabKey } from '../../components/FloatingBottomNav';

const { width } = Dimensions.get('window');

interface ScholarshipItem {
  id: string;
  title: string;
  institution: string;
  monogram: string;
  monogramBg: string;
  country: string;
  fundingType: string;
  deadline: string;
  amount: string;
  isBookmarked: boolean;
}

const FEATURED_SCHOLARSHIPS: ScholarshipItem[] = [
  {
    id: '1',
    title: 'Gates Cambridge Scholarship',
    institution: 'University of Cambridge',
    monogram: 'GC',
    monogramBg: '#183119',
    country: 'UK',
    fundingType: 'FULL FUNDING',
    deadline: 'Dec 15, 2026',
    amount: '$45,000',
    isBookmarked: true,
  },
  {
    id: '2',
    title: 'Rhodes Trust Scholarship',
    institution: 'University of Oxford',
    monogram: 'RS',
    monogramBg: '#213A1C',
    country: 'UK',
    fundingType: 'FULL FUNDING',
    deadline: 'Oct 02, 2026',
    amount: '$52,000',
    isBookmarked: false,
  },
  {
    id: '3',
    title: 'Fulbright Foreign Program',
    institution: 'US Department of State',
    monogram: 'FB',
    monogramBg: '#1E3B24',
    country: 'USA',
    fundingType: 'FULL FUNDING',
    deadline: 'Sep 18, 2026',
    amount: '$40,000',
    isBookmarked: false,
  },
  {
    id: '4',
    title: 'Schwarzman Scholars',
    institution: 'Tsinghua University',
    monogram: 'SS',
    monogramBg: '#142C16',
    country: 'CHINA',
    fundingType: 'FULL FUNDING',
    deadline: 'Nov 01, 2026',
    amount: '$60,000',
    isBookmarked: false,
  },
];

const FILTER_OPTIONS = [
  'All Types',
  'Full Funding',
  'Undergraduate',
  'Postgraduate',
  'STEM & Tech',
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState('All Types');
  const [scholarships, setScholarships] = useState(FEATURED_SCHOLARSHIPS);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [hasNotification, setHasNotification] = useState(true);

  const toggleBookmark = (id: string) => {
    setScholarships((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
      )
    );
  };

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
        {/* Top Bar: User Avatar & Notification Bell */}
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-full border-2 border-white shadow-sm overflow-hidden">
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                }}
                className="w-full h-full rounded-full"
              />
            </View>
            <View className="gap-0.5">
              <Text
                className="text-[11px] font-bold text-[#798C76] tracking-wider uppercase"
                style={{ fontFamily: FONTS.bold }}
              >
                WELCOME BACK
              </Text>
              <Text
                className="text-[17px] font-bold text-[#152A17] tracking-tight"
                style={{ fontFamily: FONTS.bold }}
              >
                Alex Johnson
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="w-[46px] h-[46px] rounded-full bg-white items-center justify-center border border-[#ECEFE4] shadow-sm relative"
            activeOpacity={0.8}
            onPress={() => setHasNotification(false)}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={21} color={COLORS.headingDark} />
            {hasNotification && (
              <View className="absolute top-[11px] right-3 w-2 h-2 rounded-full bg-[#EF4444] border-[1.5px] border-white" />
            )}
          </TouchableOpacity>
        </View>

        {/* Title Headline */}
        <View className="mb-5">
          <Text
            className="text-[34px] font-extrabold text-[#152A17] leading-10 tracking-tight"
            style={{ fontFamily: FONTS.bold }}
          >
            Find your perfect{'\n'}
            <Text
              className="italic text-[#3D6414]"
              style={{ fontFamily: FONTS.boldItalic }}
            >
              Scholarship
            </Text>
          </Text>
        </View>

        {/* Eligibility Banner */}
        <TouchableOpacity
          activeOpacity={0.92}
          className="bg-[#183119] rounded-[28px] p-5 relative overflow-hidden mb-6 shadow-md"
          accessibilityRole="button"
          accessibilityLabel="Eligibility Match Banner"
        >
          {/* Subtle decorative glow circle inside banner */}
          <View className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-[#3D6414]/30" />

          <View className="flex-row items-center justify-between mb-3.5">
            <View className="flex-row items-center bg-[#274423] py-1 px-3 rounded-2xl">
              <Ionicons
                name="sparkles"
                size={13}
                color={COLORS.badgeGpaText}
                style={{ marginRight: 4 }}
              />
              <Text
                className="text-xs font-bold text-[#A7F3D0] tracking-wide"
                style={{ fontFamily: FONTS.bold }}
              >
                3.8 GPA
              </Text>
            </View>

            <View className="flex-row items-center bg-white/10 py-1 px-3 rounded-2xl gap-1.5">
              <Ionicons name="shield-checkmark" size={15} color="#A7F3D0" />
              <Text
                className="text-xs font-bold text-white"
                style={{ fontFamily: FONTS.bold }}
              >
                92% Match Score
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text
                className="text-[17px] font-bold text-white mb-1"
                style={{ fontFamily: FONTS.bold }}
              >
                High Eligibility Profile
              </Text>
              <Text
                className="text-[13px] text-[#B6CAB2] leading-[18px]"
                style={{ fontFamily: FONTS.regular }}
              >
                You qualify for 18 fully funded global awards matching your credentials.
              </Text>
            </View>

            <View className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Filter Chips */}
        <View className="mb-6 -mx-5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          >
            {FILTER_OPTIONS.map((filter) => {
              const isActive = selectedFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setSelectedFilter(filter)}
                  activeOpacity={0.8}
                  className={`py-2.5 px-4.5 rounded-full border ${
                    isActive
                      ? 'bg-[#3D6414] border-[#3D6414]'
                      : 'bg-white border-[#ECEFE4]'
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter: ${filter}`}
                >
                  <Text
                    className={`text-[13px] font-semibold ${
                      isActive ? 'text-white' : 'text-[#152A17]'
                    }`}
                    style={{ fontFamily: FONTS.bold }}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* "Featured for you" Section */}
        <View className="mb-7">
          <View className="flex-row items-center justify-between mb-3.5">
            <Text
              className="text-[19px] font-bold text-[#152A17] tracking-tight"
              style={{ fontFamily: FONTS.bold }}
            >
              Featured for you
            </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text
                className="text-[13px] font-bold text-[#3D6414]"
                style={{ fontFamily: FONTS.bold }}
              >
                See all ({scholarships.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 10 }}
            snapToInterval={width * 0.78 + 16}
            decelerationRate="fast"
          >
            {scholarships.map((item) => (
              <View
                key={item.id}
                className="w-[280px] max-w-[320px] bg-white rounded-[28px] border border-[#ECEFE4] p-5 justify-between shadow-sm mr-4"
              >
                {/* Card Top: Monogram & Bookmark Button */}
                <View className="flex-row items-center justify-between mb-3.5">
                  <View
                    className="w-11 h-11 rounded-[14px] items-center justify-center"
                    style={{ backgroundColor: item.monogramBg }}
                  >
                    <Text
                      className="text-[15px] font-bold text-white tracking-wide"
                      style={{ fontFamily: FONTS.bold }}
                    >
                      {item.monogram}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => toggleBookmark(item.id)}
                    activeOpacity={0.7}
                    className="w-9 h-9 rounded-full bg-[#F5F7F2] items-center justify-center border border-[#ECEFE4]"
                    accessibilityRole="button"
                    accessibilityLabel="Toggle bookmark"
                  >
                    <Ionicons
                      name={item.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                      size={18}
                      color={item.isBookmarked ? COLORS.accentOlive : '#7B8E78'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Scholarship Info */}
                <View className="mb-3.5">
                  <Text
                    className="text-[17px] font-bold text-[#152A17] leading-[22px] mb-1"
                    numberOfLines={2}
                    style={{ fontFamily: FONTS.bold }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    className="text-[13px] font-medium text-[#798C76]"
                    numberOfLines={1}
                    style={{ fontFamily: FONTS.medium }}
                  >
                    {item.institution}
                  </Text>
                </View>

                {/* Tags */}
                <View className="flex-row items-center gap-2 mb-4">
                  <View className="flex-row items-center bg-[#EDF3E8] py-1 px-2.5 rounded-xl gap-1">
                    <Ionicons name="location-sharp" size={11} color={COLORS.tagText} />
                    <Text
                      className="text-[11px] font-bold text-[#2C4C16] tracking-wide"
                      style={{ fontFamily: FONTS.bold }}
                    >
                      {item.country}
                    </Text>
                  </View>
                  <View className="bg-[#EDF3E8] py-1 px-2.5 rounded-xl">
                    <Text
                      className="text-[11px] font-bold text-[#2C4C16] tracking-wide"
                      style={{ fontFamily: FONTS.bold }}
                    >
                      {item.fundingType}
                    </Text>
                  </View>
                </View>

                {/* Card Divider */}
                <View className="h-[1px] bg-[#ECEFE4] mb-3.5" />

                {/* Card Footer: Deadline & Amount */}
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text
                      className="text-[10px] font-bold text-[#798C76] tracking-wider mb-0.5"
                      style={{ fontFamily: FONTS.bold }}
                    >
                      DEADLINE
                    </Text>
                    <Text
                      className="text-[13px] font-semibold text-[#152A17]"
                      style={{ fontFamily: FONTS.semiBold }}
                    >
                      {item.deadline}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text
                      className="text-[10px] font-bold text-[#798C76] tracking-wider mb-0.5"
                      style={{ fontFamily: FONTS.bold }}
                    >
                      FUNDING
                    </Text>
                    <Text
                      className="text-[15px] font-extrabold text-[#3D6414]"
                      style={{ fontFamily: FONTS.bold }}
                    >
                      {item.amount}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* "Active Applications" Section */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3.5">
            <Text
              className="text-[19px] font-bold text-[#152A17] tracking-tight"
              style={{ fontFamily: FONTS.bold }}
            >
              Active Applications
            </Text>
            <View className="bg-[#E4ECDF] py-1 px-2.5 rounded-xl">
              <Text
                className="text-[11px] font-bold text-[#3D6414]"
                style={{ fontFamily: FONTS.bold }}
              >
                1 in progress
              </Text>
            </View>
          </View>

          {/* Active Application Card */}
          <View className="flex-row items-center justify-between bg-white rounded-[28px] border border-[#ECEFE4] p-4.5 shadow-sm">
            <View className="flex-row items-center flex-1 gap-3.5 mr-2.5">
              <View className="w-12 h-12 rounded-2xl bg-[#183119] items-center justify-center">
                <Text
                  className="text-[15px] font-bold text-white"
                  style={{ fontFamily: FONTS.bold }}
                >
                  CS
                </Text>
              </View>

              <View className="flex-1 gap-0.5">
                <Text
                  className="text-base font-bold text-[#152A17]"
                  numberOfLines={1}
                  style={{ fontFamily: FONTS.bold }}
                >
                  Chevening Scholarship
                </Text>
                <Text
                  className="text-xs font-medium text-[#798C76]"
                  style={{ fontFamily: FONTS.medium }}
                >
                  UK Government · Master's
                </Text>

                <View className="flex-row items-center bg-[#F3F6F0] py-0.5 px-2 rounded-lg self-start mt-1 gap-1.5">
                  <View className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                  <Text
                    className="text-[11px] font-semibold text-[#715814]"
                    style={{ fontFamily: FONTS.semiBold }}
                  >
                    Status: Under Review
                  </Text>
                </View>
              </View>
            </View>

            {/* SVG Circular Progress Ring */}
            <View className="items-center justify-center">
              <CircularProgress
                size={58}
                strokeWidth={5}
                progress={65}
                progressColor={COLORS.accentOlive}
                trackColor="#E7ECE3"
                textColor={COLORS.headingDark}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Nav */}
      <FloatingBottomNav
        currentTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
      />
    </View>
  );
}