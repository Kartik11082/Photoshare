import { Button, Card, CardContent, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
// import fetchModel from "../../lib/fetchModelData";
import axios from "axios";
import DeleteConfirmDialog from '../DeleteConfirmDialog';
import MentionsList from '../MentionsList';
import "./styles.css";

function UserDetail({ userId }) {
  const [user, setUser] = useState(null);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Fetch user details when the component is mounted
  useEffect(() => {
    console.log("Fetching user details");
    axios.get(`/user/${userId}`)
      .then(response => setUser(response.data)) // Set user data from response
      .catch(error => console.error("Error fetching user details:", error));
  }, [userId]);

  // Check if the current user is viewing their own profile
  useEffect(() => {
    const checkOwnProfile = async () => {
      try {
        const response = await axios.get('/user/current');
        setIsOwnProfile(String(response.data._id) === String(userId));
      } catch (error) {
        setIsOwnProfile(false);
      }
    };
    checkOwnProfile();
  }, [userId]);

  const handleDeleteAccount = async () => {
    try {
      await axios.delete(`/user/${userId}`);
      window.location.href = '/login-register';
    } catch (error) {
      console.error('Error deleting account:', error);
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

        {/* Link to User's Photos */}
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
              Delete Account
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
