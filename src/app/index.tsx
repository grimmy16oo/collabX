import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../theme/colors';

const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const isCompact = height < 720 || width < 375;
  const headingSize = isCompact ? 42 : 52;
  const headingLineHeight = isCompact ? 46 : 56;

  return (
    <LinearGradient
      colors={COLORS.welcomeGradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      className="flex-1"
    >
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          minHeight: height,
          paddingTop: Math.max(insets.top, 20) + (isCompact ? 12 : 18),
          paddingBottom: Math.max(insets.bottom, 16) + 16,
        }}
      >
        <View
          className="flex-1 w-full self-center"
          style={{ maxWidth: 560, paddingHorizontal: width < 375 ? 20 : 24 }}
        >
        {/* Top Header: White squircle icon box + CollabX brand text */}
        <View className="flex-row items-center">
          <View className="w-[50px] h-[50px] rounded-[18px] bg-white items-center justify-center shadow-sm">
            <Ionicons name="school" size={26} color={COLORS.primaryDark} />
          </View>
          <Text
            className="text-[26px] font-bold text-white ml-3.5 tracking-tight"
            style={{ fontFamily: FONTS.bold }}
          >
            CollabX
          </Text>
        </View>

        {/* Middle Content Section */}
        <View style={{ marginTop: isCompact ? 32 : 56 }}>
          {/* Display Headline */}
          <View className="mb-4 gap-5">
            <Text
              className="font-extrabold text-white tracking-tighter"
              style={{ fontFamily: FONTS.bold, fontSize: headingSize, lineHeight: headingLineHeight }}
            >
              Unlock
            </Text>
            <Text
              className="font-extrabold text-white tracking-tighter"
              style={{ fontFamily: FONTS.bold, fontSize: headingSize, lineHeight: headingLineHeight }}
            >
              Your
            </Text>
            <Text
              className="font-extrabold text-[#86BB71] tracking-tighter italic"
              style={{ fontFamily: FONTS.boldItalic, fontSize: headingSize, lineHeight: headingLineHeight }}
            >
              Global
            </Text>
            <Text
              className="font-extrabold text-[#86BB71] tracking-tighter italic"
              style={{ fontFamily: FONTS.boldItalic, fontSize: headingSize, lineHeight: headingLineHeight }}
            >
              Future
            </Text>
          </View>

          {/* Subtitle */}
          <Text
            className="text-base text-[#A3BEA1] leading-6 mb-6 max-w-[94%]"
            style={{ fontFamily: FONTS.regular }}
          >
            Explore scholarship records with official eligibility and application links.
          </Text>

          {/* Social Proof */}
          <View className="flex-row items-center gap-3.5">
            <View className="flex-row items-center">
              {AVATARS.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  className="w-9 h-9 rounded-full border-2 border-[#153018]"
                  style={{
                    marginLeft: index === 0 ? 0 : -10,
                    zIndex: 10 - index,
                  }}
                />
              ))}
              <View
                className="w-9 h-9 rounded-full bg-[#A9C6A2] items-center justify-center border-2 border-[#153018] -ml-2.5"
                style={{ zIndex: 5 }}
              >
                <Text
                  className="text-[11px] font-bold text-[#153018]"
                  style={{ fontFamily: FONTS.bold }}
                >
                  10k+
                </Text>
              </View>
            </View>

            <View className="justify-center">
              <Text
                className="text-[11px] font-bold text-[#8EA88C] tracking-widest uppercase"
                style={{ fontFamily: FONTS.bold }}
              >
                TRUSTED BY STUDENTS
              </Text>
              <Text
                className="text-[11px] font-bold text-[#8EA88C] tracking-widest uppercase"
                style={{ fontFamily: FONTS.bold }}
              >
                WORLDWIDE
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Actions & Terms */}
        <View className="gap-3" style={{ marginTop: isCompact ? 32 : 'auto' }}>
          <TouchableOpacity
            className="bg-white h-14 rounded-full items-center justify-center active:opacity-90 shadow-sm"
            activeOpacity={0.88}
            onPress={() => router.push('/home')}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
          >
            <Text
              className="text-sm font-bold text-[#153018] tracking-wider"
              style={{ fontFamily: FONTS.bold }}
            >
              GET STARTED
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="h-14 rounded-full border border-white/20 bg-white/[0.03] items-center justify-center active:opacity-80"
            activeOpacity={0.8}
            onPress={() => router.push('/sign-in')}
            accessibilityRole="button"
            accessibilityLabel="Sign In"
          >
            <Text
              className="text-sm font-bold text-white tracking-wider"
              style={{ fontFamily: FONTS.bold }}
            >
              SIGN IN
            </Text>
          </TouchableOpacity>

          <Text
            className="text-[10px] font-semibold text-[#5F7E5C] tracking-wider text-center mt-1.5 uppercase"
            style={{ fontFamily: FONTS.medium }}
          >
            BY CONTINUING YOU AGREE TO OUR TERMS OF SERVICE
          </Text>
        </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
