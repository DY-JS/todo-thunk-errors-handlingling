
import {setErrorAC, SetErrorType, SetStatusType} from "../app/app-reducer";
import {setStatusAC} from "../app/app-reducer";
import { Dispatch } from 'redux'
import { ResponseType } from '../api/todolists-api'

// generic function
export const handleServerAppError = <T>(data: ResponseType<T>, dispatch: ErrorUtilsDispatchType) => {
    if (data.messages.length) {
        dispatch(setErrorAC(data.messages[0]))
    } else {
        dispatch(setErrorAC('Some error occurred'))
    }
    dispatch(setStatusAC('failed'))
}

// или dispatch: Dispatch
export const handleServerNetworkError = (error: { message: string }, dispatch: ErrorUtilsDispatchType) => {
    dispatch(setErrorAC(error.message))
    dispatch(setStatusAC('failed'))
}
//
type ErrorUtilsDispatchType = Dispatch<SetErrorType | SetStatusType>
