import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { File as ExpoFile } from "expo-file-system";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth } from "../config/firebase";
import { apiBaseUrl, apiFetch } from "../config/api";
import { DecorativeBackdrop } from "../components/DecorativeBackdrop";
import { COLORS, FONTS } from "../theme/colors";

const SUPPORT_EMAIL = "support@collabx.app";
const TOPICS = ["Eligibility match", "Scholarships", "Bug report", "Feature idea", "Account", "Other"];

export default function ContactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [replyEmail, setReplyEmail] = useState(auth.currentUser?.email || "");
  const [screenshot, setScreenshot] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const emailSupport = async () => {
    try {
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
    } catch {
      Alert.alert("Could not open email", `Please email us at ${SUPPORT_EMAIL}.`);
    }
  };

  const chooseScreenshot = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Allow photo library access to attach a screenshot.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      setError("Choose a screenshot smaller than 5 MB.");
      return;
    }
      setError("");
    setScreenshot(asset);
  };

  const sendFeedback = async () => {
    setError("");
    setSuccess(false);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("Please sign in to send feedback. You can still email us directly above.");
      return;
    }
    if (!rating || !topic || !message.trim()) {
      setError("Choose a rating and topic, then add a message.");
      return;
    }
    if (replyEmail.trim() && !/^\S+@\S+\.\S+$/.test(replyEmail.trim())) {
      setError("Enter a valid reply email or leave it blank.");
      return;
    }

    setSending(true);
    try {
      if (!apiBaseUrl) throw new Error("Connect to the API to send feedback.");
      const formData = new FormData();
      formData.append("rating", String(rating));
      formData.append("topic", topic);
      formData.append("message", message.trim());
      formData.append("replyEmail", replyEmail.trim());
      if (screenshot) {
        const fileName = screenshot.fileName || `feedback-${Date.now()}.jpg`;
        const mimeType = screenshot.mimeType || "image/jpeg";
        if (Platform.OS === "web") {
          const fileResponse = await fetch(screenshot.uri);
          if (!fileResponse.ok) throw new Error("Could not read the attached screenshot.");
          const blob = await fileResponse.blob();
          formData.append("photo", blob.slice(0, blob.size, mimeType), fileName);
        } else {
          formData.append("photo", new ExpoFile(screenshot.uri), fileName);
        }
      }

      const response = await apiFetch(`${apiBaseUrl}/api/feedback`, {
        method: "POST",
        headers: { Authorization: `Bearer ${await currentUser.getIdToken()}` },
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not send your feedback.");
      setSuccess(true);
      setRating(0);
      setTopic("");
      setMessage("");
      setScreenshot(null);
    } catch (submitError) {
      console.error("Failed to submit CollabX feedback:", submitError);
      setError("We couldn’t send your feedback. Please try again or email us directly.");
    } finally {
      setSending(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F0F2E9]">
      <DecorativeBackdrop />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: Math.max(insets.top, 18) + 22,
            paddingBottom: Math.max(insets.bottom, 18) + 28,
            paddingHorizontal: 20,
          }}
        >
          <View className="w-full max-w-[600px] self-center">
            <View className="mb-10 flex-row items-center">
              <TouchableOpacity
                onPress={() => router.back()}
                className="mr-4 h-[52px] w-[52px] items-center justify-center rounded-full bg-white"
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={23} color="#35513A" />
              </TouchableOpacity>
              <Text className="flex-1 text-[25px] text-[#35513A]" style={{ fontFamily: FONTS.bold }}>
                Contact &amp; Feedback
              </Text>
            </View>

            <Text className="text-[20px] text-[#35513A]" style={{ fontFamily: FONTS.bold }}>Get in touch</Text>
            <Text className="mt-2 text-[15px] text-[#7C8175]" style={{ fontFamily: FONTS.regular }}>
              We usually reply within 1 to 2 working days
            </Text>

            <TouchableOpacity
              onPress={emailSupport}
              activeOpacity={0.82}
              className="mt-5 min-h-[88px] flex-row items-center rounded-[28px] border border-[#E4EBDD] bg-white px-5 shadow-sm"
              accessibilityRole="button"
              accessibilityLabel={`Email us at ${SUPPORT_EMAIL}`}
            >
              <View className="flex-1">
                <Text className="text-[16px] text-[#35513A]" style={{ fontFamily: FONTS.bold }}>Email us</Text>
                <Text className="mt-1 text-[16px] text-[#52644C]" style={{ fontFamily: FONTS.regular }}>{SUPPORT_EMAIL}</Text>
              </View>
              <View className="h-11 w-11 items-center justify-center rounded-full bg-[#EEF2E5]">
                <Ionicons name="arrow-forward" size={19} color="#71845C" />
              </View>
            </TouchableOpacity>

            <Text className="mt-12 text-[20px] text-[#35513A]" style={{ fontFamily: FONTS.bold }}>Send feedback</Text>
            <Text className="mt-2 text-[15px] text-[#7C8175]" style={{ fontFamily: FONTS.regular }}>
              Help us make CollabX better for students
            </Text>

            <View className="mt-5 rounded-[28px] border border-[#E4EBDD] bg-white px-5 pb-6 pt-6 shadow-sm">
              <Text className="text-[15px] text-[#35513A]" style={{ fontFamily: FONTS.bold }}>How is your experience?</Text>
              <View className="mt-4 flex-row gap-2.5">
                {[1, 2, 3, 4, 5].map((score) => {
                  const isSelected = rating === score;
                  const ratingTone = score < 3
                    ? { bg: COLORS.accentRoseLight, fg: COLORS.accentRose }
                    : score === 3
                      ? { bg: COLORS.accentAmberLight, fg: COLORS.accentAmber }
                      : { bg: COLORS.accentOliveLight, fg: COLORS.accentOlive };
                  return (
                    <Pressable
                      key={score}
                      onPress={() => { setRating(score); setError(""); setSuccess(false); }}
                      accessibilityRole="button"
                      accessibilityLabel={`${score} out of 5`}
                      accessibilityState={{ selected: isSelected }}
                      className="h-[60px] flex-1 items-center justify-center rounded-[20px]"
                      style={{ backgroundColor: isSelected ? ratingTone.fg : ratingTone.bg }}
                    >
                      <Text className="text-[18px]" style={{ color: isSelected ? '#FFFFFF' : ratingTone.fg, fontFamily: FONTS.bold }}>{score}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View className="mt-3 flex-row justify-between">
                <Text className="text-[14px] text-[#85877C]" style={{ fontFamily: FONTS.regular }}>Poor</Text>
                <Text className="text-[14px] text-[#85877C]" style={{ fontFamily: FONTS.regular }}>Excellent</Text>
              </View>

              <Text className="mb-3 mt-10 text-[15px] text-[#35513A]" style={{ fontFamily: FONTS.bold }}>What’s it about?</Text>
              <View className="flex-row flex-wrap gap-2.5">
                {TOPICS.map((item) => {
                  const isSelected = topic === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => { setTopic(isSelected ? "" : item); setError(""); setSuccess(false); }}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      className={`min-w-[30%] flex-1 items-center rounded-full px-4 py-3 ${isSelected ? "bg-[#35513A]" : "bg-[#EEF2E5]"}`}
                    >
                      <Text className={`text-[13px] ${isSelected ? "text-white" : "text-[#748360]"}`} style={{ fontFamily: FONTS.semiBold }}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text className="mb-3 mt-10 text-[15px] text-[#35513A]" style={{ fontFamily: FONTS.bold }}>Your message</Text>
              <TextInput
                value={message}
                onChangeText={(value) => { setMessage(value.slice(0, 500)); setError(""); setSuccess(false); }}
                maxLength={500}
                multiline
                textAlignVertical="top"
                placeholder="Tell us what happened or what you’d like to see..."
                placeholderTextColor="#898D80"
                className="min-h-[176px] rounded-[22px] bg-[#EEF2E5] px-4 py-4 text-[15px] text-[#35513A]"
                style={{ fontFamily: FONTS.regular }}
                accessibilityLabel="Your feedback message"
              />
              <Text className="mt-2 self-end text-[13px] text-[#85877C]" style={{ fontFamily: FONTS.medium }}>{message.length} / 500</Text>

              {screenshot ? (
                <View className="mt-6 flex-row items-center rounded-2xl border border-dashed border-[#DCE5D2] p-3">
                  <Image source={{ uri: screenshot.uri }} className="h-14 w-14 rounded-xl" />
                  <Text className="ml-3 flex-1 text-[13px] text-[#52644C]" numberOfLines={1} style={{ fontFamily: FONTS.medium }}>{screenshot.fileName || "Screenshot attached"}</Text>
                  <TouchableOpacity onPress={() => setScreenshot(null)} accessibilityRole="button" accessibilityLabel="Remove screenshot" className="h-9 w-9 items-center justify-center rounded-full bg-[#EEF2E5]">
                    <Ionicons name="close" size={18} color="#52644C" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={chooseScreenshot}
                  activeOpacity={0.8}
                  className="mt-6 h-[62px] items-center justify-center rounded-[20px] border-2 border-dashed border-[#DCE5D2]"
                  accessibilityRole="button"
                  accessibilityLabel="Attach a screenshot, optional"
                >
                  <View className="flex-row items-center">
                    <Ionicons name="add" size={20} color="#71845C" />
                    <Text className="ml-1 text-[14px] text-[#71845C]" style={{ fontFamily: FONTS.bold }}>Attach a screenshot (optional)</Text>
                  </View>
                </TouchableOpacity>
              )}

              <TextInput
                value={replyEmail}
                onChangeText={(value) => { setReplyEmail(value); setError(""); setSuccess(false); }}
                placeholder="Reply-to email (optional)"
                placeholderTextColor="#898D80"
                autoCapitalize="none"
                keyboardType="email-address"
                className="mt-5 h-[60px] rounded-[20px] bg-[#EEF2E5] px-4 text-[15px] text-[#35513A]"
                style={{ fontFamily: FONTS.regular }}
                accessibilityLabel="Reply-to email, optional"
              />
            </View>

            {error ? <Text className="mt-4 px-1 text-[14px] text-[#A1473C]" style={{ fontFamily: FONTS.medium }}>{error}</Text> : null}
            {success ? <Text className="mt-4 px-1 text-[14px] text-[#35513A]" style={{ fontFamily: FONTS.semiBold }}>Thanks — your feedback was sent.</Text> : null}

            <TouchableOpacity
              onPress={sendFeedback}
              disabled={sending}
              activeOpacity={0.85}
              className={`mt-8 h-[64px] flex-row items-center justify-center rounded-full bg-[#35513A] ${sending ? "opacity-70" : ""}`}
              accessibilityRole="button"
              accessibilityLabel="Send feedback"
            >
              {sending ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-[16px] text-white" style={{ fontFamily: FONTS.bold }}>Send Feedback</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
