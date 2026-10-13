import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../constants/colors';

/**
 * Iconos de trazo del diseño Aliento (viewBox 24×24, trazo redondeado).
 * Copiados del HTML de referencia para que coincidan píxel a píxel.
 */
const paths = {
  back: <Path d="M15 5l-7 7 7 7" />,
  chevronRight: <Path d="M9 5l7 7-7 7" />,
  chevronDown: <Path d="M6 9l6 6 6-6" />,
  arrowRight: <Path d="M5 12h14M13 6l6 6-6 6" />,
  arrowUp: <Path d="M12 19V5M6 11l6-6 6 6" />,
  close: <Path d="M6 6l12 12M18 6L6 18" />,
  check: <Path d="M5 12l5 5L20 7" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  chat: <Path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  mic: (
    <>
      <Rect x={9} y={3} width={6} height={12} rx={3} />
      <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  wave: <Path d="M3 10v4M7 7v10M11 4v16M15 8v8M19 10v4" />,
  keyboard: (
    <>
      <Rect x={3} y={6} width={18} height={12} rx={2.5} />
      <Path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8" />
    </>
  ),
  lock: (
    <>
      <Rect x={4} y={11} width={16} height={10} rx={2.5} />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  heart: <Path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z" />,
  home: <Path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  chart: <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  book: (
    <>
      <Path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
      <Path d="M4 21V5" />
    </>
  ),
  user: (
    <>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  phone: (
    <Path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  ),
  pin: (
    <>
      <Path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z" />
      <Circle cx={12} cy={10} r={2.5} />
    </>
  ),
  search: (
    <>
      <Circle cx={11} cy={11} r={7} />
      <Path d="M20 20l-4-4" />
    </>
  ),
  eye: (
    <>
      <Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <Circle cx={12} cy={12} r={3} />
    </>
  ),
  eyeOff: (
    <>
      <Path d="M2 12s3.6-7 10-7c2 0 3.7.7 5.1 1.6M22 12s-3.6 7-10 7c-2 0-3.7-.7-5.1-1.6" />
      <Path d="M4 4l16 16" />
    </>
  ),
  share: <Path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />,
  edit: <Path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" />,
  trash: <Path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  camera: (
    <>
      <Path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <Circle cx={12} cy={13} r={3.5} />
    </>
  ),
  calendar: (
    <>
      <Rect x={4} y={5} width={16} height={15} rx={2.5} />
      <Path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  clock: (
    <>
      <Circle cx={12} cy={12} r={8} />
      <Path d="M12 8v4l3 2" />
    </>
  ),
  refresh: <Path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />,
  copy: (
    <>
      <Rect x={8} y={8} width={12} height={12} rx={2.5} />
      <Path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  print: (
    <Path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v6H7z" />
  ),
  stop: <Rect x={7} y={7} width={10} height={10} rx={2} />,
  volume: <Path d="M4 10v4h4l5 4V6L8 10zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" />,
  volumeOff: <Path d="M4 10v4h4l5 4V6L8 10zM17 10l4 4M21 10l-4 4" />,
} as const;

/** Iconos rellenos (no usan trazo). */
const filled = {
  play: <Path d="M8 5v14l11-7z" />,
} as const;

export type IconName = keyof typeof paths | keyof typeof filled;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 22,
  color = colors.ink,
  strokeWidth = 1.8,
}) => {
  if (name in filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        {filled[name as keyof typeof filled]}
      </Svg>
    );
  }
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {paths[name as keyof typeof paths]}
    </Svg>
  );
};
