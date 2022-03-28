import {MutableRefObject, useMemo, useRef} from "react";

export type Observer<S> =
    MutableRefObject<S>
    & { addListener: (listener: (value: S) => void) => () => void };

function isFunction(functionToCheck: any) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}
const noOp = () => () => {};


export function useObserver<S>(initialValue: (S | (() => S))): [Observer<S>, (value: ((value: S) => S) | S) => void] {

    const defaultValueRef = useRef(initialValue);
    return useMemo(() => {
        let listeners: Function[] = [];
        let valueIsInitialized = false;
        const $value: Observer<S> = {
            current : {} as S,
            addListener:noOp
        };

        const currentValue = isFunction(defaultValueRef.current) ? (defaultValueRef.current as Function).call(null) : defaultValueRef.current;
        
        function setValue(callbackOrValue: S | ((oldValue: S) => S)) {
            const oldVal = valueIsInitialized ? $value.current : defaultValueRef.current;
            let newVal: S | null = null;
            if (isFunction(callbackOrValue)) {
                newVal = (callbackOrValue as ((oldValue: S) => S)).apply(null, [$value.current]);
            } else {
                newVal = callbackOrValue as S;
            }
            if (newVal === oldVal) {
                return;
            }
            valueIsInitialized = true;
            $value.current = newVal;
            listeners.forEach(function listenerInvoker(l) {
                if (newVal === oldVal) {
                    return;
                }
                l.apply(l, [newVal, oldVal]);
            })
        }

        function addListener(listener: (value: S) => void) {
            listeners.push(listener);
            return () => {
                listeners.splice(listeners.indexOf(listener), 1);
            }
        }

        $value.current = currentValue;
        $value.addListener = addListener;
        return [$value, setValue]
    }, []);
}