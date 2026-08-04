import { View, Text, StyleSheet, ScrollView, Pressable} from "react-native";
import { useState, useEffect } from "react";
import { getWeather, getWeatherCondition } from "@/services/weather";
import { getSports } from "@/services/sports";
import { getEntertainment } from "@/services/entertainment";
import { getTraffic } from "@/services/traffic";
import { getFinance  } from "@/services/finance";
import { getMusic } from "@/services/music"
import { router } from "expo-router"
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";




export default function HomeScreen() {
  const insets = useSafeAreaInsets();
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
    async function loadDashboard() {
      try {
        await Promise.all([
          getWeather()
            .then((data) => {
              setTemperature(data.temperature);
              setCondition(getWeatherCondition(data.weatherCode));
            })
            .catch((error) => {
              console.error("Unable to load weather", error);
              setCondition("Weather unavailable");
            }),
          getMusic()
            .then((musicData) => {
              setPlaylist(musicData.playlist);
              setTracks(musicData.tracks);
            })
            .catch((error) => {
              console.error("Unable to load music", error);
              setPlaylist("Music unavailable");
              setTracks(["Music unavailable"]);
            }),
          getSports()
            .then((sportsData) => {
              setGames(sportsData.games);
            })
            .catch((error) => {
              console.error("Unable to load sports", error);
              setGames(["Sports unavailable"]);
            }),
          getEntertainment()
            .then((entertainmentData) => {
              setMovie(entertainmentData.movie);
            })
            .catch((error) => {
              console.error("Unable to load entertainment", error);
              setMovie("Entertainment unavailable");
            }),
          getFinance()
            .then((financeData) => {
              setMarket(financeData.market);
            })
            .catch((error) => {
              console.error("Unable to load finance", error);
              setMarket("Market unavailable");
            }),
          getTraffic()
            .then((trafficData) => {
              setCommute(trafficData.commute);
            })
            .catch((error) => {
              console.error("Unable to load traffic", error);
              setCommute("Traffic unavailable");
            }),
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);
 
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
        },
      ]}>
      <View style={styles.card}>

        <Text style={styles.heroDate}>
          
        </Text>

        <Text style={styles.welcome}>
          Your Day at a Glance
        </Text>

        <Text style={styles.subtitle}>
          Everything you need, all in one place. 
        </Text>

        <View style={styles.heroBanner}>
          <Text style={styles.heroTitle}>
            {temperature}°F
          </Text>
          <Text style={styles.heroSubtitle}>
           🌤️ {condition} • 🚗 {commute}
          </Text>
        </View>
      
      <Text style={styles.sectionTitle}>👋 Daily Briefing</Text>

      <Pressable
  style={styles.briefingRow}
  onPress={() => router.push("/weather")}
>
  <View style={styles.briefingContent}>
    <Text style={styles.cardText}>🌤️ Weather</Text>

    <Text style={styles.cardValue}>
      {temperature}°F • {condition}
    </Text>
  </View>

  <Text style={styles.arrow}>➜</Text>
</Pressable>

      <Pressable 
       style={styles.briefingRow}
        onPress={() => router.push("/explore")}
        >
          <Text style={styles.cardText}>
        🚗 Commute: {commute}
        </Text>
       </Pressable>

      <Pressable 
       style={styles.briefingRow}
        onPress={() => router.push("/finance")}
        >
          <Text style={styles.cardText}>
         📉 Market: {market}
         </Text>
        </Pressable>

      <Pressable 
       style={styles.briefingRow}
        onPress={() => router.push("/music")}
        >
          <Text style={styles.cardText}>
         🎵 Today's Playlist: {tracks[0]}
         </Text>
         </Pressable>

      <Pressable 
       style={styles.briefingRow}
        onPress={() => router.push("/sports")}
        >
          <Text style={styles.cardText}>
         🏀 Top Game: {games[0]}
         </Text>
         </Pressable>

      <Pressable 
          style={styles.briefingRow}
            onPress={() => router.push("/entertainment")}
            >
              <Text style={styles.cardText}>
         🎬 Featured Movie: {movie}
         </Text>
         </Pressable>
         </View>

         <View style={styles.quickStatsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{temperature}°</Text>
            <Text style={styles.statLabel}>🌤️ Weather</Text>
          </View>


          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{commute}</Text>
            <Text style={styles.statLabel}>🚗 Traffic</Text>
         </View>

         <View style={styles.statCard}>
          <Text style={styles.statNumber}>{market}</Text>
          <Text style={styles.statLabel}>📉 Market</Text>
        </View>
      

        <View style={styles.trendsCard}>
        <Text style={styles.sectionTitle}>
          🔥 Top Trends Today
        </Text>

        <Text style={styles.trendsSubtitle}>
          What's happening right now
        </Text>

        <Text style={styles.cardText}>
          🏀 {games[0]}
        </Text>

        <Text style={styles.cardText}>
          🎬 {movie}
        </Text>

        <Text style={styles.cardText}>
          🎵 {tracks[0]}
        </Text>
        
        </View>

       
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

      <Link href="/entertainment" asChild>
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

      
      <View style={[styles.card, {margin: 24}]}>
        <Text style={styles.cardTitle}>🎵 Music</Text>
        
        <Text style={[styles.cardText, {marginBottom: 8}]}>
          Top Tracks Today
        </Text>

        

        
        
      </View>
    </ScrollView>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },

  contentContainer: {
    paddingHorizontal: 20,
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
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor:"rgba(255,255,255,0.12)",
    shadowColor: "#000",
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

  quickStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 20,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: "center",
  },

  statNumber: {
    color: "#38bdf8",
    fontSize: 24,
    fontWeight: "bold",
  },

  statLabel: {
    color: "#cbd5e1",
    marginTop: 4,
  },

  heroDate: {
    color: "#94a3b8",
    fontSize: 16,
    marginBottom: 20,

  },

  heroBanner: {
    backgroundColor: "#1e40af",
    padding: 20,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  heroTitle:{
    color: "#fff",
    fontSize: 42,
    fontWeight: "bold",
  },

  heroSubtitle: {
    color: "#dbeafe",
    fontSize: 16,
    marginTop: 6,
  },

  trendsCard: {
    width: "100%",
    backgroundColor: "#1e293b",
    padding: 20,
    borderRadius: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",

  },

  sectionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },

  trendsSubtitle: {
    color: "#9ca3af",
    marginBottom: 12,
  },

  briefingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 12,
  },

  briefingContent: {
    flex: 1,
  },

  cardValue: {
    fontSize: 14,
    color: "#B8C5D6",
    marginTop: 4,
  },

  arrow: {
    fontSize: 30,
    color: "#00BFFF",
    fontWeight: "bold",
    marginLeft: 12,
  },

  

})
