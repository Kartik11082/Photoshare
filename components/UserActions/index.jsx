import React from 'react';
import axios from 'axios';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

function UserActions({ userId, onActionComplete }) {
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
    const [actionType, setActionType] = React.useState('');

    const handleDelete = async (type) => {
        try {
            let response;
            if (type === 'account') {
                response = await axios.delete(`/user/${userId}`);
            } else if (type === 'photo') {
                response = await axios.delete(`/photos/${photoId}`);
            } else if (type === 'comment') {
                response = await axios.delete(`/comments/${commentId}`);
            }
            console.log(`${type} deleted successfully:`, response);
            onActionComplete();
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
        }
    };

    const handleOpenDialog = (type) => {
        setActionType(type);
        setOpenDeleteDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDeleteDialog(false);
        setActionType('');
    };

    return (
        <div>
            <Button variant="outlined" color="error" onClick={() => handleOpenDialog('account')}>
                Delete Account
            </Button>
            <Button variant="outlined" color="error" onClick={() => handleOpenDialog('photo')}>
                Delete Photo
            </Button>
            <Button variant="outlined" color="error" onClick={() => handleOpenDialog('comment')}>
                Delete Comment
            </Button>

            <Dialog open={openDeleteDialog} onClose={handleCloseDialog}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this {actionType}? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={() => { handleDelete(actionType); handleCloseDialog(); }} color="secondary">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default UserActions; 