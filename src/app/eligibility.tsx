import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiBaseUrl, apiFetch, logApiResponseFailure } from '../config/api';
import { FloatingBottomNav } from '../components/FloatingBottomNav';
import { StatusPanel } from '../components/StatusPanel';
import { DecorativeBackdrop } from '../components/DecorativeBackdrop';
import { useAuth, type UserProfile } from '../context/AuthContext';
import { COLORS, FONTS } from '../theme/colors';
import type { Scholarship } from '../types/scholarship';

type Status = 'met' | 'not_met' | 'unknown';
type Criterion = { id: string; title: string; required: string; actual: string; status: Status; manual?: boolean };
const UNKNOWN = 'Not provided';

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    .replace(/master s/g, 'master').replace(/bachelor s/g, 'bachelor').replace(/s$/, '');
}

function compareList(required: string[], actual: string[], broadPattern?: RegExp): Status {
  if (!required.length || !actual.length) return 'unknown';
  const explicit = broadPattern ? required.filter((value) => !broadPattern.test(value)) : required;
  if (explicit.some((r) => actual.some((a) => {
    const nr = normalize(r); const na = normalize(a);
    return nr === na || nr.includes(na) || na.includes(nr);
  }))) return 'met';
  return explicit.length === required.length ? 'not_met' : 'unknown';
}

function getCriteria(item: Scholarship, profile: UserProfile | undefined, selfAssessments: Record<string, Status>): Criterion[] {
  const req = item.eligibility_requirements || {};
  const listCriterion = (id: string, title: string, required: string[], actual: string[], broad?: RegExp): Criterion => ({
    id, title, required: required.length ? required.join(', ') : 'Not listed',
    actual: actual.length ? actual.join(', ') : UNKNOWN,
    status: compareList(required, actual, broad),
  });
  const cgpaRequirement = req.minimum_cgpa == null
    ? { required: 'Minimum CGPA not listed', actual: profile?.cgpa == null ? UNKNOWN : `${profile.cgpa}${profile.cgpaScale ? ` / ${profile.cgpaScale}` : ''}`, status: 'unknown' as Status }
    : profile?.cgpa == null || !profile.cgpaScale
      ? { required: `Minimum ${req.minimum_cgpa} / ${req.cgpa_scale || 'specified scale'}`, actual: UNKNOWN, status: 'unknown' as Status }
      : (() => {
        const scale = req.cgpa_scale || profile.cgpaScale!;
        const normalized = (profile.cgpa! / profile.cgpaScale!) * scale;
        return { required: `Minimum ${req.minimum_cgpa} / ${scale}`, actual: `${profile.cgpa} / ${profile.cgpaScale} (≈ ${normalized.toFixed(2)} / ${scale})`, status: normalized >= req.minimum_cgpa! ? 'met' as Status : 'not_met' as Status };
      })();

  const fieldRequirements = req.fields?.length ? req.fields : item.fields_of_study;
  const broadFieldRequirement = fieldRequirements.length > 0 && fieldRequirements.every((value) => /multiple fields|all fields|any field/i.test(value));
  const fieldCriterion = listCriterion('field', 'Field', fieldRequirements, profile?.fieldsOfStudy || [], /multiple fields|all fields|any field|related fields/i);
  if (broadFieldRequirement) {
    fieldCriterion.required = 'Any field is accepted';
    fieldCriterion.status = profile?.fieldsOfStudy?.length ? 'met' : 'unknown';
    fieldCriterion.actual = profile?.fieldsOfStudy?.length ? profile.fieldsOfStudy.join(', ') : UNKNOWN;
  }

  const languageCriterion: Criterion = req.languages?.length
    ? listCriterion('language', 'Language', req.languages, profile?.languages || [])
    : { id: 'language', title: 'Language', required: 'No language restriction; any language is accepted', actual: profile?.languages?.length ? profile.languages.join(', ') : 'Not required', status: 'met' };

  const criteria: Criterion[] = [
    { id: 'cgpa', title: 'CGPA', ...cgpaRequirement },
    listCriterion('degree', 'Degree', req.degrees?.length ? req.degrees : item.study_levels, profile?.degreeLevel ? [profile.degreeLevel] : []),
    fieldCriterion,
    languageCriterion,
    listCriterion('nationality', 'Nationality', req.nationalities?.length ? req.nationalities : item.eligible_countries, profile?.nationality ? [profile.nationality] : [], /other eligible|eligible countries|worldwide/i),
  ];
  for (const [index, requirement] of (req.other || []).entries()) {
    const id = `other:${index}`;
    criteria.push({ id, title: requirement, required: requirement, actual: selfAssessments[id] ? 'Self-assessed' : UNKNOWN, status: selfAssessments[id] || 'unknown', manual: true });
  }
  return criteria;
}

