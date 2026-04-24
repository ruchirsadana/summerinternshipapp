import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Circle, Path, Line, G, Text as SvgText } from 'react-native-svg';
import { colors } from './theme';

export const BarChart: React.FC<{
  data: { label: string; value: number; color?: string }[];
  height?: number; maxValue?: number; valueSuffix?: string;
}> = ({ data, height = 160, maxValue, valueSuffix = '' }) => {
  const max = maxValue ?? Math.max(1, ...data.map(d => d.value));
  const barGap = 10;
  const labelH = 34;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: barGap }}>
        {data.map((d, i) => {
          const h = max > 0 ? (d.value / max) * (height - labelH) : 0;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>
                {Number.isFinite(d.value) ? (Math.round(d.value * 10) / 10).toString() : '0'}{valueSuffix}
              </Text>
              <View style={{ width: '80%', height: Math.max(2, h), backgroundColor: d.color || colors.navy, borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: barGap, marginTop: 6 }}>
        {data.map((d, i) => (
          <View key={i} style={{ flex: 1 }}>
            <Text numberOfLines={2} style={{ fontSize: 10, color: colors.textSecondary, textAlign: 'center' }}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export const DonutChart: React.FC<{
  slices: { label: string; value: number; color: string }[]; size?: number; centerLabel?: string; centerValue?: string;
}> = ({ slices, size = 180, centerLabel, centerValue }) => {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2;
  const innerR = r * 0.6;
  const cx = r, cy = r;
  let angle = -Math.PI / 2;
  const paths = slices.map((s, i) => {
    const slice = (s.value / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + slice);
    const y2 = cy + r * Math.sin(angle + slice);
    const xi1 = cx + innerR * Math.cos(angle + slice);
    const yi1 = cy + innerR * Math.sin(angle + slice);
    const xi2 = cx + innerR * Math.cos(angle);
    const yi2 = cy + innerR * Math.sin(angle);
    const large = slice > Math.PI ? 1 : 0;
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${innerR} ${innerR} 0 ${large} 0 ${xi2} ${yi2} Z`;
    angle += slice;
    return <Path key={i} d={d} fill={s.color} />;
  });
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {slices.length ? paths : <Circle cx={cx} cy={cy} r={r} fill={colors.border} />}
        <Circle cx={cx} cy={cy} r={innerR} fill={colors.white} />
      </Svg>
      {(centerLabel || centerValue) && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
          {!!centerValue && <Text style={{ fontSize: 28, fontWeight: '800', color: colors.navy }}>{centerValue}</Text>}
          {!!centerLabel && <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: '600', letterSpacing: 0.6 }}>{centerLabel.toUpperCase()}</Text>}
        </View>
      )}
    </View>
  );
};

export const LineChart: React.FC<{ points: number[]; height?: number; stroke?: string; suffix?: string }> =
  ({ points, height = 140, stroke = colors.navy, suffix = '' }) => {
    if (!points.length) return <View style={{ height }} />;
    const width = 300;
    const max = Math.max(...points, 1);
    const min = Math.min(...points, 0);
    const range = max - min || 1;
    const step = points.length > 1 ? width / (points.length - 1) : width;
    const ys = points.map(v => height - ((v - min) / range) * (height - 20) - 10);
    const d = points.map((_, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${ys[i]}`).join(' ');
    return (
      <View>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <Path d={d} stroke={stroke} strokeWidth={2.5} fill="none" />
          {points.map((_, i) => (
            <Circle key={i} cx={i * step} cy={ys[i]} r={3} fill={stroke} />
          ))}
        </Svg>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>{min}{suffix}</Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>{max}{suffix}</Text>
        </View>
      </View>
    );
  };

export const Gauge: React.FC<{ score: number; size?: number }> = ({ score, size = 200 }) => {
  // NPS gauge: -100 to +100
  const clamped = Math.max(-100, Math.min(100, score));
  const r = size / 2 - 16;
  const cx = size / 2, cy = size / 2 + 8;
  const pct = (clamped + 100) / 200; // 0..1
  const startAngle = Math.PI;
  const endAngle = startAngle + pct * Math.PI;
  const fg = clamped < 0 ? colors.npsRed : clamped < 30 ? colors.npsYellow : colors.npsGreen;
  const arc = (a0: number, a1: number, color: string, w: number) => {
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return <Path d={`M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`} stroke={color} strokeWidth={w} strokeLinecap="round" fill="none" />;
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size * 0.7}>
        {arc(startAngle, startAngle + Math.PI, colors.border, 14)}
        {arc(startAngle, endAngle, fg, 14)}
      </Svg>
      <View style={{ position: 'absolute', top: size * 0.3, alignItems: 'center' }}>
        <Text style={{ fontSize: 40, fontWeight: '800', color: fg }}>{score}</Text>
        <Text style={{ fontSize: 11, letterSpacing: 0.8, color: colors.textSecondary, fontWeight: '700' }}>NPS SCORE</Text>
      </View>
    </View>
  );
};

export const Heatmap: React.FC<{ cells: { hour: number; value: number }[]; maxValue?: number; suffix?: string }> =
  ({ cells, maxValue, suffix = '%' }) => {
    const max = maxValue ?? Math.max(...cells.map(c => c.value), 1);
    const shade = (v: number) => {
      if (max === 0) return '#E0E7FF';
      const pct = v / max;
      const scale = ['#EEF2FF', '#C7D2FE', '#818CF8', '#4F46E5', '#1B2A4A'];
      const idx = Math.min(scale.length - 1, Math.floor(pct * scale.length));
      return scale[idx];
    };
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {cells.map(c => (
          <View key={c.hour} style={{ width: '14%', backgroundColor: shade(c.value), borderRadius: 6, padding: 6, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: c.value > max * 0.5 ? colors.white : colors.textSecondary, fontWeight: '700' }}>
              {c.hour}:00
            </Text>
            <Text style={{ fontSize: 13, color: c.value > max * 0.5 ? colors.white : colors.navy, fontWeight: '800' }}>
              {c.value}{suffix}
            </Text>
          </View>
        ))}
      </View>
    );
  };

/** Radar / spider chart for rating N axes on a common 1..max scale. */
export const RadarChart: React.FC<{
  axes: { label: string; value: number }[];
  max?: number; size?: number; color?: string;
}> = ({ axes, max = 5, size = 280, color = colors.navy }) => {
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 30;
  const n = axes.length || 1;
  const angleFor = (i: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;
  const point = (i: number, v: number) => {
    const a = angleFor(i);
    const rr = (v / max) * r;
    return { x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a) };
  };
  // concentric rings
  const rings = [0.25, 0.5, 0.75, 1].map((k, i) => (
    <Circle key={i} cx={cx} cy={cy} r={r * k} fill="none" stroke={colors.border} strokeWidth={1} />
  ));
  // axis spokes
  const spokes = axes.map((_, i) => {
    const a = angleFor(i);
    return (
      <Line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke={colors.border} strokeWidth={1} />
    );
  });
  // value polygon
  const pts = axes.map((d, i) => point(i, Math.max(0, Math.min(max, d.value))));
  const polygonD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  // labels
  const labels = axes.map((d, i) => {
    const a = angleFor(i);
    const lx = cx + (r + 16) * Math.cos(a);
    const ly = cy + (r + 16) * Math.sin(a);
    const anchor = Math.cos(a) > 0.3 ? 'start' : Math.cos(a) < -0.3 ? 'end' : 'middle';
    return (
      <SvgText
        key={i}
        x={lx}
        y={ly + 4}
        fill={colors.textSecondary}
        fontSize={10}
        fontWeight="700"
        textAnchor={anchor}
      >
        {d.label}
      </SvgText>
    );
  });
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <G>{rings}{spokes}</G>
        <Path d={polygonD} fill={color} fillOpacity={0.25} stroke={color} strokeWidth={2} />
        {pts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />)}
        {labels}
      </Svg>
    </View>
  );
};
