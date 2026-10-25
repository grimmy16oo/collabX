import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FloatingBottomNav } from "../components/FloatingBottomNav";
import { DecorativeBackdrop } from "../components/DecorativeBackdrop";
import { useAuth } from "../context/AuthContext";
import { FONTS } from "../theme/colors";

const DEGREE_LEVELS = ["High School", "Bachelor's", "Master's", "PhD", "Postdoc", "Other"];
const OLD_PLACEHOLDER_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function ProfileInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "decimal-pad";
  multiline?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-[12px] tracking-wide text-[#697A66]" style={{ fontFamily: FONTS.semiBold }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AA798"
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        className={`rounded-2xl border border-[#DFE7DA] bg-[#FBFCF8] px-4 text-[15px] text-[#193419] ${multiline ? "min-h-[88px] py-3" : "h-[52px]"}`}
        style={{ fontFamily: FONTS.medium }}
        accessibilityLabel={label}
      />
    </View>
  );
}

function InfoCard({ icon, title, value, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; value: string; onPress?: () => void }) {
  const content = (
    <View className="flex-row items-center py-4">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#F0F4EB]">
        <Ionicons name={icon} size={19} color="#42613A" />
      </View>
      <View className="flex-1">
        <Text className="text-[12px] text-[#879382]" style={{ fontFamily: FONTS.medium }}>{title}</Text>
        <Text className="mt-1 text-[15px] text-[#233D21]" style={{ fontFamily: FONTS.semiBold }}>{value}</Text>
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color="#A0AC9B" /> : null}
    </View>
  );
  return onPress ? <TouchableOpacity onPress={onPress} activeOpacity={0.75}>{content}</TouchableOpacity> : content;
}

