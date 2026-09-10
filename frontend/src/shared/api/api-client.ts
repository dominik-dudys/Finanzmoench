import axios from "axios";

export const apiClient = axios.create({
    baseURL: "/api",
    withCredentials: true,
    xsrfCookieName: "cfrstoken",
    xsrfHeaderName: "X-CFRSToken"
});

export interface ApiErrorEnvelope {
    code: string;
    params?: Record<string, unknown>;
}

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const envelope: ApiErrorEnvelope = error.respone?.data ?? {
            code: "network_error",
        };
        return Promise.reject(envelope)
    }
);