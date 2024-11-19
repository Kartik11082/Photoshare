import React, { useState } from "react";
import { TextField, Button, Typography, Box } from "@mui/material";
import axios from "axios";

function LoginRegister({ setCurrentUser }) {
    const [loginName, setLoginName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async () => {
        try {
            const loginData = { login_name: loginName, password: password };
            console.log("Login data:", loginData);
            const response = await axios.post("/admin/login", loginData);
            console.log("Login response:", response.data);
            setCurrentUser(response.data);
            setError("");
        } catch (err) {
            setError("Invalid login name. Please try again.");
        }
    };

    return (
        <Box display="flex" flexDirection="column" alignItems="center" mt={5}>
            <Typography variant="h5">Login</Typography>
            <TextField
                label="Login Name"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                style={{ marginBottom: "20px", width: "300px" }}
            />
            <TextField
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ marginBottom: "20px", width: "300px" }}
            />
            <Button variant="contained" color="primary" onClick={handleLogin}>
                Login
            </Button>
            {error && <Typography color="error" mt={2}>{error}</Typography>}
        </Box>
    );
}

export default LoginRegister;
