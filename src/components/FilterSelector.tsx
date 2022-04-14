import Vertical from "../layout/Vertical";
import {Grid, HeaderCellComponentProps} from "../grid/Grid";
import {ObserverValue, useObserver, useObserverListener, useObserverValue} from "../observer";
import {emptyObserver, emptySetObserver, Observer} from "../observer/useObserver";
import Horizontal from "../layout/Horizontal";
import {IoIosArrowDropdown} from "react-icons/io";
import {fetchData} from "../App";
import {MdOutlineCheckBox, MdOutlineCheckBoxOutlineBlank} from "react-icons/md";
import {createContext, Dispatch, useContext} from "react";
import {CellComponentStyledProps} from "../grid/Sheet";

interface FilterSelectorProps {
    $displayFilterSelector: Observer<boolean>;
    setDisplayFilterSelector: (props: boolean) => void;
    $selectedItem: Observer<any>
}

const FilterSelectorContext = createContext<{ $allChecked: Observer<any>; setAllChecked: Dispatch<any>; $selectedItems: Observer<any>; setSelectedItems: Dispatch<any>; $gridData: Observer<any> }>({
    $selectedItems: emptyObserver,
    setSelectedItems: emptySetObserver,
    $allChecked: emptyObserver,
    setAllChecked: emptySetObserver,
    $gridData: emptyObserver
});

export function FilterSelector(filterSelectorProps: FilterSelectorProps) {
    const {$selectedItem, setDisplayFilterSelector, $displayFilterSelector} = filterSelectorProps;
    const [$gridData, setGridData] = useObserver([]);
    const [$allChecked, setAllChecked] = useObserver(false);
    const [$selectedItems, setSelectedItems] = useObserver([]);
    useObserverListener([$selectedItem, $displayFilterSelector], async () => {
        if ($selectedItem?.current?.id && $displayFilterSelector.current) {
            const key = $selectedItem.current.id;
            const result = await fetchData('distinct/' + key);
            const gridData = result.map((r: any) => {
                const val = r[key];
                return {
                    id: val,
                    label: val
                }
            });
            setGridData(gridData);
            setSelectedItems(gridData);
            setAllChecked(true);
        }

    });
    const display = useObserverValue($displayFilterSelector);
    return <Vertical
        onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
        }}
        style={{
            bottom: display ? 0 : '-110%',
            height: '100%',
            position: 'absolute',
            width: '100%',
            transition: 'bottom 300ms ease-in-out',
            backgroundColor: '#fff',
            padding: '0rem',
            zIndex: 99
        }}>
        <FilterSelectorContext.Provider
            value={{$allChecked, setAllChecked, $selectedItems, setSelectedItems, $gridData}}>
            <Vertical style={{height: '100%'}}>
                <Horizontal style={{fontSize: 26, padding: 5}} hAlign={'right'}>
                    <Vertical onClick={() => {
                        setDisplayFilterSelector(false);
                    }}>
                        <IoIosArrowDropdown/>
                    </Vertical>
                </Horizontal>
                <ObserverValue observers={$gridData} render={() => {
                    return <Grid columns={[
                        {
                            title: '',
                            field: 'checkbox',
                            width: 50,
                            hAlign: "left",
                            headerCellComponent: CheckboxHeaderCellComponent,
                            cellComponent: CheckboxCellComponent
                        },
                        {title: 'Type', field: 'label', width: '100%', hAlign: 'left'},
                    ]} data={$gridData.current}/>
                }}/>

            </Vertical>
        </FilterSelectorContext.Provider>
    </Vertical>
}

function CheckboxHeaderCellComponent(props: HeaderCellComponentProps) {
    const context = useContext(FilterSelectorContext);
    const allSelected = useObserverValue(context.$allChecked);
    return <Vertical style={{backgroundColor: '#ddd', height: '100%', fontSize: 26}} vAlign={'center'}
                     hAlign={'center'} onClick={() => {
        if (allSelected) {
            context.setAllChecked(false);
            context.setSelectedItems([]);
        } else {
            context.setAllChecked(true);
            context.setSelectedItems(context.$gridData.current);
        }

    }}>
        {allSelected && <MdOutlineCheckBox/>}
        {!allSelected && <MdOutlineCheckBoxOutlineBlank/>}
    </Vertical>
}

function CheckboxCellComponent(props: CellComponentStyledProps) {
    const context = useContext(FilterSelectorContext);
    const isSelected = useObserverValue(context.$selectedItems, () => {
        return context.$selectedItems.current.find((i: any) => i.id === props.dataItem.id) !== undefined
    });

    return <Vertical style={{...props.cellStyle, height: '100%', fontSize: 26}} vAlign={'center'}
                     hAlign={'center'} onClick={() => {
        const alreadySelectedItem = context.$selectedItems.current.find((i: any) => i.id === props.dataItem.id);
        context.setSelectedItems((items: Array<any>) => {
            if (alreadySelectedItem) {
                return items.filter((i: any) => i.id !== props.dataItem.id);
            }
            return [...items, props.dataItem]
        });
        if (alreadySelectedItem) {
            context.setAllChecked(false);
        }

    }}>
        {isSelected && <MdOutlineCheckBox/>}
        {!isSelected && <MdOutlineCheckBoxOutlineBlank/>}
    </Vertical>
}