import {useObserverListener} from "./useObserverListener";
import {Observer, useObserver} from "./useObserver";

export function useObserverMapper<S, Output>(observer: Observer<S> | Array<Observer<any>>, map: (value: S | Array<any>) => Output): Observer<Output> {
    const [newObserver, setNewObserver] = useObserver(map(getCurrentValue(observer)));
    useObserverListener(newObserver, (newValue: any) => {
        const newMapValue = map(newValue);
        setNewObserver(newMapValue);
    })
    return newObserver;
}

function getCurrentValue<S>(observers: Observer<S> | Array<Observer<any>>): S | Array<any> {
    if (Array.isArray(observers)) {
        return observers.map(value => value.current);
    } else {
        return observers.current;
    }
}