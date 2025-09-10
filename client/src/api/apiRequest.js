import axiosInstance from "./axiosInstance";

export const apiRequest = async ({ method, url, data, params, headers }) => {
  try {
    const config = { method, url, params, headers, withCredentials: true };
    if (data) config.data = data;
    const response = await axiosInstance(config);

    return response.data?.data || response.data;
  } catch (error) {
    console.error(error.response?.data || error, "API request error");
    throw error.response?.data || error;
  }
};
