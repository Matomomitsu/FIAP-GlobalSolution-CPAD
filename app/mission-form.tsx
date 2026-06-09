import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton, PageHeader, StatusBadge } from '@/components/OperationsUI';
import { Panel } from '@/components/Panel';
import { Screen } from '@/components/Screen';
import { Palette, Radius } from '@/constants/Colors';
import { useMission } from '@/context/MissionContext';
import type { AlertThresholds, MissionProfile } from '@/types/mission';

type FormState = {
  batteryMin: string;
  crew: string;
  latencyMax: string;
  name: string;
  objective: string;
  orbit: string;
  radiationMax: string;
  signalMin: string;
  stabilityMin: string;
  temperatureMax: string;
};

const emptyProfile: MissionProfile = {
  crew: '',
  name: '',
  objective: '',
  orbit: '',
};

const numberFields: Array<keyof AlertThresholds> = [
  'temperatureMax',
  'radiationMax',
  'batteryMin',
  'signalMin',
  'latencyMax',
  'stabilityMin',
];

function toFormState(profile: MissionProfile, thresholds: AlertThresholds): FormState {
  return {
    batteryMin: String(thresholds.batteryMin),
    crew: profile.crew,
    latencyMax: String(thresholds.latencyMax),
    name: profile.name,
    objective: profile.objective,
    orbit: profile.orbit,
    radiationMax: String(thresholds.radiationMax),
    signalMin: String(thresholds.signalMin),
    stabilityMin: String(thresholds.stabilityMin),
    temperatureMax: String(thresholds.temperatureMax),
  };
}

function numberFromField(value: string) {
  return Number(value.replace(',', '.'));
}

