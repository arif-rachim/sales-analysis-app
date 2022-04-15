import React, {ForwardedRef} from "react";

/**
 * Properties for Vertical props
 */
interface VerticalProps extends React.HTMLAttributes<HTMLDivElement> {
    hAlign?: 'left' | 'right' | 'center' | undefined
    vAlign?: 'top' | 'bottom' | 'center' | undefined
}

/**
 * Vertical is a div element that has a predefined style in the form of
 * 1. layout : flex,
 * 2. flex-direction : column
 * 3. box-sizing : border-box.
 * Vertical also has vAlign and hAlign attributes, which can be used to adjust the alignment position of its children.
 */
export default React.forwardRef(function Vertical(props: VerticalProps, ref: ForwardedRef<HTMLDivElement>): JSX.Element {
    const {children, vAlign, hAlign, style, ...properties} = props;
    const alignItems = hAlign === undefined ? hAlign : {
        left: 'flex-start',
        right: 'flex-end',
        center: 'center'
    }[hAlign];
    const justifyContent = vAlign === undefined ? vAlign : {
        top: 'flex-start',
        bottom: 'flex-end',
        center: 'center'
    }[vAlign];

    return <div ref={ref} style={{
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        justifyContent,
        alignItems, ...style
    }} {...properties}>{children}</div>
});