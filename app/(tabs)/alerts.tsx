import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent, type ScrollView } from 'react-native';

import { AlertCard } from '@/components/AlertCard';
import { MetricCard } from '@/components/MetricCard';
import { EmptyState, Grid, PageHeader, Stack, StatusBadge } from '@/components/OperationsUI';
import { Panel } from '@/components/Panel';
import { Screen } from '@/components/Screen';
import { Palette, Radius } from '@/constants/Colors';
import { useMission } from '@/context/MissionContext';
import type { AlertHistoryStatus } from '@/types/mission';

type HistoryStatusFilter = 'all' | Exclude<AlertHistoryStatus, 'active'>;

const HISTORY_PAGE_SIZE = 5;

const historyStatusFilters: Array<{ label: string; value: HistoryStatusFilter }> = [
  { label: 'Todos', value: 'all' },
  { label: 'Inativos', value: 'inactive' },
  { label: 'Resolvidos', value: 'resolved' },
];

export default function AlertsScreen() {
  const { alertHistory, alerts, deleteAlertHistory, resolveAlert, resolveAlertHistory } = useMission();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const historyPanelYRef = useRef(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<HistoryStatusFilter>('all');
  const activeAlerts = alerts.filter((alert) => !alert.acknowledged);
  const visibleAlertHistory = alertHistory.filter((alert) => alert.status !== 'active');
  const filteredAlertHistory = visibleAlertHistory.filter((alert) => {
    return statusFilter === 'all' || alert.status === statusFilter;
  });
  const totalHistoryPages = Math.max(1, Math.ceil(filteredAlertHistory.length / HISTORY_PAGE_SIZE));
  const currentHistoryPage = Math.min(historyPage, totalHistoryPages);
  const pageStartIndex = (currentHistoryPage - 1) * HISTORY_PAGE_SIZE;
  const paginatedAlertHistory = filteredAlertHistory.slice(pageStartIndex, pageStartIndex + HISTORY_PAGE_SIZE);
  const rangeStart = filteredAlertHistory.length ? pageStartIndex + 1 : 0;
  const rangeEnd = Math.min(pageStartIndex + HISTORY_PAGE_SIZE, filteredAlertHistory.length);
  const criticalCount = activeAlerts.filter((alert) => alert.severity === 'critical').length;
  const warningCount = activeAlerts.filter((alert) => alert.severity === 'warning').length;
  const activeLabel = criticalCount ? `${criticalCount} critico(s)` : activeAlerts.length ? 'Monitorar' : 'Nominal';
  const activeColor = criticalCount ? Palette.red : activeAlerts.length ? Palette.yellow : Palette.green;

  useEffect(() => {
    if (historyPage > totalHistoryPages) {
      setHistoryPage(totalHistoryPages);
    }
  }, [historyPage, totalHistoryPages]);

  function selectStatusFilter(value: HistoryStatusFilter) {
    setStatusFilter(value);
    setHistoryPage(1);
  }

  function handleHistoryPanelLayout(event: LayoutChangeEvent) {
    historyPanelYRef.current = Math.max(0, event.nativeEvent.layout.y - 8);
  }

  function scrollToHistoryPanel() {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ animated: true, y: historyPanelYRef.current });
    });
  }

  function changeHistoryPage(nextPage: number) {
    if (nextPage === currentHistoryPage) {
      return;
    }

    setHistoryPage(nextPage);
    scrollToHistoryPanel();
  }

  return (
    <Screen scrollRef={scrollViewRef}>
      <PageHeader
        description="Quadro de eventos gerados por limiares operacionais, com criticidade, valor medido e faixa esperada."
        eyebrow="Event board"
        right={<StatusBadge color={activeColor} label={activeLabel} tone="solid" />}
        title="Alertas"
      />

      <Grid>
        <MetricCard color={Palette.red} label="Criticos" progress={Math.min(criticalCount * 35, 100)} value={criticalCount} />
        <MetricCard color={Palette.yellow} label="Atencao" progress={Math.min(warningCount * 25, 100)} value={warningCount} />
        <MetricCard color={activeColor} label="Total ativo" progress={Math.min(activeAlerts.length * 25, 100)} value={activeAlerts.length} />
        <MetricCard color={Palette.green} label="Historico" progress={Math.min(visibleAlertHistory.length * 12, 100)} value={visibleAlertHistory.length} />
      </Grid>

      <Panel title="Alertas acontecendo agora" caption="Eventos ativos do ciclo atual, separados do historico da missao.">
        {activeAlerts.length ? (
          <Stack>
            {activeAlerts.map((alert) => <AlertCard alert={alert} key={alert.id} onResolve={resolveAlert} />)}
          </Stack>
        ) : (
          <EmptyState
            description="Nenhum limite permanece aberto no ciclo atual. Continue acompanhando as proximas leituras."
            title="Sem alertas ativos"
          />
        )}
      </Panel>

      <View onLayout={handleHistoryPanelLayout}>
        <Panel title="Historico de alertas" caption="Alertas ativos ficam apenas no quadro atual; aqui entram registros inativos ou resolvidos.">
          {visibleAlertHistory.length ? (
            <Stack>
              <View style={styles.filtersPanel}>
                <FilterGroup
                  label="Status"
                  onChange={selectStatusFilter}
                  options={historyStatusFilters}
                  value={statusFilter}
                />
              </View>

              {filteredAlertHistory.length ? (
                <>
                  <View style={styles.historyMeta}>
                    <Text style={styles.historyMetaText}>Mostrando {rangeStart}-{rangeEnd} de {filteredAlertHistory.length}</Text>
                    <Text style={styles.historyPageText}>Pagina {currentHistoryPage}/{totalHistoryPages}</Text>
                  </View>

                  <Stack>
                    {paginatedAlertHistory.map((alert) => (
                      <AlertCard
                        alert={alert}
                        key={alert.historyId}
                        mode="history"
                        onDelete={deleteAlertHistory}
                        onResolveHistory={resolveAlertHistory}
                      />
                    ))}
                  </Stack>

                  {totalHistoryPages > 1 ? (
                    <View style={styles.paginationRow}>
                      <PaginationButton
                        disabled={currentHistoryPage <= 1}
                        label="Anterior"
                        onPress={() => changeHistoryPage(Math.max(1, currentHistoryPage - 1))}
                      />
                      <Text style={styles.paginationLabel}>{currentHistoryPage} de {totalHistoryPages}</Text>
                      <PaginationButton
                        disabled={currentHistoryPage >= totalHistoryPages}
                        label="Proxima"
                        onPress={() => changeHistoryPage(Math.min(totalHistoryPages, currentHistoryPage + 1))}
                      />
                    </View>
                  ) : null}
                </>
              ) : (
                <EmptyState
                  description="Nenhum registro combina com o status selecionado. Ajuste o filtro para ampliar a busca."
                  title="Sem resultados"
                />
              )}
            </Stack>
          ) : (
            <EmptyState
              description="Quando um alerta deixar de estar ativo ou for resolvido, ele aparecera aqui. Alertas ainda abertos permanecem apenas acima."
              title="Historico vazio"
            />
          )}
        </Panel>
      </View>

    </Screen>
  );
}

