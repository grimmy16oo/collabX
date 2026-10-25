import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiBaseUrl, apiFetch, logApiResponseFailure } from '../../config/api';
import { DecorativeBackdrop } from '../../components/DecorativeBackdrop';
import { useSavedScholarships } from '../../data/scholarshipApi';
import { COLORS, FONTS } from '../../theme/colors';
import { Scholarship } from '../../types/scholarship';

const MUTED = '#798C76';

function parseRealDeadline(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? date
    : null;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
}) {
  return (
    <View className="mb-5 rounded-[24px] border border-[#E4EBDD] bg-white p-5 shadow-sm">
      <View className="mb-4 flex-row items-center">
        <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-[#EDF3E8]">
          <Ionicons name={icon} size={18} color={COLORS.accentOlive} />
        </View>
        <Text className="text-[17px] text-[#152A17]" style={{ fontFamily: FONTS.bold }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ValueList({ values }: { values: string[] }) {
  if (!values.length) return <Text className="text-sm leading-6 text-[#798C76]" style={{ fontFamily: FONTS.regular }}>Not specified in the available scholarship data.</Text>;
  return (
    <View>
      {values.map((value, index) => (
        <View key={`${value}-${index}`} className="mb-3 flex-row items-start last:mb-0">
          <View className="mr-3 mt-[7px] h-1.5 w-1.5 rounded-full bg-[#476C19]" />
          <Text className="flex-1 text-[14px] leading-[22px] text-[#4B5E48]" style={{ fontFamily: FONTS.regular }}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="min-h-[104px] flex-1 rounded-[20px] border border-[#E4EBDD] bg-white p-4 shadow-sm">
      <View className="mb-3 flex-row items-center">
        <Ionicons name={icon} size={16} color={COLORS.accentOlive} />
        <Text className="ml-2 text-[10px] tracking-[1.4px] text-[#798C76]" style={{ fontFamily: FONTS.bold }}>{label.toUpperCase()}</Text>
      </View>
      <Text className="text-[14px] leading-5 text-[#152A17]" style={{ fontFamily: FONTS.semiBold }}>{value}</Text>
    </View>
  );
}

export default function ScholarshipDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { saved, toggle } = useSavedScholarships();
  const [item, setItem] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiFetch(`${apiBaseUrl}/api/scholarships/${encodeURIComponent(id || '')}`)
      .then((response) => {
        if (!response.ok) {
          logApiResponseFailure('Scholarship details request', response.status);
          throw new Error('Could not load scholarship details. Check the backend and try again.');
        }
        return response.json();
      })
      .then((body) => { if (active) setItem(body.data); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load scholarship details.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const isSaved = item ? saved.includes(item.id) : false;
  const deadlineDate = item ? parseRealDeadline(item.deadline) : null;
  const today = new Date();
  const todayLocalMidnight = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const daysRemaining = deadlineDate
    ? Math.round((deadlineDate.getTime() - todayLocalMidnight) / 86400000)
    : null;
  const deadlineLabel = deadlineDate ? formatDate(deadlineDate) : item?.deadline || 'Not specified';

  const openApplication = () => {
    if (item?.application_url) Linking.openURL(item.application_url);
  };

  return (
    <View className="flex-1 bg-[#F0F2E9]">
      <DecorativeBackdrop />
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.accentOlive} />
          <Text className="mt-4 text-sm text-[#798C76]" style={{ fontFamily: FONTS.medium }}>Loading scholarship…</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-[#E8EFE2]">
            <Ionicons name="cloud-offline-outline" size={25} color={COLORS.accentOlive} />
          </View>
          <Text className="text-center text-[15px] leading-6 text-[#4B5E48]" style={{ fontFamily: FONTS.medium }}>{error}</Text>
          <TouchableOpacity onPress={() => router.back()} className="mt-5 rounded-full bg-[#153018] px-6 py-3">
            <Text className="text-sm text-white" style={{ fontFamily: FONTS.semiBold }}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : item ? (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            className="w-full max-w-[760px] self-center"
            contentContainerStyle={{ paddingTop: Math.max(insets.top, 18) + 8, paddingHorizontal: 20, paddingBottom: 28 }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              className="mb-5 h-11 w-11 items-center justify-center rounded-full border border-[#E1E8DA] bg-white"
            >
              <Ionicons name="chevron-back" size={21} color={COLORS.primaryDark} />
            </TouchableOpacity>

            <View className="mb-5 overflow-hidden rounded-[30px] bg-[#153018] p-6">
              <View className="mb-6 flex-row items-start justify-between">
                <View className="mr-4 flex-1">
                  <View className="mb-3 self-start rounded-full bg-[#274423] px-3 py-1.5">
                    <Text className="text-[10px] tracking-[1.5px] text-[#A7C19D]" style={{ fontFamily: FONTS.bold }}>SCHOLARSHIP</Text>
                  </View>
                  <Text className="text-[29px] leading-[36px] text-white" style={{ fontFamily: FONTS.bold }}>{item.title}</Text>
                  <Text className="mt-2 text-[14px] leading-5 text-[#C0D0B9]" style={{ fontFamily: FONTS.medium }}>{item.provider_name}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggle(item.id)}
                  accessibilityLabel={isSaved ? 'Remove saved scholarship' : 'Save scholarship'}
                  className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
                >
                  <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={isSaved ? '#A7C19D' : '#FFFFFF'} />
                </TouchableOpacity>
              </View>

              <View className="flex-row flex-wrap">
                <View className="mb-2 mr-2 flex-row items-center rounded-full bg-white/10 px-3 py-2">
                  <Ionicons name="location-outline" size={14} color="#A7C19D" />
                  <Text className="ml-1.5 text-xs text-white" style={{ fontFamily: FONTS.medium }}>{item.country}</Text>
                </View>
                {item.study_levels.map((level) => (
                  <View key={level} className="mb-2 mr-2 flex-row items-center rounded-full bg-white/10 px-3 py-2">
                    <Ionicons name="school-outline" size={14} color="#A7C19D" />
                    <Text className="ml-1.5 text-xs text-white" style={{ fontFamily: FONTS.medium }}>{level}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="mb-5 flex-row gap-3">
              <DetailCard icon="gift-outline" label="Award" value={item.award_amount} />
              <DetailCard icon="calendar-outline" label="Deadline" value={deadlineLabel} />
            </View>
            <View className="mb-5 flex-row gap-3">
              <DetailCard icon="location-outline" label="Country" value={item.country} />
              <DetailCard icon="school-outline" label="Study level" value={item.study_levels.join(', ')} />
            </View>

            {deadlineDate && (
              <View className={`mb-5 flex-row items-center rounded-[20px] border px-4 py-3.5 ${daysRemaining !== null && daysRemaining < 0 ? 'border-[#E8D9CE] bg-[#FBF3ED]' : 'border-[#DDE8D5] bg-[#E8EFE2]'}`}>
                <Ionicons name="time-outline" size={20} color={daysRemaining !== null && daysRemaining < 0 ? '#9A5B3D' : COLORS.accentOlive} />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-[#152A17]" style={{ fontFamily: FONTS.semiBold }}>
                    {daysRemaining !== null && daysRemaining < 0
                      ? 'Deadline has passed'
                      : daysRemaining === 0
                        ? 'Deadline is today'
                        : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`}
                  </Text>
                  <Text className="mt-0.5 text-xs text-[#798C76]" style={{ fontFamily: FONTS.regular }}>
                    {item.deadline_timezone ? `Deadline timezone: ${item.deadline_timezone}` : `Deadline: ${deadlineLabel}`}
                  </Text>
                </View>
              </View>
            )}

            <Section title="About" icon="information-circle-outline">
              <Text className="text-sm leading-6 text-[#798C76]" style={{ fontFamily: FONTS.regular }}>About details are not specified in the available scholarship data.</Text>
            </Section>

            <Section title="Benefits" icon="sparkles-outline"><ValueList values={item.benefits} /></Section>
            <Section title="Fields of study" icon="book-outline"><ValueList values={item.fields_of_study} /></Section>
            <Section title="Eligible countries" icon="earth-outline"><ValueList values={item.eligible_countries} /></Section>
            <Section title="Application process" icon="git-branch-outline">
              <Text className="text-sm leading-6 text-[#798C76]" style={{ fontFamily: FONTS.regular }}>Application process details are not specified in the available scholarship data. Use the official application link below for current instructions.</Text>
            </Section>
            <Section title="Documents" icon="document-text-outline">
              <Text className="text-sm leading-6 text-[#798C76]" style={{ fontFamily: FONTS.regular }}>Required documents are not specified in the available scholarship data.</Text>
            </Section>

            <View className="mb-2 flex-row items-center justify-center">
              <Ionicons name="checkmark-circle-outline" size={14} color={MUTED} />
              <Text className="ml-1.5 text-xs text-[#798C76]" style={{ fontFamily: FONTS.regular }}>
                Last verified {item.last_verified_at || 'date not specified'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL(item.source_url)} className="mb-2 flex-row items-center justify-center py-3">
              <Text className="text-sm text-[#476C19]" style={{ fontFamily: FONTS.semiBold }}>View official source</Text>
              <Ionicons name="open-outline" size={15} color={COLORS.accentOlive} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </ScrollView>

          <View className="border-t border-[#E1E8DA] bg-white px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => toggle(item.id)}
                className={`h-[54px] flex-1 flex-row items-center justify-center rounded-full border ${isSaved ? 'border-[#476C19] bg-[#E8EFE2]' : 'border-[#D7E1D1] bg-white'}`}
              >
                <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color={COLORS.accentOlive} />
                <Text className="ml-2 text-sm text-[#274128]" style={{ fontFamily: FONTS.semiBold }}>{isSaved ? 'Saved' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={openApplication} className="h-[54px] flex-[1.5] flex-row items-center justify-center rounded-full bg-[#476C19]">
                <Text className="text-sm text-white" style={{ fontFamily: FONTS.bold }}>Open application</Text>
                <Ionicons name="arrow-forward" size={17} color="#FFFFFF" style={{ marginLeft: 9 }} />
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}
