import {Observer} from "../observer/useObserver";
import {Grid, GridColumn, GridColumnGroup} from "../grid/Grid";
import Vertical from "../layout/Vertical";
import {ObserverValue} from "../observer";
import React from "react";

type PivotGridProps = {
    setDisplayDimensionSelector: (value: (((prevState: boolean) => boolean) | boolean)) => void;
    $gridColumns: Observer<Array<GridColumn | GridColumnGroup>>;
    $gridRows: Observer<any[]>;
    $pinnedLeftColumnIndex: Observer<number>
};

export function PivotGrid(props: PivotGridProps) {
    const {setDisplayDimensionSelector, $gridRows, $gridColumns, $pinnedLeftColumnIndex} = props;
    return <Vertical style={{flexGrow: 1, overflow: 'auto'}}
                     onClick={() => setDisplayDimensionSelector(false)}>
        <ObserverValue observers={[$gridColumns, $gridRows]} render={() => {
            return <Grid columns={$gridColumns.current} data={$gridRows.current}
                         debugMode={false}
                         filterHidden={true}
                         sortableHidden={true}
                         pinnedLeftColumnIndex={$pinnedLeftColumnIndex.current}
                         headerRowHeightCallback={props => {
                             return (props.index === props.data.length - 1) ? 20 : props.length;
                         }}
            />;
        }}/>

    </Vertical>;
}