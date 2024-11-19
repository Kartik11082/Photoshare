import { Grid, Paper, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes, useNavigate, useParams } from "react-router-dom";

import axios from "axios";
import TopBar from "./components/TopBar";
import UserDetail from "./components/UserDetail";
import UserList from "./components/UserList";
import UserPhotos from "./components/UserPhotos";
import LoginRegister from "./components/LoginRegister";
import "./styles/main.css";

function UserDetailRoute({ setCurrentUser }) {
    const { userId } = useParams();

    useEffect(() => {
        axios.get(`/user/${userId}`)
            .then((response) => setCurrentUser({ ...response.data, isPhotoView: false }))
            .catch((error) => console.error("Error fetching user data:", error));
    }, [userId, setCurrentUser]);

    return <UserDetail userId={userId} />;
}

function UserPhotosRoute({ advancedFeaturesEnabled, setCurrentUser }) {
    const { userId } = useParams();

    useEffect(() => {
        axios.get(`/user/${userId}`)
            .then((response) => setCurrentUser({ ...response.data, isPhotoView: true }))
            .catch((error) => console.error("Error fetching user data:", error));
    }, [userId, setCurrentUser]);

    return <UserPhotos userId={userId} advancedFeaturesEnabled={advancedFeaturesEnabled} />;
}

function ProtectedRoute({ currentUser, children }) {
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) {
            navigate("/login");
        }
    }, [currentUser, navigate]);

    return currentUser ? children : null;
}

function PhotoShare() {
    const [advancedFeaturesEnabled, setAdvancedFeaturesEnabled] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const handleToggleAdvancedFeatures = () => {
        setAdvancedFeaturesEnabled(!advancedFeaturesEnabled);
    };

    return (
        <HashRouter>
            <div>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TopBar
                            onToggleAdvancedFeatures={handleToggleAdvancedFeatures}
                            currentUser={currentUser}
                            setCurrentUser={setCurrentUser}
                        />
                    </Grid>
                    <div className="main-topbar-buffer" />
                    <Grid item sm={3}>
                        <Paper className="main-grid-item">
                            {currentUser && <UserList />} {/* Only show user list if logged in */}
                        </Paper>
                    </Grid>
                    <Grid item sm={9}>
                        <Paper className="main-grid-item">
                            <Routes>
                                <Route
                                    path="/"
                                    element={
                                        currentUser ? (
                                            <Typography variant="body1">
                                                Welcome to your photosharing app!
                                            </Typography>
                                        ) : (
                                            <LoginRegister setCurrentUser={setCurrentUser} />
                                        )
                                    }
                                />
                                <Route
                                    path="/login"
                                    element={<LoginRegister setCurrentUser={setCurrentUser} />}
                                />
                                <Route
                                    path="/users/:userId"
                                    element={<ProtectedRoute currentUser={currentUser}><UserDetailRoute setCurrentUser={setCurrentUser} /></ProtectedRoute>}
                                />
                                <Route
                                    path="/photos/:userId"
                                    element={<ProtectedRoute currentUser={currentUser}><UserPhotosRoute advancedFeaturesEnabled={advancedFeaturesEnabled} setCurrentUser={setCurrentUser} /></ProtectedRoute>}
                                />
                                <Route
                                    path="/users"
                                    element={<ProtectedRoute currentUser={currentUser}> <UserList /></ProtectedRoute>}
                                />
                            </Routes>
                        </Paper>
                    </Grid>
                </Grid>
            </div>
        </HashRouter>
    );
}

const root = ReactDOM.createRoot(document.getElementById("photoshareapp"));
root.render(<PhotoShare />);