export default function About() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, updateProfile, uploadProfilePhoto } = useAuth();
  const [editVisible, setEditVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [degreeLevel, setDegreeLevel] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [cgpaScale, setCgpaScale] = useState("");
  const [nationality, setNationality] = useState("");
  const [targetCountries, setTargetCountries] = useState("");
  const [fieldsOfStudy, setFieldsOfStudy] = useState("");
  const [languages, setLanguages] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [completeness, setCompleteness] = useState(0);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName || "");
    setHeadline(user.profile?.headline || "");
    setDegreeLevel(user.profile?.degreeLevel || "");
    setCgpa(user.profile?.cgpa != null ? String(user.profile.cgpa) : "");
    setCgpaScale(user.profile?.cgpaScale != null ? String(user.profile.cgpaScale) : "");
    setNationality(user.profile?.nationality || "");
    setTargetCountries(user.profile?.targetCountries?.join(", ") || "");
    setFieldsOfStudy(user.profile?.fieldsOfStudy?.join(", ") || "");
    setLanguages(user.profile?.languages?.join(", ") || "");
    const savedPhoto = user.profile?.photoURL || user.profile?.avatarUrl || "";
    setAvatarUrl(savedPhoto === OLD_PLACEHOLDER_AVATAR ? "" : savedPhoto);
  }, [user]);

  const profileValues = useMemo(() => [
    user?.fullName,
    (user?.profile?.photoURL || user?.profile?.avatarUrl) && (user.profile.photoURL || user.profile.avatarUrl) !== OLD_PLACEHOLDER_AVATAR,
    user?.profile?.headline,
    user?.profile?.degreeLevel,
    user?.profile?.cgpa != null,
    user?.profile?.nationality,
    user?.profile?.targetCountries?.length,
    user?.profile?.fieldsOfStudy?.length,
    user?.profile?.languages?.length,
  ], [user]);

  useEffect(() => {
    const filled = profileValues.filter(Boolean).length;
    setCompleteness(Math.round((filled / profileValues.length) * 100));
  }, [profileValues]);

  const openEditor = () => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    setEditVisible(true);
  };

  const saveProfile = async () => {
    if (!user) return;
    const cleanName = fullName.trim();
    if (!cleanName) {
      Alert.alert("Name required", "Add your name before saving your profile.");
      return;
    }
    const parsedCgpa = cgpa.trim() ? Number(cgpa) : undefined;
    const parsedScale = cgpaScale.trim() ? Number(cgpaScale) : undefined;
    if (parsedCgpa !== undefined && (!Number.isFinite(parsedCgpa) || parsedCgpa < 0 || !parsedScale || !Number.isFinite(parsedScale) || parsedCgpa > parsedScale)) {
      Alert.alert("Check your grades", "Enter a valid CGPA and grading scale. Your CGPA cannot be higher than its scale.");
      return;
    }
    setSaving(true);
    const result = await updateProfile({
      fullName: cleanName,
      headline: headline.trim(),
      degreeLevel,
      cgpa: parsedCgpa ?? null,
      cgpaScale: parsedScale ?? null,
      nationality: nationality.trim(),
      targetCountries: splitList(targetCountries),
      fieldsOfStudy: splitList(fieldsOfStudy),
      languages: splitList(languages),
    });
    setSaving(false);
    if (result.success) setEditVisible(false);
    else Alert.alert("Couldn’t save profile", result.error || "Please try again.");
  };

  const pickAndUploadPhoto = async () => {
    if (!user) {
      Alert.alert("Sign in required", "Sign in to add a profile photo.");
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.82,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert("Image is too large", "Choose a profile photo smaller than 5 MB.");
        return;
      }
      const fileName = asset.fileName || asset.uri.split("/").pop() || `profile-${Date.now()}.jpg`;
      const extensionMimeTypes: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
      const mimeType = asset.mimeType || extensionMimeTypes[fileName.split(".").pop()?.toLowerCase() || ""];
      if (!mimeType || !["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(mimeType)) {
        Alert.alert("Unsupported image", "Choose a JPG, PNG, or WebP image.");
        return;
      }
      setPhotoBusy(true);
      const saved = await uploadProfilePhoto(asset.uri, fileName, mimeType);
      if (!saved.success) throw new Error(saved.error || "Could not save the new photo to your profile.");
      if (saved.photoURL) setAvatarUrl(saved.photoURL);
    } catch (error) {
      Alert.alert("Photo upload failed", error instanceof Error ? error.message : "Please try another image.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/sign-in");
  };

  const savedAvatar = user?.profile?.photoURL || user?.profile?.avatarUrl || avatarUrl;
  const displayAvatar = savedAvatar === OLD_PLACEHOLDER_AVATAR ? "" : savedAvatar;
  const degreeText = user?.profile?.degreeLevel || "Not added";
  const cgpaText = user?.profile?.cgpa != null
    ? `${user.profile.cgpa}${user.profile.cgpaScale ? ` / ${user.profile.cgpaScale}` : ""}`
    : "Not added";

  return (
    <View className="flex-1 bg-[#F0F2E9]">
      <DecorativeBackdrop />
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="w-full max-w-[720px] self-center"
        contentContainerStyle={{ paddingTop: Math.max(insets.top, 20) + 12, paddingBottom: Math.max(insets.bottom, 20) + 112 }}
      >
        <View className="px-5">
          <View className="mb-6 flex-row items-center justify-between">
            <View>
              <Text className="text-[12px] tracking-[2px] text-[#819079]" style={{ fontFamily: FONTS.bold }}>MY SPACE</Text>
              <Text className="mt-1 text-[30px] text-[#183518]" style={{ fontFamily: FONTS.bold }}>Your profile</Text>
            </View>
            {user ? (
              <TouchableOpacity onPress={handleLogout} className="h-11 w-11 items-center justify-center rounded-2xl bg-white" accessibilityRole="button" accessibilityLabel="Sign out">
                <Ionicons name="log-out-outline" size={21} color="#4E6049" />
              </TouchableOpacity>
            ) : null}
          </View>

          {!user ? (
            <View className="rounded-[28px] border border-[#DCE6D6] bg-white p-6">
              <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4E9]"><Ionicons name="person-outline" size={26} color="#42613A" /></View>
              <Text className="text-[20px] text-[#193419]" style={{ fontFamily: FONTS.bold }}>Make this space yours</Text>
              <Text className="mt-2 text-[14px] leading-5 text-[#71806C]" style={{ fontFamily: FONTS.regular }}>Sign in to add your details, study preferences, and profile photo.</Text>
              <TouchableOpacity onPress={() => router.push("/sign-in")} className="mt-5 h-12 items-center justify-center rounded-full bg-[#23451F]">
                <Text className="text-white" style={{ fontFamily: FONTS.bold }}>Sign in</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View className="rounded-[28px] border border-[#E4EBDD] bg-white p-5 shadow-sm">
                <View className="flex-row items-center">
                  <View className="relative mr-4">
                    {displayAvatar ? (
                      <Image source={{ uri: displayAvatar }} className="h-[82px] w-[82px] rounded-[28px] bg-[#EDF2E8]" />
                    ) : (
                      <View className="h-[82px] w-[82px] items-center justify-center rounded-[28px] bg-[#EDF2E8]"><Ionicons name="person-outline" size={34} color="#91A18A" /></View>
                    )}
                    <TouchableOpacity onPress={pickAndUploadPhoto} disabled={photoBusy} className="absolute -bottom-2 -right-2 h-9 w-9 items-center justify-center rounded-xl border-2 border-white bg-[#23451F]" accessibilityRole="button" accessibilityLabel="Upload profile photo">
                      {photoBusy ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="camera-outline" size={17} color="#fff" />}
                    </TouchableOpacity>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[21px] text-[#193419]" numberOfLines={2} style={{ fontFamily: FONTS.bold }}>{user.fullName}</Text>
                    <Text className="mt-1 text-[13px] text-[#71806C]" numberOfLines={1} style={{ fontFamily: FONTS.medium }}>{user.email}</Text>
                    <TouchableOpacity onPress={pickAndUploadPhoto} disabled={photoBusy} className="mt-2 self-start">
                      <Text className="text-[13px] text-[#42613A]" style={{ fontFamily: FONTS.semiBold }}>{photoBusy ? "Uploading photo…" : displayAvatar ? "Change photo" : "Add a profile photo"}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={openEditor} className="ml-2 h-10 w-10 items-center justify-center rounded-xl bg-[#F0F4EB]" accessibilityLabel="Edit profile" accessibilityRole="button">
                    <Ionicons name="create-outline" size={19} color="#42613A" />
                  </TouchableOpacity>
                </View>
                <View className="mt-5 border-t border-[#EDF1E9] pt-4">
                  <View className="mb-2 flex-row justify-between">
                    <Text className="text-[12px] text-[#71806C]" style={{ fontFamily: FONTS.medium }}>Profile completeness</Text>
                    <Text className="text-[12px] text-[#42613A]" style={{ fontFamily: FONTS.bold }}>{completeness}%</Text>
                  </View>
                  <View className="h-2 overflow-hidden rounded-full bg-[#EDF1E9]"><View className="h-full rounded-full bg-[#638D50]" style={{ width: `${completeness}%` }} /></View>
                  <Text className="mt-2 text-[12px] text-[#879382]" style={{ fontFamily: FONTS.regular }}>Add your details to help tailor scholarship matches.</Text>
                </View>
              </View>

              <View className="mt-7 flex-row items-center justify-between">
                <Text className="text-[18px] text-[#193419]" style={{ fontFamily: FONTS.bold }}>Study profile</Text>
                <TouchableOpacity onPress={openEditor}><Text className="text-[13px] text-[#42613A]" style={{ fontFamily: FONTS.semiBold }}>Edit details</Text></TouchableOpacity>
              </View>
              <View className="mt-3 rounded-[26px] border border-[#E4EBDD] bg-white px-4 shadow-sm">
                <InfoCard icon="school-outline" title="Current degree" value={degreeText} onPress={openEditor} />
                <View className="h-px bg-[#EDF1E9]" />
                <InfoCard icon="stats-chart-outline" title="Current CGPA" value={cgpaText} onPress={openEditor} />
                <View className="h-px bg-[#EDF1E9]" />
                <InfoCard icon="person-circle-outline" title="About you" value={user.profile?.headline?.trim() || "Add a short headline"} onPress={openEditor} />
                <View className="h-px bg-[#EDF1E9]" />
                <InfoCard icon="flag-outline" title="Nationality" value={user.profile?.nationality?.trim() || "Not added"} onPress={openEditor} />
              </View>

              <Text className="mb-3 mt-7 text-[18px] text-[#193419]" style={{ fontFamily: FONTS.bold }}>Scholarship preferences</Text>
              <View className="rounded-[26px] border border-[#E4EBDD] bg-white px-4 shadow-sm">
                <InfoCard icon="globe-outline" title="Target countries" value={user.profile?.targetCountries?.length ? user.profile.targetCountries.join(", ") : "Add countries you’re interested in"} onPress={openEditor} />
                <View className="h-px bg-[#EDF1E9]" />
                <InfoCard icon="layers-outline" title="Fields of study" value={user.profile?.fieldsOfStudy?.length ? user.profile.fieldsOfStudy.join(", ") : "Add your study interests"} onPress={openEditor} />
                <View className="h-px bg-[#EDF1E9]" />
                <InfoCard icon="chatbubble-ellipses-outline" title="Languages" value={user.profile?.languages?.length ? user.profile.languages.join(", ") : "Add languages you know"} onPress={openEditor} />
              </View>

              <Text className="mb-3 mt-7 text-[18px] text-[#193419]" style={{ fontFamily: FONTS.bold }}>Your documents</Text>
              <View className="rounded-[26px] border border-[#E4EBDD] bg-white px-4 shadow-sm">
                <InfoCard icon="document-text-outline" title="Resumes" value={user.profile?.resumes?.length ? `${user.profile.resumes.length} uploaded` : "No resumes added yet"} />
              </View>

              <Text className="mb-3 mt-7 text-[18px] text-[#193419]" style={{ fontFamily: FONTS.bold }}>Support</Text>
              <View className="rounded-[26px] border border-[#E4EBDD] bg-white px-4 shadow-sm">
                <InfoCard icon="chatbubble-ellipses-outline" title="Contact & feedback" value="Questions or suggestions? Let us know." onPress={() => router.push("/contact" as Href)} />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView className="flex-1 justify-end bg-black/40" behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="max-h-[92%] rounded-t-[30px] bg-white px-6 pt-5" style={{ paddingBottom: Math.max(insets.bottom, 18) }}>
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-[22px] text-[#193419]" style={{ fontFamily: FONTS.bold }}>Edit your profile</Text>
                <Text className="mt-1 text-[13px] text-[#82907D]" style={{ fontFamily: FONTS.regular }}>Add only the details you want to share.</Text>
              </View>
              <TouchableOpacity onPress={() => setEditVisible(false)} className="h-10 w-10 items-center justify-center rounded-xl bg-[#F2F5EF]" accessibilityLabel="Close editor">
                <Ionicons name="close" size={20} color="#51644B" />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <ProfileInput label="FULL NAME" value={fullName} onChangeText={setFullName} placeholder="Your name" />
              <ProfileInput label="HEADLINE" value={headline} onChangeText={setHeadline} placeholder="A short introduction" multiline />
              <Text className="mb-2 text-[12px] tracking-wide text-[#697A66]" style={{ fontFamily: FONTS.semiBold }}>CURRENT DEGREE</Text>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {DEGREE_LEVELS.map((level) => (
                  <TouchableOpacity key={level} onPress={() => setDegreeLevel(degreeLevel === level ? "" : level)} className={`rounded-full border px-4 py-2.5 ${degreeLevel === level ? "border-[#23451F] bg-[#23451F]" : "border-[#DFE7DA] bg-white"}`}>
                    <Text className={`text-[13px] ${degreeLevel === level ? "text-white" : "text-[#52644C]"}`} style={{ fontFamily: FONTS.semiBold }}>{level}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1"><ProfileInput label="CGPA" value={cgpa} onChangeText={setCgpa} placeholder="e.g. 3.7" keyboardType="decimal-pad" /></View>
                <View className="flex-1"><ProfileInput label="GRADING SCALE" value={cgpaScale} onChangeText={setCgpaScale} placeholder="e.g. 4.0" keyboardType="decimal-pad" /></View>
              </View>
              <ProfileInput label="NATIONALITY" value={nationality} onChangeText={setNationality} placeholder="Your nationality" />
              <ProfileInput label="TARGET COUNTRIES" value={targetCountries} onChangeText={setTargetCountries} placeholder="Separate countries with commas" multiline />
              <ProfileInput label="FIELDS OF STUDY" value={fieldsOfStudy} onChangeText={setFieldsOfStudy} placeholder="Separate subjects with commas" multiline />
              <ProfileInput label="LANGUAGES" value={languages} onChangeText={setLanguages} placeholder="e.g. English, Korean" multiline />
            </ScrollView>
            <TouchableOpacity onPress={saveProfile} disabled={saving} className="mt-3 h-14 flex-row items-center justify-center rounded-full bg-[#23451F]">
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-[15px] text-white" style={{ fontFamily: FONTS.bold }}>Save profile</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <FloatingBottomNav currentTab="profile" />
    </View>
  );
}
