import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth, Auth } from "firebase/auth"
import { getAnalytics, Analytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyBbxw7bEVA74MsCfLrQAQzx055j8P7b510",
  authDomain: "tarefas-37fab.firebaseapp.com",
  projectId: "tarefas-37fab",
  storageBucket: "tarefas-37fab.firebasestorage.app",
  messagingSenderId: "142960662748",
  appId: "1:142960662748:web:8f83d71c4eb2cefda4fc19",
  measurementId: "G-B7MYN1L0JN"
}

// Initialize Firebase
let app: FirebaseApp
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

// Initialize Auth
export const auth: Auth = getAuth(app)

// Initialize Analytics (only in browser)
export const analytics: Analytics | null = 
  typeof window !== "undefined" ? getAnalytics(app) : null

export default app

