import {
    AddTodolistActionType,
    FilterValuesType,
    RemoveTodolistActionType,
    SetTodolistsActionType
} from './todolists-reducer'
import {
    ResultCodes,
    TaskPriorities,
    TaskStatuses,
    TaskType,
    todolistsAPI, TodolistType,
    UpdateTaskModelType
} from '../../api/todolists-api'
import {Dispatch} from 'redux'
import {AppRootStateType} from '../../app/store'
import {RequestStatusType, setErrorAC, SetErrorType, setStatusAC, SetStatusType} from "../../app/app-reducer";
import {handleServerAppError, handleServerNetworkError} from "../../utils/error-utils";
import axios, {AxiosError} from "axios";

const initialState: TasksStateType = {}

export const tasksReducer = (state: TasksStateType = initialState, action: ActionsType): TasksStateType => {
    switch (action.type) {
        case 'REMOVE-TASK':
            return {...state, [action.todolistId]: state[action.todolistId].filter(t => t.id !== action.taskId)}
        case 'ADD-TASK':
            return {...state, [action.task.todoListId]: [{...action.task, entityTaskStatus: 'idle' }, ...state[action.task.todoListId]]}
        case 'UPDATE-TASK':
            return {
                ...state,
                [action.todolistId]: state[action.todolistId]
                    .map(t => t.id === action.taskId ? {...t, ...action.model, entityTaskStatus: 'idle' } : t)
            }
        case 'CHANGE-ENTITY-STATUS':
            return <TasksStateType>{
                ...state,
                [action.todolistId]: state[action.todolistId]
                    .map(task => action.taskId === task.id ? {...task, entityTaskStatus: action.status} : {...task})
            }
        case 'ADD-TODOLIST':
            return {...state, [action.todolist.id]: []}
        case 'REMOVE-TODOLIST':
            const copyState = {...state}
            delete copyState[action.id]
            return copyState
        case 'SET-TODOLISTS': {
            const copyState = {...state}
            action.todolists.forEach(tl => {
                copyState[tl.id] = []
            })
            return copyState
        }
        case 'SET-TASKS':
            return {...state, [action.todolistId]: action.tasks.map(t => ({...t, entityTaskStatus: "idle"}))}
        default:
            return state
    }
}

//types
export type TaskDomainType = TaskType & {
    entityTaskStatus: RequestStatusType
}

export type TasksStateType = {
    [key: string]: Array<TaskDomainType>
}


// actions
export const removeTaskAC = (taskId: string, todolistId: string) =>
    ({type: 'REMOVE-TASK', taskId, todolistId} as const)
export const addTaskAC = (task: TaskType) =>
    ({type: 'ADD-TASK', task} as const)
export const changeEntityStatusAC = (taskId: string, todolistId: string, status: RequestStatusType) =>
    ({  type: 'CHANGE-ENTITY-STATUS', taskId, todolistId, status} as const)

export const updateTaskAC = (taskId: string, model: UpdateDomainTaskModelType, todolistId: string) =>
    ({type: 'UPDATE-TASK', model, todolistId, taskId} as const)
export const setTasksAC = (tasks: Array<TaskType>, todolistId: string) =>
    ({type: 'SET-TASKS', tasks, todolistId} as const)

// thunks
export const fetchTasksTC = (todolistId: string) => (dispatch: Dispatch<ActionsType>) => {
    dispatch(setStatusAC("loading"))
    todolistsAPI.getTasks(todolistId)
        .then((res) => {
            // if (res.data.resultCode === ResultCodes.OK) тут в data нет resultCode
            const tasks = res.data.items
            const action = setTasksAC(tasks, todolistId)
            dispatch(action)
            dispatch(setStatusAC("succeeded"))
        }).catch((e: AxiosError<{ error: string, message: string }>) => {
        const error = e.response ? e.response.data : e  //если бэк положил что-то в response.data.message
        handleServerNetworkError(error, dispatch) // достанем ошибку из error.message
    })
}
export const removeTaskTC = (taskId: string, todolistId: string) => (dispatch: Dispatch<ActionsType>) => {
    dispatch(setStatusAC("loading"))
    dispatch(changeEntityStatusAC(taskId, todolistId, "loading"))
    todolistsAPI.deleteTask(todolistId, taskId)
        .then(res => {
            if (res.data.resultCode === ResultCodes.OK) {
                const action = removeTaskAC(taskId, todolistId)
                dispatch(action)
                dispatch(setStatusAC("succeeded"))
                dispatch(changeEntityStatusAC(taskId, todolistId, "succeeded"))
            } else {
                handleServerAppError(res.data, dispatch) //заменили дженериковой функцией dispatch ошибок
                dispatch(changeEntityStatusAC(taskId, todolistId, "failed"))
            }
        })
        .catch(e => {
            if (axios.isAxiosError<{ message: string }>(e)) {
                const error = e.response ? e.response.data : e
                handleServerNetworkError(error, dispatch)
                dispatch(changeEntityStatusAC(taskId, todolistId, "failed"))
            }
        })
}

