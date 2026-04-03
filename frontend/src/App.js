import { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Chat from "./components/Chat";
import "./App.css";
function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  // استخرج بيانات الـ JWT لتحديد role
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser(payload); // {username, role, id}
      } catch (err) {
        console.error("Invalid token");
        localStorage.removeItem("token");
      }
    }
  }, [loggedIn]);

  if (!loggedIn) {
    return showRegister ? (
      <Register onRegister={() => setShowRegister(false)} />
    ) : (
      <Login
        onLogin={() => setLoggedIn(true)}
        setShowRegister={setShowRegister}
      />
    );
  }

  return <Chat user={user} />;
}

export default App;
