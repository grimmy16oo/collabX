import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../theme/colors";

export type TabKey = "home" | "search" | "grid" | "profile";

interface FloatingBottomNavProps {
  currentTab?: TabKey;
  onSelectTab?: (tab: TabKey) => void;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>(currentTab ?? "home");

  const handlePress = (tab: TabKey) => {
    const effectiveActive = currentTab ?? activeTab;
    if (effectiveActive === tab) return;

    setActiveTab(tab);
    if (onSelectTab) {
      onSelectTab(tab);
      return;
    }

    const routeMap: Record<TabKey, string> = {
      home: "/home",
      search: "/scholarships",
      grid: "/tracker",
      profile: "/about",
    };

    const target = routeMap[tab];
    if (target) router.push(target as Href);
  };

  const navItems: {
    key: TabKey;
    icon: keyof typeof Ionicons.glyphMap;
    size: number;
  }[] = [
    { key: "home", icon: "home-outline", size: 23 },
    { key: "search", icon: "search-outline", size: 22 },
    { key: "grid", icon: "grid-outline", size: 21 },
    { key: "profile", icon: "person-outline", size: 22 },
  ];

  const effectiveActive = currentTab ?? activeTab;

  return (
    <View
      className="absolute left-0 right-0 items-center justify-center z-50"
      style={{
        bottom: Math.max(insets.bottom, 16),
        pointerEvents: "box-none" as any,
      }}
    >
      <View
        className="flex-row items-center justify-between bg-[#173B18] w-[343px] max-w-[91%] h-[72px] px-3 rounded-full shadow-2xl"
        style={{
          ...Platform.select({
            web: {
              boxShadow: "0px 10px 28px rgba(10, 24, 11, 0.28)",
            },
          }),
        }}
      >
        {navItems.map((item) => {
          const isActive = effectiveActive === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => handlePress(item.key)}
              activeOpacity={0.82}
              className={`w-12 h-12 rounded-2xl items-center justify-center ${
                isActive ? "bg-[#476C19]" : ""
              }`}
              accessibilityRole="button"
              accessibilityLabel={item.key}
            >
              <Ionicons
                name={item.icon}
                size={item.size}
                color={isActive ? "#FFFFFF" : COLORS.navInactiveIcon}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