// c try-catch
// export const addTaskTC = (title: string, todolistId: string) => async(dispatch: Dispatch<ActionsType>) => {
//     dispatch(setStatusAC("loading"))
//     try {
//         const res = await todolistsAPI.createTask(todolistId, title)  //если title > 100 символов, то ответ другой и addTaskAC закрашится
//         if (res.data.resultCode === 0) {
//             const task = res.data.data.item //если title > 100 символов, то ответ другой, item там нет
//             const action = addTaskAC(task)
//             dispatch(action)
//             dispatch(setStatusAC("succeeded"))
//         } else {
//             handleServerAppError(res.data, dispatch) //заменили дженериковой функцией dispatch ошибок
//         }
//     } catch(e) {
//         if (axios.isAxiosError<{message: string}>(e)) {
//             const error = e.response ? e.response.data : e
//             handleServerNetworkError(error, dispatch)}
//     }
// }

// c then
export const addTaskTC = (title: string, todolistId: string) => (dispatch: Dispatch<ActionsType>) => {
    dispatch(setStatusAC("loading"))
    todolistsAPI.createTask(todolistId, title)  //если title > 100 символов, то ответ другой и addTaskAC закрашится
        .then(res => {
            if (res.data.resultCode === 0) {
                const task = res.data.data.item //если title > 100 символов, то ответ другой, item там нет
                const action = addTaskAC(task)
                dispatch(action)
                dispatch(setStatusAC("succeeded"))
            } else {
                handleServerAppError(res.data, dispatch) //заменили дженериковой функцией функционал ниже
            }
            //     if (res.data.messages.length) {
            //         dispatch(setErrorAC(res.data.messages[0]))
            //     } else {
            //         dispatch(setErrorAC("Some error occured"))
            //     }
            // }
            // dispatch(setStatusAC("failed"))
        }).catch((e) => {
        // dispatch(setStatusAC("failed"))
        // dispatch(setErrorAC(e.message))
        handleServerNetworkError(e, dispatch)
    })
}

export const updateTaskTC = (taskId: string, domainModel: UpdateDomainTaskModelType, todolistId: string) =>
    (dispatch: Dispatch<ActionsType>, getState: () => AppRootStateType) => {
        const state = getState()
        const task = state.tasks[todolistId].find(t => t.id === taskId)
        if (!task) {
            //throw new Error("task not found in the state");
            console.warn('task not found in the state')
            return
        }

        const apiModel: UpdateTaskModelType = {
            deadline: task.deadline,
            description: task.description,
            priority: task.priority,
            startDate: task.startDate,
            title: task.title,
            status: task.status,
            ...domainModel
        }
        dispatch(setStatusAC("loading"))
        dispatch(changeEntityStatusAC(taskId, todolistId, "loading"))
        todolistsAPI.updateTask(todolistId, taskId, apiModel)
            .then(res => {
                if (res.data.resultCode === 0) {
                    const action = updateTaskAC(taskId, domainModel, todolistId)
                    dispatch(action)
                    dispatch(setStatusAC("succeeded"))
                    dispatch(changeEntityStatusAC(taskId, todolistId, "succeeded"))

                } else {
                    handleServerAppError(res.data, dispatch)
                    dispatch(changeEntityStatusAC(taskId, todolistId, "failed"))
                    //console.log('error-addTask')//заменили дженериковой функцией функционал ниже
                }
                // if (res.data.messages.length) {
                //     dispatch(setErrorAC(res.data.messages[0]))
                // } else {
                //     dispatch(setErrorAC("Some error occured"))
                // }
                // }
                // dispatch(setStatusAC("failed"))
            }).catch((e: AxiosError<{ error: string, message: string }>) => {
            const error = e.response ? e.response.data : e  //если бэк положил что-то в response.data.message
            handleServerNetworkError(error, dispatch) // достанем ошибку из error.message
            dispatch(changeEntityStatusAC(taskId, todolistId, "failed"))
            //console.log('error-addTask')
            // dispatch(setStatusAC("failed"))
            // dispatch(setErrorAC(e.message))
        })
    }

// types
export type UpdateDomainTaskModelType = {
    title?: string
    description?: string
    status?: TaskStatuses
    priority?: TaskPriorities
    startDate?: string
    deadline?: string
}

type ActionsType =
    | ReturnType<typeof removeTaskAC>
    | ReturnType<typeof addTaskAC>
    | ReturnType<typeof updateTaskAC>
    | ReturnType<typeof changeEntityStatusAC>
    | AddTodolistActionType
    | RemoveTodolistActionType
    | SetTodolistsActionType
    | SetStatusType
    | SetErrorType
    | ReturnType<typeof setTasksAC>
