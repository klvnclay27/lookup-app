import { View, Text, StyleSheet } from "react-native";

export default function MusicScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>🎵 Music Details</Text>

            <Text style={styles.info}>Top Track: Blinding Lights</Text>
            <Text style={styles.info}>Top Artist: NineEleven Kev</Text>
            <Text style={styles.info}>Trending Genre: Hip Hop</Text>

            <Text style={styles.note}>
               Music charts coming soon...
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
})