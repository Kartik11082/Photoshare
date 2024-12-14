import React, { useState } from 'react';
import axios from 'axios';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

function DeleteAccount({ userId, onAccountDeleted }) {
    const [openDialog, setOpenDialog] = useState(false);

    const handleDeleteAccount = async () => {
        try {
            await axios.delete(`/user/${userId}`);
            onAccountDeleted(); // Callback to refresh the UI or redirect
        } catch (error) {
            console.error('Error deleting account:', error);
        }
        setOpenDialog(false);
    };

    return (
        <div>
            <Button variant="outlined" color="error" onClick={() => setOpenDialog(true)}>
                Delete Account
            </Button>
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Confirm Account Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete your account? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteAccount} color="secondary">
                        Delete Account
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default DeleteAccount; 