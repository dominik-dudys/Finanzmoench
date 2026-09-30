
import {apiClient} from "@/shared/api";
import {isAllauthResponse, type SessionResponse} from "@/features/auth/api";

const ACCOUNT = "auth/browser/v1/account";
const AUTH = "auth/browser/v1/auth";

// ---------- Typen ----------

export type Authenticator =
    | {type: "totp"; created_at: number; last_used_at: number | null}
    | {type: "recovery_codes"; created_at: number; total_code_count: number; unused_code_count: number};

export interface TotpSetup {
    secret: string;
    totp_url: string; // otpauth://... → wird zum QR-Code
}

export interface RecoveryCodes {
    total_code_count: number;
    unused_code_count: number;
    unused_codes: string[];
}

// allauth antwortet mit 401 + flow "reauthenticate", wenn der Login >5 Min her ist
export function needsReauth(err: unknown): boolean {
    return isAllauthResponse(err)
        && err.status === 401
        && (err.data?.flows ?? []).some((f) => f.id === "reauthenticate");
}

// ---------- Status ----------

export async function getAuthenticators(): Promise<Authenticator[]> {
    const res = await apiClient.get<{data: Authenticator[]}>(`${ACCOUNT}/authenticators`);
    return res.data.data;
}

// ---------- TOTP ----------

// Liefert Secret + otpauth-URL, solange TOTP noch nicht aktiv ist (allauth: 404 + meta)
export async function getTotpSetup(): Promise<TotpSetup> {
    const res = await apiClient.get<{status: number; meta?: TotpSetup}>(
        `${ACCOUNT}/authenticators/totp`,
        {validateStatus: (s) => s === 200 || s === 404},
    );
    if (res.status === 404 && res.data.meta) {
        return res.data.meta;
    }
    throw new Error("TOTP ist bereits aktiv");
}

export async function activateTotp(code: string): Promise<void> {
    await apiClient.post(`${ACCOUNT}/authenticators/totp`, {code});
}

export async function deactivateTotp(): Promise<void> {
    await apiClient.delete(`${ACCOUNT}/authenticators/totp`);
}

// ---------- Recovery-Codes ----------

export async function getRecoveryCodes(): Promise<RecoveryCodes> {
    const res = await apiClient.get<{data: RecoveryCodes}>(`${ACCOUNT}/authenticators/recovery-codes`);
    return res.data.data;
}

export async function regenerateRecoveryCodes(): Promise<RecoveryCodes> {
    const res = await apiClient.post<{data: RecoveryCodes}>(`${ACCOUNT}/authenticators/recovery-codes`);
    return res.data.data;
}

// ---------- Reauth (Passwort erneut bestätigen) ----------

export async function reauthenticate(password: string): Promise<SessionResponse> {
    const res = await apiClient.post(`${AUTH}/reauthenticate`, {password});
    return res.data;
}

// ---------- Login-Schritt (Etappe 3) ----------

export async function authenticate2fa(code: string): Promise<SessionResponse> {
    const res = await apiClient.post(`${AUTH}/2fa/authenticate`, {code});
    return res.data;
}