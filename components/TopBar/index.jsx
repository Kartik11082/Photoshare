import React, { useEffect, useState } from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import axios from "axios";
import "./styles.css";
import PhotoUpload from "../PhotoUpload/index";

function TopBar({ currentUser, setCurrentUser }) {
    const [version, setVersion] = useState(null);
    const [showUploadDialog, setShowUploadDialog] = useState(false);

    useEffect(() => {
        axios.get("/test/info")
            .then((response) => {
                setVersion(response.data.__v);
            })
            .catch((error) => console.error("Error fetching version:", error));
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post("/admin/logout");
            setCurrentUser(null); // Clear the current user after logout
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    return (
        <AppBar className="topbar-appBar" position="absolute">
            <Toolbar>
                <Typography variant="h5" color="inherit">
                    <div className="navbar-data">
                        Kartik Karkera <div className="version">Version: {version && `(v${version})`}</div>
                    </div>
                </Typography>
                <div style={{ flexGrow: 1 }} />
                {currentUser ? (
                    <>
                        <Typography variant="h6" color="inherit">
                            Hi {currentUser.first_name}
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
                            onClick={handleLogout}
                            style={{ marginLeft: "20px" }}
                        >
                            Logout
                        </Button>
                        {showUploadDialog && (
                            <PhotoUpload 
                                userId={currentUser._id} 
                                onClose={() => setShowUploadDialog(false)}
                                onPhotoUploaded={() => {
                                    setShowUploadDialog(false);
                                }}
                            />
                        )}
                    </>
                ) : (
                    <Typography variant="h6" color="inherit">
                        Please Login
                    </Typography>
                )}
            </Toolbar>
        </AppBar>
    );
}

export default TopBar;
