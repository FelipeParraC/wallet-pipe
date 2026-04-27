export interface ActionResponse<T = undefined> {
  ok: boolean
  message: string
  data?: T
}

export const actionSuccess = <T>(data?: T, message = ''): ActionResponse<T> => ({
  ok: true,
  message,
  data,
})

export const actionFailure = <T = undefined>(message: string): ActionResponse<T> => ({
  ok: false,
  message,
})
