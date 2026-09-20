import React, { useState } from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export type TabKey = 'home' | 'search' | 'grid' | 'profile';

interface FloatingBottomNavProps {
  currentTab?: TabKey;
  onSelectTab?: (tab: TabKey) => void;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  currentTab = 'home',
  onSelectTab,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>(currentTab);

  const handlePress = (tab: TabKey) => {
    setActiveTab(tab);
    if (onSelectTab) {
      onSelectTab(tab);
    } else {
      if (tab === 'home' && currentTab !== 'home') {
        router.push('/home');
      } else if (tab === 'search' && currentTab !== 'search') {
        router.push('/scholarships');
      }
    }
  };

  const navItems: {
    key: TabKey;
    icon: keyof typeof Ionicons.glyphMap;
    size: number;
  }[] = [
    { key: 'home', icon: 'home-outline', size: 23 },
    { key: 'search', icon: 'search-outline', size: 22 },
    { key: 'grid', icon: 'grid-outline', size: 21 },
    { key: 'profile', icon: 'person-outline', size: 22 },
  ];

  const effectiveActive = currentTab || activeTab;

  return (
    <View
      className="absolute left-0 right-0 items-center justify-center z-50"
      style={{
        bottom: Platform.OS === 'ios' ? 24 : 18,
        pointerEvents: 'box-none' as any,
      }}
    >
      <View
        className="flex-row items-center justify-between bg-[#152E18] w-[260px] h-16 px-2 rounded-full shadow-2xl"
        style={{
          ...Platform.select({
            web: {
              boxShadow: '0px 10px 28px rgba(10, 24, 11, 0.28)',
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
              className={`w-12 h-12 rounded-full items-center justify-center ${
                isActive ? 'bg-[#476C19]' : ''
              }`}
              accessibilityRole="button"
              accessibilityLabel={item.key}
            >
              <Ionicons
                name={item.icon}
                size={item.size}
                color={isActive ? '#FFFFFF' : COLORS.navInactiveIcon}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
