import { View, Text, StyleSheet, ScrollView} from "react-native";
import { useState, useEffect } from "react";
import { getWeather, getWeatherCondition } from "@/services/weather";
import { getSports } from "@/services/sports";
import { getEntertainment } from "@/services/entertainment";
import { getTraffic } from "@/services/traffic";
import { getFinance  } from "@/services/finance";
import { getMusic } from "@/services/music"



export default function HomeScreen() {
  const [temperature, setTemperature] = useState(95);
  const [condition, setCondition] = useState("Hot");
  const [loading, setLoading] = useState(true);
  const [commute, setCommute] = useState("Loading...");
  const [market, setMarket] = useState("Loading...");
  const [playlist, setPlaylist] = useState("Loading...");
  const [games, setGames] = useState<string[]>([]);
  const [movie, setMovie] = useState("Loading...")

  useEffect(() => {
  getWeather().then((data) => {
    setTemperature(data.temperature);
    setCondition(getWeatherCondition(data.weatherCode));

    getMusic().then((musicData) => {
      setPlaylist(musicData.playlist);
    });

     getSports().then((sportsData) => {
      setGames(sportsData.games);
    });

     getEntertainment().then((entertainmentData) => {
      setMovie(entertainmentData.movie);
    });

    getFinance().then((financeData) => {
      setMarket(financeData.market);
    });

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
      <View style={styles.card}>
      <Text style={styles.subtitle}>
        What to LookUP
      </Text>

      <Text style={styles.title}>👋 Daily Briefing</Text>

      <Text style={styles.cardText}>
        Weather: {temperature}°F • {condition}
      </Text>

       <Text style={styles.cardText}>
        Commute: {commute}
       </Text>

        <Text style={styles.cardText}>
          Market: {market}
        </Text>

         <Text style={styles.cardText}>
          Today's Playlist: {playlist}
         </Text>
         </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>☀️ Weather</Text>
      
      <Text style= {styles.cardText}>
        {loading ? "Loading weather..." : `${temperature} °F • ${condition}`}
      </Text>

      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚗 Traffic</Text>
        <Text style={styles.cardText}>
          {loading ? "Loading traffic..." : `Commute: ${commute}`}
        </Text>
        
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏀 Sports</Text>
        <Text style={styles.cardText}>
          {games.join(" |")}
        </Text>
        
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎬 Entertainment</Text>

        <Text style={styles.cardText}>
          Now Showing: {movie}
        </Text>
      </View>


      <View style={styles.card}>
        <Text style={styles.cardTitle}>📉 Finance</Text>
        <Text style={styles.cardText}>{market}</Text>
        
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎵 Music</Text>
        <Text style={styles.cardText}>{playlist}</Text>
        
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