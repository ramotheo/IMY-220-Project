export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function apiRequest(path, options = {}) {
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
        },
    });
    const data = response.status === 204
        ? null
        : await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.message || "The request could not be completed.");
    }

    return data;
}

export function getImageUrl(image) {
    if (!image) return "";
    if (/^(https?:|data:)/i.test(image)) return image;
    return `${API_BASE_URL}${image.startsWith("/") ? image : `/uploads/${image}`}`;
}