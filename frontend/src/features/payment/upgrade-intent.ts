const KEY = "upgrade_intent";
const MAX_AGE_MS = 30 * 60 * 1000; // 30 Minuten

// Beim Klick auf "Registrieren & upgraden" merken
export function setUpgradeIntent(): void {
    try {
        sessionStorage.setItem(KEY, String(Date.now()));
    } catch {
        // sessionStorage nicht verfügbar
    }
}

export function hasUpgradeIntent(): boolean {
    try {
        const value = sessionStorage.getItem(KEY);
        return value !== null && Date.now() - Number(value) < MAX_AGE_MS;
    } catch {
        return false;
    }
}

export function clearUpgradeIntent(): void {
    try {
        sessionStorage.removeItem(KEY);
    } catch {
        // sessionStorage nicht verfügbar
    }
}