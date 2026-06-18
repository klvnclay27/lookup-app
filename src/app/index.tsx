import { View, Text, StyleSheet, ScrollView} from "react-native";
import { useState, useEffect } from "react";
import { getWeather, getWeatherCondition } from "@/services/weather";
import { getSports } from "@/services/sports";
import { getEntertainment } from "@/services/entertainment";
import { getTraffic } from "@/services/traffic";
import { getFinance  } from "@/services/finance";
import { getMusic } from "@/services/music"
import { Link } from "expo-router";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";



export default function HomeScreen() {
  const [temperature, setTemperature] = useState(95);
  const [condition, setCondition] = useState("Hot");
  const [loading, setLoading] = useState(true);
  const [commute, setCommute] = useState("Loading...");
  const [market, setMarket] = useState("Loading...");
  const [playlist, setPlaylist] = useState("Loading...");
  const [games, setGames] = useState<string[]>([]);
  const [movie, setMovie] = useState("Loading...")
  const [tracks, setTracks] = useState<string[]>([]);

  useEffect(() => {
    getWeather()
    .then((data) => {
      setTemperature(data.temperature);
      setCondition(getWeatherCondition(data.weatherCode));
    })
    .catch(() => setCondition("Weather unavailable"));

    getMusic()
    .then((musicData) => {
      setPlaylist(musicData.playlist);
      setTracks(musicData.tracks);
    });

    getSports()
    .then((sportsData) => {
      setGames(sportsData.games)
    });

    getEntertainment()
    .then((EntertainmentData) => {
      setMovie(EntertainmentData.movie)
    });

    getFinance()
    .then((financeData) => {
      setMarket(financeData.market)
    });

    getTraffic()
    .then((trafficData) => {
      setCommute(trafficData.commute)
    });

    setLoading(false);

    
  }, []);

    
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>

        <Text style={styles.welcome}>
          Welcome to LookUP
        </Text>

        <Text style={styles.subtitle}>
          Your daily hub for Weather, Traffic, Sports, Entertainment, Finance & Music
        </Text>
      

      <Text style={styles.title}>👋 Daily Briefing</Text>

      <Text style={styles.cardText}>
       🌤️ Weather: {temperature}°F • {condition}
      </Text>

       <Text style={styles.cardText}>
        🚗 Commute: {commute}
       </Text>

        <Text style={styles.cardText}>
         📉 Market: {market}
        </Text>

         <Text style={styles.cardText}>
         🎵 Today's Playlist: {tracks[0]}
         </Text>

          <Text style={styles.cardText}>
         🏀 Top Game: {games[0]}
         </Text>

         <Text style={styles.cardText}>
         🎬 Featured Movie: {movie}
         </Text>

         
         </View>
      <Link href="/weather" asChild>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>☀️ Weather</Text>
      
      <Text style= {styles.cardText}>
        {loading ? "Loading weather..." : `${temperature} °F • ${condition}`}
      </Text>

      </View>
      </Link>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚗 Traffic</Text>
        <Text style={styles.cardText}>
          {loading ? "Loading traffic..." : `Commute: ${commute}`}
        </Text>
        
      </View>
      <Link href="/sports" asChild>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏀 Sports</Text>
        
        <Text style={[styles.cardTitle, {marginBottom: 8}]}>
          Today's Games
        </Text>

        {games.map((game, index) => (
          <Text
             key={index}
             style={[styles.cardText, {marginBottom: 4 }]}
             >
              {game}
             </Text>
        ))}
        
      </View>
      </Link>

      <Link href="/sports" asChild>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎬 Entertainment</Text>

        <Text style={styles.cardText}>
          Now Showing: {movie}
        </Text>
      </View>
      </Link>

      <Link href="/finance" asChild>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📉 Finance</Text>
        <Text style={styles.cardText}>{market}</Text>
        
      </View>
      </Link>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎵 Music</Text>
        
        <Text style={[styles.cardText, {marginBottom: 8}]}>
          Top Tracks Today
        </Text>

         {tracks.map((track, index) => (
          <Text key={index} style={styles.cardText}>
            • {track}
          </Text>
        ))}
        
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
    borderWidth: 1,
    borderColor:"rgba(255,255,255,0.12)",
    shadowColor: "000",
    shadowOffset: { width: 0, height: 8},
    shadowOpacity: 0.25,
    elevation: 8,
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

  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    marginBottom: 10,

  },
  quickItem: {
    fontSize: 16,
    color: "#b3b3b3",
    marginBottom: 6,
  },

  subtitle: {
    color: "#b3b3b3",
    fontSize: 18,
    marginBottom: 25,
  },

  welcome: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },

})