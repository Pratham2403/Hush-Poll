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
    // Get fresh token from localStorage every time
    // This ensures we always use the latest token even after login/refresh
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors without logging out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if it's a network error (backend server down)
    if (!error.response) {
      console.error("Network Error:", error.message);

      // Create a more user-friendly error that won't trigger logout
      return Promise.reject({
        response: {
          status: 503,
          data: {
            message: "Server connection lost. Please try again later.",
          },
        },
      });
    }

    // For other errors, maintain the original error structure
    // Don't handle auth errors with automatic logout
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      console.log("Login response:", response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Login failed");
      }
      throw new Error("Login failed: Network error");
    }
  },

  register: async (name: string, email: string, password: string) => {
    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Registration failed");
      }
      throw new Error("Registration failed: Network error");
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get("/auth/profile");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Failed to get profile");
      }
      throw new Error("Failed to get profile: Network error");
    }
  },

  updateProfile: async (data: { name: string; email: string }) => {
    try {
      const response = await api.put("/auth/profile", data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Failed to update profile"
        );
      }
      throw new Error("Failed to update profile: Network error");
    }
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    try {
      const response = await api.put("/auth/password", data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Failed to change password"
        );
      }
      throw new Error("Failed to change password: Network error");
    }
  },
};

// Polls API
export const pollsAPI = {
  // Create a new poll
  createPoll: async (pollData: any) => {
    try {
      const response = await api.post("/polls", pollData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Failed to create poll");
      }
      throw new Error("Failed to create poll: Network error");
    }
  },

  // Get all public polls
  getPolls: async () => {
    try {
      const response = await api.get("/polls");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Failed to fetch polls");
      }
      throw new Error("Failed to fetch polls: Network error");
    }
  },

  // Get available private polls for the current logged-in user
  getAvailablePrivatePolls: async () => {
    try {
      const response = await api.get("/polls/available-private");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message ||
            "Failed to fetch available private polls"
        );
      }
      throw new Error("Failed to fetch available private polls: Network error");
    }
  },

  // Get a specific poll by ID
  getPoll: async (id: string) => {
    try {
      let url = `/polls/${id}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      // Instead of throwing new Error, pass through the original error
      // This preserves the response object for more detailed error handling
      if (axios.isAxiosError(error)) {
        // Add a more user-friendly message but preserve the error structure
        error.message = error.response?.data?.message || "Failed to fetch poll";
        throw error;
      }
      // For non-axios errors, still wrap with a message
      throw new Error("Failed to fetch poll: Network error");
    }
  },

  // Update an existing poll
  updatePoll: async (pollId: string, pollData: any) => {
    try {
      const response = await api.put(`/polls/${pollId}`, pollData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Failed to update poll");
      }
      throw new Error("Failed to update poll: Network error");
    }
  },

  // Get user's polls
  getUserPolls: async () => {
    try {
      const response = await api.get("/polls/user");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Failed to fetch user polls"
        );
      }
      throw new Error("Failed to fetch user polls: Network error");
    }
  },

  // Submit a vote for a poll
  submitVote: async (
    pollId: string,
    voteData: { selectedOptions: string[]; voterToken: string }
  ) => {
    try {
      const response = await api.post(`/polls/${pollId}/vote`, voteData);
      return response.data;
    } catch (error) {
      // Instead of throwing new Error, pass through the original error
      // This preserves the response object for more detailed error handling
      if (axios.isAxiosError(error)) {
        // Add a more user-friendly message but preserve the error structure
        error.message =
          error.response?.data?.message || "Failed to submit vote";
        throw error;
      }
      // For non-axios errors, still wrap with a message
      throw new Error("Failed to submit vote: Network error");
    }
  },

  // Get results for a poll
  getResults: async (pollId: string) => {
    try {
      const response = await api.get(`/polls/${pollId}/results`);
      return response.data;
    } catch (error) {
      // Instead of throwing new Error, pass through the original error
      // This preserves the response object for more detailed error handling
      if (axios.isAxiosError(error)) {
        // Add a more user-friendly message but preserve the error structure
        error.message =
          error.response?.data?.message || "Failed to fetch results";
        throw error;
      }
      // For non-axios errors, still wrap with a message
      throw new Error("Failed to fetch results: Network error");
    }
  },

  // Delete a poll
  deletePoll: async (pollId: string) => {
    try {
      const response = await api.delete(`/polls/${pollId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Failed to delete poll");
      }
      throw new Error("Failed to delete poll: Network error");
    }
  },
};

// Admin API
export const adminAPI = {
  getAllUsers: async () => {
    try {
      const response = await api.get("/admin/users");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Failed to fetch users");
      }
      throw new Error("Failed to fetch users: Network error");
    }
  },

  getAllPolls: async () => {
    try {
      const response = await api.get("/admin/polls");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Failed to fetch polls");
      }
      throw new Error("Failed to fetch polls: Network error");
    }
  },

  getPollDetails: async (pollId: string) => {
    try {
      const response = await api.get(`/admin/polls/${pollId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Failed to fetch poll details"
        );
      }
      throw new Error("Failed to fetch poll details: Network error");
    }
  },

  forceEndPoll: async (pollId: string) => {
    try {
      const response = await api.post(`/admin/polls/${pollId}/end`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Failed to end poll");
      }
      throw new Error("Failed to end poll: Network error");
    }
  },

  toggleUserSuspension: async (userId: string) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/suspend`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Failed to toggle user suspension"
        );
      }
      throw new Error("Failed to toggle user suspension: Network error");
    }
  },

  deletePoll: async (pollId: string) => {
    try {
      const response = await api.delete(`/admin/polls/${pollId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Failed to delete poll");
      }
      throw new Error("Failed to delete poll: Network error");
    }
  },
};

export default api;
