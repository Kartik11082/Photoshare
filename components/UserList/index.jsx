import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Divider,
    List,
    ListItem,
    ListItemText,
    Typography,
} from "@mui/material";
import axios from "axios";
// import fetchModel from "../../lib/fetchModelData";
import "./styles.css";

function UserList() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        console.log("Fetching UserList");
        axios.get("/user/list")
            .then(response => setUsers(response.data))
            .catch(error => console.error("Error fetching user list:", error));
    }, []);

    return (
        <div>
            <Typography variant="body1">
                This is the user list, which takes up 3/12 of the window. You might
                choose to use <a href="https://mui.com/components/lists/">Lists</a>{" "}
                and <a href="https://mui.com/components/dividers/">Dividers</a> to
                display your users like so:
            </Typography>
            <List component="nav">
                {users.map((user) => (
                    <div key={user._id}>
                        <ListItem component={Link} to={`/users/${user._id}`}>
                            <ListItemText primary={`${user.first_name} ${user.last_name}`} />
                        </ListItem>
                        <Divider />
                    </div>
                ))}
            </List>
            <Typography variant="body1">
                The model comes in from the server via axios(/user/list)
            </Typography>
        </div>
    );
}

export default UserList;
