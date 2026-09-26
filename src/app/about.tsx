import { Ionicons } from "@expo/vector-icons";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FloatingBottomNav } from "../components/FloatingBottomNav";
import { COLORS, FONTS } from "../theme/colors";

type DetailRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  label: string;
  destructive?: boolean;
  badge?: string;
};

function DetailRow({
  icon,
  iconColor,
  iconBackground,
  label,
  destructive,
  badge,
}: DetailRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      className="flex-row items-center justify-between"
      style={{ minHeight: 76 }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View className="flex-row items-center">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-4"
          style={{ backgroundColor: iconBackground }}
        >
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text
          className="text-[14px] font-bold"
          style={{
            color: destructive ? "#FF4343" : COLORS.headingDark,
            fontFamily: FONTS.bold,
          }}
        >
          {label}
        </Text>
      </View>
      <View className="flex-row items-center">
        {badge && (
          <View className="bg-[#FF731E] rounded-md px-1.5 py-1 mr-3">
            <Text
              className="text-[9px] text-white"
              style={{ fontFamily: FONTS.bold }}
            >
              {badge}
            </Text>
          </View>
        )}
        {!destructive && (
          <Ionicons name="chevron-forward" size={17} color="#A5B49D" />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function About() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-[#F4F6EF]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="px-6"
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20) + 10,
          paddingBottom: Math.max(insets.bottom, 20) + 100,
        }}
      >
        <View className="items-center mb-10">
          <View className="relative mb-6">
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
              }}
              className="w-[108px] h-[108px] rounded-[36px] border-4 border-white"
            />
            <TouchableOpacity
              className="absolute right-[-6px] bottom-[-5px] w-9 h-9 rounded-xl bg-[#426800] border-2 border-white items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Ionicons name="pencil-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text
            className="text-[26px] font-bold tracking-tight text-[#203E20]"
            style={{ fontFamily: FONTS.bold }}
          >
            Alex Johnson
          </Text>
          <Text
            className="text-[12px] tracking-[1.2px] text-[#9EAE95] mt-1"
            style={{ fontFamily: FONTS.bold }}
          >
            COMPUTER SCIENCE UNDERGRAD
          </Text>
        </View>
        <View className="flex-row gap-4 mb-10">
          <View
            className="flex-1 bg-white rounded-[25px] px-5 justify-center"
            style={{ height: 84 }}
          >
            <Text
              className="text-[9px] tracking-[0.6px] text-[#9EAE95]"
              style={{ fontFamily: FONTS.bold }}
            >
              CURRENT CGPA
            </Text>
            <View className="flex-row items-end mt-1">
              <Text
                className="text-[21px] text-[#203E20]"
                style={{ fontFamily: FONTS.bold }}
              >
                3.85
              </Text>
              <Text
                className="text-[11px] text-[#9EAE95] mb-1 ml-1"
                style={{ fontFamily: FONTS.bold }}
              >
                / 4.0
              </Text>
            </View>
          </View>
          <View
            className="flex-1 bg-white rounded-[25px] px-5 justify-center"
            style={{ height: 84 }}
          >
            <Text
              className="text-[9px] tracking-[0.6px] text-[#9EAE95]"
              style={{ fontFamily: FONTS.bold }}
            >
              DEGREE LEVEL
            </Text>
            <Text
              className="text-[14px] text-[#203E20] mt-2"
              style={{ fontFamily: FONTS.bold }}
            >
              Bachelor&apos;s
            </Text>
          </View>
        </View>
        <Text
          className="text-[13px] tracking-[1px] text-[#29472A] mb-4 ml-2"
          style={{ fontFamily: FONTS.bold }}
        >
          APPLICATION DETAILS
        </Text>
        <View className="bg-white rounded-[38px] px-6 mb-8">
          <DetailRow
            icon="document-text-outline"
            iconColor="#456907"
            iconBackground="#F3F5F0"
            label="Saved Resumes"
          />
          <DetailRow
            icon="globe-outline"
            iconColor="#9D38FF"
            iconBackground="#FAF1FF"
            label="Target Countries"
          />
          <DetailRow
            icon="layers-outline"
            iconColor="#FA5B18"
            iconBackground="#FFF5EF"
            label="Field of Study"
          />
        </View>
        <Text
          className="text-[13px] tracking-[1px] text-[#29472A] mb-4 ml-2"
          style={{ fontFamily: FONTS.bold }}
        >
          ACCOUNT
        </Text>
        <View className="bg-white rounded-[38px] px-6">
          <DetailRow
            icon="notifications-outline"
            iconColor="#29472A"
            iconBackground="#F3F5F0"
            label="Notifications"
            badge="2 NEW"
          />
          <DetailRow
            icon="log-out-outline"
            iconColor="#FF4343"
            iconBackground="#FFF1F1"
            label="Log Out"
            destructive
          />
        </View>
      </ScrollView>
      <FloatingBottomNav currentTab="profile" />
    </View>
  );
}
