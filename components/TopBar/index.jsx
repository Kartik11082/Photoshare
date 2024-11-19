import React, { useEffect, useState } from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import axios from "axios";
import PhotoUpload from "../PhotoUpload";
import "./styles.css";

function TopBar({ currentUser, setCurrentUser }) {
    console.log("currentUser", currentUser);
    console.log("setCurrentUser", setCurrentUser);

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
            setCurrentUser(null);
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

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
