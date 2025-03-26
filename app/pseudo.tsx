import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function Pseudo() {
  const [pseudo, setPseudo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Vérifier si un pseudo existe déjà
    const checkExistingPseudo = async () => {
      const existingPseudo = await AsyncStorage.getItem("userPseudo");
      if (existingPseudo) {
        router.replace("/");
      }
    };
    checkExistingPseudo();
  }, []);

  const handleSubmit = async () => {
    if (!pseudo.trim()) {
      setError("Le pseudo ne peut pas être vide");
      return;
    }

    try {
      await AsyncStorage.setItem("userPseudo", pseudo.trim());
      router.replace("/");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du pseudo:", error);
      setError("Une erreur est survenue");
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#000000", "#333333"]}
        style={styles.contentContainer}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>CHOISISSEZ VOTRE PSEUDO</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={pseudo}
            onChangeText={setPseudo}
            placeholder="Entrez votre pseudo"
            placeholderTextColor="#666666"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>CONTINUER</Text>
        </TouchableOpacity>
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
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: "#cccccc",
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 30,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    color: "white",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  errorText: {
    color: "#ff4444",
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#333333",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
