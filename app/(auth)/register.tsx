import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedStarfield } from '@/components/AnimatedStarfield';
import { ActionButton, StatusBadge } from '@/components/OperationsUI';
import { Panel } from '@/components/Panel';
import { Palette, Radius } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';

type RegisterErrors = Partial<Record<'email' | 'form' | 'name' | 'password', string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(name: string, email: string, password: string) {
  const errors: RegisterErrors = {};
  const trimmedEmail = email.trim();

  if (name.trim().length < 2) {
    errors.name = 'Informe o nome do operador.';
  }

  if (!trimmedEmail) {
    errors.email = 'Informe o email do operador.';
  } else if (!emailPattern.test(trimmedEmail)) {
    errors.email = 'Use um email valido, como operador@missao.com.';
  } else if (trimmedEmail.length > 120) {
    errors.email = 'Use um email com ate 120 caracteres.';
  }

  if (!password) {
    errors.password = 'Informe uma senha.';
  } else if (password.length < 8) {
    errors.password = 'Use pelo menos 8 caracteres.';
  } else if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Inclua letra maiuscula, minuscula e numero.';
  }

  return errors;
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const nextErrors = validate(name, email, password);

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      await register(name, email, password);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : 'Nao foi possivel criar o cadastro.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <View style={styles.heroCard}>
        <StatusBadge color={Palette.green} label="Novo operador" tone="solid" />
        <Text style={styles.title}>Criar acesso</Text>
        <Text style={styles.description}>Seu nome sera usado nos registros de resolucao dos alertas da missao.</Text>
      </View>

      <Panel title="Cadastro" caption="O app cria uma missao padrao para cada operador apos o primeiro acesso.">
        <AuthField
          error={errors.name}
          label="Nome do usuario"
          onChangeText={(value) => {
            setName(value);
            setErrors((current) => ({ ...current, name: undefined, form: undefined }));
          }}
          textContentType="name"
          value={name}
        />
        <AuthField
          autoCapitalize="none"
          error={errors.email}
          keyboardType="email-address"
          label="Email"
          onChangeText={(value) => {
            setEmail(value);
            setErrors((current) => ({ ...current, email: undefined, form: undefined }));
          }}
          textContentType="emailAddress"
          value={email}
        />
        <AuthField
          error={errors.password}
          helper="Minimo 8 caracteres, com maiuscula, minuscula e numero."
          label="Senha"
          onChangeText={(value) => {
            setPassword(value);
            setErrors((current) => ({ ...current, password: undefined, form: undefined }));
          }}
          secureTextEntry
          textContentType="password"
          value={password}
        />
        {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}
        <ActionButton disabled={submitting} onPress={submit}>
          {submitting ? 'Criando...' : 'Criar cadastro'}
        </ActionButton>
      </Panel>

      <Text style={styles.switchText}>
        Ja possui acesso? <Link href={'/login' as never} style={styles.link}>Entrar</Link>
      </Text>
    </AuthShell>
  );
}

type AuthFieldProps = {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  helper?: string;
  keyboardType?: 'default' | 'email-address';
  label: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  textContentType?: 'emailAddress' | 'password' | 'name';
  value: string;
};

function AuthField({ autoCapitalize = 'sentences', error, helper, keyboardType = 'default', label, onChangeText, secureTextEntry, textContentType, value }: AuthFieldProps) {
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
      {!error && helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <AnimatedStarfield />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.background,
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    alignSelf: 'center',
    gap: 18,
    justifyContent: 'center',
    maxWidth: 620,
    minHeight: '100%',
    padding: 20,
    width: '100%',
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
    fontWeight: '900',
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
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
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
  helper: {
    color: Palette.subtle,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  formError: {
    backgroundColor: 'rgba(255, 88, 118, 0.12)',
    borderColor: 'rgba(255, 88, 118, 0.42)',
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Palette.red,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
    marginBottom: 14,
    padding: 12,
  },
  switchText: {
    color: Palette.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  link: {
    color: Palette.accent,
    fontWeight: '900',
  },
});
