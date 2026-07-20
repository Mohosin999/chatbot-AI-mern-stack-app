import React from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Loading from "./pages/Loading";
import Upgrade from "./pages/Upgrade";
import "./assets/prism.css";

const App = () => {
  return (
    <div>
      <Toaster position="top-right" />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="*" element={<Loading />} />
      </Routes>
    </div>
  );
};

export default App;
