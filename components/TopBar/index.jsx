import React, { useEffect, useState } from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import axios from "axios";
import PhotoUpload from "../PhotoUpload";
import "./styles.css";
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Link } from 'react-router-dom';

function TopBar({ loggedInUser, setCurrentUser }) {
    const [version, setVersion] = useState(null);
    const [showUploadDialog, setShowUploadDialog] = useState(false);

    useEffect(() => {
        // Check localStorage for user data on component mount
        const storedUser = localStorage.getItem('loggedInUser');
        if (storedUser && !loggedInUser) {
            const user = JSON.parse(storedUser);
            setCurrentUser(user);
            // Set axios default header with session info
            axios.defaults.withCredentials = true;
        }
    }, []);

    useEffect(() => {
        axios.get("/test/info")
            .then((response) => {
                setVersion(response.data.__v);
            })
            .catch((error) => console.error("Error fetching version:", error));
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post("/admin/logout", {});
            setCurrentUser(null);
            localStorage.removeItem('loggedInUser');
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    // Store user data in localStorage when it changes
    useEffect(() => {
        if (loggedInUser) {
            localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
        }
    }, [loggedInUser]);

    const handlePhotoUploaded = () => {
        setShowUploadDialog(false);
    };

    return (
        <AppBar className="topbar-appBar" position="absolute">
            <Toolbar>
                <Typography variant="h5" color="inherit">
                    <div className="navbar-data">
                        <div className="version">Version: {version && `(v${version})`}</div>
                    </div>
                </Typography>
                <div style={{ flexGrow: 1 }} />
                {loggedInUser ? (
                    <>
                        <Typography variant="h6" color="inherit">
                            Hi {loggedInUser.first_name}
                        </Typography>
                        <Button
                            color="inherit"
                            onClick={() => setShowUploadDialog(true)}
                            style={{ marginLeft: "20px" }}
                        >
                            Add Photo
                        </Button>
                        <Button
                            color="inherit"
                            component={Link}
                            to="/favorites"
                            startIcon={<FavoriteIcon />}
                            style={{ marginLeft: "20px" }}
                        >
                            Favorites
                        </Button>
                        <Button
                            color="inherit"
                            onClick={handleLogout}
                            style={{ marginLeft: "20px" }}
                        >
                            Logout
                        </Button>
                    </>
                ) : (
                    <Typography variant="h6" color="inherit">
                        Please Login
                    </Typography>
                )}
            </Toolbar>
            {showUploadDialog && (
                <PhotoUpload
                    onClose={() => setShowUploadDialog(false)}
                    onPhotoUploaded={handlePhotoUploaded}
                />
            )}
        </AppBar>
    );
}

export default TopBar;
