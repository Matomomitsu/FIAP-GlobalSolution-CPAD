import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedStarfield } from "@/components/AnimatedStarfield";
import { ActionButton, StatusBadge } from "@/components/OperationsUI";
import { Panel } from "@/components/Panel";
import { Palette, Radius } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";

type LoginErrors = Partial<Record<"email" | "password" | "form", string>>;

function validate(email: string, password: string) {
    const errors: LoginErrors = {};

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
        errors.email = "Informe um email valido.";
    }

    if (password.length < 6) {
        errors.password = "A senha precisa ter pelo menos 6 caracteres.";
    }

    return errors;
}

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<LoginErrors>({});
    const [submitting, setSubmitting] = useState(false);

    async function submit() {
        const nextErrors = validate(email, password);

        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            return;
        }

        setSubmitting(true);
        setErrors({});

        try {
            await login(email, password);
        } catch (error) {
            setErrors({
                form:
                    error instanceof Error
                        ? error.message
                        : "Nao foi possivel entrar.",
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <AuthShell>
            <View style={styles.heroCard}>
                <StatusBadge
                    color={Palette.accent}
                    label="Acesso local"
                    tone="solid"
                />
                <Text style={styles.title}>Entrar no console</Text>
                <Text style={styles.description}>
                    Acesse suas missoes, telemetria e historico operacional.
                </Text>
            </View>

            <Panel
                title="Credenciais"
                caption="Use o email e a senha cadastrados para carregar suas missoes."
            >
                <AuthField
                    autoCapitalize="none"
                    error={errors.email}
                    keyboardType="email-address"
                    label="Email"
                    onChangeText={(value) => {
                        setEmail(value);
                        setErrors((current) => ({
                            ...current,
                            email: undefined,
                            form: undefined,
                        }));
                    }}
                    textContentType="emailAddress"
                    value={email}
                />
                <AuthField
                    error={errors.password}
                    label="Senha"
                    onChangeText={(value) => {
                        setPassword(value);
                        setErrors((current) => ({
                            ...current,
                            password: undefined,
                            form: undefined,
                        }));
                    }}
                    secureTextEntry
                    textContentType="password"
                    value={password}
                />
                {errors.form ? (
                    <Text style={styles.formError}>{errors.form}</Text>
                ) : null}
                <ActionButton disabled={submitting} onPress={submit}>
                    {submitting ? "Entrando..." : "Entrar"}
                </ActionButton>
            </Panel>

            <Text style={styles.switchText}>
                Ainda nao tem operador?{" "}
                <Link href={"/register" as never} style={styles.link}>
                    Criar cadastro
                </Link>
            </Text>
        </AuthShell>
    );
}

type AuthFieldProps = {
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    error?: string;
    keyboardType?: "default" | "email-address";
    label: string;
    onChangeText: (value: string) => void;
    secureTextEntry?: boolean;
    textContentType?: "emailAddress" | "password" | "name";
    value: string;
};

function AuthField({
    autoCapitalize = "sentences",
    error,
    keyboardType = "default",
    label,
    onChangeText,
    secureTextEntry,
    textContentType,
    value,
}: AuthFieldProps) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                accessibilityLabel={label}
                autoCapitalize={autoCapitalize}
                keyboardType={keyboardType}
                onChangeText={onChangeText}
                placeholderTextColor={Palette.subtle}
                secureTextEntry={secureTextEntry}
                selectionColor={Palette.accent}
                style={[styles.input, error && styles.inputError]}
                textContentType={textContentType}
                value={value}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

function AuthShell({ children }: { children: ReactNode }) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="light" />
            <AnimatedStarfield />
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {children}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: Palette.background,
        flex: 1,
        overflow: "hidden",
    },
    content: {
        alignSelf: "center",
        gap: 18,
        justifyContent: "center",
        maxWidth: 620,
        minHeight: "100%",
        padding: 20,
        width: "100%",
        zIndex: 1,
    },
    heroCard: {
        backgroundColor: Palette.panel,
        borderColor: Palette.borderStrong,
        borderRadius: Radius.xxl,
        borderWidth: 1,
        gap: 14,
        padding: 20,
    },
    title: {
        color: Palette.text,
        fontSize: 34,
        fontWeight: "900",
        letterSpacing: -1,
        lineHeight: 38,
    },
    description: {
        color: Palette.muted,
        fontSize: 15,
        lineHeight: 23,
    },
    field: {
        marginBottom: 14,
    },
    label: {
        color: Palette.muted,
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 0.8,
        marginBottom: 8,
        textTransform: "uppercase",
    },
    input: {
        backgroundColor: Palette.cardMuted,
        borderColor: Palette.border,
        borderRadius: Radius.md,
        borderWidth: 1,
        color: Palette.text,
        fontSize: 16,
        minHeight: 52,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    inputError: {
        borderColor: Palette.red,
    },
    error: {
        color: Palette.red,
        fontSize: 12,
        lineHeight: 17,
        marginTop: 6,
    },
    formError: {
        backgroundColor: "rgba(255, 88, 118, 0.12)",
        borderColor: "rgba(255, 88, 118, 0.42)",
        borderRadius: Radius.md,
        borderWidth: 1,
        color: Palette.red,
        fontSize: 13,
        fontWeight: "800",
        lineHeight: 19,
        marginBottom: 14,
        padding: 12,
    },
    switchText: {
        color: Palette.muted,
        fontSize: 14,
        lineHeight: 21,
        textAlign: "center",
    },
    link: {
        color: Palette.accent,
        fontWeight: "900",
    },
});
