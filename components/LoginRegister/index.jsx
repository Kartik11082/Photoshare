import React, { useState } from "react";
import { TextField, Button, Typography, Divider } from "@mui/material";
import axios from "axios";
import "./styles.css";


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
            localStorage.setItem('loggedInUser', JSON.stringify(response.data));
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
        <div className="login-register-container">
            <div className="login-section">
                <Typography variant="h5" className="section-title">Login</Typography>
                <TextField
                    className="form-field"
                    label="Login Name"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    fullWidth
                />
                <TextField
                    className="form-field"
                    label="Password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    fullWidth
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleLogin}
                    className="submit-button"
                >
                    Login
                </Button>
                {loginError && <div className="error-message">{loginError}</div>}
            </div>

            <Divider className="divider" />

            <div className="register-section">
                <Typography variant="h5" className="section-title">Register New Account</Typography>
                <TextField
                    className="form-field"
                    label="Login Name"
                    value={registerUsername}
                    onChange={e => setRegisterUsername(e.target.value)}
                    required
                    fullWidth
                />
                <TextField
                    className="form-field"
                    label="Password"
                    type="password"
                    value={registerPassword}
                    onChange={e => setRegisterPassword(e.target.value)}
                    required
                    fullWidth
                />
                <TextField
                    className="form-field"
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    fullWidth
                />
                <TextField
                    className="form-field"
                    label="First Name"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                    fullWidth
                />
                <TextField
                    className="form-field"
                    label="Last Name"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                    fullWidth
                />
                <TextField
                    className="form-field"
                    label="Location"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    fullWidth
                />
                <TextField
                    className="form-field"
                    label="Description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    fullWidth
                />
                <TextField
                    className="form-field"
                    label="Occupation"
                    value={occupation}
                    onChange={e => setOccupation(e.target.value)}
                    fullWidth
                />
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleRegister}
                    className="submit-button"
                >
                    Register Me
                </Button>
                {registerError && <div className="error-message">{registerError}</div>}
                {registerSuccess && <div className="success-message">Registration successful! Please login.</div>}
            </div>
        </div>
    );
}

export default LoginRegister;
