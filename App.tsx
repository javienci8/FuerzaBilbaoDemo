
import React, { useMemo, useState } from "react";
import Entrenamientos from "./Entrenamientos";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  ImageBackground,
  StyleSheet,
  useWindowDimensions,
  StatusBar,
} from "react-native";

const LOGO = require("./assets/fuerza-bilbao-logo.png");
const BACKGROUND = require("./assets/gym-background.png");

type Client = {
  id: string;
  name: string;
  sessions: number;
  pin: string;
};

const CLIENTS: Client[] = [
  { id: "FB001", name: "Álvaro Martín", sessions: 8, pin: "1234" },
  { id: "FB002", name: "Laura Gómez", sessions: 5, pin: "1234" },
  { id: "FB003", name: "Rodrigo García", sessions: 10, pin: "1234" },
  { id: "FB004", name: "María Fernández", sessions: 3, pin: "1234" },
  { id: "FB005", name: "David López", sessions: 11, pin: "1234" },
];

const NAVY = "#101D32";
const TURQUOISE = "#20B9B9";
const GREEN = "#079968";

export default function App() {
  const { width } = useWindowDimensions();

  // Diseño adaptable según el ancho real de la pantalla.
  const isPhone = width < 640;
  const isCompact = width < 1050;
  const isDesktop = width >= 1450;

  const [activeTab, setActiveTab] = useState<"Entrada" | "Entrenamientos">("Entrada");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Client>(CLIENTS[0]);
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [started, setStarted] = useState(false);

  const filteredClients = useMemo(() => {
    const value = search.toLowerCase().trim();

    return CLIENTS.filter(
      (client) =>
        client.name.toLowerCase().includes(value) ||
        client.id.toLowerCase().includes(value)
    );
  }, [search]);

  function selectClient(client: Client) {
    setSelected(client);
    setPin("");
    setMessage("");
    setStarted(false);
  }

  function addNumber(number: string) {
    if (pin.length >= 4) return;

    setPin((current) => current + number);
    setMessage("");
    setStarted(false);
  }

  function removeNumber() {
    setPin((current) => current.slice(0, -1));
    setMessage("");
    setStarted(false);
  }

  function clearPin() {
    setPin("");
    setMessage("");
    setStarted(false);
  }

  function startTraining() {
    if (pin.length !== 4) {
      setMessage("Introduce los 4 números de tu DNI.");
      return;
    }

    if (pin !== selected.pin) {
      setMessage("El código introducido no es correcto.");
      return;
    }

    if (selected.sessions <= 0) {
      setMessage("No tienes sesiones disponibles.");
      return;
    }

    setStarted(true);
    setMessage("Identificación correcta. ¡Vamos a entrenar!");
  }

  function ClientCard({ client }: { client: Client }) {
    const active = selected.id === client.id;

    const initials = client.name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    return (
      <Pressable
        onPress={() => selectClient(client)}
        style={[
          styles.clientCard,
          active && styles.clientCardActive,
        ]}
      >
        <View style={[styles.avatar, active && styles.avatarActive]}>
          <Text
            style={[
              styles.avatarText,
              active && styles.avatarTextActive,
            ]}
          >
            {initials}
          </Text>
        </View>

        <View style={styles.clientInfo}>
          <Text style={styles.clientName} numberOfLines={1}>
            {client.name}
          </Text>

          <Text style={styles.clientDetails}>
            {client.id} · {client.sessions} sesiones disponibles
          </Text>
        </View>

        <View style={styles.clientArrow}>
          {active ? (
            <Text style={styles.check}>✓</Text>
          ) : (
            <Text style={styles.arrow}>›</Text>
          )}
        </View>
      </Pressable>
    );
  }

  function IdentificationPanel() {
    const initials = selected.name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    return (
      <View style={[styles.identificationCard, isPhone && styles.identificationCardPhone]}>
        <View style={styles.stepRow}>
          <Text style={styles.sectionEyebrow}>
            IDENTIFICACIÓN DE CLIENTE
          </Text>

          <Text style={styles.stepBadge}>
            PASO 02 DE 02
          </Text>
        </View>

        <Text style={styles.identificationTitle}>
          Confirma tu identidad
        </Text>

        <Text style={styles.identificationSubtitle}>
          Introduce los últimos 4 números de tu DNI.
        </Text>

        <View style={[styles.selectedClient, isPhone && styles.selectedClientPhone]}>
          <View style={styles.selectedAvatar}>
            <Text style={styles.selectedAvatarText}>
              {initials}
            </Text>
          </View>

          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName} numberOfLines={1}>
              {selected.name}
            </Text>

            <Text style={styles.selectedId}>
              {selected.id}
            </Text>
          </View>

          <View style={[styles.sessionInfo, isPhone && styles.sessionInfoPhone]}>
            <Text style={styles.calendarIcon}>▦</Text>

            <View>
              <Text style={styles.sessionNumber}>
                {selected.sessions}
              </Text>

              <Text style={styles.sessionLabel}>
                Sesiones disponibles
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.pinContainer}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.pinBox,
                pin.length > index && styles.pinBoxFilled,
              ]}
            >
              <Text style={styles.pinDot}>
                {pin.length > index ? "●" : ""}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.keypad}>
          {[
            "1", "2", "3",
            "4", "5", "6",
            "7", "8", "9",
            "⌫", "0", "C",
          ].map((number) => (
            <Pressable
              key={number}
              onPress={() => {
                if (number === "⌫") {
                  removeNumber();
                } else if (number === "C") {
                  clearPin();
                } else {
                  addNumber(number);
                }
              }}
              style={({ pressed }) => [
                styles.key,
                pressed && styles.keyPressed,
              ]}
            >
              <Text style={styles.keyText}>{number}</Text>
            </Pressable>
          ))}
        </View>

        {message ? (
          <Text
            style={[
              styles.message,
              started && styles.successMessage,
            ]}
          >
            {message}
          </Text>
        ) : null}

        <Pressable
          onPress={startTraining}
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.startButtonPressed,
          ]}
        >
          <Text style={styles.playIcon}>▶</Text>

          <Text style={styles.startButtonText}>
            {started
              ? "ENTRENAMIENTO INICIADO"
              : "INICIAR ENTRENAMIENTO"}
          </Text>
        </Pressable>

        <Text style={styles.demoNote}>
          DEMO · PIN de prueba: 1234
        </Text>
      </View>
    );
  }

  function BrandPanel() {
    return (
      <View style={styles.brandPanel}>
        <View style={styles.brandContent}>
          <Image
            source={LOGO}
            style={styles.brandLogo}
            resizeMode="contain"
          />

          <Text style={styles.brandName}>
            FUERZA BILBAO
          </Text>

          <Text style={styles.brandSubtitle}>
            CENTRO DE ENTRENAMIENTO
          </Text>

          <View style={styles.brandLine} />

          <View style={styles.values}>
            <View style={styles.valueRow}>
              <Text style={styles.valueIcon}>✦</Text>
              <Text style={styles.valueText}>CONSTANCIA</Text>
            </View>

            <View style={styles.valueRow}>
              <Text style={styles.valueIcon}>♨</Text>
              <Text style={styles.valueText}>ESFUERZO</Text>
            </View>

            <View style={styles.valueRow}>
              <Text style={styles.valueIcon}>◎</Text>
              <Text style={styles.valueText}>RESULTADOS</Text>
            </View>
          </View>
        </View>

        <Text style={styles.brandFooter}>
          TU MEJOR VERSIÓN EMPIEZA AQUÍ
        </Text>
      </View>
    );
  }

  function Navigation() {
    return (
      <View style={[styles.navigation, isCompact && styles.navigationCompact]}>
        <Pressable
          onPress={() => setActiveTab("Entrada")}
          style={[
            styles.navItem,
            activeTab === "Entrada" && styles.navItemActive,
          ]}
        >
          <Text
            style={[
              styles.navText,
              activeTab === "Entrada" && styles.navActiveText,
            ]}
          >
            ⌂ Entrada
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("Entrenamientos")}
          style={[
            styles.navItem,
            activeTab === "Entrenamientos" && styles.navItemActive,
          ]}
        >
          <Text
            style={[
              styles.navText,
              activeTab === "Entrenamientos" && styles.navActiveText,
            ]}
          >
            ✚ Entrenamientos
          </Text>
        </Pressable>

        <View style={styles.navItem}>
          <Text style={styles.navText}>▥ Historial</Text>
        </View>
      </View>
    );
  }

  return (
    <ImageBackground
      source={BACKGROUND}
      resizeMode="cover"
      style={styles.screen}
      imageStyle={styles.backgroundImage}
    >
      <StatusBar barStyle="light-content" />

      <View
        pointerEvents="none"
        style={styles.backgroundOverlay}
      />

      {/* CABECERA */}
      <View
        style={[
          styles.topBar,
          isCompact && styles.topBarCompact,
          isPhone && styles.topBarPhone,
        ]}
      >
        <View style={styles.headerBrand}>
          <Image
            source={LOGO}
            style={styles.headerLogo}
            resizeMode="contain"
          />

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              FUERZA BILBAO
            </Text>

            <Text style={styles.headerSubtitle}>
              CENTRO DE ENTRENAMIENTO
            </Text>
          </View>
        </View>

        <Navigation />

        {!isCompact && (
          <View style={styles.systemStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              Sistema de acceso
            </Text>
          </View>
        )}
      </View>

      {/* CONTENIDO */}
      {activeTab === "Entrada" ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isCompact && styles.scrollContentCompact,
            isPhone && styles.scrollContentPhone,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.mainLayout,
              isCompact && styles.mainStack,
              !isCompact && styles.mainColumns,
            ]}
          >
            {/* LISTA DE CLIENTES */}
            <View
              style={[
                styles.clientsColumn,
                isCompact && styles.columnCompact,
              ]}
            >
              <Text style={styles.eyebrow}>
                TU ENTRENAMIENTO COMIENZA AQUÍ
              </Text>

              <Text style={[styles.mainTitle, isPhone && styles.mainTitlePhone]}>
                Identifícate para entrenar
              </Text>

              <Text style={styles.mainSubtitle}>
                Busca tu perfil y selecciona tu nombre para continuar.
              </Text>

              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>⌕</Text>

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Buscar por nombre o código..."
                  placeholderTextColor="#718096"
                  style={styles.searchInput}
                />

                {search.length > 0 && (
                  <Pressable onPress={() => setSearch("")}>
                    <Text style={styles.clearSearch}>✕</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>
                  Selecciona tu perfil
                </Text>

                <Text style={styles.clientCount}>
                  {filteredClients.length} CLIENTES
                </Text>
              </View>

              <View style={styles.clientList}>
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                    />
                  ))
                ) : (
                  <Text style={styles.emptyText}>
                    No se han encontrado clientes.
                  </Text>
                )}
              </View>
            </View>

            {/* IDENTIFICACIÓN */}
            <View
              style={[
                styles.identificationColumn,
                isCompact && styles.columnCompact,
              ]}
            >
              <IdentificationPanel />
            </View>

            {/* MARCA LATERAL: SOLO ORDENADOR */}
            {isDesktop && <BrandPanel />}
          </View>

          {isCompact && (
            <View style={styles.mobileFooter}>
              <Image
                source={LOGO}
                style={styles.mobileLogo}
                resizeMode="contain"
              />

              <Text style={styles.mobileBrand}>
                FUERZA BILBAO
              </Text>

              <Text style={styles.mobileFooterText}>
                CENTRO DE ENTRENAMIENTO
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.trainingContainer}>
          <Entrenamientos />
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minWidth: 0,
    backgroundColor: NAVY,
  },

  backgroundImage: {
    opacity: 1,
  },

  backgroundOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(5, 15, 30, 0.55)",
  },

  // CABECERA

  topBar: {
    minHeight: 82,
    backgroundColor: "rgba(9, 24, 43, 0.97)",
    paddingHorizontal: 28,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 14,
    zIndex: 2,
  },

  topBarCompact: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },

  topBarPhone: {
    paddingHorizontal: 15,
    paddingVertical: 11,
  },

  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },

  headerTextContainer: {
    minWidth: 0,
  },

  headerLogo: {
    width: 54,
    height: 48,
    flexShrink: 0,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  headerSubtitle: {
    color: "#D0DCE9",
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 3,
  },

  navigation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  navigationCompact: {
    width: "100%",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: 7,
  },

  navItem: {
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 9,
  },

  navItemActive: {
    backgroundColor: "#193A4D",
    borderBottomWidth: 3,
    borderBottomColor: "#35D4D8",
  },

  navText: {
    color: "#D0DCE9",
    fontSize: 14,
    fontWeight: "700",
  },

  navActiveText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  systemStatus: {
    borderWidth: 1,
    borderColor: "#536A80",
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#20D18B",
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  // CONTENIDO

  scroll: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },

  scrollContent: {
    flexGrow: 1,
    width: "100%",
    padding: 28,
    paddingBottom: 45,
  },

  scrollContentCompact: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 35,
  },

  scrollContentPhone: {
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 30,
  },

  mainLayout: {
    width: "100%",
    maxWidth: 1800,
    alignSelf: "center",
    minWidth: 0,
  },

  mainColumns: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 22,
  },

  mainStack: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 26,
    maxWidth: 760,
  },

  clientsColumn: {
    flex: 1.08,
    minWidth: 0,
    paddingTop: 16,
  },

  identificationColumn: {
    flex: 1,
    minWidth: 0,
  },

  columnCompact: {
    width: "100%",
    flex: 0,
    minWidth: 0,
    alignSelf: "stretch",
    paddingTop: 0,
  },

  trainingContainer: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },

  // TÍTULOS

  eyebrow: {
    color: "#4DE5E0",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  mainTitle: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "900",
    marginBottom: 7,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 7,
  },

  mainTitlePhone: {
    fontSize: 29,
    lineHeight: 35,
  },

  mainSubtitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 23,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  // BUSCADOR

  searchBox: {
    width: "100%",
    minHeight: 57,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#D7E0EA",
    backgroundColor: "rgba(255,255,255,0.98)",
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 27,
  },

  searchIcon: {
    fontSize: 28,
    color: NAVY,
    marginRight: 12,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    color: NAVY,
    fontSize: 15,
    outlineStyle: "none" as any,
  },

  clearSearch: {
    color: "#64748B",
    fontSize: 20,
    padding: 5,
  },

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 15,
    flexWrap: "wrap",
  },

  listTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  clientCount: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },

  // CLIENTES

  clientList: {
    width: "100%",
    gap: 9,
  },

  clientCard: {
    width: "100%",
    minHeight: 79,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: "#DFE6EE",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  clientCardActive: {
    backgroundColor: "#E1F9F7",
    borderColor: TURQUOISE,
    borderWidth: 1.5,
  },

  avatar: {
    width: 49,
    height: 49,
    borderRadius: 30,
    backgroundColor: "#E1E7EF",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  avatarActive: {
    backgroundColor: "#159FA7",
  },

  avatarText: {
    color: NAVY,
    fontSize: 16,
    fontWeight: "900",
  },

  avatarTextActive: {
    color: "#FFFFFF",
  },

  clientInfo: {
    flex: 1,
    minWidth: 0,
  },

  clientName: {
    color: NAVY,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 4,
  },

  clientDetails: {
    color: "#42566D",
    fontSize: 13,
    flexShrink: 1,
  },

  clientArrow: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  check: {
    width: 27,
    height: 27,
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: GREEN,
    color: "#FFFFFF",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 19,
    fontWeight: "900",
  },

  arrow: {
    color: "#42556B",
    fontSize: 32,
  },

  emptyText: {
    color: "#FFFFFF",
    padding: 20,
    textAlign: "center",
  },

  // IDENTIFICACIÓN

  identificationCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.99)",
    borderRadius: 23,
    padding: 25,
    borderWidth: 1,
    borderColor: "#E0E7EF",
    shadowColor: "#152A42",
    shadowOpacity: 0.20,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
    minWidth: 0,
  },

  identificationCardPhone: {
    padding: 17,
    borderRadius: 19,
  },

  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  sectionEyebrow: {
    color: "#31576C",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  stepBadge: {
    color: "#078D79",
    backgroundColor: "#DDF8F2",
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 20,
    fontSize: 10,
    fontWeight: "900",
  },

  identificationTitle: {
    color: NAVY,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "900",
    marginBottom: 5,
  },

  identificationSubtitle: {
    color: "#52657C",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },

  selectedClient: {
    backgroundColor: "#F0F4F8",
    borderWidth: 1,
    borderColor: "#DFE7F0",
    borderRadius: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 25,
    minWidth: 0,
  },

  selectedClientPhone: {
    flexWrap: "wrap",
    marginBottom: 20,
  },

  selectedAvatar: {
    width: 49,
    height: 49,
    borderRadius: 30,
    backgroundColor: "#159FA7",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  selectedAvatarText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },

  selectedInfo: {
    flex: 1,
    minWidth: 0,
  },

  selectedName: {
    color: NAVY,
    fontSize: 16,
    fontWeight: "900",
  },

  selectedId: {
    color: "#52657C",
    fontSize: 13,
    marginTop: 3,
  },

  sessionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderLeftWidth: 1,
    borderLeftColor: "#A9B7C8",
    paddingLeft: 12,
    flexShrink: 0,
  },

  sessionInfoPhone: {
    width: "100%",
    borderLeftWidth: 0,
    borderTopWidth: 1,
    borderTopColor: "#D5DFE9",
    paddingLeft: 0,
    paddingTop: 9,
    justifyContent: "center",
  },

  calendarIcon: {
    color: "#159FA7",
    fontSize: 24,
    fontWeight: "900",
  },

  sessionNumber: {
    color: NAVY,
    fontSize: 25,
    fontWeight: "900",
  },

  sessionLabel: {
    color: "#52657C",
    fontSize: 10,
  },

  // PIN

  pinContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },

  pinBox: {
    width: 58,
    height: 58,
    maxWidth: "22%",
    borderWidth: 1.5,
    borderColor: "#18AEB5",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  pinBoxFilled: {
    backgroundColor: "#E4F8F7",
  },

  pinDot: {
    color: NAVY,
    fontSize: 18,
  },

  // TECLADO

  keypad: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 9,
    marginBottom: 20,
  },

  key: {
    width: "31.5%",
    height: 51,
    borderRadius: 13,
    backgroundColor: "#EDF2F7",
    borderWidth: 1,
    borderColor: "#DDE5EE",
    alignItems: "center",
    justifyContent: "center",
  },

  keyPressed: {
    backgroundColor: "#D8F4F2",
    borderColor: TURQUOISE,
  },

  keyText: {
    color: NAVY,
    fontSize: 24,
    fontWeight: "900",
  },

  // MENSAJES Y BOTÓN

  message: {
    color: "#D04444",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 19,
  },

  successMessage: {
    color: "#078D65",
  },

  startButton: {
    width: "100%",
    minHeight: 62,
    backgroundColor: GREEN,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  startButtonPressed: {
    backgroundColor: "#087D59",
  },

  playIcon: {
    color: "#FFFFFF",
    fontSize: 20,
  },

  startButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    flexShrink: 1,
  },

  demoNote: {
    color: "#64748B",
    textAlign: "center",
    fontSize: 10,
    marginTop: 13,
  },

  // MARCA LATERAL

  brandPanel: {
    width: 225,
    minHeight: 650,
    borderRadius: 22,
    backgroundColor: "rgba(9,24,43,0.98)",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 35,
    paddingHorizontal: 16,
    overflow: "hidden",
    flexShrink: 0,
  },

  brandContent: {
    alignItems: "center",
    width: "100%",
    marginTop: 65,
  },

  brandLogo: {
    width: 155,
    height: 115,
    marginBottom: 15,
  },

  brandName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },

  brandSubtitle: {
    color: "#D1DBE7",
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 7,
    textAlign: "center",
  },

  brandLine: {
    width: 65,
    height: 5,
    borderRadius: 5,
    backgroundColor: "#2ED4D0",
    marginVertical: 35,
  },

  values: {
    width: "100%",
    gap: 25,
    paddingHorizontal: 8,
  },

  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  valueIcon: {
    color: "#2ED4D0",
    fontSize: 27,
    width: 32,
    textAlign: "center",
  },

  valueText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },

  brandFooter: {
    color: "#C0CCDA",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textAlign: "center",
  },

  // PIE EN MÓVIL Y TABLET

  mobileFooter: {
    width: "100%",
    alignItems: "center",
    marginTop: 28,
    padding: 20,
    backgroundColor: "rgba(9,24,43,0.97)",
    borderRadius: 18,
  },

  mobileLogo: {
    width: 80,
    height: 65,
  },

  mobileBrand: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 8,
  },

  mobileFooterText: {
    color: "#D1DBE7",
    fontSize: 10,
    marginTop: 5,
    letterSpacing: 1,
  },
});
