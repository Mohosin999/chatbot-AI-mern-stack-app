import React from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Loading from "./pages/Loading";
// Prism css file to style the code blocks
import "./assets/prism.css";

const App = () => {
  return (
    <div className="selection:bg-orange-400">
      <Toaster position="top-right" />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="*" element={<Loading />} />
      </Routes>

      <div>
        <h1>Welcome to My App</h1>
      </div>
    </div>
  );
};

export default App;
