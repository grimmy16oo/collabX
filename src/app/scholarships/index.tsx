import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingBottomNav } from '../../components/FloatingBottomNav';
import { StatusPanel } from '../../components/StatusPanel';
import { DecorativeBackdrop } from '../../components/DecorativeBackdrop';
import { useSavedScholarships, useScholarships } from '../../data/scholarshipApi';
import { FONTS } from '../../theme/colors';
import { getFundingVisual } from '../../theme/scholarshipVisuals';
import { Scholarship } from '../../types/scholarship';

type SortOption = 'Recommended' | 'Deadline soonest' | 'Award highest' | 'A–Z';
type DeadlineFilter = 'Any deadline' | 'Closing in 30 days' | 'Next 90 days' | 'Has a deadline';

const SORT_OPTIONS: SortOption[] = ['Recommended', 'Deadline soonest', 'Award highest', 'A–Z'];
const DEADLINE_OPTIONS: DeadlineFilter[] = ['Any deadline', 'Closing in 30 days', 'Next 90 days', 'Has a deadline'];
const FUNDED_PATTERN = /fully funded|full tuition|full scholarship|full cost/i;
const PARTIAL_PATTERN = /partial|tuition support|up to|maximum|award of/i;

function parseDeadline(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? date
    : null;
}

function localTodayUtc(): number {
  const today = new Date();
  return Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
}

function deadlineDays(value: string): number | null {
  const date = parseDeadline(value);
  return date ? Math.round((date.getTime() - localTodayUtc()) / 86400000) : null;
}

function fundingCategory(value: string): string {
  if (FUNDED_PATTERN.test(value)) return 'Fully funded';
  if (PARTIAL_PATTERN.test(value)) return 'Partial funding';
  return 'Other funding';
}

function numericAward(value: string): number {
  const amount = value.match(/\d[\d,.]*/)?.[0];
  return amount ? Number(amount.replace(/,/g, '')) : -1;
}

