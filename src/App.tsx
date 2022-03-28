import {Grid} from "./grid/Grid";

import React, {createContext, useEffect} from "react";
import Vertical from "./layout/Vertical";
import Horizontal from "./layout/Horizontal";
import {Observer, useObserver} from "./observer/useObserver";
import {ObserverValue, useObserverListener, useObserverValue} from "./observer";

const dimensions = [
    {id: 'storeCode', name: 'Store Code'},
    {id: 'storeName', name: 'Store Name'},
    {id: 'store', name: 'Store Type'},
    {id: 'location', name: 'Store Location'},
    {id: 'city', name: 'Store City'},
    {id: 'groupCode', name: 'Material Group Code'},
    {id: 'name', name: 'Material Name'},
    {id: 'category', name: 'Material Category'},
    {id: 'date', name: 'Date'},
    {id: 'quantity', name: 'Sales Quantity'},
    {id: 'value', name: 'Sales Value'}
];
const DimensionSelectorContext = createContext<any>({});

interface DimensionSelectorProps {
    $displayDimensionSelector: Observer<boolean>;
    onDimensionChanged: (props:{columns:Array<any>,rows:Array<any>,filters:Array<any>,values:Array<any>}) => void
}


function DimensionSelector(dimensionSelectorProps: DimensionSelectorProps) {

    const display = useObserverValue(dimensionSelectorProps.$displayDimensionSelector);
    const [$fieldsGridData, setFieldsGridData] = useObserver<any>(dimensions);
    const [$filtersGridData, setFiltersGridData] = useObserver<any>([]);
    const [$columnsGridData, setColumnsGridData] = useObserver<any>([]);
    const [$rowsGridData, setRowsGridData] = useObserver<any>([]);
    const [$valuesGridData, setValuesGridData] = useObserver<any>([]);
    const [$focusedItem, setFocusedItem] = useObserver<any>(undefined);
    const [$toolBarAction, setToolBarAction] = useObserver<any>([]);
    useObserverListener([$focusedItem,$fieldsGridData,$filtersGridData,$rowsGridData,$columnsGridData,$valuesGridData], () => {

        const isInFields = $fieldsGridData.current.indexOf($focusedItem.current) >= 0;
        const isInFilters = $filtersGridData.current.indexOf($focusedItem.current) >= 0;
        const isInRows = $rowsGridData.current.indexOf($focusedItem.current) >= 0;
        const isInColumns = $columnsGridData.current.indexOf($focusedItem.current) >= 0;
        const isInValues = $valuesGridData.current.indexOf($focusedItem.current) >= 0;
        function moveFrom(props:{fromGridSetter:(value:any) => void,toGridSetter:(value:any) => void}){
            return () => {
                props.fromGridSetter((old:any) => old.filter((i:any) => i !== $focusedItem.current));
                props.toGridSetter((old:any) => [...old, $focusedItem.current]);
                if(dimensionSelectorProps.onDimensionChanged){
                    dimensionSelectorProps.onDimensionChanged({
                        columns:$columnsGridData.current,
                        rows:$rowsGridData.current,
                        filters:$filtersGridData.current,
                        values:$valuesGridData.current
                    });
                }
            }
        }

        const fieldsGridAction = [
            {title: 'Add to Rows', onAction: moveFrom({fromGridSetter:setFieldsGridData,toGridSetter:setRowsGridData})},
            {title: 'Add to Columns', onAction: moveFrom({fromGridSetter:setFieldsGridData,toGridSetter:setColumnsGridData})},
            {title: 'Add to Filters', onAction: moveFrom({fromGridSetter:setFieldsGridData,toGridSetter:setFiltersGridData})},
            {title: 'Add to Values', onAction: moveFrom({fromGridSetter:setFieldsGridData,toGridSetter:setValuesGridData})},
        ];
        const filtersGridAction = [
            {title: 'Move to Rows',onAction: moveFrom({fromGridSetter:setFiltersGridData,toGridSetter:setRowsGridData})},
            {title: 'Move to Columns',onAction: moveFrom({fromGridSetter:setFiltersGridData,toGridSetter:setColumnsGridData})},
            {title: 'Remove Filters',onAction: moveFrom({fromGridSetter:setFiltersGridData,toGridSetter:setFieldsGridData})},
            {title: 'Move to Values',onAction: moveFrom({fromGridSetter:setFiltersGridData,toGridSetter:setValuesGridData})},
        ];
        const columnGridAction = [
            {title: 'Move to Rows',onAction: moveFrom({fromGridSetter:setColumnsGridData,toGridSetter:setRowsGridData})},
            {title: 'Remove Column',onAction: moveFrom({fromGridSetter:setColumnsGridData,toGridSetter:setFieldsGridData})},
            {title: 'Move to Filters',onAction: moveFrom({fromGridSetter:setColumnsGridData,toGridSetter:setFiltersGridData})},
            {title: 'Move to Values',onAction: moveFrom({fromGridSetter:setColumnsGridData,toGridSetter:setValuesGridData})},
        ];
        const rowGridAction = [
            {title: 'Remove Row',onAction: moveFrom({fromGridSetter:setRowsGridData,toGridSetter:setFieldsGridData})},
            {title: 'Move to Columns',onAction: moveFrom({fromGridSetter:setRowsGridData,toGridSetter:setColumnsGridData})},
            {title: 'Move to Filters',onAction: moveFrom({fromGridSetter:setRowsGridData,toGridSetter:setFiltersGridData})},
            {title: 'Move to Values',onAction: moveFrom({fromGridSetter:setRowsGridData,toGridSetter:setValuesGridData})},
        ];
        const valuesGridAction = [
            {title: 'Move to Rows',onAction: moveFrom({fromGridSetter:setValuesGridData,toGridSetter:setRowsGridData})},
            {title: 'Move to Columns',onAction: moveFrom({fromGridSetter:setValuesGridData,toGridSetter:setColumnsGridData})},
            {title: 'Move to Filters',onAction: moveFrom({fromGridSetter:setValuesGridData,toGridSetter:setFiltersGridData})},
            {title: 'Remove Value',onAction: moveFrom({fromGridSetter:setValuesGridData,toGridSetter:setFieldsGridData})},
        ];

        if (isInFields) {
            setToolBarAction(fieldsGridAction);
        }
        if (isInColumns) {
            setToolBarAction(columnGridAction);
        }
        if (isInFilters) {
            setToolBarAction(filtersGridAction);
        }
        if (isInRows) {
            setToolBarAction(rowGridAction);
        }
        if (isInValues) {
            setToolBarAction(valuesGridAction);
        }
    });


    return <DimensionSelectorContext.Provider value={{}}><Vertical
        onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
        }}
        style={{
            bottom: display ? 0 : '-80%',
            height: '80%',
            border: '1px solid blue',
            position: 'absolute',
            width: '100%',
            transition: 'bottom 300ms ease-in-out',
            overflow: 'auto',
            zIndex: 99,
            backgroundColor:'#ddd',
            padding:'0.5rem'
        }}>
        <Vertical style={{height: '33.33%'}}>
            <ObserverValue observers={[$fieldsGridData,$focusedItem]} render={() => {
                return <Grid defaultRowHeight={40} columns={[
                    {title: 'Choose fields to add to report', field: 'name', width: '100%'}
                ]} data={$fieldsGridData.current} rowResizerHidden={true}
                             defaultHeaderRowHeight={30}
                             focusedDataItem={$focusedItem.current}
                             filterHidden={true}
                             onFocusedDataItemChange={(newItem) => setFocusedItem(newItem)}
                />
            }}/>
        </Vertical>
        <Horizontal style={{height: '33.33%', overflow: 'auto',marginTop:'0.5rem'}}>
            <Vertical style={{width: '50%', borderRight: '1px solid #CCC'}}>
                <ObserverValue observers={[$filtersGridData, $focusedItem]} render={() => {
                    return <Grid defaultRowHeight={40} columns={[
                        {title: 'Filters', field: 'name', width: '100%'}
                    ]} data={$filtersGridData.current} rowResizerHidden={true}
                                 defaultHeaderRowHeight={30}
                                 focusedDataItem={$focusedItem.current}
                                 filterHidden={true}
                                 onFocusedDataItemChange={(newItem) => setFocusedItem(newItem)}
                    />
                }}/>
            </Vertical>
            <Vertical style={{width: '50%',marginLeft:'0.5rem'}}>
                <ObserverValue observers={[$columnsGridData, $focusedItem]} render={() => {
                    return <Grid defaultRowHeight={40} columns={[
                        {title: 'Columns', field: 'name', width: '100%'}
                    ]} data={$columnsGridData.current} rowResizerHidden={true}
                                 defaultHeaderRowHeight={30}
                                 focusedDataItem={$focusedItem.current}
                                 filterHidden={true}
                                 onFocusedDataItemChange={(newItem) => setFocusedItem(newItem)}
                    />
                }}/>
            </Vertical>
        </Horizontal>
        <Horizontal style={{height: '33.33%', overflow: 'auto',marginTop:'0.5rem'}}>
            <Vertical style={{width: '50%', borderRight: '1px solid #CCC'}}>
                <ObserverValue observers={[$rowsGridData, $focusedItem]} render={() => {
                    return <Grid defaultRowHeight={40} columns={[
                        {title: 'Rows', field: 'name', width: '100%'}
                    ]} data={$rowsGridData.current} rowResizerHidden={true}
                                 defaultHeaderRowHeight={30}
                                 focusedDataItem={$focusedItem.current}
                                 filterHidden={true}
                                 onFocusedDataItemChange={(newItem) => setFocusedItem(newItem)}
                    />
                }}/>
            </Vertical>
            <Vertical style={{width: '50%',marginLeft:'0.5rem'}}>
                <ObserverValue observers={[$valuesGridData, $focusedItem]} render={() => {
                    return <Grid defaultRowHeight={40} columns={[
                        {title: 'Values', field: 'name', width: '100%'}
                    ]} data={$valuesGridData.current} rowResizerHidden={true}
                                 defaultHeaderRowHeight={30}
                                 focusedDataItem={$focusedItem.current}
                                 filterHidden={true}
                                 onFocusedDataItemChange={(newItem) => setFocusedItem(newItem)}
                    />
                }}/>
            </Vertical>
        </Horizontal>
        <ObserverValue observers={$toolBarAction} render={() => {
            const toolBarActions = $toolBarAction.current;
            const width = Math.round((100 / toolBarActions.length));
            return <Horizontal style={{borderTop: '1px solid #CCC',marginTop:'0.5rem'}}>
                {toolBarActions.map((ta: any) => {
                    return <Vertical hAlign={'center'} style={{
                        width: `${width}%`,
                        padding: '1rem',
                        backgroundColor: '#fff',
                        borderRight: '1px solid #ccc'
                    }} key={ta.title} onClick={() => ta.onAction()}>
                        {ta.title}
                    </Vertical>
                })}
            </Horizontal>
        }}/>
    </Vertical>
    </DimensionSelectorContext.Provider>

}

