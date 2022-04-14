import {defaultCellSpanFunction, GridColumn, GridColumnGroup} from "./grid/Grid";

import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import Vertical from "./layout/Vertical";
import Horizontal from "./layout/Horizontal";
import {useObserver} from "./observer/useObserver";
import {ObserverValue} from "./observer";
import {CellComponentStyledProps} from "./grid/Sheet";
import {generateUniqueID} from "web-vitals/dist/modules/lib/generateUniqueID";
import {DimensionSelector} from "./components/DimensionSelector";
import {PivotGrid} from "./components/PivotGrid";

const FIELD_SEPARATOR: string = '⚮';

const SalesSchema: any = {
    quantity: {
        comment: 'QTY',
        isNumber: true
    },
    value: {
        comment: 'AED',
        isNumber: true
    },
    storeCode: {
        comment: 'Store Code'
    },
    storeName: {
        comment: 'Store Name'
    },
    store: {
        comment: 'Store Type'
    },
    location: {
        comment: 'Store Location'
    },
    city: {
        comment: 'Store City'
    },
    groupCode: {
        comment: 'Material Group Code'
    },
    groupName: {
        comment: 'Material Group Name'
    },
    brand: {
        comment: 'Material Brand'
    },
    code: {
        comment: 'Material Code'
    },
    name: {
        comment: 'Material Name'
    },
    category: {
        comment: 'Material Category'
    },
    date: {
        comment: 'Date',
    },
};

const dimensions = Object.keys(SalesSchema).map((key: string) => {
    return {id: key, name: SalesSchema[key].comment, isNumber: SalesSchema[key].isNumber}
})

// const dimensions = [
//     {id: 'storeCode', name: 'Store Code'},
//     {id: 'storeName', name: 'Store Name'},
//     {id: 'store', name: 'Store Type'},
//     {id: 'location', name: 'Store Location'},
//     {id: 'city', name: 'Store City'},
//     {id: 'groupCode', name: 'Material Group Code'},
//     {id: 'name', name: 'Material Name'},
//     {id: 'category', name: 'Material Category'},
//     {id: 'date', name: 'Date'},
//     {id: 'quantity', name: 'Sales Quantity'},
//     {id: 'value', name: 'Sales Value'}
// ];

function loadDimension(dimensionName: string) {
    const dimension = localStorage.getItem(dimensionName);
    if (dimension) {
        return JSON.parse(dimension);
    }
    return []
}

async function renderGrid(props: { columns: any; rows: any; values: any; setPinnedLeftColumnIndex: any; setGridColumns: any; setGridRows: any }) {
    const column = props.columns[0];
    if (column === undefined) {
        return;
    }
    const row = props.rows[0];
    if (row === undefined) {
        return;
    }

    const value = props.values[0];

    if (value === undefined) {
        return;
    }

    let [columnsData, rowsData] = await Promise.all([fetchData('distinct/' + props.columns.map((col: any) => col.id).join('_')), fetchData('distinct/' + props.rows.map((row: any) => row.id).join('_'))]);

    rowsData = rowsData.map((row: any) => {
        const [key] = Object.keys(row);
        const keys = key.split('_');
        const val = row[key];
        const values = val.split('#');
        return keys.reduce((out: any, key: string, index: number) => {
            out[key] = values[index];
            return out;
        }, {});
    })
    const cols = Object.keys(rowsData[0]).map(key => {
        const column: GridColumn = {
            width: 100,
            field: key,
            title: key,
            cellSpanFunction: defaultCellSpanFunction,
            cellComponent: CellComponent
        };
        return column;
    });
    const colsLength = cols.length;
    const gridColumnsData: Array<GridColumn | GridColumnGroup> = columnsData.reduce((acc: Array<GridColumn | GridColumnGroup>, colData: any) => {
        const colKey: string = Object.keys(colData)[0];
        const colVal: string = colData[colKey];
        const keys: Array<string> = colKey.split('_');
        const values: Array<string> = colVal.split('#');
        const lastIndexKey = keys.length;
        keys.reduce((acc: Array<GridColumn | GridColumnGroup>, key: string, index: number) => {
            const isNotLastIndex = index < (lastIndexKey - 1);
            const title = values[index];
            const existingChild: any = acc.find((ac: any) => ac.title === title);
            if (existingChild) {
                const child: GridColumnGroup = existingChild;
                return child.columns;
            }
            const child: any = {};
            if (isNotLastIndex) {
                const group: GridColumnGroup = child;
                group.columns = [];
                group.title = title;

            } else {
                const group: GridColumnGroup = child;
                group.title = title;
                group.columns = props.values.map((value: any) => {
                    const column: GridColumn = {
                        title: value.name,
                        field: colVal + FIELD_SEPARATOR + colKey + FIELD_SEPARATOR + value.id,
                        width: 100,
                        cellComponent: FetchDataCellComponent
                    };
                    // column.field = colVal + FIELD_SEPARATOR + colKey + FIELD_SEPARATOR + value.id;
                    // column.title = value.name;
                    // column.width = 50;
                    // column.cellComponent = FetchDataCellComponent
                    return column;
                });

            }
            acc.push(child);
            return child.columns;
        }, acc);
        return acc;
    }, cols);

    props.setPinnedLeftColumnIndex(colsLength - 1);
    props.setGridColumns(gridColumnsData);
    props.setGridRows(rowsData);
}

