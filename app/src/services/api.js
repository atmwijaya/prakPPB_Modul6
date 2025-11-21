import { BACKEND_URL } from "./config.js";
import { supabase } from "./supabaseClient.js";

console.log("🚀 API Initialized with URL:", BACKEND_URL);

let globalToken = null;

// Setup auth listener
export const setupApiAuth = () => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    globalToken = session?.access_token || null;
    console.log("🔄 API Auth Updated - Token:", !!globalToken);
  });

  supabase.auth.getSession().then(({ data: { session } }) => {
    globalToken = session?.access_token || null;
    console.log("🔑 Initial API Token:", !!globalToken);
  });

  return subscription;
};

// Enhanced request function dengan timeout
async function request(path, options = {}) {
  console.log("🌐 API Request:", { 
    path, 
    method: options.method || 'GET',
    hasToken: !!globalToken 
  });

  // Validasi BACKEND_URL
  if (!BACKEND_URL || BACKEND_URL.includes('localhost') || BACKEND_URL.includes('127.0.0.1')) {
    console.warn("⚠️ BACKEND_URL menggunakan localhost - akan menggunakan mock data");
    throw new Error('MOCK_DATA_MODE');
  }

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Tambahkan token jika ada
  if (globalToken) {
    headers['Authorization'] = `Bearer ${globalToken}`;
  }

  const url = `${BACKEND_URL}${path}`;
  
  try {
    console.log("📡 Making request to:", url);
    
    // Tambahkan timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log("📨 Response status:", response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          // Coba parse error message dari JSON
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.message || errorText;
          } catch {
            errorMessage = errorText;
          }
        }
      } catch (e) {
        // Ignore text reading errors
      }
      throw new Error(errorMessage);
    }

    // Handle empty responses
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();
    console.log("✅ API Success - Data received:", 
      Array.isArray(data) ? `${data.length} items` : 'object'
    );
    
    return data;
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("💥 API Request Failed:", error.message);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: Backend server is not responding');
    }
    
    if (error.message.includes('Network request failed') || 
        error.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to backend at ${BACKEND_URL}`);
    }
    
    throw error;
  }
}

// Realistic mock data
const generateMockSensorData = () => {
  const baseTime = Date.now();
  const readings = [
    {
      id: '1',
      temperature: 25.5,
      threshold_value: 30.0,
      recorded_at: new Date(baseTime).toISOString()
    },
    {
      id: '2',
      temperature: 26.2,
      threshold_value: 30.0,
      recorded_at: new Date(baseTime - 300000).toISOString()
    },
    {
      id: '3',
      temperature: 24.8,
      threshold_value: 30.0,
      recorded_at: new Date(baseTime - 600000).toISOString()
    },
    {
      id: '4',
      temperature: 27.1,
      threshold_value: 30.0,
      recorded_at: new Date(baseTime - 900000).toISOString()
    },
    {
      id: '5',
      temperature: 23.9,
      threshold_value: 30.0,
      recorded_at: new Date(baseTime - 1200000).toISOString()
    }
  ];
  console.log("📊 Generated mock sensor data:", readings.length, "items");
  return readings;
};

let mockThresholds = [
  {
    id: '1',
    value: 30.0,
    note: 'Default summer threshold',
    created_at: new Date().toISOString()
  },
  {
    id: '2', 
    value: 28.5,
    note: 'Previous setting for equipment calibration',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '3',
    value: 32.0,
    note: 'High temperature season adjustment',
    created_at: new Date(Date.now() - 172800000).toISOString()
  }
];

export const Api = {
  async getSensorReadings() {
    try {
      console.log("📊 [API] Fetching sensor readings...");
      const data = await request("/api/readings");
      
      if (!Array.isArray(data)) {
        console.warn("📊 [API] Unexpected response format, using mock data");
        return generateMockSensorData();
      }
      
      console.log(`📊 [API] Successfully fetched ${data.length} sensor readings`);
      
      // Validate data structure
      const validData = data.filter(item => 
        item && 
        typeof item.temperature === 'number' &&
        item.recorded_at
      );
      
      return validData.length > 0 ? validData : generateMockSensorData();
      
    } catch (error) {
      if (error.message === 'MOCK_DATA_MODE') {
        console.log("📊 [API] Using mock data mode for sensor readings");
      } else {
        console.warn("📊 [API] Using mock sensor data due to:", error.message);
      }
      return generateMockSensorData();
    }
  },

  async getThresholds() {
    try {
      console.log("⚙️ [API] Fetching thresholds...");
      const data = await request("/api/thresholds");
      
      if (!Array.isArray(data)) {
        console.warn("⚙️ [API] Unexpected response format, using mock data");
        return mockThresholds;
      }
      
      console.log(`⚙️ [API] Successfully fetched ${data.length} thresholds`);
      
      // Validate data structure
      const validData = data.filter(item => 
        item && 
        typeof item.value === 'number' &&
        item.created_at
      );
      
      return validData.length > 0 ? validData : mockThresholds;
      
    } catch (error) {
      if (error.message === 'MOCK_DATA_MODE') {
        console.log("⚙️ [API] Using mock data mode for thresholds");
      } else {
        console.warn("⚙️ [API] Using mock threshold data due to:", error.message);
      }
      return mockThresholds;
    }
  },

  async createThreshold(payload) {
    try {
      console.log("💾 [API] Creating threshold...", payload);
      const data = await request("/api/thresholds", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      console.log("💾 [API] Threshold created successfully");
      
      // Update mock data untuk konsistensi UI
      if (data && data.id) {
        const newThreshold = {
          id: data.id,
          value: data.value,
          note: data.note || '',
          created_at: data.created_at || new Date().toISOString()
        };
        mockThresholds.unshift(newThreshold);
        console.log("💾 [API] Mock data updated with new threshold");
      }
      
      return data;
      
    } catch (error) {
      console.warn("💾 [API] Using mock threshold creation due to:", error.message);
      
      // Create realistic mock response
      const mockResponse = {
        id: `mock-${Date.now()}`,
        value: payload.value,
        note: payload.note || '',
        created_at: new Date().toISOString()
      };
      
      // Update mock data
      mockThresholds.unshift(mockResponse);
      console.log("💾 [API] Created mock threshold:", mockResponse);
      
      return mockResponse;
    }
  },

  // Enhanced connection test
  async testConnection() {
    try {
      console.log("🧪 Testing backend connection...");
      
      if (!BACKEND_URL || BACKEND_URL.includes('localhost') || BACKEND_URL.includes('127.0.0.1')) {
        console.log("🧪 Connection test: MOCK MODE (localhost URL)");
        return false;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${BACKEND_URL}/api/readings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const success = response.ok;
      console.log("🧪 Connection test:", success ? "SUCCESS" : "FAILED", response.status);
      return success;
      
    } catch (error) {
      console.log("🧪 Connection test: FAILED -", error.message);
      return false;
    }
  },

  // Get connection status info
  getConnectionInfo() {
    return {
      backendUrl: BACKEND_URL,
      isMockMode: !BACKEND_URL || BACKEND_URL.includes('localhost') || BACKEND_URL.includes('127.0.0.1'),
      hasToken: !!globalToken
    };
  }
};

// Initialize auth listener
setupApiAuth();