/**
 * Todo we need todo following things
 * 1. Add cors to fastify
 * 2. Add fetch to list dimension
 * 3. Add fetch to list columns and rows
 * @constructor
 */
export default function App() {

    const [$displayDimensionSelector, setDisplayDimensionSelector] = useObserver(false);

    useEffect(() => {
        //(async () => {
        // here we need to fetch dimension
        // const result = await fetch('http://localhost:3001/v1/dimension');
        // const data = await result.json();
        // console.log('We have data', data);
        //})();
    }, []);
    return <Vertical style={{height: '100%', overflow: 'auto'}}>

        <Vertical style={{flexGrow: 1, border: '1px solid red', overflow: 'auto'}}
                  onClick={() => {
                      setDisplayDimensionSelector(false);
                  }}>

            <Grid columns={[]} data={[]}
            />
        </Vertical>
        <Horizontal style={{borderBottom: '1px solid #CCC'}}>
            <Vertical style={{width: '50%', padding: '1rem', borderRight: '1px solid #CCC'}} hAlign={'center'}
                      onClick={() => {
                          setDisplayDimensionSelector((old: boolean) => !old);
                      }}>
                Configure Pivot
            </Vertical>
            <Vertical style={{width: '50%', padding: '1rem'}} hAlign={'center'}>
                Settings
            </Vertical>
        </Horizontal>
        <DimensionSelector $displayDimensionSelector={$displayDimensionSelector} onDimensionChanged={async (props) => {
            const {filters,rows,columns,values} = props;
            const column = (columns as any)[0];
            const columnsData = await fetchData('distinct/'+column.id);
            const row = (rows as any)[0];
            const rowsData = await fetchData('distinct/'+row.id);
            // now we need to setup the column and the rows altogether
            // first we need to build the column
            // next we need to build the rows
            // then we need to create the cell
            // then we need to add filter into the cell
            // then we need to add drilling capability
            // rows get the
            return true;
        }}/>
    </Vertical>
}

async function fetchData(url:string){
    const result = await window.fetch(`http://localhost:3001/v1/${url}`);
    const json = await result.json();
    return json;
}