const AppContext = createContext<any>({});


/**
 * Todo we need todo following things
 * 1. Add cors to fastify
 * 2. Add fetch to list dimension
 * 3. Add fetch to list columns and rows
 * @constructor
 */
export default function App() {

    const [$displayDimensionSelector, setDisplayDimensionSelector] = useObserver(false);
    const [$pinnedLeftColumnIndex, setPinnedLeftColumnIndex] = useObserver(-1);
    const [$gridColumns, setGridColumns] = useObserver<Array<GridColumn | GridColumnGroup>>([]);
    const [$gridRows, setGridRows] = useObserver([]);
    const [initialDimension] = useState(() => {
        const filters = loadDimension('filters');
        const columns = loadDimension('columns');
        const rows = loadDimension('rows');
        const values = loadDimension('values');
        const dim = dimensions.filter((d: any) => {
            return !(filters.map((i: any) => i?.id).includes(d.id) || columns.map((i: any) => i?.id).includes(d.id) || rows.map((i: any) => i?.id).includes(d.id) || values.map((i: any) => i?.id).includes(d.id))
        });
        return {filters, columns, rows, values, dimensions: dim}
    });

    const {rows, columns, values} = initialDimension;
    useEffect(() => {
        renderGrid({columns, rows, values, setPinnedLeftColumnIndex, setGridColumns, setGridRows}).then();
        //(async () => {
        // here we need to fetch dimension
        // const result = await fetch('http://localhost:3001/v1/dimension');
        // const data = await result.json();
        // console.log('We have data', data);
        //})();
    }, [rows, columns, values, setPinnedLeftColumnIndex, setGridColumns, setGridRows]);
    const fetchData = useFetchPostData();
    return <AppContext.Provider value={useMemo(() => ({fetchData}), [fetchData])}>
        <Vertical style={{height: '100%', overflow: 'hidden', position: 'relative'}}>

            <PivotGrid setDisplayDimensionSelector={setDisplayDimensionSelector} $gridColumns={$gridColumns}
                             $gridRows={$gridRows} $pinnedLeftColumnIndex={$pinnedLeftColumnIndex}/>
            <Horizontal style={{borderTop: '1px solid #ddd'}}>
                <Vertical style={{width: '50%', padding: '1rem', borderRight: '1px solid #ddd'}} hAlign={'center'}
                          onClick={() => {
                              setDisplayDimensionSelector((old: boolean) => !old);
                          }}>
                    Configure Pivot
                </Vertical>
                <Vertical style={{width: '50%', padding: '1rem'}} hAlign={'center'}>
                    Settings
                </Vertical>
            </Horizontal>
            <DimensionSelector $displayDimensionSelector={$displayDimensionSelector}
                               onDimensionChanged={async (props) => {
                                   const {rows, columns, values} = props;
                                   await renderGrid({
                                       columns,
                                       rows,
                                       values,
                                       setPinnedLeftColumnIndex,
                                       setGridColumns,
                                       setGridRows
                                   });
                               }} initialDimension={initialDimension}/>
        </Vertical></AppContext.Provider>
}

