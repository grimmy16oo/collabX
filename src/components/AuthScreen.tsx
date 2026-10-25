import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { hasFirebaseConfig } from "../config/firebase";
import { COLORS, FONTS } from "../theme/colors";
import { DecorativeBackdrop } from "./DecorativeBackdrop";

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
  const { login, register, resetPassword } = useAuth();
  const isSignUp = mode === "signUp";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const title = isSignUp ? "Create Your\nAccount" : "Welcome\nBack";
  const subtitle = isSignUp
    ? "Join a community of learners,\nshare your skills, and grow together."
    : "Sign in to continue your\nscholarship journey.";

  const handleSubmit = async () => {
    setErrorMessage("");
    setInfoMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please fill in both email and password.");
      return;
    }

    if (isSignUp) {
      if (!fullName.trim()) {
        setErrorMessage("Please enter your full name.");
        return;
      }
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }

      setIsSubmitting(true);
      const res = await register(fullName.trim(), email.trim(), password);
      setIsSubmitting(false);

      if (res.success) {
        router.replace("/home");
      } else {
        setErrorMessage(res.error || "Failed to create account with Firebase.");
      }
    } else {
      setIsSubmitting(true);
      const res = await login(email.trim(), password);
      setIsSubmitting(false);

      if (res.success) {
        router.replace("/home");
      } else {
        setErrorMessage(res.error || "Failed to sign in with Firebase.");
      }
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage("");
    setInfoMessage("");

    if (!email.trim()) {
      setErrorMessage("Enter your email address above to receive a password reset link.");
      return;
    }

    setIsSubmitting(true);
    const res = await resetPassword(email.trim());
    setIsSubmitting(false);

    if (res.success) {
      setInfoMessage(`Password reset link sent to ${email.trim()}. Please check your email.`);
    } else {
      setErrorMessage(res.error || "Could not send password reset email.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.canvasHome }}>
      <DecorativeBackdrop />
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
            {/* Header Brand */}
            <View className="flex-row items-center self-center mb-7">
              <View className="w-[58px] h-[58px] rounded-[20px] bg-white items-center justify-center shadow-sm">
                <Image source={require("../../assets/images/logo.png")} className="h-12 w-12" resizeMode="contain" />
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
              className="text-[17px] leading-6 text-[#71876F] mt-3 mb-6"
              style={{ fontFamily: FONTS.regular }}
            >
              {subtitle}
            </Text>

            {/* Error Banner */}
            {errorMessage ? (
              <View className="bg-[#FDEDEC] border border-[#F5B7B1] rounded-2xl p-4 mb-4">
                <Text
                  className="text-[#9A3C2D] text-[13px] leading-5"
                  style={{ fontFamily: FONTS.medium }}
                >
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Info / Success Banner */}
            {infoMessage ? (
              <View className="bg-[#EAFBF0] border border-[#A7F3D0] rounded-2xl p-4 mb-4">
                <Text
                  className="text-[#136A38] text-[13px] leading-5"
                  style={{ fontFamily: FONTS.medium }}
                >
                  {infoMessage}
                </Text>
              </View>
            ) : null}

            {/* Input Fields */}
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

            {/* Remember Me & Forgot Password */}
            {!isSignUp && (
              <View className="flex-row justify-end items-center my-2">
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  accessibilityRole="button"
                >
                  <Text
                    className="text-[14px] text-[#355126]"
                    style={{ fontFamily: FONTS.semiBold }}
                  >
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
              className={`h-[60px] rounded-full bg-[#1E421C] items-center justify-center flex-row mt-4 ${
                isSubmitting ? "opacity-75" : ""
              }`}
              accessibilityRole="button"
              accessibilityLabel={isSignUp ? "Sign up" : "Sign in"}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text
                    className="text-[17px] text-white font-bold tracking-wide"
                    style={{ fontFamily: FONTS.bold }}
                  >
                    {isSignUp ? "CREATE ACCOUNT" : "SIGN IN"}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={23}
                    color="#FFFFFF"
                    className="ml-3"
                  />
                </>
              )}
            </TouchableOpacity>

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

            {/* Switch Mode Footer */}
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
