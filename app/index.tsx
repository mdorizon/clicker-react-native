import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function Home() {
  const router = useRouter();
  const [selectedTeam, setSelectedTeam] = useState<"rouge" | "bleu" | null>(
    null
  );

  useEffect(() => {
    const checkPseudoAndTeam = async () => {
      const pseudo = await AsyncStorage.getItem("userPseudo");
      const team = await AsyncStorage.getItem("selectedTeam");

      if (!pseudo) {
        router.replace("/pseudo");
        return;
      }

      if (team === "rouge" || team === "bleu") {
        router.replace("/game");
        return;
      }
    };

    checkPseudoAndTeam();
  }, []);

  const handleTeamSelect = async (team: "rouge" | "bleu") => {
    try {
      await AsyncStorage.setItem("selectedTeam", team);
      setSelectedTeam(team);
      router.push("/game");
    } catch (error) {
      console.error("Erreur lors de la sélection de l'équipe:", error);
    }
  };

  const handleReset = async () => {
    try {
      await AsyncStorage.removeItem("selectedTeam");
      await AsyncStorage.removeItem("userPseudo");
      router.replace("/pseudo");
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Lignes de fond animées */}
      <View style={styles.backgroundLines}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={i} style={[styles.line, { top: i * 80 }]} />
        ))}
      </View>

      <View style={styles.contentContainer}>
        {/* Titre avec effet futuriste */}
        <View style={styles.titleContainer}>
          <LinearGradient
            colors={["#ff444400", "#ff4444", "#ff444400"]}
            style={styles.titleLine}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
          <Text style={styles.title}>SÉLECTION D'ÉQUIPE</Text>
          <LinearGradient
            colors={["#4444ff00", "#4444ff", "#4444ff00"]}
            style={styles.titleLine}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
        </View>

        {/* Conteneur des boutons avec effet de perspective */}
        <View style={styles.buttonsContainer}>
          <View style={styles.buttonWrapper}>
            <LinearGradient
              colors={["#ff222200", "#ff2222"]}
              style={styles.buttonGlow}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <TouchableOpacity
              style={styles.touchable}
              onPress={() => handleTeamSelect("rouge")}
            >
              <View style={[styles.teamButton, styles.redButton]}>
                <Text style={[styles.buttonText, { color: "#ff4444" }]}>
                  ÉQUIPE ROUGE
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonWrapper}>
            <LinearGradient
              colors={["#2222ff00", "#2222ff"]}
              style={styles.buttonGlow}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <TouchableOpacity
              style={styles.touchable}
              onPress={() => handleTeamSelect("bleu")}
            >
              <View style={[styles.teamButton, styles.blueButton]}>
                <Text style={[styles.buttonText, { color: "#4444ff" }]}>
                  ÉQUIPE BLEUE
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

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
    marginBottom: 30,
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
  buttonsContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 60,
    width: "100%",
    paddingHorizontal: 20,
  },
  buttonWrapper: {
    alignItems: "center",
    position: "relative",
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  buttonGlow: {
    position: "absolute",
    width: "90%",
    height: 40,
    bottom: -15,
    opacity: 0.3,
    borderRadius: 20,
  },
  teamButton: {
    width: "100%",
    backgroundColor: "#151515",
    borderWidth: 1,
    borderRadius: 10,
    padding: 25,
    transform: [{ perspective: 2000 }, { rotateX: "5deg" }],
  },
  redButton: {
    borderColor: "#ff2222",
  },
  blueButton: {
    borderColor: "#2222ff",
  },
  touchable: {
    width: "90%",
  },
  buttonText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 3,
  },
  bottomDecoration: {
    alignItems: "center",
    marginTop: 40,
  },
  bottomLine: {
    height: 1,
    width: width * 0.9,
  },
});
