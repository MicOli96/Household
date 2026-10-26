import { CompletedBy } from "./CompletedBy";
import { View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { avatars } from "../theme/avatars";
import { Member } from "../data/types"; 
import { Slice } from "../utils/statistics";

/** Avatarens färg, grå för den som inte valt avatar än. */
function colorOf(member: Member) {
  return member.avatar ? avatars[member.avatar] : "#9E9E9E";
}

type Props = {
  slices: Slice[];
  size: number;
  /** Visa avatarerna i diagrammet, bara i det stora. */
  showAvatars?: boolean;
  /** Avatarens cirkeldiameter; ytterbehållaren är 8 pixlar större. */
  avatarSize?: number;
};

// Cirkeldiagram där varje medlem får sin avatars färg, som i skissen.
export function PieChart({ slices, size, showAvatars = false, avatarSize = 24 }: Props) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const r = size / 2;
  const avatarOffset = (avatarSize + 8) / 2;
  if (total === 0) return null;

  // En enda bit kan inte ritas som båge, då blir det en hel cirkel.
  if (slices.length === 1) {
    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={r} cy={r} r={r} fill={colorOf(slices[0].member)} />
        </Svg>
        {showAvatars && <View style={{ position: "absolute", left: r - avatarOffset, top: r - avatarOffset }}>
          <CompletedBy members={[slices[0].member]} size={avatarSize} />
        </View>}
      </View>
    );
  }

  // Varje bit börjar där de föregående slutar, räknat från klockan tolv.
  const parts = slices.map((slice, i) => {
    const before = slices.slice(0, i).reduce((sum, s) => sum + s.value, 0);
    const start = -Math.PI / 2 + (before / total) * Math.PI * 2;
    const sweep = (slice.value / total) * Math.PI * 2;
    const angle = start + sweep;
    const mid = start + sweep / 2;
    const x1 = r + r * Math.cos(start);
    const y1 = r + r * Math.sin(start);
    const x2 = r + r * Math.cos(angle);
    const y2 = r + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return {
      slice,
      d: `M ${r} ${r} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
      label: { x: r + r * 0.6 * Math.cos(mid), y: r + r * 0.6 * Math.sin(mid) },
    };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {parts.map((p) => (
          <Path key={p.slice.member.userId} d={p.d} fill={colorOf(p.slice.member)} />
        ))}
      </Svg>
      {showAvatars &&
        parts.map((p) => (
          <View key={p.slice.member.userId}
            style={{ position: "absolute", left: p.label.x - avatarOffset, top: p.label.y - avatarOffset }}>
            <CompletedBy members={[p.slice.member]} size={avatarSize} />
          </View>
        ))}
    </View>
  );
}
