import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../theme/colors";
import { DecorativeBackdrop } from "../components/DecorativeBackdrop";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const isCompact = height < 720 || width < 375;
  const headingSize = isCompact ? 52 : 64;
  const headingLineHeight = isCompact ? 56 : 68;

  return (
    <LinearGradient
      colors={COLORS.welcomeGradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      className="flex-1"
    >
      <DecorativeBackdrop variant="dark" />
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
              <Image
                source={require("../../assets/images/logo.png")}
                className="w-10 h-10"
                resizeMode="contain"
              />
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
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: headingSize,
                  lineHeight: headingLineHeight,
                }}
              >
                Unlock
              </Text>
              <Text
                className="font-extrabold text-white tracking-tighter"
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: headingSize,
                  lineHeight: headingLineHeight,
                }}
              >
                Your
              </Text>
              <Text
                className="font-extrabold text-[#86BB71] tracking-tighter italic"
                style={{
                  fontFamily: FONTS.boldItalic,
                  fontSize: headingSize,
                  lineHeight: headingLineHeight,
                }}
              >
                Global
              </Text>
              <Text
                className="font-extrabold text-[#86BB71] tracking-tighter italic"
                style={{
                  fontFamily: FONTS.boldItalic,
                  fontSize: headingSize,
                  lineHeight: headingLineHeight,
                }}
              >
                Future
              </Text>
            </View>

            {/* Subtitle */}
            <Text
              className="text-[#a4c7a2] py-3 mb-6 "
              style={{ fontFamily: FONTS.semiBoldItalic }}
            >
              Explore scholarship records with official eligibility and
              application links.
            </Text>
          </View>

          {/* Bottom Actions & Terms */}
          <View
            className="gap-3 mb-3"
            style={{ marginTop: isCompact ? 32 : "auto" }}
          >
            <TouchableOpacity
              className="bg-white h-14 rounded-full items-center justify-center active:opacity-90 shadow-sm"
              activeOpacity={0.88}
              onPress={() => router.push("/home")}
              accessibilityRole="button"
              accessibilityLabel="Get Started"
            >
              <Text
                className="font-bold text-[#153018] tracking-wider"
                style={{ fontFamily: FONTS.bold }}
              >
                GET STARTED
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="h-14 rounded-full border border-white/20 bg-white/[0.03] items-center justify-center active:opacity-80"
              activeOpacity={0.8}
              onPress={() => router.push("/sign-in")}
              accessibilityRole="button"
              accessibilityLabel="Sign In"
            >
              <Text
                className="font-bold text-white tracking-wider"
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
