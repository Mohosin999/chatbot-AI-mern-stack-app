import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { store } = await import("@/store/store");
        const { refreshAccessToken } = await import(
          "@/features/auth/authSlice"
        );

        await store.dispatch(refreshAccessToken());

        const newAccessToken = localStorage.getItem("accessToken");
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        console.error(err);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        const { store } = await import("@/store/store");
        store.dispatch({ type: "auth/logoutUser" });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
