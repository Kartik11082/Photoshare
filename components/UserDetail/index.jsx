import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Typography, Card, CardContent } from "@mui/material";
// import fetchModel from "../../lib/fetchModelData";
import axios from "axios";
import "./styles.css";

function UserDetail({ userId }) {
  const [user, setUser] = useState(null);

  // Fetch user details when the component is mounted
  useEffect(() => {
    console.log("Fetching user details");
    axios.get(`/user/${userId}`)
      .then(response => setUser(response.data)) // Set user data from response
      .catch(error => console.error("Error fetching user details:", error));
  }, [userId]);

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
      </CardContent>
    </Card>
  );
}

export default UserDetail;
