import {useEffect, useRef, useState} from "react";
import {Observer} from "./useObserver";
import {useObserverListener} from "./useObserverListener";

export function useObserverValue<S,Output>(observers:Observer<S>|Array<Observer<S>>,mapper?:(arg:S|Array<any>) => Output):Array<any> | S | Output{
    const isUnmounted = useRef(false);
    useEffect(() => {
        return () => {
            isUnmounted.current = true
        };
    },[]);
    const [state, setState] = useState(() => {
        if(Array.isArray(observers)){
            const defaultVal = (observers as Observer<any>[]).map((value:Observer<any>) => value.current)
            return mapper ? mapper(defaultVal) : defaultVal;
        }else{
            return mapper ? mapper(observers.current) : observers.current;
        }
    });
    useObserverListener(observers,(value) => {
        if(isUnmounted.current){
            return;
        }
        if(mapper){
            setState(mapper(value));
        }else{
            setState(value);
        }
    });
    return state;
}