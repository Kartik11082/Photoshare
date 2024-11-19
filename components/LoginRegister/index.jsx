import React, { useState } from "react";
import { TextField, Button, Typography, Box, Divider } from "@mui/material";
import axios from "axios";

function LoginRegister({ setCurrentUser }) {
    // Login states
    const [loginUsername, setLoginUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Registration states
    const [registerUsername, setRegisterUsername] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [occupation, setOccupation] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Error/success states
    const [loginError, setLoginError] = useState("");
    const [registerError, setRegisterError] = useState("");
    const [registerSuccess, setRegisterSuccess] = useState(false);

    const handleLogin = async () => {
        try {
            const loginData = {
                login_name: loginUsername,
                password: loginPassword
            };
            const response = await axios.post("/admin/login", loginData);
            setCurrentUser(response.data);
            setLoginError("");
        } catch (err) {
            setLoginError(err.response?.data?.message || "Invalid login credentials. Please try again.");
        }
    };

    const handleRegister = async () => {
        setRegisterError("");
        setRegisterSuccess(false);

        if (registerPassword !== confirmPassword) {
            setRegisterError("Passwords do not match");
            return;
        }

        if (!registerUsername || !registerPassword || !firstName || !lastName) {
            setRegisterError("Required fields are missing");
            return;
        }

        try {
            const response = await axios.post('/user', {
                login_name: registerUsername,
                password: registerPassword,
                first_name: firstName,
                last_name: lastName,
                location,
                description,
                occupation
            });
            console.log("Register response:", response.data);

            setRegisterSuccess(true);
            // Clear form fields
            setRegisterUsername('');
            setRegisterPassword('');
            setFirstName('');
            setLastName('');
            setLocation('');
            setDescription('');
            setOccupation('');
            setConfirmPassword('');
        } catch (error) {
            setRegisterError(error.response?.data?.message || "Registration failed");
        }
    };

    return (
        <Box display="flex" flexDirection="column" alignItems="center" mt={5}>
            <Typography variant="h5" gutterBottom>Login</Typography>
            <TextField
                label="Login Name"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                style={{ marginBottom: "10px", width: "300px" }}
            />
            <TextField
                label="Password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                style={{ marginBottom: "20px", width: "300px" }}
            />
            <Button variant="contained" color="primary" onClick={handleLogin}>
                Login
            </Button>
            {loginError && <Typography color="error" mt={2}>{loginError}</Typography>}

            <Divider style={{ width: "100%", margin: "30px 0" }} />

            <Typography variant="h5" gutterBottom>Register New Account</Typography>
            <TextField
                label="Login Name *"
                value={registerUsername}
                onChange={e => setRegisterUsername(e.target.value)}
                style={{ marginBottom: "10px", width: "300px" }}
            />
            <TextField
                label="Password *"
                type="password"
                value={registerPassword}
                onChange={e => setRegisterPassword(e.target.value)}
                style={{ marginBottom: "10px", width: "300px" }}
            />
            <TextField
                label="Confirm Password *"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ marginBottom: "10px", width: "300px" }}
            />
            <TextField
                label="First Name *"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                style={{ marginBottom: "10px", width: "300px" }}
            />
            <TextField
                label="Last Name *"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                style={{ marginBottom: "10px", width: "300px" }}
            />
            <TextField
                label="Location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                style={{ marginBottom: "10px", width: "300px" }}
            />
            <TextField
                label="Description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ marginBottom: "10px", width: "300px" }}
            />
            <TextField
                label="Occupation"
                value={occupation}
                onChange={e => setOccupation(e.target.value)}
                style={{ marginBottom: "20px", width: "300px" }}
            />
            <Button variant="contained" color="secondary" onClick={handleRegister}>
                Register Me
            </Button>
            {registerError && <Typography color="error" mt={2}>{registerError}</Typography>}
            {registerSuccess && <Typography color="success" mt={2}>Registration successful! Please login.</Typography>}
        </Box>
    );
}

export default LoginRegister;
