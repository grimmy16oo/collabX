import { Ionicons } from '@expo/vector-icons';
import { useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

/** Quiet, non-interactive CollabX artwork used behind cream canvas screens. */
export function DecorativeBackdrop({ variant = 'canvas' }: { variant?: 'canvas' | 'dark' } = {}) {
  const { width, height } = useWindowDimensions();
  const size = Math.min(width * 0.82, 360);
  const centerX = size * 0.78;
  const centerY = size * 0.12;
  const palette = variant === 'dark'
    ? { blob: '#7C9F75', ring: '#B7D0B0', leaf: '#ADC8A7', icon: '#D7E6D1', accent: '#D9C68E', blobOpacity: 0.13, iconOpacity: 0.075, accentOpacity: 0.2 }
    : { blob: '#DDE8D6', ring: '#C9D8C1', leaf: '#AEC2A5', icon: '#31583B', accent: '#C79B61', blobOpacity: 0.48, iconOpacity: 0.075, accentOpacity: 0.17 };

  return (
    <View pointerEvents="none" accessible={false} className="absolute inset-0 overflow-hidden">
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', top: -size * 0.16, right: -size * 0.3 }}
      >
        <Circle cx={centerX} cy={centerY} r={size * 0.42} fill={palette.blob} opacity={palette.blobOpacity} />
        <Circle cx={centerX} cy={centerY} r={size * 0.31} fill="none" stroke={palette.ring} strokeWidth={1.2} opacity={0.72} />
        <Circle cx={centerX} cy={centerY} r={size * 0.2} fill="none" stroke={palette.ring} strokeWidth={1} opacity={0.58} />
        <Circle cx={size * 0.34} cy={size * 0.68} r={size * 0.035} fill={palette.accent} opacity={palette.accentOpacity} />
        <Circle cx={size * 0.43} cy={size * 0.74} r={size * 0.018} fill={palette.accent} opacity={palette.accentOpacity * 0.8} />
        <Path
          d={`M ${size * 0.2} ${size * 0.55} C ${size * 0.38} ${size * 0.42}, ${size * 0.57} ${size * 0.42}, ${size * 0.76} ${size * 0.58}`}
          fill="none"
          stroke={palette.leaf}
          strokeWidth={1.2}
          opacity={0.7}
        />
      </Svg>

      <Svg
        width={size * 0.76}
        height={size * 0.76}
        viewBox={`0 0 ${size * 0.76} ${size * 0.76}`}
        style={{ position: 'absolute', bottom: -size * 0.28, left: -size * 0.24 }}
      >
        <Circle cx={size * 0.38} cy={size * 0.38} r={size * 0.3} fill={palette.blob} opacity={variant === 'dark' ? 0.1 : 0.4} />
        <Path
          d={`M ${size * 0.12} ${size * 0.55} C ${size * 0.26} ${size * 0.24}, ${size * 0.48} ${size * 0.18}, ${size * 0.65} ${size * 0.1} C ${size * 0.59} ${size * 0.36}, ${size * 0.4} ${size * 0.58}, ${size * 0.12} ${size * 0.55} Z`}
          fill="none"
          stroke={palette.leaf}
          strokeWidth={1.4}
          opacity={0.8}
        />
        <Path d={`M ${size * 0.16} ${size * 0.53} Q ${size * 0.38} ${size * 0.4} ${size * 0.58} ${size * 0.18}`} fill="none" stroke={palette.leaf} strokeWidth={1} opacity={0.72} />
      </Svg>

      <View style={{ position: 'absolute', top: Math.max(height * 0.19, 150), right: -17, opacity: palette.iconOpacity }}>
        <Ionicons name="school-outline" size={112} color={palette.icon} />
      </View>
      <View style={{ position: 'absolute', bottom: Math.max(height * 0.2, 140), left: -22, opacity: palette.iconOpacity * 0.9 }}>
        <Ionicons name="sparkles-outline" size={92} color={palette.icon} />
      </View>
    </View>
  );
}
