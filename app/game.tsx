import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  getDoc,
  updateDoc,
  increment,
  addDoc,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { db } from "./firebase";

const { width } = Dimensions.get("window");

export default function Game() {
  const [userTeam, setUserTeam] = useState<"rouge" | "bleu" | null>(null);
  const [scores, setScores] = useState({ rouge: 0, bleu: 0 });
  const [personalClicks, setPersonalClicks] = useState(0);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [userPseudo, setUserPseudo] = useState<string | null>(null);

  // Générer ou récupérer l'ID unique de l'appareil et le pseudo
  useEffect(() => {
    const initUserData = async () => {
      try {
        let storedId = await AsyncStorage.getItem("deviceId");
        if (!storedId) {
          storedId = `device_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          await AsyncStorage.setItem("deviceId", storedId);
        }
        setDeviceId(storedId);

        const pseudo = await AsyncStorage.getItem("userPseudo");
        if (pseudo) {
          setUserPseudo(pseudo);
        }
      } catch (error) {
        console.error(
          "Erreur lors de l'initialisation des données utilisateur:",
          error
        );
      }
    };
    initUserData();
  }, []);

  // Charger le nombre de clics personnel depuis Firebase
  useEffect(() => {
    if (!deviceId) return;

    const interactionsRef = collection(db, "interactions");
    const q = query(interactionsRef, where("deviceId", "==", deviceId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const totalClicks = snapshot.docs.reduce((total, doc) => {
        return total + (doc.data().clicks || 0);
      }, 0);
      setPersonalClicks(totalClicks);
    });

    return () => unsubscribe();
  }, [deviceId]);

  const handleClick = useCallback(async () => {
    if (!userTeam || !deviceId || !userPseudo) return;

    try {
      // Créer un ID unique pour la combinaison joueur-équipe
      const playerTeamId = `${deviceId}_${
        userTeam === "rouge" ? "red" : "blue"
      }`;
      const playerRef = doc(db, "interactions", playerTeamId);
      const playerDoc = await getDoc(playerRef);

      if (!playerDoc.exists()) {
        // Créer un nouveau document pour cette combinaison joueur-équipe
        await setDoc(playerRef, {
          team: userTeam === "rouge" ? "red" : "blue",
          clicks: 1,
          lastUpdate: Date.now(),
          deviceId: deviceId,
          pseudo: userPseudo,
        });
      } else {
        // Mettre à jour le nombre de clics pour cette combinaison
        await updateDoc(playerRef, {
          clicks: increment(1),
          lastUpdate: Date.now(),
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'interaction:", error);
    }
  }, [userTeam, deviceId, userPseudo]);

  const handleReset = async () => {
    try {
      await AsyncStorage.removeItem("selectedTeam");
      router.replace("/");
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
    }
  };

  // Calculer le pourcentage pour la barre de progression
  const calculateProgress = () => {
    const total = scores.rouge + scores.bleu;
    if (total === 0) return 50; // Si aucun score, barre au milieu
    return (scores.rouge / total) * 100;
  };

  useEffect(() => {
    // Récupérer l'équipe de l'utilisateur
    const loadUserTeam = async () => {
      const team = await AsyncStorage.getItem("selectedTeam");
      if (team === "rouge" || team === "bleu") {
        setUserTeam(team);
      }
    };
    loadUserTeam();

    // Écouter les changements dans la collection "interactions"
    const interactionsRef = collection(db, "interactions");
    const unsubscribe = onSnapshot(
      interactionsRef,
      (snapshot) => {
        // Compter les clics par équipe
        const redClicks = snapshot.docs.reduce((total, doc) => {
          return (
            total + (doc.data().team === "red" ? doc.data().clicks || 0 : 0)
          );
        }, 0);
        const blueClicks = snapshot.docs.reduce((total, doc) => {
          return (
            total + (doc.data().team === "blue" ? doc.data().clicks || 0 : 0)
          );
        }, 0);

        setScores({
          rouge: redClicks,
          bleu: blueClicks,
        });
      },
      (error) => {
        console.error("Erreur lors de l'écoute des interactions:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      {/* Lignes de fond animées */}
      <View style={styles.backgroundLines}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={i} style={[styles.line, { top: i * 80 }]} />
        ))}
      </View>

      <LinearGradient
        colors={
          userTeam === "rouge" ? ["#000000", "#ff4444"] : ["#000000", "#4444ff"]
        }
        style={styles.contentContainer}
        locations={[0.2, 1]}
      >
        <View>
          <TouchableOpacity
            style={styles.titleContainer}
            onPress={handleReset}
            activeOpacity={0.6}
          >
            <LinearGradient
              colors={
                userTeam === "rouge"
                  ? ["#ff444400", "#ff4444", "#ff444400"]
                  : ["#4444ff00", "#4444ff", "#4444ff00"]
              }
              style={styles.titleLine}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            />
            <Text style={styles.title}>SCORE EN TEMPS RÉEL</Text>
            <LinearGradient
              colors={
                userTeam === "rouge"
                  ? ["#ff444400", "#ff4444", "#ff444400"]
                  : ["#4444ff00", "#4444ff", "#4444ff00"]
              }
              style={styles.titleLine}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            />
          </TouchableOpacity>

          <View style={styles.progressContainer}>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressText, { color: "#ff4444" }]}>
                {Math.round(calculateProgress())}%
              </Text>
              <Text style={[styles.progressText, { color: "#4444ff" }]}>
                {Math.round(100 - calculateProgress())}%
              </Text>
            </View>
            <View style={styles.progressBackground}>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarRed,
                    { width: `${calculateProgress()}%` },
                  ]}
                />
                <View
                  style={[
                    styles.progressBarBlue,
                    { width: `${100 - calculateProgress()}%` },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={styles.scoreContainer}>
            <View style={[styles.teamButton, styles.redButton]}>
              <Text style={styles.buttonText}>{scores.rouge}</Text>
            </View>

            <View style={[styles.teamButton, styles.blueButton]}>
              <Text style={styles.buttonText}>{scores.bleu}</Text>
            </View>
          </View>
        </View>

        <View style={styles.gameControls}>
          <View style={styles.buttonWrapper}>
            <LinearGradient
              colors={
                userTeam === "rouge"
                  ? ["#ff222200", "#ff2222"]
                  : ["#2222ff00", "#2222ff"]
              }
              style={styles.buttonGlow}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <TouchableOpacity
              style={[
                styles.clickButton,
                userTeam === "rouge" ? styles.redButton : styles.blueButton,
              ]}
              onPress={handleClick}
              activeOpacity={0.7}
            >
              <Text style={styles.clickButtonText}>CLIQUER</Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[
              styles.personalClicksText,
              { color: userTeam === "rouge" ? "#ff4444" : "#4444ff" },
            ]}
          >
            Vos clics: {personalClicks}
          </Text>

          {/* Décoration du bas */}
          <View style={styles.bottomDecoration}>
            <LinearGradient
              colors={["#ffffff00", "#ffffff22", "#ffffff00"]}
              style={styles.bottomLine}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  backgroundLines: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.1,
  },
  line: {
    position: "absolute",
    width: "200%",
    height: 1,
    backgroundColor: "#ffffff",
    transform: [{ rotate: "15deg" }],
    left: -50,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
    paddingVertical: "15%",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 15,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  titleLine: {
    height: 1,
    width: width * 0.6,
    marginVertical: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    letterSpacing: 2,
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 15,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 5,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  progressBackground: {
    width: "90%",
    height: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#000000",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  progressBarContainer: {
    flexDirection: "row",
    height: "100%",
  },
  progressBarRed: {
    height: "100%",
    backgroundColor: "#ff4444",
  },
  progressBarBlue: {
    height: "100%",
    backgroundColor: "#4444ff",
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 40,
  },
  teamButton: {
    width: "45%",
    padding: 15,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
  },
  redButton: {
    borderColor: "#ff2222",
  },
  blueButton: {
    borderColor: "#2222ff",
  },
  buttonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonWrapper: {
    alignItems: "center",
    position: "relative",
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    marginBottom: 20,
  },
  buttonGlow: {
    position: "absolute",
    width: "90%",
    height: 40,
    bottom: -15,
    opacity: 0.3,
    borderRadius: 20,
  },
  clickButton: {
    width: "90%",
    backgroundColor: "#151515",
    borderWidth: 1,
    borderRadius: 10,
    padding: 25,
    transform: [{ perspective: 2000 }, { rotateX: "5deg" }],
  },
  clickButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 3,
  },
  bottomDecoration: {
    alignItems: "center",
    marginTop: 20,
  },
  bottomLine: {
    height: 1,
    width: width * 0.9,
  },
  gameControls: {
    flex: 1,
    justifyContent: "flex-end",
    width: "100%",
    paddingBottom: 20,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  personalClicksText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
