import {Observer} from "../observer/useObserver";
import {Grid, GridColumn, GridColumnGroup} from "../grid/Grid";
import {useObserverValue} from "../observer";
import React, {useMemo, useState} from "react";
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
    const [customRowHeight] = useState(() => {
        const item = localStorage.getItem('customRowHeight');
        if(item){
            return new Map<number,number>(JSON.parse(item,reviver));
        }
        return new Map<number,number>();
    });
    const [customColWidth] = useState(() => {
        const item = localStorage.getItem('customColWidth');
        if(item){
            const map = new Map<number,number>(JSON.parse(item,reviver));
            return map;
        }
        return new Map<number,number>();
    });
    const handler = useMemo(() => {
        function onCustomColWidthChange(map:Map<number,number>){
            localStorage.setItem('customColWidth',JSON.stringify(map,replacer));
        }
        function onCustomRowHeightChange(map:Map<number,number>){
            localStorage.setItem('customRowHeight',JSON.stringify(map,replacer));
        }
        return {
            onCustomColWidthChange,
            onCustomRowHeightChange
        }
    },[]);
    return <Vertical style={{height: '100%', fontSize: 11}}>
        <Grid columns={columns} data={rows}
              filterHidden={true}
              sortableHidden={true}
              pinnedLeftColumnIndex={$pinnedLeftColumnIndex.current}
              headerRowHeightCallback={props => {
                  return (props.index === props.data.length - 1) ? 20 : props.length;
              }}
              customRowHeight={customRowHeight}
              customColWidth={customColWidth}
              onCustomColWidthChange={handler.onCustomColWidthChange}
              onCustomRowHeightChange={handler.onCustomRowHeightChange}
              rowResizerHidden={true}
        /></Vertical>
}

function replacer(key:any, value:any) {
    if(value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()), // or with spread: value: [...value]
        };
    } else {
        return value;
    }
}

function reviver(key:any, value:any) {
    if(typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
    }
    return value;
}