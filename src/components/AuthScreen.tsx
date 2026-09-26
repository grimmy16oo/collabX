import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../theme/colors";

type AuthMode = "signIn" | "signUp";

const Field = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secure = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secure?: boolean;
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <View className="h-[60px] rounded-full border border-[#DCE5D6] bg-white/70 flex-row items-center px-5 mb-2.5">
      <Ionicons name={icon} size={22} color="#3C5731" />
      <TextInput
        className="flex-1 ml-3.5 text-[15px] text-[#17331A]"
        style={{ fontFamily: FONTS.medium }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#90A08C"
        secureTextEntry={secure && !visible}
        autoCapitalize="none"
        keyboardType={
          placeholder.includes("Email") ? "email-address" : "default"
        }
        accessibilityLabel={placeholder}
      />
      {secure && (
        <TouchableOpacity
          onPress={() => setVisible((shown) => !shown)}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={22}
            color="#3C5731"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isSignUp = mode === "signUp";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const title = isSignUp ? "Create Your\nAccount" : "Welcome\nBack";
  const subtitle = isSignUp
    ? "Join a community of learners,\nshare your skills, and grow together."
    : "Sign in to continue your\nscholarship journey.";

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FBF4" }}>
      <View className="absolute -left-20 -top-20 w-64 h-64 rounded-full bg-[#DCE9D4]/70" />
      <View className="absolute -right-28 -bottom-28 w-72 h-72 rounded-full bg-[#DCE9D4]/70" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: Math.max(insets.top, 20) + 16,
            paddingBottom: Math.max(insets.bottom, 20) + 20,
          }}
        >
          <View className="px-6 w-full max-w-[460px] self-center">
            <View className="flex-row items-center self-center mb-7">
              <View className="w-[58px] h-[58px] rounded-[20px] bg-[#193419] items-center justify-center">
                <Ionicons name="school" size={30} color="#FFFFFF" />
              </View>
              <Text
                className="ml-3 text-[30px] font-bold text-[#17331A]"
                style={{ fontFamily: FONTS.bold }}
              >
                CollabX
              </Text>
            </View>

            <Text
              className="text-[40px] leading-[44px] font-bold text-[#102C14] tracking-tight"
              style={{ fontFamily: FONTS.bold }}
            >
              {title}
            </Text>
            <Text
              className="text-[17px] leading-6 text-[#71876F] mt-3 mb-7"
              style={{ fontFamily: FONTS.regular }}
            >
              {subtitle}
            </Text>

            {isSignUp && (
              <Field
                icon="person-outline"
                placeholder="Full name"
                value={fullName}
                onChangeText={setFullName}
              />
            )}
            <Field
              icon="mail-outline"
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
            />
            <Field
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secure
            />
            {isSignUp && (
              <Field
                icon="lock-closed-outline"
                placeholder="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secure
              />
            )}

            {!isSignUp && (
              <View className="flex-row justify-between items-center my-2">
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => setRememberMe((value) => !value)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                >
                  <View
                    className={`w-6 h-6 rounded-md items-center justify-center ${rememberMe ? "bg-[#23451F]" : "border border-[#8EA28A]"}`}
                  >
                    {rememberMe && (
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    className="ml-2.5 text-[14px] text-[#71876F]"
                    style={{ fontFamily: FONTS.medium }}
                  >
                    Remember me
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button">
                  <Text
                    className="text-[14px] text-[#355126]"
                    style={{ fontFamily: FONTS.semiBold }}
                  >
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              onPress={() => router.replace("/home")}
              activeOpacity={0.85}
              className="h-[60px] rounded-full bg-[#1E421C] items-center justify-center flex-row mt-4"
              accessibilityRole="button"
              accessibilityLabel={isSignUp ? "Sign up" : "Sign in"}
            >
              <Text
                className="text-[17px] text-white font-bold tracking-wide"
                style={{ fontFamily: FONTS.bold }}
              >
                {isSignUp ? "SIGN UP" : "SIGN IN"}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={23}
                color="#FFFFFF"
                className="ml-3"
              />
            </TouchableOpacity>

            <View className="flex-row items-center my-6">
              <View className="h-px flex-1 bg-[#D4E0CF]" />
              <Text
                className="mx-5 text-[14px] text-[#71876F]"
                style={{ fontFamily: FONTS.medium }}
              >
                OR
              </Text>
              <View className="h-px flex-1 bg-[#D4E0CF]" />
            </View>
            <View className="flex-row justify-center gap-5">
              {[
                ["logo-google", "#4285F4"],
                ["logo-apple", "#111111"],
                ["game-controller-outline", "#5865F2"],
              ].map(([icon, color]) => (
                <TouchableOpacity
                  key={icon}
                  className="w-14 h-14 rounded-full border border-[#DCE5D6] bg-white/75 items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel={`Continue with ${icon}`}
                >
                  <Ionicons
                    name={icon as keyof typeof Ionicons.glyphMap}
                    size={25}
                    color={color}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {isSignUp && (
              <Text
                className="text-center text-[12px] leading-[18px] text-[#71876F] mt-7"
                style={{ fontFamily: FONTS.regular }}
              >
                By creating an account, you agree to our{"\n"}
                <Text
                  className="text-[#355126]"
                  style={{ fontFamily: FONTS.semiBold }}
                >
                  Terms of Service
                </Text>{" "}
                and{" "}
                <Text
                  className="text-[#355126]"
                  style={{ fontFamily: FONTS.semiBold }}
                >
                  Privacy Policy.
                </Text>
              </Text>
            )}
            <View className="flex-row justify-center mt-7">
              <Text
                className="text-[14px] text-[#71876F]"
                style={{ fontFamily: FONTS.medium }}
              >
                {isSignUp
                  ? "Already have an account? "
                  : "Don’t have an account? "}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.replace(isSignUp ? "/sign-in" : "/sign-up")
                }
                accessibilityRole="link"
              >
                <Text
                  className="text-[14px] text-[#17331A]"
                  style={{ fontFamily: FONTS.bold }}
                >
                  {isSignUp ? "Log in" : "Sign up"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