type FilterGroupProps<T extends string> = {
  label: string;
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  value: T;
};

function FilterGroup<T extends string>({ label, onChange, options, value }: FilterGroupProps<T>) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.filterRow}>
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              accessibilityLabel={`${label}: ${option.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [styles.filterChip, selected && styles.filterChipActive, pressed && styles.pressed]}>
              <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type PaginationButtonProps = {
  disabled: boolean;
  label: string;
  onPress: () => void;
};

function PaginationButton({ disabled, label, onPress }: PaginationButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.pageButton, pressed && !disabled && styles.pressed, disabled && styles.pageButtonDisabled]}>
      <Text style={[styles.pageButtonText, disabled && styles.pageButtonTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filtersPanel: {
    backgroundColor: Palette.cardMuted,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 14,
    padding: 14,
  },
  filterGroup: {
    gap: 9,
  },
  filterLabel: {
    color: Palette.muted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: Palette.panelRaised,
    borderColor: Palette.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 13,
  },
  filterChipActive: {
    backgroundColor: Palette.accent,
    borderColor: Palette.accent,
  },
  filterChipText: {
    color: Palette.text,
    fontSize: 12,
    fontWeight: '900',
  },
  filterChipTextActive: {
    color: Palette.ink,
  },
  historyMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  historyMetaText: {
    color: Palette.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  historyPageText: {
    color: Palette.accent,
    fontSize: 12,
    fontWeight: '900',
  },
  paginationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  pageButton: {
    alignItems: 'center',
    backgroundColor: Palette.panelRaised,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  pageButtonDisabled: {
    opacity: 0.45,
  },
  pageButtonText: {
    color: Palette.text,
    fontSize: 13,
    fontWeight: '900',
  },
  pageButtonTextDisabled: {
    color: Palette.subtle,
  },
  paginationLabel: {
    color: Palette.muted,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    minWidth: 58,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.76,
  },
});
