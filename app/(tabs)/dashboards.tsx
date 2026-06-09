import { MetricCard } from '@/components/MetricCard';
import { DataRow, Grid, PageHeader, Readout, Stack, StatusBadge } from '@/components/OperationsUI';
import { Panel } from '@/components/Panel';
import { Screen } from '@/components/Screen';
import { TrendChart } from '@/components/TrendChart';
import { Palette } from '@/constants/Colors';
import { useMission } from '@/context/MissionContext';

export default function DashboardsScreen() {
  const { history, risk, telemetry } = useMission();
  const energyBalance = telemetry.solarInput - telemetry.powerDraw;
  const linkHealth = Math.max(0, telemetry.signal - telemetry.packetLoss * 2);

  return (
    <Screen>
      <PageHeader
        description="Matriz de telemetria por subsistema com historico recente, variacao e leitura atual sempre visivel."
        eyebrow="Telemetria viva"
        right={<StatusBadge color={risk.color} label={risk.label} />}
        title="Dados da missao"
      />

      <Grid>
        <Readout accent={energyBalance < 0 ? Palette.yellow : Palette.green} label="Energia liquida" suffix="kW" value={`${energyBalance >= 0 ? '+' : ''}${energyBalance.toFixed(1)}`} />
        <Readout accent={Palette.cyan} label="Saude do link" suffix="pts" value={linkHealth.toFixed(1)} />
        <Readout accent={Palette.indigo} label="Estabilidade" suffix="%" value={telemetry.orbitalStability} />
      </Grid>

      <Panel title="Power loop" caption="Reserva, captacao solar, consumo e tendencia energetica.">
        <Grid>
          <MetricCard color={Palette.green} label="Bateria" progress={telemetry.battery} unit="%" value={telemetry.battery} />
          <MetricCard color={Palette.accent} label="Entrada solar" progress={telemetry.solarInput} unit="kW" value={telemetry.solarInput} />
          <MetricCard color={Palette.red} label="Consumo" progress={telemetry.powerDraw} unit="kW" value={telemetry.powerDraw} />
        </Grid>
        <DataRow
          detail="Entrada solar menos consumo instantaneo."
          label="Balanco do ciclo"
          value={`${energyBalance >= 0 ? '+' : ''}${energyBalance.toFixed(1)} kW`}
          valueColor={energyBalance < 0 ? Palette.yellow : Palette.green}
        />
        <TrendChart color={Palette.green} data={history} label="Historico de bateria" metric="battery" unit="%" />
      </Panel>

      <Panel title="Ambiente pressurizado" caption="Temperatura e radiacao simuladas para seguranca dos modulos.">
        <Grid>
          <MetricCard color={Palette.yellow} label="Temperatura" progress={(telemetry.temperature / 58) * 100} unit="C" value={telemetry.temperature} />
          <MetricCard color={Palette.purple} label="Radiacao" progress={(telemetry.radiation / 2.4) * 100} unit="mSv/h" value={telemetry.radiation} />
        </Grid>
        <TrendChart color={Palette.yellow} data={history} label="Historico de temperatura" metric="temperature" unit="C" />
      </Panel>

      <Panel title="Comunicacao e orbita" caption="Enlace de telemetria, perdas, latencia e estabilidade de trajetoria.">
        <Grid>
          <MetricCard color={Palette.cyan} label="Sinal" progress={telemetry.signal} unit="%" value={telemetry.signal} />
          <MetricCard color={Palette.yellow} label="Latencia" progress={(telemetry.latency / 720) * 100} unit="ms" value={telemetry.latency} />
          <MetricCard color={Palette.red} label="Perda pacotes" progress={(telemetry.packetLoss / 12) * 100} unit="%" value={telemetry.packetLoss} />
          <MetricCard color={Palette.indigo} label="Estabilidade" progress={telemetry.orbitalStability} unit="%" value={telemetry.orbitalStability} />
        </Grid>
        <Stack>
          <DataRow detail="Sinal compensado pela perda de pacotes." label="Saude consolidada" value={`${linkHealth.toFixed(1)} pts`} valueColor={linkHealth < 70 ? Palette.yellow : Palette.green} />
        </Stack>
        <TrendChart color={Palette.cyan} data={history} label="Historico de sinal" metric="signal" unit="%" />
      </Panel>
    </Screen>
  );
}
