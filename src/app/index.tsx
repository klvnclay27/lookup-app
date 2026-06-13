import { View, Text, StyleSheet, ScrollView} from "react-native";
import { useState, useEffect, use} from "react";
import { getWeather, getWeatherCondition } from "@/services/weather";
import { getTraffic } from "@/services/traffic";


export default function HomeScreen() {
  const [temperature, setTemperature] = useState(95);
  const [condition, setCondition] = useState("Hot");
  const [loading, setLoading] = useState(true);
  const [commute, setCommute] = useState("Loading...");

  useEffect(() => {
  getWeather().then((data) => {
    setTemperature(data.temperature);
    setCondition(getWeatherCondition(data.weatherCode));

    getTraffic().then((trafficData) => {
      setCommute(trafficData.commute);
    });
    setLoading(false);
  })
  .catch(() => {
    setCondition("Weather unavailable");
    setLoading(false);
  })
  }, []);

    
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Good Afternoon Kelvin</Text>

      <Text style={styles.subtitle}>
        What to LookUP
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>☀️ Weather</Text>
      
      <Text style= {styles.cardText}>
        {loading ? "Loading weather..." : `${temperature} °F • ${condition}`}
      </Text>   
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚗 Traffic</Text>
        <Text style={styles.cardText}>Commute: {commute}</Text>
        
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📉 Finance</Text>
        <Text style={styles.cardText}>S&P 500 +0.8</Text>
        
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎵 Music</Text>
        <Text style={styles.cardText}>Todays's Playlist</Text>
        
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
  },
  title: {
    color:"white",
    fontSize: 36,
    fontWeight: "bold",
    marginTop: 50,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#1e1e1e",
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
  },
  cardTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  cardText: {
    color: "#b3b3b3",
    fontSize: 14,
  },
  subtitle: {
    color: "#b3b3b3",
    fontSize: 18,
    marginBottom: 25,
  }
})