export default function MissionFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = params.mode === 'create' ? 'create' : 'edit';
  const { createMission, profile, thresholds, updateProfile, updateThresholds } = useMission();
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [form, setForm] = useState<FormState>(() => toFormState(mode === 'create' ? emptyProfile : profile, thresholds));
  const [savedMessage, setSavedMessage] = useState('');
  const isCreate = mode === 'create';

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSavedMessage('');
  }

  function validate() {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (form.name.trim().length < 3) {
      nextErrors.name = 'Informe um nome com pelo menos 3 caracteres.';
    }

    if (form.objective.trim().length < 12) {
      nextErrors.objective = 'Descreva o objetivo da missao.';
    }

    numberFields.forEach((field) => {
      const value = numberFromField(form[field]);

      if (!Number.isFinite(value) || value <= 0) {
        nextErrors[field] = 'Use um numero positivo.';
      }
    });

    if (numberFromField(form.batteryMin) > 100) {
      nextErrors.batteryMin = 'Percentuais devem ficar entre 1 e 100.';
    }

    if (numberFromField(form.signalMin) > 100) {
      nextErrors.signalMin = 'Percentuais devem ficar entre 1 e 100.';
    }

    if (numberFromField(form.stabilityMin) > 100) {
      nextErrors.stabilityMin = 'Percentuais devem ficar entre 1 e 100.';
    }

    return nextErrors;
  }

  function buildThresholds(): AlertThresholds {
    return {
      batteryMin: numberFromField(form.batteryMin),
      latencyMax: numberFromField(form.latencyMax),
      radiationMax: numberFromField(form.radiationMax),
      signalMin: numberFromField(form.signalMin),
      stabilityMin: numberFromField(form.stabilityMin),
      temperatureMax: numberFromField(form.temperatureMax),
    };
  }

  function buildProfile(): MissionProfile {
    return {
      crew: form.crew.trim() || 'Equipe nao definida',
      name: form.name.trim(),
      objective: form.objective.trim(),
      orbit: form.orbit.trim() || 'Orbita nao definida',
    };
  }

  function submit() {
    const nextErrors = validate();

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const nextProfile = buildProfile();
    const nextThresholds = buildThresholds();

    if (isCreate) {
      createMission(nextProfile, nextThresholds);
      router.replace('/settings' as never);
      return;
    }

    updateProfile(nextProfile);
    updateThresholds(nextThresholds);
    setSavedMessage('Missao atualizada.');
    router.replace('/settings' as never);
  }

  return (
    <Screen>
      <PageHeader
        description={isCreate ? 'Defina identidade, tripulacao e limites antes de ativar uma nova missao.' : 'Edite identidade e limites da missao selecionada em um fluxo focado.'}
        eyebrow={isCreate ? 'Nova missao' : 'Editar missao'}
        right={<StatusBadge color={isCreate ? Palette.green : Palette.accent} label={isCreate ? 'Criar' : 'Editar'} tone="solid" />}
        title={isCreate ? 'Criar missao' : 'Editar missao atual'}
      />

      <Panel title="Identidade da missao" caption="Dados usados no centro preditivo e no contexto operacional.">
        <Field error={errors.name} label="Nome da missao" onChangeText={(value) => updateField('name', value)} value={form.name} />
        <View style={styles.row}>
          <Field label="Orbita" onChangeText={(value) => updateField('orbit', value)} value={form.orbit} />
          <Field label="Tripulacao / equipe" onChangeText={(value) => updateField('crew', value)} value={form.crew} />
        </View>
        <Field
          error={errors.objective}
          label="Objetivo"
          multiline
          onChangeText={(value) => updateField('objective', value)}
          value={form.objective}
        />
      </Panel>

      <Panel title="Limites de alerta" caption="Ao violar uma faixa, o app recalcula risco e registra eventos na aba Alertas.">
        <View style={styles.row}>
          <Field error={errors.temperatureMax} keyboardType="decimal-pad" label="Temp. max (C)" onChangeText={(value) => updateField('temperatureMax', value)} value={form.temperatureMax} />
          <Field error={errors.radiationMax} keyboardType="decimal-pad" label="Radiacao max" onChangeText={(value) => updateField('radiationMax', value)} value={form.radiationMax} />
        </View>
        <View style={styles.row}>
          <Field error={errors.batteryMin} keyboardType="number-pad" label="Bateria min (%)" onChangeText={(value) => updateField('batteryMin', value)} value={form.batteryMin} />
          <Field error={errors.signalMin} keyboardType="number-pad" label="Sinal min (%)" onChangeText={(value) => updateField('signalMin', value)} value={form.signalMin} />
        </View>
        <View style={styles.row}>
          <Field error={errors.latencyMax} keyboardType="number-pad" label="Latencia max" onChangeText={(value) => updateField('latencyMax', value)} value={form.latencyMax} />
          <Field error={errors.stabilityMin} keyboardType="number-pad" label="Estabilidade min" onChangeText={(value) => updateField('stabilityMin', value)} value={form.stabilityMin} />
        </View>
      </Panel>

      {savedMessage ? <Text style={styles.saved}>{savedMessage}</Text> : null}
      <View style={styles.actions}>
        <ActionButton onPress={submit}>{isCreate ? 'Criar e ativar missao' : 'Salvar missao'}</ActionButton>
        <ActionButton onPress={() => router.replace('/settings' as never)} variant="secondary">Voltar para Config</ActionButton>
      </View>
    </Screen>
  );
}

type FieldProps = {
  error?: string;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  value: string;
};

function Field({ error, keyboardType = 'default', label, multiline, onChangeText, value }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholderTextColor={Palette.subtle}
        selectionColor={Palette.accent}
        style={[styles.input, multiline && styles.textArea, error && styles.inputError]}
        value={value}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  field: {
    flex: 1,
    marginBottom: 14,
    minWidth: 148,
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
  textArea: {
    minHeight: 112,
    textAlignVertical: 'top',
  },
  error: {
    color: Palette.red,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  saved: {
    backgroundColor: 'rgba(83, 247, 178, 0.12)',
    borderColor: 'rgba(83, 247, 178, 0.32)',
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Palette.green,
    fontSize: 13,
    fontWeight: '900',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  actions: {
    gap: 12,
  },
});
