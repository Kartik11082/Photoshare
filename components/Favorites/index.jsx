import React, { useState, useEffect } from 'react';
import { 
    Grid, 
    Card, 
    CardMedia, 
    CardActions, 
    IconButton, 
    Modal,
    Box,
    Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'auto'
};

function Favorites() {
    const [favorites, setFavorites] = useState([]);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            const response = await axios.get('/favorites');
            setFavorites(response.data);
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    };

    const handleRemoveFavorite = async (photoId) => {
        try {
            await axios.delete(`/favorites/remove/${photoId}`);
            setFavorites(favorites.filter(fav => fav.photo_id._id !== photoId));
        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    };

    const handlePhotoClick = (photo) => {
        setSelectedPhoto(photo);
        setModalOpen(true);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>My Favorite Photos</Typography>
            <Grid container spacing={3}>
                {favorites.map((favorite) => (
                    <Grid item xs={12} sm={6} md={4} key={favorite._id}>
                        <Card>
                            <CardMedia
                                component="img"
                                height="200"
                                image={`/images/${favorite.photo_id.file_name}`}
                                alt="Photo"
                                sx={{ cursor: 'pointer', objectFit: 'cover' }}
                                onClick={() => handlePhotoClick(favorite.photo_id)}
                            />
                            <CardActions>
                                <IconButton 
                                    onClick={() => handleRemoveFavorite(favorite.photo_id._id)}
                                    color="error"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
            >
                <Box sx={modalStyle}>
                    {selectedPhoto && (
                        <>
                            <img
                                src={`/images/${selectedPhoto.file_name}`}
                                alt="Full size"
                                style={{ maxWidth: '100%', maxHeight: '70vh' }}
                            />
                            <Typography sx={{ mt: 2 }}>
                                Date: {new Date(selectedPhoto.date_time).toLocaleString()}
                            </Typography>
                        </>
                    )}
                </Box>
            </Modal>
        </Box>
    );
}

export default Favorites; 