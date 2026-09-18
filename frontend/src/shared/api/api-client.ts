import axios from "axios";

export const apiClient = axios.create({
    baseURL: "/api",
    withCredentials: true,
    xsrfCookieName: "csrftoken",
    xsrfHeaderName: "X-CSRFToken"
});

export interface ApiErrorEnvelope {
    code: string;
    params?: Record<string, unknown>;
}

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const envelope: ApiErrorEnvelope = error.response?.data ?? {
            code: "network_error",
        };
        return Promise.reject(envelope)
    }
);