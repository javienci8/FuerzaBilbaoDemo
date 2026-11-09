import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

type Client = {
  id: string;
  name: string;
  weight: string;
};

type SavedExercise = {
  id: string;
  clientName: string;
  clientId: string;
  mode: string;
  detail: string;
  weight: string;
  time: string;
};

const CLIENTS: Client[] = [
  { id: "FB001", name: "Álvaro Martín", weight: "45" },
  { id: "FB002", name: "Laura Gómez", weight: "25" },
  { id: "FB003", name: "Rodrigo García", weight: "55" },
  { id: "FB004", name: "María Fernández", weight: "30" },
  { id: "FB005", name: "David López", weight: "40" },
];

const NAVY = "#101D32";
const GREEN = "#079968";
const TURQUOISE = "#20B9B9";

type Mode = "DINÁMICO" | "ISOMÉTRICO";

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remaining
  ).padStart(2, "0")}`;
}

export default function Entrenamientos() {
  const { width } = useWindowDimensions();
  const compact = width < 1050;
  const narrow = width < 390;

  const [selectedIds, setSelectedIds] = useState<string[]>(["FB001"]);
  const [activeClientId, setActiveClientId] = useState("FB001");
  const [weights, setWeights] = useState<Record<string, string>>({
    FB001: "45",
    FB002: "25",
    FB003: "55",
    FB004: "30",
    FB005: "40",
  });

  const [mode, setMode] = useState<Mode>("DINÁMICO");
  const [repetitions, setRepetitions] = useState(9);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState<SavedExercise[]>([]);

  const selectedClients = useMemo(
    () => CLIENTS.filter((client) => selectedIds.includes(client.id)),
    [selectedIds]
  );

  const activeClient =
    selectedClients.find((client) => client.id === activeClientId) ??
    selectedClients[0];

  const totalSeconds = mode === "DINÁMICO" ? repetitions * 16 : 60;

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setElapsed((current) => Math.min(current + 1, totalSeconds));
    }, 1000);

    return () => clearInterval(interval);
  }, [running, totalSeconds]);

  useEffect(() => {
    if (elapsed >= totalSeconds && running) {
      setRunning(false);
    }
  }, [elapsed, totalSeconds, running]);

  const progress =
    totalSeconds > 0
      ? Math.min((elapsed / totalSeconds) * 100, 100)
      : 0;

  let phaseTitle = "PREPARADO";
  let phaseDescription = "Pulsa iniciar para comenzar";
  let phaseRemaining = mode === "DINÁMICO" ? 8 : 20;
  let currentRepetition = mode === "DINÁMICO" ? 1 : 0;
  let activeIsoStage = 0;

  if (elapsed >= totalSeconds) {
    phaseTitle = "ENTRENAMIENTO COMPLETADO";
    phaseDescription = "Has terminado el protocolo";
    phaseRemaining = 0;
    currentRepetition = repetitions;
    activeIsoStage = 2;
  } else if (mode === "DINÁMICO") {
    const phaseSecond = elapsed % 16;
    currentRepetition = Math.floor(elapsed / 16) + 1;

    if (phaseSecond < 8) {
      phaseTitle = "FASE CONCÉNTRICA";
      phaseDescription = "Realiza el movimiento de subida";
      phaseRemaining = 8 - phaseSecond;
    } else {
      phaseTitle = "FASE EXCÉNTRICA";
      phaseDescription = "Controla el movimiento de bajada";
      phaseRemaining = 16 - phaseSecond;
    }
  } else {
    activeIsoStage = elapsed < 20 ? 0 : elapsed < 40 ? 1 : 2;
    const stages = [
      { title: "ISOMÉTRICO · 50%", description: "Mantén la posición" },
      { title: "ISOMÉTRICO · 80%", description: "Aumenta la intensidad" },
      { title: "ISOMÉTRICO · 100%", description: "Máxima intensidad" },
    ];

    phaseTitle = stages[activeIsoStage].title;
    phaseDescription = stages[activeIsoStage].description;
    phaseRemaining = (activeIsoStage + 1) * 20 - elapsed;
  }

  const isUpPhase = mode === "DINÁMICO" && elapsed % 16 < 8;
  const isTimerComplete = elapsed >= totalSeconds;

  function toggleClient(client: Client) {
    const isSelected = selectedIds.includes(client.id);

    if (isSelected) {
      if (selectedIds.length === 1) {
        setNotice("Debe haber al menos un cliente seleccionado.");
        return;
      }

      const nextIds = selectedIds.filter((id) => id !== client.id);
      setSelectedIds(nextIds);

      if (activeClientId === client.id) {
        setActiveClientId(nextIds[0]);
      }

      setNotice("");
      return;
    }

    if (selectedIds.length >= 3) {
      setNotice("Solo se permiten 3 clientes por máquina.");
      return;
    }

    setSelectedIds([...selectedIds, client.id]);
    setActiveClientId(client.id);
    setNotice("");
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setRunning(false);
    setElapsed(0);
    setNotice("");
  }

  function changeRepetitions(amount: number) {
    setRepetitions((current) =>
      Math.min(30, Math.max(1, current + amount))
    );
    setRunning(false);
    setElapsed(0);
  }

  function startTimer() {
    if (elapsed >= totalSeconds) {
      setElapsed(0);
    }
    setRunning(true);
    setNotice("");
  }

  function pauseTimer() {
    setRunning(false);
  }

  function resetTimer() {
    setRunning(false);
    setElapsed(0);
    setNotice("");
  }

  function saveExercise() {
    if (!activeClient) {
      setNotice("Selecciona un cliente.");
      return;
    }

    if (elapsed === 0) {
      setNotice("Inicia el ejercicio antes de guardarlo.");
      return;
    }

    const detail =
      mode === "DINÁMICO"
        ? `${repetitions} repeticiones · 8 s concéntrica / 8 s excéntrica`
        : "20 s al 50% · 20 s al 80% · 20 s al 100%";

    const record: SavedExercise = {
      id: `${Date.now()}`,
      clientName: activeClient.name,
      clientId: activeClient.id,
      mode,
      detail,
      weight: weights[activeClient.id] || "0",
      time: new Date().toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setHistory((current) => [record, ...current]);
    setNotice(`Ejercicio guardado para ${activeClient.name}.`);
  }

  function updateWeight(clientId: string, value: string) {
    setWeights((current) => ({
      ...current,
      [clientId]: value.replace(",", ".").replace(/[^0-9.]/g, ""),
    }));
  }

  function ClientSelector({ client }: { client: Client }) {
    const isSelected = selectedIds.includes(client.id);
    const isActive = activeClientId === client.id;

    return (
      <Pressable
        onPress={() => toggleClient(client)}
        style={[
          styles.clientCard,
          isSelected && styles.clientCardSelected,
          isActive && styles.clientCardActive,
        ]}
      >
        <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
          <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
            {client.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </Text>
        </View>

        <View style={styles.clientInfo}>
          <Text style={styles.clientName} numberOfLines={1}>
            {client.name}
          </Text>
          <Text style={styles.clientId}>{client.id}</Text>
        </View>

        <View style={[styles.selectionMark, isSelected && styles.selectionMarkActive]}>
          <Text style={styles.selectionMarkText}>
            {isSelected ? "✓" : "+"}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.page, width < 480 && styles.pageMobile]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeader}>
        <View style={styles.headingGroup}>
          <Text style={styles.eyebrow}>CONTROL DE MÁQUINA</Text>
          <Text style={styles.pageTitle}>Entrenamientos</Text>
          <Text style={styles.pageSubtitle}>
            Gestiona los clientes y controla cada ejercicio.
          </Text>
        </View>

        <View style={styles.machineStatus}>
          <View style={styles.statusDot} />
          <View>
            <Text style={styles.machineName}>MÁQUINA 01</Text>
            <Text style={styles.machineOnline}>Sistema preparado</Text>
          </View>
        </View>
      </View>

      <View style={[styles.mainLayout, compact && styles.mainLayoutCompact]}>
        {/* COLUMNA DE CLIENTES */}
        <View style={[styles.leftColumn, compact && styles.fullColumn]}>
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelTitle}>Clientes en máquina</Text>
                <Text style={styles.panelSubtitle}>
                  Selecciona hasta 3 personas
                </Text>
              </View>

              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  {selectedIds.length}/3
                </Text>
              </View>
            </View>

            <View style={styles.clientList}>
              {CLIENTS.map((client) => (
                <ClientSelector key={client.id} client={client} />
              ))}
            </View>

            {notice ? (
              <Text style={styles.notice}>{notice}</Text>
            ) : null}
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Clientes seleccionados</Text>
            <Text style={styles.panelSubtitle}>
              Elige quién está realizando el ejercicio ahora.
            </Text>

            {selectedClients.map((client) => {
              const active = activeClientId === client.id;

              return (
                <Pressable
                  key={client.id}
                  onPress={() => setActiveClientId(client.id)}
                  style={[
                    styles.activeClientRow,
                    active && styles.activeClientRowSelected,
                  ]}
                >
                  <View style={styles.activeClientInfo}>
                    <Text style={styles.activeClientName}>
                      {client.name}
                    </Text>
                    <Text style={styles.clientId}>{client.id}</Text>
                  </View>

                  <Text style={active ? styles.activeLabel : styles.selectLabel}>
                    {active ? "ENTRENANDO" : "SELECCIONAR"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* COLUMNA DE ENTRENAMIENTO */}
        <View style={[styles.rightColumn, compact && styles.fullColumn]}>
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelTitle}>Configuración del ejercicio</Text>
                <Text style={styles.panelSubtitle}>
                  Define el protocolo de entrenamiento.
                </Text>
              </View>
              <View style={styles.machineTag}>
                <Text style={styles.machineTagText}>MÁQUINA 01</Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>TIPO DE ENTRENAMIENTO</Text>

            <View style={styles.modeSelector}>
              <Pressable
                onPress={() => changeMode("DINÁMICO")}
                style={[
                  styles.modeButton,
                  mode === "DINÁMICO" && styles.modeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeButtonTitle,
                    mode === "DINÁMICO" && styles.modeButtonTitleActive,
                  ]}
                >
                  DINÁMICO
                </Text>
                <Text
                  style={[
                    styles.modeButtonDescription,
                    mode === "DINÁMICO" && styles.modeButtonDescriptionActive,
                  ]}
                >
                  8 s subida + 8 s bajada
                </Text>
              </Pressable>

              <Pressable
                onPress={() => changeMode("ISOMÉTRICO")}
                style={[
                  styles.modeButton,
                  mode === "ISOMÉTRICO" && styles.modeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeButtonTitle,
                    mode === "ISOMÉTRICO" && styles.modeButtonTitleActive,
                  ]}
                >
                  ISOMÉTRICO
                </Text>
                <Text
                  style={[
                    styles.modeButtonDescription,
                    mode === "ISOMÉTRICO" && styles.modeButtonDescriptionActive,
                  ]}
                >
                  50% · 80% · 100%
                </Text>
              </Pressable>
            </View>

            {mode === "DINÁMICO" ? (
              <View style={styles.repetitionsRow}>
                <View>
                  <Text style={styles.fieldLabel}>REPETICIONES</Text>
                  <Text style={styles.smallDescription}>
                    16 segundos por repetición
                  </Text>
                </View>

                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => changeRepetitions(-1)}
                    style={styles.stepperButton}
                  >
                    <Text style={styles.stepperText}>−</Text>
                  </Pressable>

                  <Text style={styles.repetitionNumber}>
                    {repetitions}
                  </Text>

                  <Pressable
                    onPress={() => changeRepetitions(1)}
                    style={styles.stepperButton}
                  >
                    <Text style={styles.stepperText}>+</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.isoStages}>
                <View style={styles.isoStage}>
                  <Text style={styles.isoPercentage}>50%</Text>
                  <Text style={styles.isoSeconds}>20 segundos</Text>
                </View>
                <View style={styles.isoStage}>
                  <Text style={styles.isoPercentage}>80%</Text>
                  <Text style={styles.isoSeconds}>20 segundos</Text>
                </View>
                <View style={styles.isoStage}>
                  <Text style={styles.isoPercentage}>100%</Text>
                  <Text style={styles.isoSeconds}>20 segundos</Text>
                </View>
              </View>
            )}

            <View style={styles.weightSection}>
              <View style={styles.weightHeading}>
                <Text style={styles.fieldLabel}>PESO DEL CLIENTE ACTIVO</Text>
                <Text style={styles.weightClient}>
                  {activeClient?.name ?? "Sin cliente"}
                </Text>
              </View>

              <View style={styles.weightInputRow}>
                <TextInput
                  value={
                    activeClient
                      ? weights[activeClient.id] ?? ""
                      : ""
                  }
                  onChangeText={(value) =>
                    activeClient && updateWeight(activeClient.id, value)
                  }
                  editable={!!activeClient}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  style={styles.weightInput}
                />
                <Text style={styles.weightUnit}>KG</Text>
              </View>
            </View>
          </View>

          {/* TEMPORIZADOR */}
          <View style={[styles.timerPanel, narrow && styles.timerPanelNarrow]}>
            <View style={styles.timerTopRow}>
              <View>
                <Text style={styles.timerEyebrow}>SESIÓN EN CURSO</Text>
                <Text style={styles.timerTitle}>Temporizador</Text>
              </View>
              <View style={[styles.timerStatus, running && styles.timerStatusRunning]}>
                <View style={[styles.statusDot, running && styles.statusDotRunning]} />
                <Text style={styles.timerStatusText}>
                  {running
                    ? "EN MARCHA"
                    : isTimerComplete
                    ? "FINALIZADO"
                    : elapsed === 0
                    ? "PREPARADO"
                    : "EN PAUSA"}
                </Text>
              </View>
            </View>

            {mode === "DINÁMICO" ? (
              <View style={styles.dynamicPhaseGrid}>
                <View
                  style={[
                    styles.dynamicPhaseCard,
                    isUpPhase && !isTimerComplete && styles.dynamicPhaseCardUpActive,
                  ]}
                >
                  <View style={styles.phaseCardHeading}>
                    <Text
                      style={[
                        styles.dynamicPhaseLabel,
                        isUpPhase && !isTimerComplete && styles.dynamicPhaseLabelActive,
                      ]}
                    >
                      SUBIDA
                    </Text>
                    {isUpPhase && !isTimerComplete ? (
                      <Text style={styles.phaseNowBadge}>AHORA</Text>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.dynamicPhaseTime,
                      narrow && styles.dynamicPhaseTimeNarrow,
                      isUpPhase && !isTimerComplete && styles.dynamicPhaseTimeActive,
                      isUpPhase && !isTimerComplete && narrow && styles.dynamicPhaseTimeActiveNarrow,
                    ]}
                  >
                    {isTimerComplete
                      ? "00 s"
                      : isUpPhase
                      ? `${phaseRemaining} s`
                      : "08 s"}
                  </Text>
                  <Text
                    style={[
                      styles.dynamicPhaseCaption,
                      isUpPhase && !isTimerComplete && styles.dynamicPhaseCaptionActive,
                    ]}
                  >
                    Concéntrica
                  </Text>
                </View>

                <View
                  style={[
                    styles.dynamicPhaseCard,
                    !isUpPhase && !isTimerComplete && styles.dynamicPhaseCardDownActive,
                  ]}
                >
                  <View style={styles.phaseCardHeading}>
                    <Text
                      style={[
                        styles.dynamicPhaseLabel,
                        !isUpPhase && !isTimerComplete && styles.dynamicPhaseLabelActive,
                      ]}
                    >
                      BAJADA
                    </Text>
                    {!isUpPhase && !isTimerComplete ? (
                      <Text style={styles.phaseNowBadge}>AHORA</Text>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.dynamicPhaseTime,
                      narrow && styles.dynamicPhaseTimeNarrow,
                      !isUpPhase && !isTimerComplete && styles.dynamicPhaseTimeActive,
                      !isUpPhase && !isTimerComplete && narrow && styles.dynamicPhaseTimeActiveNarrow,
                    ]}
                  >
                    {isTimerComplete
                      ? "00 s"
                      : !isUpPhase
                      ? `${phaseRemaining} s`
                      : "08 s"}
                  </Text>
                  <Text
                    style={[
                      styles.dynamicPhaseCaption,
                      !isUpPhase && !isTimerComplete && styles.dynamicPhaseCaptionActive,
                    ]}
                  >
                    Excéntrica
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.isoTimerGrid}>
                {[
                  { label: "50%", description: "Intensidad inicial" },
                  { label: "80%", description: "Intensidad media" },
                  { label: "100%", description: "Intensidad máxima" },
                ].map((stage, index) => {
                  const active = activeIsoStage === index && !isTimerComplete;
                  return (
                    <View
                      key={stage.label}
                      style={[
                        styles.isoTimerCard,
                        active && styles.isoTimerCardActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.isoTimerPercent,
                          active && styles.isoTimerPercentActive,
                        ]}
                      >
                        {stage.label}
                      </Text>
                      <Text
                        style={[
                          styles.isoTimerTime,
                          narrow && styles.isoTimerTimeNarrow,
                          active && styles.isoTimerTimeActive,
                          active && narrow && styles.isoTimerTimeActiveNarrow,
                        ]}
                      >
                        {isTimerComplete ? "00 s" : active ? `${phaseRemaining} s` : "20 s"}
                      </Text>
                      <Text
                        style={[
                          styles.isoTimerDescription,
                          active && styles.isoTimerDescriptionActive,
                        ]}
                      >
                        {active ? "AHORA" : stage.description}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.timerMetaRow}>
              <View style={styles.totalTimeBlock}>
                <Text style={styles.timerRemainingLabel}>TIEMPO TOTAL RESTANTE</Text>
                <Text style={styles.totalTimeValue}>
                  {formatTime(totalSeconds - elapsed)}
                </Text>
              </View>
              {mode === "DINÁMICO" ? (
                <View style={styles.repetitionMeta}>
                  <Text style={styles.repetitionProgressLabel}>REPETICIÓN</Text>
                  <Text style={styles.repetitionProgressValue}>
                    {currentRepetition} / {repetitions}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%` },
                ]}
              />
            </View>

            <Text style={styles.phaseDescriptionTimer}>
              {isTimerComplete
                ? "Protocolo completado"
                : `${phaseTitle} · ${phaseDescription}`}
            </Text>

            <View style={styles.timerButtons}>
              {!running ? (
                <Pressable
                  onPress={startTimer}
                  style={[styles.timerButton, styles.timerStartButton]}
                >
                  <Text style={styles.timerStartText}>
                    ▶ {elapsed > 0 && elapsed < totalSeconds ? "REANUDAR" : "INICIAR"}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={pauseTimer}
                  style={[styles.timerButton, styles.timerPauseButton]}
                >
                  <Text style={styles.timerPauseText}>Ⅱ  PAUSAR</Text>
                </Pressable>
              )}

              <Pressable
                onPress={resetTimer}
                style={[styles.timerButton, styles.timerResetButton]}
              >
                <Text style={styles.timerResetText}>↻  REINICIAR</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={saveExercise}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>
                ✓  GUARDAR EJERCICIO DEL CLIENTE
              </Text>
            </Pressable>

            {notice ? (
              <Text style={styles.timerNotice}>{notice}</Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* HISTORIAL */}
      <View style={styles.historyPanel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Historial de esta sesión</Text>
            <Text style={styles.panelSubtitle}>
              Ejercicios guardados por cliente.
            </Text>
          </View>

          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>{history.length}</Text>
          </View>
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryIcon}>▤</Text>
            <Text style={styles.emptyHistoryTitle}>
              Todavía no hay ejercicios guardados
            </Text>
            <Text style={styles.emptyHistoryText}>
              Cuando termines un ejercicio, pulsa “Guardar ejercicio del cliente”.
            </Text>
          </View>
        ) : (
          history.map((item) => (
            <View key={item.id} style={styles.historyRow}>
              <View style={styles.historyIcon}>
                <Text style={styles.historyIconText}>✓</Text>
              </View>

              <View style={styles.historyInfo}>
                <Text style={styles.historyClient}>{item.clientName}</Text>
                <Text style={styles.historyDetail}>
                  {item.mode} · {item.detail}
                </Text>
                <Text style={styles.historyMeta}>
                  {item.clientId} · {item.time}
                </Text>
              </View>

              <View style={styles.historyWeight}>
                <Text style={styles.historyWeightValue}>
                  {item.weight} kg
                </Text>
                <Text style={styles.historyWeightLabel}>PESO</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <Text style={styles.footerNote}>
        FUERZA BILBAO · PANEL DE ENTRENAMIENTO · DEMO LOCAL
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#F1F5F9",
  },

  page: {
    width: "100%",
    maxWidth: 1550,
    alignSelf: "center",
    padding: 24,
    paddingBottom: 45,
  },

  pageMobile: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 32,
  },

  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 24,
  },

  headingGroup: {
    flex: 1,
    minWidth: 230,
  },

  eyebrow: {
    color: "#079E9E",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 7,
  },

  pageTitle: {
    color: NAVY,
    fontSize: 32,
    fontWeight: "900",
  },

  pageSubtitle: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 5,
  },

  machineStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE7EF",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#10B981",
  },

  machineName: {
    color: NAVY,
    fontSize: 12,
    fontWeight: "900",
  },

  machineOnline: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 3,
  },

  mainLayout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
    minWidth: 0,
  },

  mainLayoutCompact: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  leftColumn: {
    width: 350,
    flexShrink: 0,
    gap: 18,
  },

  rightColumn: {
    flex: 1,
    minWidth: 0,
    gap: 18,
  },

  fullColumn: {
    width: "100%",
    flex: 0,
    minWidth: 0,
    flexShrink: 1,
  },

  panel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 18,
  },

  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 18,
  },

  panelTitle: {
    color: NAVY,
    fontSize: 18,
    fontWeight: "900",
  },

  panelSubtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
  },

  counterBadge: {
    minWidth: 42,
    height: 34,
    borderRadius: 20,
    backgroundColor: "#DDF8F2",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  counterText: {
    color: "#078D79",
    fontSize: 13,
    fontWeight: "900",
  },

  clientList: {
    gap: 9,
  },

  clientCard: {
    minHeight: 68,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  clientCardSelected: {
    backgroundColor: "#E9F9F7",
    borderColor: "#A5E7DF",
  },

  clientCardActive: {
    borderColor: TURQUOISE,
    borderWidth: 1.5,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 25,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  avatarSelected: {
    backgroundColor: "#159FA7",
  },

  avatarText: {
    color: NAVY,
    fontSize: 13,
    fontWeight: "900",
  },

  avatarTextSelected: {
    color: "#FFFFFF",
  },

  clientInfo: {
    flex: 1,
    minWidth: 0,
  },

  clientName: {
    color: NAVY,
    fontSize: 14,
    fontWeight: "900",
  },

  clientId: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 3,
  },

  selectionMark: {
    width: 29,
    height: 29,
    borderRadius: 18,
    backgroundColor: "#EDF2F7",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  selectionMarkActive: {
    backgroundColor: GREEN,
  },

  selectionMarkText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  notice: {
    color: "#B45309",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 12,
  },

  activeClientRow: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 11,
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  activeClientRowSelected: {
    backgroundColor: "#E7F8F4",
    borderColor: "#7DD9C7",
  },

  activeClientInfo: {
    flex: 1,
    minWidth: 0,
  },

  activeClientName: {
    color: NAVY,
    fontSize: 14,
    fontWeight: "800",
  },

  activeLabel: {
    color: "#078D65",
    fontSize: 10,
    fontWeight: "900",
  },

  selectLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
  },

  fieldLabel: {
    color: "#52657C",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  machineTag: {
    backgroundColor: "#EDF5F8",
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  machineTagText: {
    color: "#31576C",
    fontSize: 10,
    fontWeight: "900",
  },

  modeSelector: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginBottom: 22,
  },

  modeButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 76,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DDE5EE",
    backgroundColor: "#F7F9FC",
    padding: 12,
    justifyContent: "center",
  },

  modeButtonActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },

  modeButtonTitle: {
    color: NAVY,
    fontSize: 13,
    fontWeight: "900",
  },

  modeButtonTitleActive: {
    color: "#FFFFFF",
  },

  modeButtonDescription: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 6,
  },

  modeButtonDescriptionActive: {
    color: "#C7D5E5",
  },

  repetitionsRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E7EDF3",
    paddingVertical: 12,
  },

  smallDescription: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 5,
  },

  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  stepperButton: {
    width: 37,
    height: 37,
    borderRadius: 10,
    backgroundColor: "#EAF1F6",
    alignItems: "center",
    justifyContent: "center",
  },

  stepperText: {
    color: NAVY,
    fontSize: 24,
    fontWeight: "800",
  },

  repetitionNumber: {
    color: NAVY,
    fontSize: 23,
    fontWeight: "900",
    minWidth: 25,
    textAlign: "center",
  },

  isoStages: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 12,
  },

  isoStage: {
    flex: 1,
    minWidth: 0,
    borderRadius: 11,
    backgroundColor: "#EFF5F8",
    alignItems: "center",
    paddingVertical: 13,
  },

  isoPercentage: {
    color: "#078D79",
    fontSize: 19,
    fontWeight: "900",
  },

  isoSeconds: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 5,
    textAlign: "center",
  },

  weightSection: {
    marginTop: 20,
  },

  weightHeading: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 6,
  },

  weightClient: {
    color: "#078D79",
    fontSize: 11,
    fontWeight: "800",
  },

  weightInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#F4F7FA",
    borderWidth: 1,
    borderColor: "#DCE5ED",
    borderRadius: 12,
    paddingHorizontal: 14,
  },

  weightInput: {
    flex: 1,
    minWidth: 0,
    height: 49,
    color: NAVY,
    fontSize: 22,
    fontWeight: "900",
  },

  weightUnit: {
    color: "#52657C",
    fontSize: 13,
    fontWeight: "900",
  },

  // TEMPORIZADOR

  timerPanel: {
    backgroundColor: NAVY,
    borderRadius: 19,
    padding: 22,
    marginBottom: 18,
  },

  timerPanelNarrow: {
    padding: 14,
  },

  timerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },

  timerEyebrow: {
    color: "#6FE0DA",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  timerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 5,
  },

  timerStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "#607187",
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },

  timerStatusRunning: {
    borderColor: "#1DAA7D",
    backgroundColor: "rgba(16,185,129,0.12)",
  },

  statusDotRunning: {
    backgroundColor: "#34D399",
  },

  timerStatusText: {
    color: "#DDE7F1",
    fontSize: 9,
    fontWeight: "900",
  },

  dynamicPhaseGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },

  dynamicPhaseCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 150,
    borderRadius: 16,
    padding: 15,
    backgroundColor: "#1A3049",
    borderWidth: 1.5,
    borderColor: "#344A63",
    justifyContent: "space-between",
  },

  dynamicPhaseCardUpActive: {
    backgroundColor: "#073F3F",
    borderColor: "#27D1BD",
  },

  dynamicPhaseCardDownActive: {
    backgroundColor: "#183F5D",
    borderColor: "#55B8F0",
  },

  phaseCardHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 5,
  },

  dynamicPhaseLabel: {
    color: "#AFC1D3",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },

  dynamicPhaseLabelActive: {
    color: "#FFFFFF",
  },

  phaseNowBadge: {
    color: "#062C2D",
    backgroundColor: "#6FE0DA",
    overflow: "hidden",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    fontSize: 8,
    fontWeight: "900",
  },

  dynamicPhaseTime: {
    color: "#D7E1EC",
    fontSize: 43,
    lineHeight: 52,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    marginTop: 7,
  },

  dynamicPhaseTimeActive: {
    color: "#FFFFFF",
    fontSize: 50,
    lineHeight: 59,
  },

  dynamicPhaseTimeNarrow: {
    fontSize: 35,
    lineHeight: 43,
  },

  dynamicPhaseTimeActiveNarrow: {
    fontSize: 40,
    lineHeight: 48,
  },

  dynamicPhaseCaption: {
    color: "#AFC1D3",
    fontSize: 11,
    fontWeight: "700",
  },

  dynamicPhaseCaptionActive: {
    color: "#BDFBF0",
  },

  isoTimerGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },

  isoTimerCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 126,
    borderRadius: 13,
    paddingVertical: 13,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A3049",
    borderWidth: 1.5,
    borderColor: "#344A63",
  },

  isoTimerCardActive: {
    backgroundColor: "#073F3F",
    borderColor: "#27D1BD",
  },

  isoTimerPercent: {
    color: "#B7C8D9",
    fontSize: 15,
    fontWeight: "900",
  },

  isoTimerPercentActive: {
    color: "#6FE0DA",
  },

  isoTimerTime: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    marginTop: 9,
  },

  isoTimerTimeActive: {
    fontSize: 30,
    color: "#FFFFFF",
  },

  isoTimerTimeNarrow: {
    fontSize: 21,
  },

  isoTimerTimeActiveNarrow: {
    fontSize: 24,
  },

  isoTimerDescription: {
    color: "#AFC1D3",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 7,
  },

  isoTimerDescriptionActive: {
    color: "#BDFBF0",
  },

  timerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },

  totalTimeBlock: {
    flex: 1,
    minWidth: 125,
  },

  timerRemainingLabel: {
    color: "#9FB0C4",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  totalTimeValue: {
    color: "#DDE7F1",
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    marginTop: 3,
  },

  repetitionMeta: {
    alignItems: "flex-end",
  },

  repetitionProgressLabel: {
    color: "#AFC1D3",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  repetitionProgressValue: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 3,
  },

  progressTrack: {
    width: "100%",
    height: 7,
    borderRadius: 10,
    backgroundColor: "#314258",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#27D1BD",
  },

  phaseDescriptionTimer: {
    color: "#C5D3E1",
    fontSize: 11,
    marginTop: 9,
    minHeight: 16,
  },

  timerButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  timerButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 49,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  timerStartButton: {
    backgroundColor: GREEN,
  },

  timerPauseButton: {
    backgroundColor: "#D99A27",
  },

  timerResetButton: {
    backgroundColor: "#2A4058",
    borderWidth: 1,
    borderColor: "#52677E",
  },

  timerStartText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  timerPauseText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  timerResetText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  saveButton: {
    minHeight: 53,
    backgroundColor: "#E2F8F3",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    marginTop: 12,
  },

  saveButtonText: {
    color: "#087D61",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },

  timerNotice: {
    color: "#9FE8D8",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 12,
  },

  // HISTORIAL

  historyPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    marginTop: 3,
  },

  emptyHistory: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 15,
    backgroundColor: "#F7F9FC",
    borderRadius: 13,
  },

  emptyHistoryIcon: {
    color: "#159FA7",
    fontSize: 30,
    marginBottom: 8,
  },

  emptyHistoryTitle: {
    color: NAVY,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyHistoryText: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },

  historyRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E8EDF3",
    paddingVertical: 12,
  },

  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: "#DDF8F2",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  historyIconText: {
    color: "#078D65",
    fontSize: 18,
    fontWeight: "900",
  },

  historyInfo: {
    flex: 1,
    minWidth: 0,
  },

  historyClient: {
    color: NAVY,
    fontSize: 14,
    fontWeight: "900",
  },

  historyDetail: {
    color: "#52657C",
    fontSize: 11,
    marginTop: 4,
  },

  historyMeta: {
    color: "#8795A7",
    fontSize: 10,
    marginTop: 3,
  },

  historyWeight: {
    alignItems: "flex-end",
    flexShrink: 0,
  },

  historyWeightValue: {
    color: NAVY,
    fontSize: 15,
    fontWeight: "900",
  },

  historyWeightLabel: {
    color: "#8795A7",
    fontSize: 9,
    marginTop: 3,
  },

  footerNote: {
    color: "#8492A6",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 1,
    marginTop: 22,
  },
});