function StatusPill({ status }: { status: Status }) {
  const bg = status === 'met' ? '#34543C' : status === 'not_met' ? COLORS.accentRoseLight : COLORS.accentAmberLight;
  const fg = status === 'met' ? '#FFFFFF' : status === 'not_met' ? COLORS.accentRose : COLORS.accentAmber;
  const label = status === 'met' ? 'Met' : status === 'not_met' ? 'Not met' : 'Unknown';
  return <View className="min-w-[76px] items-center rounded-full px-3 py-1.5" style={{ backgroundColor: bg }}><Text className="text-[12px]" style={{ color: fg, fontFamily: FONTS.bold }}>{label}</Text></View>;
}

function criterionIcon(id: string): keyof typeof Ionicons.glyphMap {
  if (id === 'cgpa') return 'stats-chart-outline';
  if (id === 'degree') return 'school-outline';
  if (id === 'field') return 'book-outline';
  if (id === 'language') return 'chatbubble-ellipses-outline';
  if (id === 'nationality') return 'globe-outline';
  return 'checkmark-circle-outline';
}

function criterionColor(id: string) {
  if (id === 'cgpa' || id === 'language') return { background: COLORS.accentBlueLight, foreground: COLORS.accentBlue };
  if (id === 'field' || id.startsWith('other:')) return { background: COLORS.accentAmberLight, foreground: COLORS.accentAmber };
  if (id === 'nationality') return { background: COLORS.accentRoseLight, foreground: COLORS.accentRose };
  return { background: COLORS.accentOliveLight, foreground: COLORS.accentOlive };
}

function CriterionHeading({ criterion }: { criterion: Criterion }) {
  const tone = criterionColor(criterion.id);
  return (
    <View className="mb-2 flex-row items-center justify-between">
      <View className="mr-3 flex-1 flex-row items-center">
        <View className="mr-2.5 h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: tone.background }}>
          <Ionicons name={criterionIcon(criterion.id)} size={17} color={tone.foreground} />
        </View>
        <Text className="flex-1 text-[14px] leading-5 text-[#344D39]" style={{ fontFamily: FONTS.bold }}>{criterion.title}</Text>
      </View>
      <StatusPill status={criterion.status} />
    </View>
  );
}

