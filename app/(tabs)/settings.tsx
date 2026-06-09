import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton, DataRow, PageHeader, StatusBadge } from '@/components/OperationsUI';
import { Panel } from '@/components/Panel';
import { Screen } from '@/components/Screen';
import { Palette, Radius } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useMission } from '@/context/MissionContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const {
    activeMission,
    activeMissionId,
    leaveMission,
    missions,
    profile,
    resetSimulation,
    selectMission,
  } = useMission();

  function openMissionForm(mode: 'create' | 'edit') {
    router.push(`/mission-form?mode=${mode}` as never);
  }

  return (
    <Screen>
      <PageHeader
        description="Acesse dados do operador e gerencie missoes sem concentrar todos os formularios em uma unica tela."
        eyebrow="Mission setup"
        right={<StatusBadge color={Palette.accent} label="Config" />}
        title="Configuracoes"
      />

      <Panel title="Operador" caption="Conta usada para identificar resolucoes no historico de alertas.">
        <View style={styles.stack}>
          <DataRow label="Nome" value={currentUser?.name ?? 'Operador'} />
          <DataRow label="Email" value={currentUser?.email ?? 'Nao informado'} />
          <ActionButton onPress={logout} variant="secondary">Sair da conta</ActionButton>
        </View>
      </Panel>

      <Panel title="Missao atual" caption="Resumo rapido da missao selecionada. Edite os detalhes em uma tela dedicada.">
        <View style={styles.currentMissionCard}>
          <View style={styles.missionHeader}>
            <View style={styles.missionCopy}>
              <Text style={styles.missionTitle}>{profile.name}</Text>
              <Text style={styles.missionMeta}>{profile.orbit} | {profile.crew}</Text>
            </View>
            <StatusBadge color={Palette.accent} label="Ativa" tone="solid" />
          </View>
          <Text style={styles.objective}>{profile.objective}</Text>
        </View>

        <View style={styles.actions}>
          <ActionButton onPress={() => openMissionForm('edit')}>Editar missao atual</ActionButton>
          <ActionButton onPress={resetSimulation} variant="danger">Reiniciar simulacao</ActionButton>
        </View>
      </Panel>

      <Panel title="Missoes salvas" caption="Crie uma nova missao em uma tela separada ou selecione uma missao existente.">
        <ActionButton onPress={() => openMissionForm('create')}>Criar nova missao</ActionButton>

        <View style={styles.missionList}>
          {missions.map((mission) => {
            const isActive = mission.id === activeMissionId;
            const visibleHistoryCount = mission.alertHistory.filter((alert) => alert.status !== 'active').length;

            return (
              <View key={mission.id} style={[styles.missionCard, isActive && styles.missionCardActive]}>
                <View style={styles.missionHeader}>
                  <View style={styles.missionCopy}>
                    <Text style={styles.missionTitle}>{mission.profile.name}</Text>
                    <Text style={styles.missionMeta}>{mission.profile.orbit} | {visibleHistoryCount} registro(s)</Text>
                  </View>
                  {isActive ? <StatusBadge color={Palette.accent} label="Ativa" tone="solid" /> : null}
                </View>
                <View style={styles.missionActions}>
                  <ActionButton disabled={isActive} onPress={() => selectMission(mission.id)} variant="secondary">
                    {isActive ? 'Selecionada' : 'Selecionar'}
                  </ActionButton>
                  <ActionButton onPress={() => leaveMission(mission.id)} variant="danger">Sair da missao</ActionButton>
                </View>
              </View>
            );
          })}
        </View>
      </Panel>

      {!activeMission ? (
        <Panel title="Sem missao ativa" caption="Crie uma nova missao para liberar edicao de parametros.">
          <ActionButton onPress={() => openMissionForm('create')}>Criar missao</ActionButton>
        </Panel>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  currentMissionCard: {
    backgroundColor: Palette.cardMuted,
    borderColor: Palette.borderStrong,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  objective: {
    color: Palette.textSoft,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  actions: {
    gap: 12,
  },
  missionList: {
    gap: 12,
    marginTop: 14,
  },
  missionCard: {
    backgroundColor: Palette.cardMuted,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  missionCardActive: {
    borderColor: Palette.accent,
  },
  missionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  missionCopy: {
    flex: 1,
  },
  missionTitle: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 21,
  },
  missionMeta: {
    color: Palette.muted,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 5,
  },
  missionActions: {
    gap: 10,
  },
});
