import { View, Text, StyleSheet, Pressable } from "react-native";

export default function SportsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>🏀 ⚾ Today's Games</Text>



         
       <Pressable  
         style={styles.gameCard}
            onPress={() => alert("Knicks vs Celtics")}
            >
            
            <View>
                <Text style={styles.info}>Knicks vs Celtics</Text>
                <Text style={styles.note}></Text>
            </View>

            <Text style={styles.timeBadge}>7:00 PM</Text>
        </Pressable>

        <Pressable 
          style={styles.gameCard}
           onPress={() => alert("Yankees vs Red Sox")}
           >
            <Text style={styles.info}>Yankees vs Red Sox</Text>
            <Text style={styles.timeBadge}>7:05 PM</Text>
        </Pressable>

        <Pressable
          style={styles.gameCard}
           onPress={() => alert(" Mets vs Phillies")}
           >
            <Text style={styles.info}>Mets vs Phillies</Text>
            <Text style={styles.timeBadge}>7:10 PM</Text>
        </Pressable>
            
            <Text style={styles.note}>
                Scores and Standings coming soon...
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f172a",
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 20,
    },
    info: {
        fontSize: 20,
        color: "#fff",
    },
    note: {
        marginTop: 20,
        color:"94a3b8",
        fontSize: 16,
    },

    gameCard: {
        backgroundColor: "#1e1e1e",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        minHeight: 70,
        alignSelf: "flex-start",
        alignItems: "center",
        width: "60%",
        flexDirection: "row",
        justifyContent: "space-between",
        borderColor: "rgba(255,255,255,0.1)",
    },

    timeBadge: {
        color: "#fff",
        backgroundColor: "#2563eb",
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 12,
        fontSize: 10,
        fontWeight: "bold",
    }
})