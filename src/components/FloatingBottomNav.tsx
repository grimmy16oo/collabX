import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../theme/colors";

export type TabKey = "home" | "search" | "eligibility" | "grid" | "profile";

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
  const [hoveredTab, setHoveredTab] = useState<TabKey | null>(null);

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
      eligibility: "/eligibility",
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
    { key: "eligibility", icon: "checkmark-circle-outline", size: 22 },
    { key: "grid", icon: "grid-outline", size: 21 },
    { key: "profile", icon: "person-outline", size: 22 },
  ];

  const effectiveActive = currentTab ?? activeTab;

  return (
    <View
      className="absolute left-0 right-0 z-50 items-center justify-center"
      style={{
        bottom: Math.max(insets.bottom, 16),
        pointerEvents: "box-none" as any,
      }}
    >
      <View
        className="h-[80px] w-[343px] max-w-[91%] flex-row items-center justify-between rounded-full bg-[#153018] px-4 shadow-2xl"
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
            <Pressable
              key={item.key}
              onPress={() => handlePress(item.key)}
              onHoverIn={() => setHoveredTab(item.key)}
              onHoverOut={() => setHoveredTab((current) => current === item.key ? null : current)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={
                ({ home: "Home", search: "Search scholarships", eligibility: "Eligibility checker", grid: "Application tracker", profile: "Profile" })[item.key]
              }
              hitSlop={4}
              android_ripple={{ color: "rgba(255,255,255,0.16)", borderless: false }}
              style={({ pressed }) => ({
                width: 48,
                height: 48,
                flexShrink: 0,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 20,
                backgroundColor: isActive
                  ? pressed ? "#5B7E2D" : COLORS.navActiveCircle
                  : hoveredTab === item.key ? "rgba(255,255,255,0.12)" : "transparent",
                transform: [{ scale: pressed ? 0.96 : 1 }],
                ...Platform.select({ web: { transition: "background-color 140ms ease", cursor: "pointer" } as any }),
              })}
            >
              <Ionicons
                name={item.icon}
                size={item.size}
                color={isActive || hoveredTab === item.key ? "#FFFFFF" : COLORS.navInactiveIcon}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
