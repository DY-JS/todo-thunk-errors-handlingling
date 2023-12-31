//app-reducer.tsx


export type RequestStatusType = 'idle' | 'loading' | 'succeeded' | 'failed'

const initialState = {
    //error: "Some error" as null | string,
    error: null as null | string,
    status: 'loading' as RequestStatusType
}

type InitialStateType = typeof initialState

export const appReducer = (state: InitialStateType = initialState, action: ActionsType): InitialStateType => {
    switch (action.type) {
        case 'APP/SET-STATUS':
            return {...state, status: action.status}

        case 'APP/SET-ERROR':
            return {...state, error: action.error}
        default:
            return state
    }
}

//action-creators
export const setStatusAC = (status: RequestStatusType ) => ({type: 'APP/SET-STATUS', status} as const)
export const setErrorAC = (error: null | string ) => ({type: 'APP/SET-ERROR', error} as const)

//action-types
export type SetStatusType = ReturnType<typeof setStatusAC>
export type SetErrorType = ReturnType<typeof setErrorAC>

type ActionsType = SetStatusType | SetErrorType
