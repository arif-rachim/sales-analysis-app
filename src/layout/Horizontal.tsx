import React, {ForwardedRef} from "react";

/**
 * Properties for Vertical props
 */
interface HorizontalProps extends React.HTMLAttributes<HTMLDivElement> {
    hAlign?: 'left' | 'right' | 'center' | undefined
    vAlign?: 'top' | 'bottom' | 'center' | undefined
}

/**
 * Horizontal is a div element that has a predefined style in the form of
 * 1. layout : flex,
 * 2. flex-direction : row
 * 3. box-sizing : border-box.
 * Vertical also has vAlign and hAlign attributes, which can be used to adjust the alignment position of its children.
 */
export default React.forwardRef(function Horizontal(props: HorizontalProps, ref: ForwardedRef<HTMLDivElement>): JSX.Element {
    const {children, vAlign, hAlign, style, ...properties} = props;
    const justifyContent = hAlign === undefined ? hAlign : {
        left: 'flex-start',
        right: 'flex-end',
        center: 'center'
    }[hAlign];
    const alignItems = vAlign === undefined ? vAlign : {
        top: 'flex-start',
        bottom: 'flex-end',
        center: 'center'
    }[vAlign];

    return <div ref={ref} style={{
        display: 'flex',
        flexDirection: 'row',
        boxSizing: 'border-box',
        justifyContent,
        alignItems, ...style
    }} {...properties}>{children}</div>
});