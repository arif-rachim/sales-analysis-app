import {useObserverValue} from "./useObserverValue";
import {Observer} from "./useObserver";

type ObserverValueProps<S> = {observers:(Observer<S> | Observer<any>[]),render:(value:S | any[] | null) => JSX.Element};

export function ObserverValue<S>(props:ObserverValueProps<S>) {
    const state = useObserverValue(props.observers as Observer<any>[])
    return props.render(state);
}