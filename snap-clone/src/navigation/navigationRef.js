import { createNavigationContainerRef } from "@react-navigation/native";

// Erlaubt Navigation von ausserhalb der Screen-Baumstruktur (z.B. vom
// globalen Neue-Nachricht-Banner), wo useNavigation() nicht verfuegbar ist.
export const navigationRef = createNavigationContainerRef();
