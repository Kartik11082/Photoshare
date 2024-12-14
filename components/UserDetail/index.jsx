import { Button, Card, CardContent, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import DeleteConfirmDialog from '../DeleteConfirmDialog';
import MentionsList from '../MentionsList';
import "./styles.css";

function UserDetail({ userId }) {
    const [user, setUser] = useState(null);
    const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const response = await axios.get(`/user/${userId}`);
                setUser(response.data);
            } catch (error) {
                console.error("Error fetching user details:", error);
            }
        };

        fetchUserDetails();
    }, [userId]);

    // useEffect(() => {
    //   const checkOwnProfile = async () => {
    //     try {
    //       const response = await axios.get('/user/current');
    //       console.log("TESTING:", String(response.data._id) === String(userId));
    //       setIsOwnProfile(String(response.data._id) === String(userId));
    //     } catch (error) {
    //       console.error("Checking own profile:", userId, error);
    //       setIsOwnProfile(false);
    //     }
    //   };

    //   checkOwnProfile();
    // }, [userId]);

    useEffect(() => {
        const checkOwnProfile = async () => {
            try {
                const response = await axios.get('/currentUser');
                console.log("Current user ID:", response.data._id, "Target user ID:", userId);

                // Normalize both values
                const currentUserId = String(response.data._id).trim();
                const targetUserId = String(userId).trim();
                console.log("CHECK:", currentUserId, targetUserId)

                setIsOwnProfile(currentUserId === targetUserId);
            } catch (error) {
                console.error("Error checking own profile:", error);
                setIsOwnProfile(false);
            }
        };

        checkOwnProfile();
    }, [userId]);

    const handleDeleteAccount = async () => {
        try {
            await axios.delete(`/user/${userId}`);
            console.log("User account deleted successfully.");
            // Refresh the page after deletion
            window.location.reload();
        } catch (error) {
            console.error("Error deleting account:", error);
        }
    };

    if (!user) {
        return <Typography variant="body1">Loading user details...</Typography>;
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h5">
                    {user.first_name} {user.last_name}
                </Typography>
                <Typography variant="body1">Location: {user.location}</Typography>
                <Typography variant="body1">Occupation: {user.occupation}</Typography>
                <Typography variant="body1">Description: {user.description}</Typography>

                <Typography variant="body1">
                    <Link to={`/photos/${userId}`}>View Photos of {user.first_name}</Link>
                </Typography>

                <MentionsList userId={userId} />

                {isOwnProfile && (
                    <>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => setDeleteAccountDialog(true)}
                            sx={{ mt: 2 }}
                        >
                            Delete My Account
                        </Button>
                        <DeleteConfirmDialog
                            open={deleteAccountDialog}
                            title="Delete Account"
                            message="Are you sure you want to delete your account? This will permanently delete all your photos and comments. This action cannot be undone."
                            onConfirm={handleDeleteAccount}
                            onCancel={() => setDeleteAccountDialog(false)}
                        />
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default UserDetail;
