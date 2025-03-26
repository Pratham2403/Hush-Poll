import axios from "axios";

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage if available
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  register: async (name: string, email: string, password: string) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response.data;
  },
};

// Polls API
export const pollsAPI = {
  // Create a new poll
  createPoll: async (pollData: any) => {
    const response = await api.post("/polls", pollData);
    return response.data;
  },

  // Get all public polls
  getPolls: async () => {
    const response = await api.get("/polls");
    return response.data;
  },

  // Get a specific poll by ID
  getPoll: async (id: string, inviteCode?: string) => {
    let url = `/polls/${id}`;
    if (inviteCode) {
      url += `?inviteCode=${inviteCode}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  // Get user's polls
  getUserPolls: async () => {
    const response = await api.get("/polls/user");
    return response.data;
  },

  // Submit a vote for a poll
  submitVote: async (
    pollId: string,
    voteData: { selectedOptions: string[]; voterToken: string }
  ) => {
    const response = await api.post(`/polls/${pollId}/vote`, voteData);
    return response.data;
  },

  // Get results for a poll
  getResults: async (pollId: string) => {
    const response = await api.get(`/polls/${pollId}/results`);
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getAllUsers: async () => {
    const response = await api.get("/admin/users");
    return response.data;
  },

  getAllPolls: async () => {
    const response = await api.get("/admin/polls");
    return response.data;
  },

  deletePoll: async (pollId: string) => {
    const response = await api.delete(`/admin/polls/${pollId}`);
    return response.data;
  },
};

export default api;
