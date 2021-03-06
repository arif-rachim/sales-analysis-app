import Vertical from "../layout/Vertical";
import {emptyObserver, Observer, useObserver} from "../observer/useObserver";
import React, {
    createContext,
    Dispatch,
    MutableRefObject,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState
} from "react";
import {ObserverValue, useObserverListener, useObserverValue} from "../observer";
import Horizontal from "../layout/Horizontal";
import {Grid} from "../grid/Grid";
import {debounce, Dimension, fetchData} from "../App";
import {CellComponentStyledProps} from "../grid/Sheet";
import {BiCube} from "react-icons/bi";
import {AiFillDownCircle} from "react-icons/ai";
import {MdCheckBox, MdCheckBoxOutlineBlank} from "react-icons/md";

interface LabelValue {
    id: string;
    label: string;
}

const FilterSelectorContext = createContext<MutableRefObject<{ $selectedItem: Observer<Dimension>, onSelectedItemChanged: (item: Dimension) => void, $gridData: Observer<Array<any>> }> | undefined>(undefined);
export default function FilterSelector(props: { $displayFilterSelector: Observer<boolean>, setDisplayFilterSelector: Dispatch<boolean>, $selectedItem: Observer<Dimension>, onSelectedItemChanged: (selectedItem: any) => void }) {
    const {$displayFilterSelector, setDisplayFilterSelector, $selectedItem, onSelectedItemChanged} = props;
    const display = useObserverValue($displayFilterSelector);
    const [$gridData, setGridData] = useObserver<Array<LabelValue>>([]);

    useObserverListener($displayFilterSelector, () => {
        if (!$displayFilterSelector.current) {
            setGridData([]);
        }
    });

    const refreshData = useCallback(debounce(async () => {
        if($displayFilterSelector.current){
            const item = $selectedItem.current;
            const result = await fetchData('distinct/' + item.id);
            const values: Array<LabelValue> = result.map((res: any) => {
                const val = item.id;
                return {id: res[val], label: res[val]};
            });
            setGridData(values);
        }
    },100),[]);
    useObserverListener([$selectedItem,$displayFilterSelector], refreshData);
    const selectorContextRef = useRef({$selectedItem, onSelectedItemChanged, $gridData});
    selectorContextRef.current = {$selectedItem, onSelectedItemChanged, $gridData};
    return <FilterSelectorContext.Provider value={selectorContextRef}>
        <Vertical
            style={{
                bottom: display ? 0 : '-100%',
                height: '100%',
                position: 'absolute',
                width: '100%',
                transition: 'bottom 300ms ease-in-out',
                backgroundColor: '#fff',
                padding: '0rem',
            }}>
            <ObserverValue observers={$gridData} render={() => {
                return <Grid columns={[
                    {
                        title: '',
                        field: 'id',
                        width: 50,
                        hAlign: 'left',
                        cellComponent: CheckboxCellComponent,
                        headerCellComponent: CheckboxHeaderCellComponent
                    },
                    {
                        title: <Horizontal style={{width: 440}}>
                            <Vertical style={{fontSize: 16, marginRight: 10}}><BiCube/></Vertical>
                            <Vertical style={{flexGrow: 1}}>
                                {'Filter'}
                            </Vertical>
                            <Horizontal onClick={() => setDisplayFilterSelector(false)} style={{cursor:'pointer'}}>
                                <Vertical style={{fontSize: 16, marginRight: 5}}>
                                    <AiFillDownCircle/>
                                </Vertical>
                                <Vertical>
                                    {'Close'}
                                </Vertical>
                            </Horizontal>
                        </Horizontal>, field: 'label', width: '100%', hAlign: 'left'
                    }
                ]} data={$gridData.current} rowResizerHidden={true} sortableHidden={true}/>
            }}/>

        </Vertical>
    </FilterSelectorContext.Provider>
}

function CheckboxHeaderCellComponent() {
    const context = useContext(FilterSelectorContext);
    const $selectedItem = context?.current.$selectedItem || emptyObserver;
    const [allSelected, setAllSelected] = useState($selectedItem.current.allSelected);
    useObserverListener($selectedItem, () => {
        setAllSelected($selectedItem.current.allSelected);
    })
    return <Vertical style={{backgroundColor: '#ddd', height: '100%'}} vAlign={'center'} hAlign={'center'}>
        <Checkbox value={allSelected} onChange={(isChecked) => {
            const selectedItem: Dimension = $selectedItem.current;
            selectedItem.allSelected = isChecked;
            if (!isChecked) {
                selectedItem.filteredItems = [];
            } else {
                selectedItem.filteredItems = context?.current.$gridData.current.map<string>(d => d?.id) || [];
            }
            const onSelectedItemChanged = context?.current.onSelectedItemChanged || (() => {
            });
            onSelectedItemChanged({...selectedItem});
        }}/>

    </Vertical>
}

function CheckboxCellComponent(props: CellComponentStyledProps) {
    const context = useContext(FilterSelectorContext);
    const $selectedItem = context?.current.$selectedItem || emptyObserver;
    useEffect(() => {
        console.log('Remount');
    },[])
    const [isChecked, setChecked] = useState($selectedItem.current.filteredItems.includes(props.dataItem.id));

    useEffect(() => {
        setChecked($selectedItem.current.filteredItems.includes(props.dataItem.id));
    }, [$selectedItem, props.dataItem]);

    useObserverListener($selectedItem, () => {
        setChecked($selectedItem.current.filteredItems.includes(props.dataItem.id));
    });
    const dataItem: LabelValue = props.dataItem;
    const selectedItem: Dimension = $selectedItem.current;
    return <Vertical style={{...props.cellStyle, height: '100%'}} hAlign={'center'} vAlign={'center'}>
        <Checkbox value={isChecked}
               onChange={(value) => {
                   setChecked(value);
                   const isChecked = value;
                   const filteredItems = $selectedItem.current.filteredItems;
                   if (isChecked) {
                       filteredItems.push(dataItem.id);
                   } else {
                       $selectedItem.current.filteredItems = filteredItems.filter((x: string) => x !== dataItem.id);
                       $selectedItem.current.allSelected = false;
                   }
                   const onSelectedItemChanged = context?.current.onSelectedItemChanged || (() => {
                   });
                   onSelectedItemChanged({...$selectedItem.current});
               }}
        />
    </Vertical>
}

function Checkbox(props:{value:boolean,onChange:(val:boolean) => void}){
    return <Vertical onClick={() => props.onChange(!props.value)} style={{fontSize:20}}>
        {props.value ? <MdCheckBox/> : <MdCheckBoxOutlineBlank/>}
    </Vertical>

}