function ProfileTile({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <View className={`mb-2 rounded-[16px] bg-[#EEF2E5] p-3 ${wide ? 'w-full' : 'w-[48.5%]'}`}>
    <Text className="text-[13px] text-[#52634E]" style={{ fontFamily: FONTS.bold }}>{label}</Text>
    <Text className="mt-0.5 text-[14px] leading-5 text-[#61715C]" numberOfLines={2} style={{ fontFamily: FONTS.medium }}>{value || UNKNOWN}</Text>
  </View>;
}

export default function EligibilityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState(id || '');
  const [item, setItem] = useState<Scholarship | null>(null);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [search, setSearch] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const [optionsRetry, setOptionsRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailsRetry, setDetailsRetry] = useState(0);
  const [selfAssessments, setSelfAssessments] = useState<Record<string, Status>>({});

  useEffect(() => { setSelectedId(id || ''); }, [id]);

  useEffect(() => {
    if (selectedId || scholarships.length) return;
    if (!apiBaseUrl) {
      setOptionsError('Backend API address is unavailable. Check your network or API configuration.');
      return;
    }
    let active = true;
    setLoadingOptions(true);
    apiFetch(`${apiBaseUrl}/api/scholarships`)
      .then((response) => {
        if (!response.ok) throw new Error('Could not load scholarships. Please try again.');
        return response.json();
      })
      .then((body) => { if (active) setScholarships(body.data || []); })
      .catch((reason: unknown) => { if (active) setOptionsError(reason instanceof Error ? reason.message : 'Could not load scholarships.'); })
      .finally(() => { if (active) setLoadingOptions(false); });
    return () => { active = false; };
  }, [selectedId, scholarships.length, optionsRetry]);

  useEffect(() => {
    let active = true;
    if (!selectedId) { setItem(null); setLoading(false); setError(''); return; }
    if (!apiBaseUrl) { setError('Backend API address is unavailable.'); setLoading(false); return; }
    setLoading(true); setError('');
    apiFetch(`${apiBaseUrl}/api/scholarships/${encodeURIComponent(selectedId)}`)
      .then((response) => {
        if (!response.ok) { logApiResponseFailure('Eligibility scholarship request', response.status); throw new Error('Could not load this scholarship. Please try again.'); }
        return response.json();
      })
      .then((body) => { if (active) setItem(body.data); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load this scholarship.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedId, detailsRetry]);

  const matchingScholarships = scholarships.filter((scholarship) => `${scholarship.title} ${scholarship.provider_name} ${scholarship.country}`.toLowerCase().includes(search.trim().toLowerCase()));

  useEffect(() => {
    let active = true;
    setSelfAssessments({});
    if (!selectedId) return () => { active = false; };
    AsyncStorage.getItem(`collabx:eligibility:${user?.id || 'guest'}:${selectedId}`).then((value) => {
      if (!active || !value) return;
      try { setSelfAssessments(JSON.parse(value) as Record<string, Status>); } catch { setSelfAssessments({}); }
    }).catch(() => {});
    return () => { active = false; };
  }, [selectedId, user?.id]);

  const criteria = useMemo(() => item ? getCriteria(item, user?.profile, selfAssessments) : [], [item, user?.profile, selfAssessments]);
  const metCount = criteria.filter((criterion) => criterion.status === 'met').length;
  const evaluatedCount = criteria.filter((criterion) => criterion.status !== 'unknown').length;
  const unknownCount = criteria.length - evaluatedCount;
  const score = evaluatedCount ? Math.round((metCount / evaluatedCount) * 100) : 0;
  const failed = criteria.some((criterion) => criterion.status === 'not_met');
  const matchLabel = evaluatedCount === 0 ? 'Add your details' : failed ? 'Some criteria not met' : unknownCount ? 'Likely eligible' : 'All listed criteria met';
  const funded = /fully funded|full tuition|full scholarship|full cost/i.test(item?.award_amount || '');

  const updateAssessment = (criterionId: string, status: Status) => {
    setSelfAssessments((current) => {
      const next = { ...current, [criterionId]: status };
      AsyncStorage.setItem(`collabx:eligibility:${user?.id || 'guest'}:${selectedId}`, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  return <View className="flex-1 bg-[#F0F2E9]">
    <DecorativeBackdrop />
    <ScrollView className="w-full max-w-[760px] self-center" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: Math.max(insets.top, 16) + 4, paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 28) + 116 }}>
      <View className="mb-5 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-white" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={19} color={COLORS.primaryDark} />
        </TouchableOpacity>
        <Text className="text-[22px] text-[#344D39]" style={{ fontFamily: FONTS.bold }}>Eligibility Checker</Text>
      </View>

      {!selectedId ? <>
        <Text className="mb-3 text-[15px] leading-6 text-[#687861]" style={{ fontFamily: FONTS.medium }}>Choose a scholarship to compare its requirements with your profile.</Text>
        <View className="mb-3 h-12 flex-row items-center rounded-[16px] border border-[#E1E8DA] bg-white px-4 shadow-sm">
          <Ionicons name="search-outline" size={19} color="#82927C" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search scholarships" placeholderTextColor="#8B9683" className="ml-2.5 flex-1 text-[15px] text-[#344D39]" style={{ fontFamily: FONTS.medium }} />
        </View>
        {loadingOptions ? <View className="items-center py-10"><ActivityIndicator color={COLORS.accentOlive} /><Text className="mt-3 text-sm text-[#798C76]" style={{ fontFamily: FONTS.medium }}>Loading scholarships…</Text></View>
          : optionsError ? <StatusPanel tone="error" title="Scholarships unavailable" message={optionsError} actionLabel="Try again" onAction={() => { setOptionsError(''); setOptionsRetry((value) => value + 1); }} />
            : matchingScholarships.length ? matchingScholarships.map((scholarship) => <TouchableOpacity key={scholarship.id} onPress={() => setSelectedId(scholarship.id)} activeOpacity={0.82} className="mb-3 rounded-[22px] border border-[#E4EBDD] bg-white p-4 shadow-sm">
              <View className="flex-row items-start">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF1E5]"><Ionicons name="school-outline" size={19} color="#476C19" /></View>
                <View className="flex-1">
                  <Text className="text-[15px] text-[#344D39]" style={{ fontFamily: FONTS.bold }}>{scholarship.title}</Text>
                  <Text className="mt-1 text-[13px] text-[#798C76]" style={{ fontFamily: FONTS.medium }}>{scholarship.provider_name} · {scholarship.country}</Text>
                  <View className="mt-2 self-start rounded-full bg-[#EEF2E5] px-3 py-1"><Text className="text-[12px] text-[#687A5E]" style={{ fontFamily: FONTS.medium }}>{scholarship.study_levels.join(', ') || 'All study levels'}</Text></View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#98A58F" style={{ marginLeft: 4, marginTop: 10 }} />
              </View>
            </TouchableOpacity>) : <StatusPanel tone="empty" title="No scholarships found" message={scholarships.length ? 'Try another title, provider, or country.' : 'There are no scholarship records to compare yet.'} />}
      </> : loading ? <View className="items-center py-14"><ActivityIndicator color={COLORS.accentOlive} /><Text className="mt-3 text-sm text-[#798C76]" style={{ fontFamily: FONTS.medium }}>Loading eligibility…</Text></View>
        : error ? <StatusPanel tone="error" title="Couldn't load this scholarship" message={error} actionLabel="Try again" onAction={() => setDetailsRetry((value) => value + 1)} />
          : item ? <>
            <TouchableOpacity onPress={() => { setSelectedId(''); setItem(null); }} className="mb-3 self-start"><Text className="text-[11px] text-[#476C19]" style={{ fontFamily: FONTS.bold }}>‹ Choose a different scholarship</Text></TouchableOpacity>
            <View className="mb-5 rounded-[24px] bg-white p-4">
              {funded ? <View className="mb-3 self-start rounded-full bg-[#E8EFE2] px-3 py-1"><Text className="text-[12px] text-[#526943]" style={{ fontFamily: FONTS.bold }}>FULLY FUNDED</Text></View> : null}
              <Text className="text-[19px] leading-7 text-[#344D39]" style={{ fontFamily: FONTS.bold }}>{item.title}</Text>
              <Text className="mt-0.5 text-[14px] text-[#798C76]" style={{ fontFamily: FONTS.medium }}>{item.provider_name} · {item.country}</Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                <View className="rounded-full bg-[#EEF2E5] px-3 py-1.5"><Text className="text-[12px] text-[#687A5E]" style={{ fontFamily: FONTS.medium }}>Deadline · {item.deadline || 'Not specified'}</Text></View>
                {item.study_levels.slice(0, 2).map((level) => <View key={level} className="rounded-full bg-[#EEF2E5] px-3 py-1.5"><Text className="text-[12px] text-[#687A5E]" style={{ fontFamily: FONTS.medium }}>{level}</Text></View>)}
              </View>
            </View>

            <View className="mb-7 flex-row items-center rounded-[24px] border border-[#E4EBDD] bg-white p-5 shadow-sm">
              <View className="mr-5 h-[118px] w-[118px] items-center justify-center">
                <Svg width={118} height={118} viewBox="0 0 118 118" className="absolute">
                  <Circle cx="59" cy="59" r="49" fill="none" stroke="#E7ECDE" strokeWidth="10" />
                  {evaluatedCount > 0 ? <Circle cx="59" cy="59" r="49" fill="none" stroke="#35553D" strokeWidth="10" strokeDasharray={`${2 * Math.PI * 49}`} strokeDashoffset={`${2 * Math.PI * 49 * (1 - score / 100)}`} strokeLinecap="round" rotation="-90" origin="59, 59" /> : null}
                </Svg>
                <Text className="text-[25px] text-[#344D39]" style={{ fontFamily: FONTS.bold }}>{evaluatedCount ? `${score}%` : '—'}</Text>
                <Text className="text-[12px] text-[#829076]" style={{ fontFamily: FONTS.medium }}>Match</Text>
              </View>
              <View className="flex-1">
                <Text className="mb-2 text-[12px] tracking-wide text-[#788568]" style={{ fontFamily: FONTS.bold }}>MATCH SCORE</Text>
                <View className={`self-start rounded-full px-3 py-1.5 ${failed ? 'bg-[#F3E4DE]' : 'bg-[#34543C]'}`}><Text className="text-[12px] text-white" style={{ color: failed ? '#A3543F' : '#FFFFFF', fontFamily: FONTS.bold }}>{matchLabel}</Text></View>
                <Text className="mt-3 text-[13px] text-[#405744]" style={{ fontFamily: FONTS.semiBold }}>{metCount} of {evaluatedCount} evaluated criteria met</Text>
                {unknownCount > 0 ? <Text className="mt-1 text-[12px] leading-5 text-[#87917C]" style={{ fontFamily: FONTS.regular }}>{unknownCount} unknown item{unknownCount === 1 ? '' : 's'} not scored</Text> : null}
              </View>
            </View>

            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-[18px] text-[#344D39]" style={{ fontFamily: FONTS.bold }}>Your Profile</Text>
              <TouchableOpacity onPress={() => router.push('/about')}><Text className="text-[13px] text-[#71805D]" style={{ fontFamily: FONTS.bold }}>Edit</Text></TouchableOpacity>
            </View>
            <View className="mb-7 flex-row flex-wrap justify-between rounded-[22px] bg-white p-3">
              <ProfileTile label="CGPA" value={user?.profile?.cgpa != null ? `${user.profile.cgpa} / ${user.profile.cgpaScale || '?'}` : ''} />
              <ProfileTile label="Degree" value={user?.profile?.degreeLevel || ''} />
              <ProfileTile label="Field" value={user?.profile?.fieldsOfStudy?.join(', ') || ''} />
              <ProfileTile label="Language" value={user?.profile?.languages?.join(', ') || ''} />
              <ProfileTile label="Nationality" value={user?.profile?.nationality || ''} wide />
            </View>

            <Text className="text-[18px] text-[#344D39]" style={{ fontFamily: FONTS.bold }}>Requirement Breakdown</Text>
            <Text className="mb-3 mt-0.5 text-[13px] text-[#87917C]" style={{ fontFamily: FONTS.regular }}>Required criteria compared with your profile</Text>
            {criteria.filter((criterion) => !criterion.manual).map((criterion) => <View key={criterion.id} className="mb-3 rounded-[22px] border border-[#E4EBDD] bg-white p-4 shadow-sm">
              <CriterionHeading criterion={criterion} />
              <Text className="text-[13px] leading-5 text-[#61715C]" style={{ fontFamily: FONTS.medium }}>Required: {criterion.required}</Text>
              <Text className="text-[13px] leading-5 text-[#61715C]" style={{ fontFamily: FONTS.regular }}>You: {criterion.actual}</Text>
            </View>)}

            {criteria.some((criterion) => criterion.manual) ? <>
              <Text className="mb-1 mt-3 text-[18px] text-[#344D39]" style={{ fontFamily: FONTS.bold }}>Other Requirements</Text>
              {criteria.filter((criterion) => criterion.manual).map((criterion) => <View key={criterion.id} className="mb-3 rounded-[22px] border border-[#E4EBDD] bg-white p-4 shadow-sm">
                <CriterionHeading criterion={criterion} />
                <Text className="text-[13px] leading-5 text-[#61715C]" style={{ fontFamily: FONTS.medium }}>Required: {criterion.required}</Text>
                <Text className="mb-2 text-[13px] leading-5 text-[#61715C]" style={{ fontFamily: FONTS.regular }}>You: {criterion.actual}</Text>
                <View className="flex-row gap-2">
                  {(['met', 'not_met', 'unknown'] as Status[]).map((status) => {
                    const label = status === 'met' ? 'I meet this' : status === 'not_met' ? 'I don’t meet this' : 'Not sure';
                    return <TouchableOpacity key={status} onPress={() => updateAssessment(criterion.id, status)} className={`rounded-full border px-3 py-2 ${criterion.status === status ? 'border-[#476C19] bg-[#E8EFE2]' : 'border-[#DFE7DA] bg-white'}`}><Text className="text-[12px] text-[#52634E]" style={{ fontFamily: FONTS.semiBold }}>{label}</Text></TouchableOpacity>;
                  })}
                </View>
              </View>)}
            </> : null}

            <TouchableOpacity onPress={() => router.push('/about')} className="mt-2 h-[54px] flex-row items-center justify-center rounded-full bg-[#34543C]">
              <Text className="text-[13px] text-white" style={{ fontFamily: FONTS.bold }}>Complete my profile</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
            <Text className="mt-3 px-2 text-center text-[12px] leading-5 text-[#87917C]" style={{ fontFamily: FONTS.regular }}>This match is a guide based on the information available. Confirm all requirements with the official scholarship provider.</Text>
          </> : null}
    </ScrollView>
    <FloatingBottomNav currentTab="eligibility" />
  </View>;
}