function ChoiceGroup({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View className="mb-5">
      <Text className="mb-2.5 text-[13px] text-[#152A17]" style={{ fontFamily: FONTS.bold }}>{title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => onSelect(option)}
            className={`rounded-full border px-3.5 py-2 ${selected === option ? 'border-[#3D6414] bg-[#3D6414]' : 'border-[#ECEFE4] bg-white'}`}
          >
            <Text className={`text-xs ${selected === option ? 'text-white' : 'text-[#274128]'}`} style={{ fontFamily: FONTS.medium }}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function ScholarshipsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { country: countryParam } = useLocalSearchParams<{ country?: string }>();
  const countryFilter = typeof countryParam === 'string' ? countryParam : '';
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('All levels');
  const [sortBy, setSortBy] = useState<SortOption>('Recommended');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [draftCountry, setDraftCountry] = useState(countryFilter);
  const [draftField, setDraftField] = useState('All fields');
  const [draftFunding, setDraftFunding] = useState('Any funding');
  const [draftDeadline, setDraftDeadline] = useState<DeadlineFilter>('Any deadline');
  const [fieldFilter, setFieldFilter] = useState('All fields');
  const [fundingFilter, setFundingFilter] = useState('Any funding');
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('Any deadline');
  const { items, loading, error, refresh } = useScholarships(query);
  const { saved, toggle } = useSavedScholarships();

  const countries = useMemo(() => ['Any country', ...Array.from(new Set(items.map((item) => item.country))).sort()], [items]);
  const fields = useMemo(() => ['All fields', ...Array.from(new Set(items.flatMap((item) => item.fields_of_study))).sort()], [items]);
  const levels = ['All levels', ...Array.from(new Set(items.flatMap((item) => item.study_levels))).sort()];
  const activeFilterCount = Number(Boolean(countryFilter)) + Number(fieldFilter !== 'All fields') + Number(fundingFilter !== 'Any funding') + Number(deadlineFilter !== 'Any deadline');

  const results = useMemo(() => {
    const filtered = items.filter((item) => {
      const selectedCountry = countryFilter || '';
      const selectedField = fieldFilter;
      const days = deadlineDays(item.deadline);
      const countryMatches = !selectedCountry || item.country.toLowerCase() === selectedCountry.toLowerCase();
      const levelMatches = level === 'All levels' || item.study_levels.some((value) => value.toLowerCase().includes(level.toLowerCase()));
      const fieldMatches = selectedField === 'All fields' || item.fields_of_study.some((value) => value.toLowerCase() === selectedField.toLowerCase());
      const fundingMatches = fundingFilter === 'Any funding' || fundingCategory(item.award_amount) === fundingFilter;
      const deadlineMatches = deadlineFilter === 'Any deadline'
        || (deadlineFilter === 'Has a deadline' && days !== null)
        || (deadlineFilter === 'Closing in 30 days' && days !== null && days >= 0 && days <= 30)
        || (deadlineFilter === 'Next 90 days' && days !== null && days >= 0 && days <= 90);
      return countryMatches && levelMatches && fieldMatches && fundingMatches && deadlineMatches;
    });

    if (sortBy === 'Recommended') return filtered;
    return filtered.sort((a, b) => {
      if (sortBy === 'A–Z') return a.title.localeCompare(b.title);
      if (sortBy === 'Award highest') return numericAward(b.award_amount) - numericAward(a.award_amount);
      const aDays = deadlineDays(a.deadline);
      const bDays = deadlineDays(b.deadline);
      const aOrder = aDays === null || aDays < 0 ? Number.MAX_SAFE_INTEGER : aDays;
      const bOrder = bDays === null || bDays < 0 ? Number.MAX_SAFE_INTEGER : bDays;
      return aOrder - bOrder;
    });
  }, [items, countryFilter, fieldFilter, fundingFilter, deadlineFilter, level, sortBy]);

  const openFilters = () => {
    setDraftCountry(countryFilter || 'Any country');
    setDraftField(fieldFilter);
    setDraftFunding(fundingFilter);
    setDraftDeadline(deadlineFilter);
    setFiltersVisible(true);
  };

  const applyFilters = () => {
    router.setParams({ country: draftCountry === 'Any country' ? undefined : draftCountry });
    setFieldFilter(draftField);
    setFundingFilter(draftFunding);
    setDeadlineFilter(draftDeadline);
    setFiltersVisible(false);
  };

  const clearFilters = () => {
    setDraftCountry('Any country');
    setDraftField('All fields');
    setDraftFunding('Any funding');
    setDraftDeadline('Any deadline');
    router.setParams({ country: undefined });
    setFieldFilter('All fields');
    setFundingFilter('Any funding');
    setDeadlineFilter('Any deadline');
    setLevel('All levels');
  };

  const openDetails = (item: Scholarship) => router.push({ pathname: '/scholarships/details', params: { id: item.id } });

  return (
    <View className="flex-1 bg-[#F0F2E9]">
      <DecorativeBackdrop />
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="w-full max-w-[760px] self-center px-5"
        contentContainerStyle={{ paddingTop: Math.max(insets.top, 20) + 12, paddingBottom: Math.max(insets.bottom, 20) + 100 }}
      >
        <View className="mb-5 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-white">
            <Ionicons name="chevron-back" size={20} color="#152A17" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl text-[#152A17]" style={{ fontFamily: FONTS.bold }}>Scholarships</Text>
            <Text className="mt-0.5 text-[12px] text-[#798C76]" style={{ fontFamily: FONTS.regular }}>Explore scholarships by country, study level, and keyword.</Text>
          </View>
        </View>

        <View className="mb-3 h-12 flex-row items-center rounded-full border border-[#ECEFE4] bg-white px-4">
          <Ionicons name="search-outline" size={19} color="#798C76" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, provider, country, field..."
            placeholderTextColor="#9AAFA0"
            className="ml-2.5 flex-1 text-sm text-[#152A17]"
            style={{ fontFamily: FONTS.medium }}
          />
          {query ? <TouchableOpacity onPress={() => setQuery('')}><Ionicons name="close-circle" size={18} color="#9AAFA0" /></TouchableOpacity> : null}
        </View>

        <View className="mb-4 flex-row gap-2.5">
          <TouchableOpacity onPress={openFilters} className="h-10 flex-1 flex-row items-center justify-center rounded-full border border-[#DCE5D7] bg-white">
            <Ionicons name="options-outline" size={17} color="#3D6414" />
            <Text className="ml-2 text-[12px] text-[#274128]" style={{ fontFamily: FONTS.semiBold }}>Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSortVisible(true)} className="h-10 flex-1 flex-row items-center justify-center rounded-full border border-[#DCE5D7] bg-white">
            <Ionicons name="swap-vertical-outline" size={17} color="#3D6414" />
            <Text className="ml-2 text-[12px] text-[#274128]" style={{ fontFamily: FONTS.semiBold }}>{sortBy}</Text>
            <Ionicons name="chevron-down" size={14} color="#798C76" style={{ marginLeft: 5 }} />
          </TouchableOpacity>
        </View>

        {countryFilter ? (
          <View className="mb-4 flex-row items-center self-start rounded-full bg-[#E8EFE2] px-3.5 py-2">
            <Ionicons name="location-outline" size={15} color="#3D6414" />
            <Text className="ml-1.5 text-xs text-[#2C4C16]" style={{ fontFamily: FONTS.semiBold }}>Destination: {countryFilter}</Text>
            <TouchableOpacity onPress={() => router.setParams({ country: undefined })} className="ml-2"><Ionicons name="close-circle" size={16} color="#476C19" /></TouchableOpacity>
          </View>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 8 }}>
          {levels.map((value) => (
            <TouchableOpacity key={value} onPress={() => setLevel(value)} className={`rounded-xl px-3.5 py-2 ${level === value ? 'bg-[#3D6414]' : 'bg-white'}`}>
              <Text className={level === value ? 'text-xs text-white' : 'text-xs text-[#152A17]'} style={{ fontFamily: FONTS.bold }}>{value}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text className="mb-4 text-[13px] text-[#798C76]">
          {loading ? 'Loading scholarships…' : error ? 'Unable to load scholarships' : `${results.length} scholarships`}
        </Text>

        {loading ? <ActivityIndicator color="#3D6414" /> : error ? (
          <StatusPanel tone="error" title="Couldn't load scholarships" message={error} actionLabel="Try again" onAction={refresh} />
        ) : results.length === 0 ? (
          <StatusPanel tone="empty" title="No scholarships found" message="Try changing your search or filters to see more opportunities." actionLabel="Clear filters" onAction={clearFilters} />
        ) : results.map((item) => {
          const days = deadlineDays(item.deadline);
          const closing = days !== null && days >= 0 && days <= 30;
          const funding = getFundingVisual(item.award_amount);
          return (
            <TouchableOpacity key={item.id} activeOpacity={0.92} onPress={() => openDetails(item)} className="mb-4 rounded-[28px] border border-[#E4EBDD] bg-white p-5 shadow-sm">
              <View className="flex-row items-start">
                <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: funding.background }}>
                  <Ionicons name="school-outline" size={21} color={funding.foreground} />
                </View>
                <View className="mr-2 flex-1">
                  <Text className="text-[17px] leading-5 text-[#152A17]" style={{ fontFamily: FONTS.bold }}>{item.title}</Text>
                  <Text className="mt-1 text-[11px] uppercase text-[#718568]" numberOfLines={1} style={{ fontFamily: FONTS.bold }}>{item.provider_name} · {item.country}</Text>
                  <View className="mt-2 self-start rounded-full px-2.5 py-1" style={{ backgroundColor: funding.background }}>
                    <Text className="text-[10px]" style={{ color: funding.foreground, fontFamily: FONTS.bold }}>{funding.label}</Text>
                  </View>
                  <Text className="mt-1.5 text-[12px] text-[#42603C]" numberOfLines={1} style={{ fontFamily: FONTS.medium }}>{item.study_levels.join(' · ') || 'Study level not specified'}</Text>
                </View>
                <TouchableOpacity onPress={() => toggle(item.id)} hitSlop={8} accessibilityLabel={saved.includes(item.id) ? 'Remove bookmark' : 'Save scholarship'}>
                  <Ionicons name={saved.includes(item.id) ? 'bookmark' : 'bookmark-outline'} size={21} color="#3D6414" />
                </TouchableOpacity>
              </View>

              <View className="my-4 h-px bg-[#ECEFE4]" />
              <View className="flex-row items-center">
                <View className="flex-1">
                  <Text className="mb-1 text-[9px] tracking-[1.2px] text-[#798C76]" style={{ fontFamily: FONTS.bold }}>AWARD</Text>
                  <Text className="text-[16px] text-[#3D6414]" style={{ fontFamily: FONTS.bold }}>{item.award_amount}</Text>
                </View>
                <View className="mx-3 h-9 w-px bg-[#ECEFE4]" />
                <View className="flex-1">
                  <View className="mb-1 flex-row items-center">
                    <Text className="text-[9px] tracking-[1.2px] text-[#798C76]" style={{ fontFamily: FONTS.bold }}>DEADLINE</Text>
                    {closing ? <View className="ml-2 rounded-full bg-[#F7EDE2] px-2 py-0.5"><Text className="text-[9px] text-[#9A5B3D]" style={{ fontFamily: FONTS.bold }}>Closing soon</Text></View> : null}
                  </View>
                  <Text className="text-[13px] text-[#152A17]" style={{ fontFamily: FONTS.semiBold }}>{item.deadline}</Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color="#8FA38D" />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <FloatingBottomNav currentTab="search" />

      <Modal visible={filtersVisible} transparent animationType="slide" onRequestClose={() => setFiltersVisible(false)}>
        <View className="flex-1 justify-end">
          <Pressable onPress={() => setFiltersVisible(false)} className="absolute inset-0 bg-black/35" />
          <View className="max-h-[85%] rounded-t-[30px] bg-[#F0F2E9] px-5 pb-8 pt-5" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-[21px] text-[#152A17]" style={{ fontFamily: FONTS.bold }}>Filters</Text>
                <Text className="mt-1 text-xs text-[#798C76]">Narrow down the scholarship list</Text>
              </View>
              <TouchableOpacity onPress={() => setFiltersVisible(false)} className="h-9 w-9 items-center justify-center rounded-full bg-white"><Ionicons name="close" size={19} color="#274128" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <ChoiceGroup title="Country" options={countries} selected={draftCountry || 'Any country'} onSelect={setDraftCountry} />
              <ChoiceGroup title="Field of study" options={fields} selected={draftField} onSelect={setDraftField} />
              <ChoiceGroup title="Funding type" options={['Any funding', 'Fully funded', 'Partial funding', 'Other funding']} selected={draftFunding} onSelect={setDraftFunding} />
              <ChoiceGroup title="Deadline" options={DEADLINE_OPTIONS} selected={draftDeadline} onSelect={(value) => setDraftDeadline(value as DeadlineFilter)} />
            </ScrollView>
            <View className="mt-4 flex-row gap-3">
              <TouchableOpacity onPress={clearFilters} className="h-12 flex-1 items-center justify-center rounded-full border border-[#D7E1D1] bg-white"><Text className="text-sm text-[#274128]" style={{ fontFamily: FONTS.semiBold }}>Reset</Text></TouchableOpacity>
              <TouchableOpacity onPress={applyFilters} className="h-12 flex-[1.5] items-center justify-center rounded-full bg-[#3D6414]"><Text className="text-sm text-white" style={{ fontFamily: FONTS.bold }}>Show scholarships</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={sortVisible} transparent animationType="fade" onRequestClose={() => setSortVisible(false)}>
        <View className="flex-1 items-center justify-center px-6">
          <Pressable onPress={() => setSortVisible(false)} className="absolute inset-0 bg-black/35" />
          <View className="w-full rounded-[28px] bg-white p-5">
            <Text className="mb-3 text-[19px] text-[#152A17]" style={{ fontFamily: FONTS.bold }}>Sort by</Text>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity key={option} onPress={() => { setSortBy(option); setSortVisible(false); }} className="flex-row items-center justify-between border-t border-[#ECEFE4] py-3.5">
                <Text className={`text-sm ${sortBy === option ? 'text-[#3D6414]' : 'text-[#4B5E48]'}`} style={{ fontFamily: sortBy === option ? FONTS.bold : FONTS.medium }}>{option}</Text>
                {sortBy === option ? <Ionicons name="checkmark" size={18} color="#3D6414" /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}
