import {useLayoutEffect, useRef} from "react";
import {Observer} from "./useObserver";


export function useObserverListener<S,Output>(observers: Observer<S> | Array<Observer<any>>, listener: (value: S|Array<any>) => Output) {
    const observerIsUndefined = observers === undefined;
    const observerIsArray = observerIsUndefined ? false : Array.isArray(observers);
    let observerArray:Array<Observer<any>> = (observerIsArray ? observers : [observers]) as Array<Observer<any>>;
    const propsRef = useRef({listener, observerArray, observerIsArray});
    propsRef.current = {listener, observerArray, observerIsArray};

    useLayoutEffect(() => {

        function listener(index: number) {
            return function invokerExecutor(newValue:any) {
                let currentValue = propsRef.current.observerArray.map((o:Observer<any>) => o.current);
                let newValues = [...currentValue];
                newValues.splice(index, 1, newValue);
                const values = propsRef.current.observerIsArray ? newValues : newValues[0];
                propsRef.current.listener.apply(null, [values]);
            };
        }
        const removeListeners: Function[] = propsRef.current.observerArray.map(($o:Observer<any>, index:number) => $o.addListener(listener(index)));
        return () => removeListeners.forEach(removeListener => removeListener.call(null))
    }, []);
}