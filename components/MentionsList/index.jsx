import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Typography,
    Card,
    CardContent,
    CardMedia,
    Grid,
    Box
} from '@mui/material';
import axios from 'axios';

function MentionsList({ userId }) {
    const [mentionedPhotos, setMentionedPhotos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMentionedPhotos = async () => {
            try {
                const response = await axios.get(`/mentionsOfUser/${userId}`);
                setMentionedPhotos(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching mentioned photos:', error);
                setLoading(false);
            }
        };

        fetchMentionedPhotos();
    }, [userId]);

    if (loading) {
        return <Typography>Loading mentions...</Typography>;
    }

    if (mentionedPhotos.length === 0) {
        return <Typography variant="body1" sx={{ mt: 2 }}>No mentions found</Typography>;
    }

    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Photos where mentioned:</Typography>
            <Grid container spacing={2}>
                {mentionedPhotos.map((photo) => (
                    <Grid item xs={12} sm={6} md={4} key={photo._id}>
                        <Card>
                            <Link to={`/photos/${photo.user_id}#${photo._id}`}>
                                <CardMedia
                                    component="img"
                                    height="140"
                                    image={`./images/${photo.file_name}`}
                                    alt="Photo thumbnail"
                                />
                            </Link>
                            <CardContent>
                                <Typography variant="body2">
                                    Posted by:{' '}
                                    <Link to={`/users/${photo.user_id}`}>
                                        {photo.owner_first_name} {photo.owner_last_name}
                                    </Link>
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {new Date(photo.date_time).toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

export default MentionsList;