import React, { useState } from 'react'
import Snackbar from '@mui/material/Snackbar'
import MuiAlert, { AlertProps } from '@mui/material/Alert'
import {useAppDispatch, useAppSelector} from "../../app/store";
import {setErrorAC} from "../../app/app-reducer";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />
})

export function ErrorSnackbar() {
    const dispatch = useAppDispatch()
    const error = useAppSelector<null|string>((state) => state.app.error)
    //const [open, setOpen] = useState(false)

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return
        }
        dispatch(setErrorAC(null))
        //setOpen(!!error)
    }
    return (
        <Snackbar open={error !== null} autoHideDuration={6000} onClose={handleClose} anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}>
            <Alert onClose={handleClose} severity='error' sx={{width: '100%'}}>
                Error message 😠 {error}
            </Alert>
        </Snackbar>
    )
}
