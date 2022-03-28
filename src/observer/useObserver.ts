import {MutableRefObject, useMemo, useRef} from "react";

type UnRegisterCallback = () => void;
type OnListener<S> = (value: S) => void;

export interface Observer<S> extends MutableRefObject<S> {
    addListener: (listener: OnListener<S>) => UnRegisterCallback
}

function isFunction(functionToCheck: any) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

const noOp = () => () => {
};

type Dispatch<A> = (value: A) => void;
type SetObserverAction<S> = S | ((prevState: S) => S);
type Initialization<S> = S | (() => S)

export function useObserver<S>(initialValue: Initialization<S>): [Observer<S>, Dispatch<SetObserverAction<S>>] {

    const defaultValueRef = useRef(initialValue);
    return useMemo(() => {
        let listeners: Function[] = [];
        let valueIsInitialized = false;
        const $value: Observer<S> = {
            current: {} as S,
            addListener: noOp
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

        function addListener(listener: OnListener<S>) {
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