function debounce(func: Function, timeout = 300) {
    let timer: any = 0;
    return (...args: any) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            // @ts-ignore
            func.apply(this, args);
        }, timeout);
    };
}

function useFetchPostData() {
    const requestRef = useRef<any>([]);
    const fireImmediateRequestToServer = useCallback(function fireRequestToServer() {
        const request = requestRef.current;
        if (request.length === 0) {
            return;
        }
        const {hostname, protocol} = window.location;
        const address = `${protocol}//${hostname}:3001/v1/compoundRequest`;
        requestRef.current = [];
        const options = {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json;charset=UTF-8",
            },
            body: JSON.stringify(request.map((r: any) => ({id: r.id, method: r.method, body: r.body}))),
        };
        (async () => {
            try {
                const result = await window.fetch(address, options)
                const json = await result.json();
                json.forEach(({value, id}: any) => {
                    const req = request.find((req: any) => req.id === id);
                    req.resolve(value);
                });
            } catch (error) {
                console.warn(error);
            }
        })();
    }, []);
    // eslint-disable-next-line
    const fireDebounceRequestToServer = useCallback(debounce(fireImmediateRequestToServer, 300), []);
    return useCallback(function fetchPostData(url: string, body: any) {
        return new Promise(resolve => {
            const id = generateUniqueID();
            requestRef.current.push({id, method: url, body, resolve});
            if (requestRef.current.length > 100) {
                fireImmediateRequestToServer();
            } else {
                fireDebounceRequestToServer();
            }
        });
    }, [fireDebounceRequestToServer, fireImmediateRequestToServer]);
}


async function fetchData(url: string, signal?: AbortSignal) {
    const {hostname, protocol} = window.location;
    const address = `${protocol}//${hostname}:3001/v1/${url}`;
    try {
        const result = await window.fetch(address, {signal});
        return await result.json();
    } catch (error) {
        console.warn(error);
        return []
    }
}

function CellComponent(props: CellComponentStyledProps) {
    return <Vertical vAlign={'center'} style={{height: '100%', padding: '2px 5px'}}>
        {props.value}
    </Vertical>
}

const numberFormat = new Intl.NumberFormat();

function FetchDataCellComponent(props: CellComponentStyledProps) {
    const {fetchData} = useContext(AppContext);
    const [colValFiltersString, colKeyFiltersString, valueType] = props.column.field.split(FIELD_SEPARATOR);
    const dataItemString = JSON.stringify(props.dataItem);

    const [$value, setValue] = useObserver<any>('loading');
    useEffect(() => {
        const dataItem = JSON.parse(dataItemString);
        const colKeyFilters = colKeyFiltersString.split('_');
        const colValFilters = colValFiltersString.split('#');
        const rowKeyFilters = Object.keys(dataItem);
        const rowValFilters = rowKeyFilters.map(key => dataItem[key]);
        const filters = [...colKeyFilters, ...rowKeyFilters];
        const values = [...colValFilters, ...rowValFilters];

        (async () => {
            setValue('loading');
            try {
                const result = await fetchData(valueType, {filters, values});
                const value = parseInt(result || '0');
                setValue(value);
            } catch (err) {
                console.log(err);
            }
        })();
    }, [colKeyFiltersString, colValFiltersString, dataItemString, fetchData, setValue, valueType])

    return <Vertical vAlign={'center'} style={{height: '100%'}}>
        <ObserverValue observers={$value} render={() => {
            return <Vertical
                style={{
                    textAlign: 'right',
                    padding: '2px 5px'
                }}>{$value.current === 'loading' ? 'Loading...' : numberFormat.format($value.current)}</Vertical>
        }}/>
    </Vertical>
}
