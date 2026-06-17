import { View, Text, StyleSheet } from "react-native";

export default function FinanceScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>💰 Finance Details</Text>

            <Text style={styles.info}>S&P 500: +0.5</Text>
            <Text style={styles.info}>Dow Jones: +0.5</Text>
            <Text style={styles.info}>NASDAQ: +1.2</Text>

            <Text style={styles.note}>
               Stock watchlist coming soon...
            </Text>
        </View>
    );
}

const styles = StyleSheet.create ({
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
        marginBottom: 10,
    },
    note:{
        marginTop: 20,
        color: "#94a3b8",
    },
});