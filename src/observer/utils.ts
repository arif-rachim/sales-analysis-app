export function isFunction(functionToCheck: any) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

export function isNullOrUndefined(data: any) {
    return data === undefined || data === null
}