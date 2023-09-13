import {ResultCodes, todolistsAPI, TodolistType} from '../../api/todolists-api'
import {Dispatch} from 'redux'
import {RequestStatusType, setErrorAC, SetErrorType, setStatusAC, SetStatusType} from "../../app/app-reducer";
import {handleServerAppError, handleServerNetworkError} from "../../utils/error-utils";
import {AxiosError} from "axios";

const initialState: Array<TodolistDomainType> = []

export const todolistsReducer = (state: Array<TodolistDomainType> = initialState, action: ActionsType): Array<TodolistDomainType> => {
    switch (action.type) {
        case 'REMOVE-TODOLIST':
            return state.filter(tl => tl.id !== action.id)
        case 'ADD-TODOLIST':
            return [{...action.todolist, filter: 'all', entityStatus: 'idle'}, ...state]
        case 'CHANGE-TODOLIST-TITLE':
            return state.map(tl => tl.id === action.id ? {...tl, title: action.title} : tl)
        case 'CHANGE-TODOLIST-FILTER':
            return state.map(tl => tl.id === action.id ? {...tl, filter: action.filter} : tl)
        case 'SET-TODOLISTS':
            return action.todolists.map(tl => ({...tl, filter: 'all', entityStatus: 'idle'}))
        case 'CHANGE-ENTITY-STATUS':
            return state.map(tl => action.id === tl.id ? {...tl, entityStatus: action.status} : {...tl})
        default:
            return state
    }
}

// actions
export const removeTodolistAC = (id: string) => ({type: 'REMOVE-TODOLIST', id} as const)
export const addTodolistAC = (todolist: TodolistType) => ({type: 'ADD-TODOLIST', todolist} as const)
export const changeTodolistTitleAC = (id: string, title: string) => ({
    type: 'CHANGE-TODOLIST-TITLE',
    id,
    title
} as const)
export const changeTodolistFilterAC = (id: string, filter: FilterValuesType) => ({
    type: 'CHANGE-TODOLIST-FILTER',
    id,
    filter
} as const)
export const setTodolistsAC = (todolists: Array<TodolistType>) => ({type: 'SET-TODOLISTS', todolists} as const)
export const changeTodolistEntityStatusAC = (id: string, status: RequestStatusType) => ({
    type: 'CHANGE-ENTITY-STATUS',
    id,
    status
} as const)


// thunks
export const fetchTodolistsTC = () => {
    return (dispatch: Dispatch<ActionsType>) => {
        dispatch(setStatusAC("loading"))
        //dispatch(setErrorAC("Some Error"))
        todolistsAPI.getTodolists()
            .then((res) => {
                console.log(res.data)
                dispatch(setTodolistsAC(res.data))
                dispatch(setStatusAC("succeeded"))
            }).catch((e: AxiosError<{ error: string, message: string }>) => {
            const error = e.response ? e.response.data : e  //если бэк положил что-то в response.data.message
            handleServerNetworkError(error, dispatch) // достанем ошибку из error.message
        })
    }
}

export const removeTodolistTC = (todolistId: string) => {
    return (dispatch: Dispatch<ActionsType>) => {
        dispatch(setStatusAC("loading"))
        dispatch((changeTodolistEntityStatusAC(todolistId, "loading")))
        todolistsAPI.deleteTodolist(todolistId)
            .then((res) => {
                    if (res.data.resultCode === ResultCodes.OK) {      //res.data.resultCode === 0 - это успешный ответ
                        dispatch(removeTodolistAC(todolistId))
                        dispatch(setStatusAC("succeeded"))
                        dispatch((changeTodolistEntityStatusAC(todolistId, "succeeded")))
                    } else {
                        handleServerAppError(res.data, dispatch) //заменили дженериковой функцией функционал ниже
                        dispatch((changeTodolistEntityStatusAC(todolistId, "failed")))
                    }
                }
            )
            .catch((e: AxiosError<{ error: string, message: string }>) => {
                const error = e.response ? e.response.data : e  //если бэк положил что-то в response.data.message
                handleServerNetworkError(error, dispatch) // достанем ошибку из error.message
                dispatch((changeTodolistEntityStatusAC(todolistId, "failed")))
            })
    }
}
export const addTodolistTC = (title: string) => {
    return (dispatch: Dispatch<ActionsType>) => {
        dispatch(setStatusAC("loading"))
        todolistsAPI.createTodolist(title)
            .then((res) => {
                if (res.data.resultCode === ResultCodes.OK) {
                    dispatch(addTodolistAC(res.data.data.item))
                    dispatch(setStatusAC("succeeded"))
                } else {
                    handleServerAppError(res.data, dispatch)
                }
            }).catch((e) => {
            handleServerNetworkError(e, dispatch)
        })
    }
}
export const changeTodolistTitleTC = (id: string, title: string) => {
    return (dispatch: Dispatch<ActionsType>) => {
        dispatch(setStatusAC("loading"))
        todolistsAPI.updateTodolist(id, title)
            .then((res) => {
                dispatch(changeTodolistTitleAC(id, title))
                dispatch(setStatusAC("succeeded"))
            })
    }
}

// types
export type AddTodolistActionType = ReturnType<typeof addTodolistAC>;
export type RemoveTodolistActionType = ReturnType<typeof removeTodolistAC>;
export type SetTodolistsActionType = ReturnType<typeof setTodolistsAC>;
export type ChangeTodolistEntityStatusType = ReturnType<typeof changeTodolistEntityStatusAC>;

type ActionsType =
    | RemoveTodolistActionType
    | AddTodolistActionType
    | ReturnType<typeof changeTodolistTitleAC>
    | ReturnType<typeof changeTodolistFilterAC>
    | SetTodolistsActionType
    | SetStatusType
    | SetErrorType
    | ChangeTodolistEntityStatusType

export type FilterValuesType = 'all' | 'active' | 'completed';
export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType,
    entityStatus: RequestStatusType
}
