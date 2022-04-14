import {Observer} from "../observer/useObserver";
import {Grid, GridColumn, GridColumnGroup} from "../grid/Grid";
import {useObserverValue} from "../observer";
import React from "react";
import Vertical from "../layout/Vertical";

type PivotGridProps = {
    $gridColumns: Observer<Array<GridColumn | GridColumnGroup>>;
    $gridRows: Observer<any[]>;
    $pinnedLeftColumnIndex: Observer<number>
};

export function PivotGrid(props: PivotGridProps) {
    const {$gridRows, $gridColumns, $pinnedLeftColumnIndex} = props;
    const columns: any = useObserverValue($gridColumns);
    const rows: any = useObserverValue($gridRows);
    return <Vertical style={{height: '100%',fontSize:10}}>
        <Grid columns={columns} data={rows}
              debugMode={false}
              filterHidden={true}
              sortableHidden={true}
              pinnedLeftColumnIndex={$pinnedLeftColumnIndex.current}
              headerRowHeightCallback={props => {
                  return (props.index === props.data.length - 1) ? 20 : props.length;
              }}
        /></Vertical>
}