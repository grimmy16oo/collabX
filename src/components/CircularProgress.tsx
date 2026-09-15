import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, FONTS } from '../theme/colors';

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 to 100
  progressColor?: string;
  trackColor?: string;
  textColor?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size = 60,
  strokeWidth = 5.5,
  progress = 65,
  progressColor = COLORS.accentOlive,
  trackColor = '#E6EDE1',
  textColor = COLORS.headingDark,
}) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (circumference * Math.min(Math.max(progress, 0), 100)) / 100;

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        {/* Background Track */}
        <Circle
          stroke={trackColor}
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Active Progress Arc */}
        <Circle
          stroke={progressColor}
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View className="absolute items-center justify-center">
        <Text
          className="text-[13px] font-bold"
          style={{ color: textColor, fontFamily: FONTS.bold }}
        >
          {progress}%
        </Text>
      </View>
    </View>
  );
};
