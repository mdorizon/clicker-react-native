import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";

interface Upgrade {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  owned: number;
  multiplier: number;
}

export default function Shop() {
  const [userTeam, setUserTeam] = useState<"rouge" | "bleu" | null>(null);
  const [personalClicks, setPersonalClicks] = useState(0);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    {
      id: "clickBoost",
      name: "Boost de Clic",
      description: "Ajoute +0.1 points par clic pour chaque niveau",
      basePrice: 100,
      owned: 0,
      multiplier: 0.1,
    },
    {
      id: "autoClicker",
      name: "Auto-Clicker",
      description: "Ajoute +0.1 points par seconde pour chaque niveau",
      basePrice: 500,
      owned: 0,
      multiplier: 0.1,
    },
    {
      id: "superBoost",
      name: "Super Boost",
      description: "Ajoute +0.5 points par clic pour chaque niveau",
      basePrice: 750,
      owned: 0,
      multiplier: 0.5,
    },
  ]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const team = await AsyncStorage.getItem("selectedTeam");
        if (team === "rouge" || team === "bleu") {
          setUserTeam(team);
        }

        // Charger les améliorations achetées
        const savedUpgrades = await AsyncStorage.getItem("upgrades");
        if (savedUpgrades) {
          const parsedUpgrades = JSON.parse(savedUpgrades);
          setUpgrades((prevUpgrades) =>
            prevUpgrades.map((upgrade) => ({
              ...upgrade,
              owned: parsedUpgrades[upgrade.id]?.owned || 0,
            }))
          );
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };
    loadData();
  }, []);

  // Récupérer l'ID de l'appareil
  useEffect(() => {
    const getDeviceId = async () => {
      try {
        const storedId = await AsyncStorage.getItem("deviceId");
        if (storedId) {
          setDeviceId(storedId);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'ID:", error);
      }
    };
    getDeviceId();
  }, []);

  // Charger les clics personnels depuis Firebase
  useEffect(() => {
    if (!deviceId) return;

    const playerRef = doc(db, "playerStats", deviceId);
    const unsubscribe = onSnapshot(playerRef, (doc) => {
      if (doc.exists()) {
        setPersonalClicks(doc.data().totalClicks || 0);
      }
    });

    return () => unsubscribe();
  }, [deviceId]);

  // Charger les améliorations depuis Firebase
  useEffect(() => {
    const loadUpgrades = async () => {
      try {
        if (!deviceId) return;

        const upgradesRef = doc(db, "playerUpgrades", deviceId);
        const upgradesDoc = await getDoc(upgradesRef);

        if (upgradesDoc.exists()) {
          const savedUpgrades = upgradesDoc.data();
          setUpgrades((prevUpgrades) =>
            prevUpgrades.map((upgrade) => ({
              ...upgrade,
              owned: savedUpgrades[upgrade.id]?.owned || 0,
            }))
          );
        }
      } catch (error) {
        console.error("Erreur lors du chargement des améliorations:", error);
      }
    };
    loadUpgrades();
  }, [deviceId]);

  const calculatePrice = (upgrade: Upgrade) => {
    return Math.round(upgrade.basePrice * Math.pow(1.1, upgrade.owned));
  };

  const handlePurchase = async (upgrade: Upgrade) => {
    try {
      if (!deviceId) return;

      const price = calculatePrice(upgrade);
      if (personalClicks < price) return;

      // Mettre à jour les clics personnels
      const playerStatsRef = doc(db, "playerStats", deviceId);
      await updateDoc(playerStatsRef, {
        totalClicks: increment(-price),
      });

      // Mettre à jour les améliorations dans Firebase
      const upgradesRef = doc(db, "playerUpgrades", deviceId);
      const upgradesDoc = await getDoc(upgradesRef);
      const currentUpgrades = upgradesDoc.exists() ? upgradesDoc.data() : {};

      await setDoc(upgradesRef, {
        ...currentUpgrades,
        [upgrade.id]: {
          owned: (currentUpgrades[upgrade.id]?.owned || 0) + 1,
        },
      });

      // Mettre à jour l'état local
      setUpgrades((prevUpgrades) =>
        prevUpgrades.map((u) =>
          u.id === upgrade.id ? { ...u, owned: u.owned + 1 } : u
        )
      );
    } catch (error) {
      console.error("Erreur lors de l'achat:", error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          userTeam === "rouge" ? ["#000000", "#ff4444"] : ["#000000", "#4444ff"]
        }
        style={styles.contentContainer}
        locations={[0.2, 1]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>BOUTIQUE</Text>
          <View style={styles.clicksContainer}>
            <Text style={styles.clicksText}>{personalClicks.toFixed(1)}</Text>
            <Ionicons name="hand-left" size={20} color="white" />
          </View>
        </View>

        <ScrollView style={styles.upgradesList}>
          {upgrades.map((upgrade) => (
            <View
              key={upgrade.id}
              style={[
                styles.upgradeCard,
                { borderColor: userTeam === "rouge" ? "#ff4444" : "#4444ff" },
              ]}
            >
              <View style={styles.upgradeInfo}>
                <View style={styles.upgradeHeader}>
                  <View style={styles.upgradeTitleContainer}>
                    <Ionicons
                      name={
                        upgrade.id === "autoClicker"
                          ? "time"
                          : upgrade.id === "clickBoost"
                          ? "flash"
                          : "star"
                      }
                      size={24}
                      color="white"
                      style={styles.upgradeIcon}
                    />
                    <Text style={styles.upgradeName}>{upgrade.name}</Text>
                  </View>
                  <Text style={styles.upgradePrice}>
                    {calculatePrice(upgrade)} clics
                  </Text>
                </View>
                <Text style={styles.upgradeDescription}>
                  {upgrade.description}
                </Text>
                <Text style={styles.upgradeOwned}>
                  Possédé: {upgrade.owned}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.buyButton,
                  {
                    backgroundColor:
                      personalClicks >= calculatePrice(upgrade)
                        ? userTeam === "rouge"
                          ? "#ff4444"
                          : "#4444ff"
                        : "#666666",
                  },
                ]}
                onPress={() => handlePurchase(upgrade)}
                disabled={personalClicks < calculatePrice(upgrade)}
                activeOpacity={0.7}
              >
                <Text style={styles.buyButtonText}>
                  {calculatePrice(upgrade)} clics
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 40,
  },
  backButton: {
    padding: 10,
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
  clicksContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  clicksText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 5,
  },
  upgradesList: {
    flex: 1,
  },
  upgradeCard: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
  },
  upgradeInfo: {
    marginBottom: 10,
  },
  upgradeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  upgradeTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  upgradeIcon: {
    marginRight: 8,
  },
  upgradeName: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  upgradeDescription: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginBottom: 5,
  },
  upgradeOwned: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
  },
  buyButton: {
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  buyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  upgradePrice: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
  },
});
