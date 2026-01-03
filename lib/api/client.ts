import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios"
import { auth } from "@/lib/firebase"

const ASSESSMENTS_API_URL = "https://api.trieduconline.com.br/assessments"
const USERS_API_URL = "https://api.trieduconline.com.br/users"

export interface ApiError {
  message: string
  status?: number
  data?: any
}

export class ApiClient {
  private client: AxiosInstance

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Request interceptor para adicionar token do Firebase
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          const user = auth.currentUser
          if (user) {
            const token = await user.getIdToken()
            if (token && config.headers) {
              config.headers.Authorization = `Bearer ${token}`
            }
          }
        } catch (error) {
          console.error("Erro ao obter token do Firebase:", error)
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor para tratamento de erros
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const apiError: ApiError = {
          message: error.message || "Erro na requisição",
          status: error.response?.status,
          data: error.response?.data,
        }

        // Tratamento específico de erros
        if (error.response?.status === 401) {
          apiError.message = "Não autenticado. Por favor, faça login novamente."
        } else if (error.response?.status === 403) {
          apiError.message = "Sem permissão para acessar este recurso."
        } else if (error.response?.status === 404) {
          apiError.message = "Recurso não encontrado."
        }

        return Promise.reject(apiError)
      }
    )
  }

  // Método público para atualizar token manualmente (se necessário)
  setAuthToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`
    } else {
      delete this.client.defaults.headers.common["Authorization"]
    }
  }

  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }
}

// Instância do cliente para Assessments API
export const assessmentsApi = new ApiClient(ASSESSMENTS_API_URL)

// Instância do cliente para Users API
export const usersApi = new ApiClient(USERS_API_URL)
